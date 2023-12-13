from lib.htmlparser import FeedLinkParser, TextParser, ImageSrcParser


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


def test_text_parser():
    parser = TextParser()
    assert parser.parse("http://a/?a&amp;b&c") == "http://a/?a&b&c"
    assert parser.parse("<div>a<div>b<div>c</div>") == "abc"


def test_img_src_parser():
    parser = ImageSrcParser()
    assert parser.parse("<img src='/image.jpg'>") == "/image.jpg"
