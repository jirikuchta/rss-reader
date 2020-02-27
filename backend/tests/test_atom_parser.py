import pytest

from parser.common import ParserError, FeedType
from parser.atom import AtomParser, AtomItemParser

from tests.mocks.atom_feed import MockAtomFeed, MockAtomFeedItem, MockAtomLink


class TestAtomParser:

    def test_feed_type(self) -> None:
        feed = MockAtomFeed(title="", links=[MockAtomLink(href="")])
        assert AtomParser(feed.build()).feed_type == FeedType.ATOM

    def test_title(self) -> None:
        feed = MockAtomFeed(title=None, links=[MockAtomLink(href="")])

        with pytest.raises(ParserError):
            AtomParser(feed.build())

        feed.title = " <b> foo </b><br/> "
        assert AtomParser(feed.build()).title == "foo"

    def test_link(self) -> None:
        feed = MockAtomFeed(title="")

        with pytest.raises(ParserError):
            AtomParser(feed.build())

        feed.links = [MockAtomLink(href="foo", rel=None)]
        assert AtomParser(feed.build()).link == "foo"

        feed.links = [MockAtomLink(href="foo", rel="alternate")]
        assert AtomParser(feed.build()).link == "foo"

        feed.links = [MockAtomLink(href="foo", rel="enclosure")]
        with pytest.raises(ParserError):
            AtomParser(feed.build())

    def test_items(self) -> None:
        feed = MockAtomFeed(title="", links=[MockAtomLink(href="")])
        assert len(AtomParser(feed.build()).items) == 0

        feed.items = [MockAtomFeedItem()]
        assert len(AtomParser(feed.build()).items) == 1
        assert type(AtomParser(feed.build()).items[0]) is AtomItemParser

        # invalid item
        feed.items = [MockAtomFeedItem()]
        assert len(AtomParser(feed.build()).items) == 1
