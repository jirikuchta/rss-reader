from lib.utils import LinkParser


class TestParserText:

    def test_feeds(self):
        parser = LinkParser("""<head>
            <link rel="alternate" type="application/rss+xml" href="foo" title="Foo">
            <link rel="alternate" type="application/atom+xml" href="bar">
        </head>""")

        assert len(parser.feeds) == 2
        assert parser.feeds[0]["href"] == "foo"
        assert parser.feeds[0]["title"] == "Foo"
        assert parser.feeds[1]["href"] == "bar"
        assert parser.feeds[1]["title"] is None

    def test_icons(self):

        parser = LinkParser("""<head>
            <link rel="icon" href="foo">
            <link rel="shortcut icon" href="bar">
            <link rel="icon" sizes="16x16" href="baz">
        </head>""")

        assert len(parser.icons) == 3
        assert parser.icons[0]["href"] == "foo"
        assert parser.icons[0]["size"] is None
        assert parser.icons[1]["href"] == "bar"
        assert parser.icons[1]["size"] is None
        assert parser.icons[2]["href"] == "baz"
        assert parser.icons[2]["size"] == 16
