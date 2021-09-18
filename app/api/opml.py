from tempfile import TemporaryFile
from xml.etree import ElementTree as ET
from flask import send_file

from models import Category, Subscription
from api import api_bp


@api_bp.route("/opml/export/", methods=["GET"])
def opml_export():
    data = Subscription.query.outerjoin(Category).with_entities(
        Category.title, Subscription.title,
        Subscription.feed_url, Subscription.web_url).all()

    root = ET.Element("opml", attrib={"version": "1.0"})
    ET.SubElement(root, "head")
    body = ET.SubElement(root, "body")

    for category in set([i[0] for i in data]):
        node = body

        if category is not None:
            attrib = {"text": category, "title": category}
            node = ET.SubElement(body, "outline", attrib=attrib)

        for subscription in filter(lambda i: i[0] == category, data):
            attrib = {
                "type": "rss",
                "text": subscription[1],
                "title": subscription[1],
                "xmlUrl": subscription[2],
                "webUrl": subscription[3] or ""}
            ET.SubElement(node, "outline", attrib=attrib)

    file = TemporaryFile()
    ET.ElementTree(root).write(file, encoding="utf-8", xml_declaration=True)

    return send_file(
        file, mimetype="application/xml",
        as_attachment=True, attachment_filename="feeds.opml")
