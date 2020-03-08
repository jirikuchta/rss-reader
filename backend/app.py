from flask import Flask
from flask_restful import Resource, Api

from parser import parse

app = Flask(__name__)
api = Api(app)


TEST_FEEDS = (
    "https://historje.tumblr.com/rss",
    "http://feeds.feedburner.com/CssTricks")


class Feeds(Resource):
    def get(self):
        data = {"feeds": []}

        for feed_uri in TEST_FEEDS:
            parser = parse(feed_uri)

            feed_data = {
                "feed_type": parser.feed_type.name,
                "title": parser.title,
                "link": parser.link}

            feed_data["items"] = [{
                "id": item.id,
                "title": item.title,
                "link": item.link,
                "summary": item.summary,
                "content": item.content,
                "comments_link": item.comments_link,
                "author": item.author,
                "categories": item.categories,
                "enclosures": [{
                    "url": enclosure.url,
                    "type": enclosure.type,
                    "length": enclosure.length
                } for enclosure in item.enclosures]
            } for item in parser.items]

            data["feeds"].append(feed_data)

        return data


api.add_resource(Feeds, "/feeds")


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
