import { FeedItem } from "./types";
import * as data from "./data";
import * as html from "./html";

export function init() {
	let node = document.querySelector("#items");
	data.list().forEach(feed => {
		feed.items.forEach(item => {
			node.appendChild(buildItem(item));
		})
	});
}

function buildItem(item: FeedItem) {
	let node = html.node("article");
	node.appendChild(html.node("h3", {}, item.title));
	if (item.summary) {
		node.appendChild(html.node("p", {}, item.summary))
	}
	return node;
}
