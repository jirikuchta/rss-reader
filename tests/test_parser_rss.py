import pytest
from datetime import datetime

from rss_reader.parser.common import ParserError, FeedType, Enclosure
from rss_reader.parser.rss import RSSParser, RSSItemParser

from tests.mocks.rss_feed import MockRSSFeed, MockRSSFeedItem, \
    MockRSSFeedItemEnclosure, MockRSSFeedItemGUID, MockAtomLink


class TestParserRSS:

    def test_feed_type(self) -> None:
        feed = MockRSSFeed(title="", link="")
        assert RSSParser(feed.build()).feed_type == FeedType.RSS

    def test_title(self) -> None:
        feed = MockRSSFeed(title=None, link="")

        with pytest.raises(ParserError):
            RSSParser(feed.build())

        feed.title = " <b> foo </b><br/> "
        assert RSSParser(feed.build()).title == "foo"

    def test_web_url(self) -> None:
        feed = MockRSSFeed(title="", link=None)

        with pytest.raises(ParserError):
            RSSParser(feed.build())

        feed.link = "foo"
        assert RSSParser(feed.build()).web_url == "foo"

    def test_items(self) -> None:
        feed = MockRSSFeed(title="", link="")
        assert len(RSSParser(feed.build()).items) == 0

        feed.items = [MockRSSFeedItem(title="", link="",
                                      guid=MockRSSFeedItemGUID(""))]
        parser = RSSParser(feed.build())
        assert len(parser.items) == 1
        assert type(parser.items[0]) is RSSItemParser

        # invalid item
        feed.items = [MockRSSFeedItem(title=None, link=None, guid=None)]
        assert len(RSSParser(feed.build()).items) == 0

    def test_no_channel_error(self) -> None:
        feed = MockRSSFeed(title="", link="", channel=False)
        with pytest.raises(ParserError):
            RSSParser(feed.build())


class TestParserRSSItem:

    def test_guid(self) -> None:
        item = MockRSSFeedItem(title="", link=None, guid=None)

        with pytest.raises(ParserError):
            RSSItemParser(item.build())

        item.link = ""
        item.guid = MockRSSFeedItemGUID("foo")
        assert RSSItemParser(item.build()).guid == "foo"

        item.guid = None
        item.link = "bar"
        assert RSSItemParser(item.build()).guid == "bar"

        item.guid = None
        item.link = None
        item.atom_links = [MockAtomLink(href="foo")]
        assert RSSItemParser(item.build()).guid == "foo"

    def test_title(self) -> None:
        item = MockRSSFeedItem(title=None, link="",
                               guid=MockRSSFeedItemGUID(""))

        with pytest.raises(ParserError):
            RSSItemParser(item.build())

        item.title = " <b> foo </b><br/> "
        assert RSSItemParser(item.build()).title == "foo"

        item.title = None
        item.description = "<b>bar</b>"
        assert RSSItemParser(item.build()).title == "bar"

        item.title = None
        item.description = None
        item.content_encoded = "<b>foobar</b>"
        assert RSSItemParser(item.build()).title == "foobar"

    def test_url(self) -> None:
        item = MockRSSFeedItem(title="", link=None,
                               guid=MockRSSFeedItemGUID(""))
        assert RSSItemParser(item.build()).url is None

        item.link = "foo"
        assert RSSItemParser(item.build()).url == "foo"

        item.link = None
        item.guid = MockRSSFeedItemGUID("foo", isPermalink=True)
        assert RSSItemParser(item.build()).url == "foo"

        item.link = None
        item.guid = MockRSSFeedItemGUID("foo", isPermalink=False)
        assert RSSItemParser(item.build()).url is None

        item.link = None
        item.guid.isPermalink = False
        item.atom_links = [MockAtomLink(href="foo", rel=None)]
        assert RSSItemParser(item.build()).url == "foo"

        item.link = None
        item.guid.isPermalink = False
        item.atom_links = [MockAtomLink(href="foo", rel="alternate")]
        assert RSSItemParser(item.build()).url == "foo"

        item.link = None
        item.guid.isPermalink = False
        item.atom_links = [MockAtomLink(href="foo", rel="enclosure")]
        assert RSSItemParser(item.build()).url is None

    def test_summary(self) -> None:
        item = MockRSSFeedItem(title="", link="", guid=MockRSSFeedItemGUID(""))
        assert RSSItemParser(item.build()).summary is None

        item.description = "<b>foo</b>"
        assert RSSItemParser(item.build()).summary == "foo"

        item.description = None
        item.content_encoded = "<b>bar</b>"
        assert RSSItemParser(item.build()).summary == "bar"

    def test_content(self) -> None:
        item = MockRSSFeedItem(title="", link="", guid=MockRSSFeedItemGUID(""))
        assert RSSItemParser(item.build()).content is None

        item.content_encoded = "<b>foo</b> "
        assert RSSItemParser(item.build()).content == "<b>foo</b>"

        item.content_encoded = None
        item.description = "<b>bar</b> "
        assert RSSItemParser(item.build()).content == "<b>bar</b>"

    def test_comments_url(self) -> None:
        item = MockRSSFeedItem(title="", link="", guid=MockRSSFeedItemGUID(""))
        assert RSSItemParser(item.build()).comments_url is None

        item.comments = "foo"
        assert RSSItemParser(item.build()).comments_url == "foo"

    def test_author(self) -> None:
        item = MockRSSFeedItem(title="", link="", guid=MockRSSFeedItemGUID(""))
        assert RSSItemParser(item.build()).author is None

        item.author = "foo"
        assert RSSItemParser(item.build()).author == "foo"

        item.author = "foo"
        item.dc_creator = "bar"
        assert RSSItemParser(item.build()).author == "bar <foo>"

        item.author = None
        item.dc_creator = "bar"
        assert RSSItemParser(item.build()).author == "bar"

    @pytest.mark.parametrize("value,expected", [
        (None, None),
        ("Mon, 5 Oct 2020 16:30:15 +0000", datetime(2020, 10, 5, 16, 30, 15)),
        ("Mon, 5 Oct 2020 16:30:15 GMT", datetime(2020, 10, 5, 16, 30, 15))])
    def test_time_published(self, value, expected) -> None:
        item = MockRSSFeedItem(title="", link="", guid=MockRSSFeedItemGUID(""),
                               pubdate=value)
        assert RSSItemParser(item.build()).time_published == expected

    def test_enclosures(self) -> None:
        item = MockRSSFeedItem(title="", link="", guid=MockRSSFeedItemGUID(""))
        assert len(RSSItemParser(item.build()).enclosures) == 0

        item.enclosures = [MockRSSFeedItemEnclosure(url="", type_attr="")]
        assert len(RSSItemParser(item.build()).enclosures) == 1
        assert type(RSSItemParser(item.build()).enclosures[0]) is Enclosure

        item.enclosures = [MockRSSFeedItemEnclosure(url=None, type_attr=None)]
        assert len(RSSItemParser(item.build()).enclosures) == 0

    def test_categories(self) -> None:
        item = MockRSSFeedItem(title="", link="", guid=MockRSSFeedItemGUID(""))
        assert len(RSSItemParser(item.build()).categories) == 0

        item.categories = ["foo", "<b>bar</b> "]
        assert len(RSSItemParser(item.build()).categories) == 2
        assert RSSItemParser(item.build()).categories[0] == "foo"
        assert RSSItemParser(item.build()).categories[1] == "bar"
