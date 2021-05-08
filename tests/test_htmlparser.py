from lib.htmlparser import FeedLinkParser, FaviconParser, TextParser


def test_feedlink_parser():
    parser = FeedLinkParser("""<head>
        <link rel="alternate" type="application/rss+xml" href="bar" title="Foo">
        <link rel="alternate" type="application/rss+xml" href="http://bar">
        <link rel="alternate" type="application/atom+xml" href="bar">
    </head>""", "http://foo")

    assert len(parser.links) == 3
    assert parser.links[0]["href"] == "http://foo/bar"
    assert parser.links[0]["title"] == "Foo"
    assert parser.links[1]["href"] == "http://bar"
    assert parser.links[1]["title"] is None
    assert parser.links[2]["href"] == "http://foo/bar"
    assert parser.links[2]["title"] is None


def test_favicon_parser():
    parser = FaviconParser("""<head>
        <link rel="icon" href="bar">
        <link rel="shortcut icon" href="http://bar">
        <link rel="icon" sizes="16x16" href="bar">
    </head>""", "http://foo")

    assert len(parser.icons) == 3
    assert parser.icons[0]["href"] == "http://foo/bar"
    assert parser.icons[0]["size"] is None
    assert parser.icons[1]["href"] == "http://bar"
    assert parser.icons[1]["size"] is None
    assert parser.icons[2]["href"] == "http://foo/bar"
    assert parser.icons[2]["size"] == 16


class TextTextPrser:

    def test_url(self):
        parser = TextParser()
        assert parser.parse("http://a/?a&amp;b&c") == "http://a/?a&b&c"

    def test_html(self):
        parser = TextParser()
        assert parser.parse("<div>a<div>b<div>c</div>") == "abc"
