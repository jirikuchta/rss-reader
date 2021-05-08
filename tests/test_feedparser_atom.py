import pytest
from datetime import datetime

from lib.feedparser import FeedType, FeedParser, FeedItemParser

from tests.mocks.atom_feed import MockAtomFeed, MockAtomFeedItem, \
    MockAtomLink, MockAtomAuthor


class TestParserAtom:

    def test_feed_type(self) -> None:
        feed = MockAtomFeed()
        assert FeedParser(feed.build(), "").feed_type == FeedType.ATOM

    def test_title(self) -> None:
        feed = MockAtomFeed()
        assert FeedParser(feed.build(), "").title is None

        feed.title = " <b> foo </b><br/> "
        assert FeedParser(feed.build(), "").title == "foo"

    def test_web_url(self) -> None:
        feed = MockAtomFeed(links=[
            MockAtomLink(href="foo", rel="enclosure"),
            MockAtomLink(href="foo", rel="self")])
        assert FeedParser(feed.build(), "").web_url is None

        feed.links = [MockAtomLink(href="foo", rel=None)]
        assert FeedParser(feed.build(), "").web_url == "foo"

        feed.links = [MockAtomLink(href="foo", rel="alternate")]
        assert FeedParser(feed.build(), "http://a").web_url == "http://a/foo"

    def test_items(self) -> None:
        feed = MockAtomFeed()
        assert len(FeedParser(feed.build(), "").items) == 0

        feed.items = [MockAtomFeedItem(link=MockAtomLink(href=""))]
        parser = FeedParser(feed.build(), "")
        assert len(parser.items) == 1
        assert type(parser.items[0]) is FeedItemParser


class TestParserAtomItem:

    def test_guid(self) -> None:
        item = MockAtomFeedItem()
        assert FeedItemParser(item.build(), FeedType.ATOM, "").guid is not None

        item.item_id = "foo"
        assert FeedItemParser(item.build(), FeedType.ATOM, "").guid == "foo"

    def test_title(self) -> None:
        item = MockAtomFeedItem()
        assert FeedItemParser(item.build(), FeedType.ATOM, "").title is None

        item.title = "<b> bar<b/> "
        assert FeedItemParser(item.build(), FeedType.ATOM, "").title == "bar"

    def test_url(self) -> None:
        item = MockAtomFeedItem()
        assert FeedItemParser(item.build(), FeedType.ATOM, "").url is None

        item.link = MockAtomLink(href="foo", rel="enclosure")
        assert FeedItemParser(item.build(), FeedType.ATOM, "").url is None

        item.link = MockAtomLink(href="foo")
        assert FeedItemParser(item.build(), FeedType.ATOM, "").url == "foo"

        item.link = MockAtomLink(href="foo", rel="alternate")
        assert FeedItemParser(item.build(), FeedType.ATOM, "").url == "foo"

        item.link = MockAtomLink(href="foo", rel="alternate")
        assert FeedItemParser(
            item.build(), FeedType.ATOM, "http://a").url == "http://a/foo"

    def test_summary(self) -> None:
        item = MockAtomFeedItem()
        assert FeedItemParser(item.build(), FeedType.ATOM, "").summary is None

        item.summary = "<b> foo</b> "
        assert FeedItemParser(item.build(), FeedType.ATOM, "").summary == "foo"

    def test_content(self) -> None:
        item = MockAtomFeedItem()
        assert FeedItemParser(item.build(), FeedType.ATOM, "").content is None

        item.content = "<b> foo</b> "
        assert FeedItemParser(
            item.build(), FeedType.ATOM, "").content == "<b> foo</b>"

    def test_comments_url(self) -> None:
        item = MockAtomFeedItem()
        assert FeedItemParser(
            item.build(), FeedType.ATOM, "").comments_url is None

        item.comments = MockAtomLink(href="foo", rel="replies")
        assert FeedItemParser(item.build(), FeedType.ATOM,
                              "http://a").comments_url == "http://a/foo"

        item.comments = "bar"
        assert FeedItemParser(item.build(), FeedType.ATOM,
                              "http://a").comments_url == "http://a/bar"

    def test_author(self) -> None:
        item = MockAtomFeedItem()
        assert FeedItemParser(item.build(), FeedType.ATOM, "").author is None

        item.author = MockAtomAuthor(name="foo")
        assert FeedItemParser(item.build(), FeedType.ATOM, "").author == "foo"

    @pytest.mark.parametrize("value,expected", [
        (None, None),
        ("2003-12-13T18:30:02+0000", datetime(2003, 12, 13, 18, 30, 2)),
        ("2003-12-13T18:30:02.01+0000",
         datetime(2003, 12, 13, 18, 30, 2, 10000))])
    def test_time_published(self, value, expected) -> None:
        item = MockAtomFeedItem(published=value)
        assert FeedItemParser(
            item.build(), FeedType.ATOM, "").time_published == expected
