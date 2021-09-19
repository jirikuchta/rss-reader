import { OPMLItem, Category, Subscription } from "data/types";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";

const PROLOG = '<?xml version="1.0" encoding="UTF-8"?>';


export function parse(opml: string): OPMLItem[] {
	let parser = new DOMParser();
	let doc = parser.parseFromString(opml, "application/xml");
	let nodes = Array.from(doc.querySelectorAll("outline"))
		.filter(node => node.getAttribute("type") == "rss");

	return nodes.map(node => ({
		title: node.getAttribute("title"),
		xmlUrl: node.getAttribute("xmlUrl"),
		webUrl: node.getAttribute("webUrl"),
		category: node.closest("body > outline")?.getAttribute("title") || null
	}));
}

export function serialize() {
	let doc = document.implementation.createDocument(null, null, null);
	let body = doc.createElement("body");

	categories.list()
		.forEach(c => body.appendChild(buildCategory(doc, c)));

	subscriptions.list()
		.filter(s => !s.category_id)
		.forEach(s => body.appendChild(buildSubscription(doc, s)));

	let root = doc.createElement("opml");
	root.setAttribute("version", "1.0");
	doc.appendChild(root);

	root.appendChild(doc.createElement("head"));
	root.appendChild(body);

	return `${PROLOG}${(new XMLSerializer()).serializeToString(doc)}`;
}

function buildCategory(doc: XMLDocument, data: Category) {
	let node = doc.createElement("outline");
	node.setAttribute("text", data.title);
	node.setAttribute("title", data.title);
	subscriptions.list(data.id)
		.forEach(s => node.appendChild(buildSubscription(doc, s)));
	return node;
}

function buildSubscription(doc: XMLDocument, data: Subscription) {
	let node = doc.createElement("outline");
	node.setAttribute("type", "rss");
	node.setAttribute("text", data.title);
	node.setAttribute("title", data.title);
	node.setAttribute("title", data.title);
	node.setAttribute("xmlUrl", data.feed_url);
	data.web_url && node.setAttribute("webUrl", data.web_url);
	return node;
}
