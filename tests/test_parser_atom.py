import pytest

from rss_reader.parser.common import ParserError, FeedType, Enclosure
from rss_reader.parser.atom import AtomParser, AtomItemParser

from tests.mocks.atom_feed import MockAtomFeed, MockAtomFeedItem, \
    MockAtomLink, MockAtomAuthor


class TestParserAtom:

    def test_feed_type(self) -> None:
        feed = MockAtomFeed(title="", link=MockAtomLink(href=""))
        assert AtomParser(feed.build()).feed_type == FeedType.ATOM

    def test_title(self) -> None:
        feed = MockAtomFeed(title=None, link=MockAtomLink(href=""))

        with pytest.raises(ParserError):
            AtomParser(feed.build())

        feed.title = " <b> foo </b><br/> "
        assert AtomParser(feed.build()).title == "foo"

    def test_link(self) -> None:
        feed = MockAtomFeed(title="")

        with pytest.raises(ParserError):
            AtomParser(feed.build())

        feed.link = MockAtomLink(href="foo", rel=None)
        assert AtomParser(feed.build()).link == "foo"

        feed.link = MockAtomLink(href="foo", rel="alternate")
        assert AtomParser(feed.build()).link == "foo"

        feed.link = MockAtomLink(href="foo", rel="enclosure")
        with pytest.raises(ParserError):
            AtomParser(feed.build())

    def test_items(self) -> None:
        feed = MockAtomFeed(title="", link=MockAtomLink(href=""))
        assert len(AtomParser(feed.build()).items) == 0

        feed.items = [MockAtomFeedItem(item_id="", title="",
                                       link=MockAtomLink(href=""))]
        assert len(AtomParser(feed.build()).items) == 1
        assert type(AtomParser(feed.build()).items[0]) is AtomItemParser

        # invalid item
        feed.items = [MockAtomFeedItem(item_id=None, title=None, link=None)]
        assert len(AtomParser(feed.build()).items) == 0


class TestParserAtomItem:
    pass

    def test_id(self) -> None:
        item = MockAtomFeedItem(item_id=None, title="",
                                link=MockAtomLink(href=""))

        with pytest.raises(ParserError):
            AtomItemParser(item.build())

        item.item_id = "foo"
        assert AtomItemParser(item.build()).id == "foo"

    def test_title(self) -> None:
        item = MockAtomFeedItem(item_id="", title=None,
                                link=MockAtomLink(href=""))

        with pytest.raises(ParserError):
            AtomItemParser(item.build())

        item.title = "<b> bar<b/> "
        assert AtomItemParser(item.build()).title == "bar"

    def test_link(self) -> None:
        item = MockAtomFeedItem(item_id="", title="", link=None)

        with pytest.raises(ParserError):
            AtomItemParser(item.build())

        item.link = MockAtomLink(href="foo")
        assert AtomItemParser(item.build()).link == "foo"

        item.link = MockAtomLink(href="foo", rel="alternate")
        assert AtomItemParser(item.build()).link == "foo"

        item.link = MockAtomLink(href="foo", rel="enclosure")
        with pytest.raises(ParserError):
            AtomItemParser(item.build())

    def test_summary(self) -> None:
        item = MockAtomFeedItem(item_id="", title="",
                                link=MockAtomLink(href=""))
        assert AtomItemParser(item.build()).summary is None

        item.summary = "<b> foo</b> "
        assert AtomItemParser(item.build()).summary == "foo"

        item.summary = None
        item.content = "<b> bar </b> "
        assert AtomItemParser(item.build()).summary == "bar"

    def test_content(self) -> None:
        item = MockAtomFeedItem(item_id="", title="",
                                link=MockAtomLink(href=""))
        assert AtomItemParser(item.build()).content is None

        item.content = "<b> foo</b> "
        assert AtomItemParser(item.build()).content == "<b> foo</b>"

    def test_comments_link(self) -> None:
        item = MockAtomFeedItem(item_id="", title="",
                                link=MockAtomLink(href=""))
        assert AtomItemParser(item.build()).comments_link is None

        item.comments = MockAtomLink(href="foo", rel="replies")
        assert AtomItemParser(item.build()).comments_link == "foo"

        item.comments = "bar"
        assert AtomItemParser(item.build()).comments_link == "bar"

    def test_author(self) -> None:
        item = MockAtomFeedItem(item_id="", title="",
                                link=MockAtomLink(href=""))
        assert AtomItemParser(item.build()).author is None

        item.author = MockAtomAuthor(name="foo", email="bar")
        assert AtomItemParser(item.build()).author == "foo <bar>"

        item.author = MockAtomAuthor(name="foo", email=None)
        assert AtomItemParser(item.build()).author == "foo"

        item.author = MockAtomAuthor(name=None, email="bar")
        assert AtomItemParser(item.build()).author == "bar"

    def test_enclosures(self) -> None:
        item = MockAtomFeedItem(item_id="", title="",
                                link=MockAtomLink(href=""))
        assert len(AtomItemParser(item.build()).enclosures) == 0

        item.enclosures = [MockAtomLink(href="foo", rel="enclosure",
                                        type_attr="bar", length=1234)]
        assert len(AtomItemParser(item.build()).enclosures) == 1
        assert type(AtomItemParser(item.build()).enclosures[0]) is Enclosure
        assert AtomItemParser(item.build()).enclosures[0].url == "foo"
        assert AtomItemParser(item.build()).enclosures[0].type == "bar"
        assert AtomItemParser(item.build()).enclosures[0].length == 1234

        # invalid enclosure
        item.enclosures = [MockAtomLink(href=None, rel="enclosure",
                                        type_attr=None)]
        assert len(AtomItemParser(item.build()).enclosures) == 0

    def test_categories(self) -> None:
        item = MockAtomFeedItem(item_id="", title="",
                                link=MockAtomLink(href=""))
        assert len(AtomItemParser(item.build()).categories) == 0

        item.categories = ["foo", "bar"]
        assert len(AtomItemParser(item.build()).categories) == 2
        assert AtomItemParser(item.build()).categories[0] == "foo"
        assert AtomItemParser(item.build()).categories[1] == "bar"