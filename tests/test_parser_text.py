from lib.feedparser import TextParser


class TestParserText:

    def test_url(self):
        parser = TextParser()
        assert parser.parse("http://a/?a&amp;b&c") == "http://a/?a&b&c"

    def test_html(self):
        parser = TextParser()
        assert parser.parse("<div>a<div>b<div>c</div>") == "abc"
