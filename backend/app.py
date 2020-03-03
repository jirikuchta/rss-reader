from flask import Flask, request

from parser import parse

app = Flask(__name__)


@app.route("/feed")
def feed():
    url = request.args.get("url")
    feed = parse(url)

    return {
        "feed_type": feed.feed_type.name,
        "title": feed.title,
        "link": feed.link,
        "items": [{
            "id": item.id,
            "title": item.title,
            "link": item.link,
            "summary": item.summary,
            "content": item.content,
            "comments_link": item.comments_link,
            "author": item.author,
            "enclosures": [{
                "url": enclosure.url,
                "type": enclosure.type,
                "length": enclosure.length
            } for enclosure in item.enclosures],
            "categories": item.categories
        } for item in feed.items]
    }


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
