import { FeedItem } from "data/types";
import * as items from "data/items";
import * as html from "util/html";
import * as pubsub from "util/pubsub";

let node = document.querySelector("#items") as HTMLElement;

export function init() {
	build();
	pubsub.subscribe("selected-feed-change", build);
}

export function build() {
	html.clear(node);
	items.list().forEach(item => node.appendChild(buildItem(item)));
}

function buildItem(item: FeedItem) {
	let node = html.node("article");
	node.appendChild(html.node("h3", {}, item.title));
	if (item.summary) {
		node.appendChild(html.node("p", {}, item.summary))
	}
	return node;
}
