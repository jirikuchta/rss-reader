import pytest
from datetime import datetime

from lib.feedparser import ParserError, FeedType, FeedParser, FeedItemParser

from tests.mocks.rss_feed import MockRSSFeed, MockRSSFeedItem, \
    MockRSSFeedItemGUID, MockAtomLink


class TestParserRSS:

    def test_feed_type(self) -> None:
        assert FeedParser(MockRSSFeed().build(), "").feed_type == FeedType.RSS

    def test_title(self) -> None:
        feed = MockRSSFeed()
        assert FeedParser(feed.build(), "").title is None

        feed.title = " <b> foo </b><br/> "
        assert FeedParser(feed.build(), "").title == "foo"

    def test_web_url(self) -> None:
        feed = MockRSSFeed()
        assert FeedParser(feed.build(), "http://a").web_url is None

        feed.link = "foo"
        assert FeedParser(feed.build(), "http://a").web_url == "http://a/foo"

    def test_items(self) -> None:
        feed = MockRSSFeed()
        assert len(FeedParser(feed.build(), "").items) == 0

        feed.items = [MockRSSFeedItem()]
        parser = FeedParser(feed.build(), "")
        assert len(parser.items) == 1
        assert type(parser.items[0]) is FeedItemParser

    def test_no_channel_error(self) -> None:
        feed = MockRSSFeed(channel=False)
        with pytest.raises(ParserError):
            FeedParser(feed.build(), "")


class TestParserRSSItem:

    def test_guid(self) -> None:
        item = MockRSSFeedItem()
        assert FeedItemParser(item.build(), FeedType.RSS, "").guid is not None

        item.guid = MockRSSFeedItemGUID("foo")
        item.link = ""
        assert FeedItemParser(item.build(), FeedType.RSS, "").guid == "foo"

        item.guid = None
        item.link = "bar"
        assert FeedItemParser(item.build(), FeedType.RSS, "").guid == "bar"

        item.guid = None
        item.link = None
        item.atom_links = [MockAtomLink(href="foo")]
        assert FeedItemParser(item.build(), FeedType.RSS, "").guid == "foo"

    def test_title(self) -> None:
        item = MockRSSFeedItem()
        assert FeedItemParser(item.build(), FeedType.RSS, "").title is None

        item.title = " <b> foo </b><br/> "
        assert FeedItemParser(item.build(), FeedType.RSS, "").title == "foo"

    def test_url(self) -> None:
        item = MockRSSFeedItem()
        assert FeedItemParser(item.build(), FeedType.RSS, "").url is None

        item.link = "foo"
        assert FeedItemParser(item.build(), FeedType.RSS, "").url == "foo"

        item.link = None
        item.guid = MockRSSFeedItemGUID(value="foo", isPermalink=True)
        assert FeedItemParser(item.build(), FeedType.RSS, "").url == "foo"

        item.link = None
        item.guid = MockRSSFeedItemGUID(value="foo", isPermalink=False)
        assert FeedItemParser(item.build(), FeedType.RSS, "").url is None

        item.link = None
        item.guid.isPermalink = False
        item.atom_links = [MockAtomLink(href="foo", rel=None)]
        assert FeedItemParser(
            item.build(), FeedType.RSS, "http://a").url == "http://a/foo"

        item.link = None
        item.guid.isPermalink = False
        item.atom_links = [MockAtomLink(href="foo", rel="alternate")]
        assert FeedItemParser(
            item.build(), FeedType.RSS, "http://a").url == "http://a/foo"

        item.link = None
        item.guid.isPermalink = False
        item.atom_links = [MockAtomLink(href="foo", rel="enclosure")]
        assert FeedItemParser(item.build(), FeedType.RSS, "").url is None

    def test_summary(self) -> None:
        item = MockRSSFeedItem()
        assert FeedItemParser(item.build(), FeedType.RSS, "").summary is None

        item.description = "<b>foo</b>"
        assert FeedItemParser(item.build(), FeedType.RSS, "").summary == "foo"

        item.description = None
        item.content_encoded = "<b>bar</b>"
        assert FeedItemParser(item.build(), FeedType.RSS, "").summary == "bar"

    def test_content(self) -> None:
        item = MockRSSFeedItem()
        assert FeedItemParser(item.build(), FeedType.RSS, "").content is None

        item.content_encoded = "<b>foo</b> "
        assert FeedItemParser(
            item.build(), FeedType.RSS, "").content == "<b>foo</b>"

        item.content_encoded = None
        item.description = "<b>bar</b> "
        assert FeedItemParser(
            item.build(), FeedType.RSS, "").content == "<b>bar</b>"

    def test_comments_url(self) -> None:
        item = MockRSSFeedItem()
        assert FeedItemParser(
            item.build(), FeedType.RSS, "").comments_url is None

        item.comments = "foo"
        assert FeedItemParser(item.build(), FeedType.RSS,
                              "http://a").comments_url == "http://a/foo"

    def test_author(self) -> None:
        item = MockRSSFeedItem()
        assert FeedItemParser(item.build(), FeedType.RSS, "").author is None

        item.author = "foo"
        assert FeedItemParser(item.build(), FeedType.RSS, "").author == "foo"

        item.author = None
        item.dc_creator = "bar"
        assert FeedItemParser(item.build(), FeedType.RSS, "").author == "bar"

    @pytest.mark.parametrize("value,expected", [
        (None, None),
        ("Mon, 5 Oct 2020 16:30:15 +0000", datetime(2020, 10, 5, 16, 30, 15)),
        ("Mon, 5 Oct 2020 16:30:15 GMT", datetime(2020, 10, 5, 16, 30, 15))])
    def test_time_published(self, value, expected) -> None:
        item = MockRSSFeedItem(guid=MockRSSFeedItemGUID(""), pubdate=value)
        assert FeedItemParser(
            item.build(), FeedType.RSS, "").time_published == expected
