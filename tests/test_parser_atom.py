import pytest
from datetime import datetime

from lib.feedparser import FeedType, FeedParser, FeedItemParser

from tests.mocks.atom_feed import MockAtomFeed, MockAtomFeedItem, \
    MockAtomLink, MockAtomAuthor


class TestParserAtom:

    def test_feed_type(self) -> None:
        feed = MockAtomFeed(title="", links=[MockAtomLink(href="")])
        assert FeedParser(feed.build(), "").feed_type == FeedType.ATOM

    def test_title(self) -> None:
        feed = MockAtomFeed(title=None, links=[MockAtomLink(href="")])
        assert FeedParser(feed.build(), "").title is None

        feed.title = " <b> foo </b><br/> "
        assert FeedParser(feed.build(), "").title == "foo"

    def test_web_url(self) -> None:
        feed = MockAtomFeed(title="", links=[
            MockAtomLink(href="foo", rel="enclosure"),
            MockAtomLink(href="foo", rel="self")])
        assert FeedParser(feed.build(), "").web_url is None

        feed.links = [MockAtomLink(href="foo", rel=None)]
        assert FeedParser(feed.build(), "").web_url == "foo"

        feed.links = [MockAtomLink(href="foo", rel="alternate")]
        assert FeedParser(feed.build(), "http://a").web_url == "http://a/foo"

    def test_items(self) -> None:
        feed = MockAtomFeed(title="", links=[MockAtomLink(href="")])
        assert len(FeedParser(feed.build(), "").items) == 0

        feed.items = [MockAtomFeedItem(item_id="", title="",
                                       link=MockAtomLink(href=""))]
        parser = FeedParser(feed.build(), "")
        assert len(parser.items) == 1
        assert type(parser.items[0]) is FeedItemParser

        # skip invalid items
        feed.items = [MockAtomFeedItem(item_id=None, link=None)]
        assert len(FeedParser(feed.build(), "").items) == 0


class TestParserAtomItem:

    def test_guid(self) -> None:
        item = MockAtomFeedItem(item_id=None, title="",
                                link=MockAtomLink(href=""))
        assert FeedItemParser(item.build(), "").guid is not None

        item.item_id = "foo"
        assert FeedItemParser(item.build(), "").guid == "foo"

    def test_title(self) -> None:
        item = MockAtomFeedItem(item_id="", title=None,
                                link=MockAtomLink(href=""))
        assert FeedItemParser(item.build(), "").title is None

        item.title = "<b> bar<b/> "
        assert FeedItemParser(item.build(), "").title == "bar"

    def test_url(self) -> None:
        item = MockAtomFeedItem(item_id="", title="", link=None)
        assert FeedItemParser(item.build(), "").url is None

        item.link = MockAtomLink(href="foo", rel="enclosure")
        assert FeedItemParser(item.build(), "").url is None

        item.link = MockAtomLink(href="foo")
        assert FeedItemParser(item.build(), "").url == "foo"

        item.link = MockAtomLink(href="foo", rel="alternate")
        assert FeedItemParser(item.build(), "").url == "foo"

        item.link = MockAtomLink(href="foo", rel="alternate")
        assert FeedItemParser(item.build(), "http://a").url == "http://a/foo"

    def test_summary(self) -> None:
        item = MockAtomFeedItem(item_id="", title="",
                                link=MockAtomLink(href=""))
        assert FeedItemParser(item.build(), "").summary is None

        item.summary = "<b> foo</b> "
        assert FeedItemParser(item.build(), "").summary == "foo"

        item.summary = None
        item.content = "<b> bar </b> "
        assert FeedItemParser(item.build(), "").summary == "bar"

    def test_content(self) -> None:
        item = MockAtomFeedItem(item_id="", title="",
                                link=MockAtomLink(href=""))
        assert FeedItemParser(item.build(), "").content is None

        item.content = "<b> foo</b> "
        assert FeedItemParser(item.build(), "").content == "<b> foo</b>"

    def test_comments_url(self) -> None:
        item = MockAtomFeedItem(item_id="", title="",
                                link=MockAtomLink(href=""))
        assert FeedItemParser(item.build(), "").comments_url is None

        item.comments = MockAtomLink(href="foo", rel="replies")
        assert FeedItemParser(
            item.build(), "http://a").comments_url == "http://a/foo"

        item.comments = "bar"
        assert FeedItemParser(
            item.build(), "http://a").comments_url == "http://a/bar"

    def test_author(self) -> None:
        item = MockAtomFeedItem(item_id="", title="",
                                link=MockAtomLink(href=""))
        assert FeedItemParser(item.build(), "").author is None

        item.author = MockAtomAuthor(name="foo", email="bar")
        assert FeedItemParser(item.build(), "").author == "foo <bar>"

        item.author = MockAtomAuthor(name="foo", email=None)
        assert FeedItemParser(item.build(), "").author == "foo"

        item.author = MockAtomAuthor(name=None, email="bar")
        assert FeedItemParser(item.build(), "").author == "bar"

    @pytest.mark.parametrize("value,expected", [
        (None, None),
        ("2003-12-13T18:30:02+0000", datetime(2003, 12, 13, 18, 30, 2)),
        ("2003-12-13T18:30:02.01+0000",
         datetime(2003, 12, 13, 18, 30, 2, 10000))])
    def test_time_published(self, value, expected) -> None:
        item = MockAtomFeedItem(item_id="", title="",
                                link=MockAtomLink(href=""), published=value)
        assert FeedItemParser(item.build(), "").time_published == expected
