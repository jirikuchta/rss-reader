import { Entry } from "data/types";

import * as feeds from "data/feeds";
import * as entries from "data/entries";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

let node = document.querySelector("#entries") as HTMLElement;

export function init() {
	build();
	pubsub.subscribe("selected-feed-change", build);
}

export async function build() {
	html.clear(node);
	let selected_feed = feeds.getSelected();
	let items = await entries.list(selected_feed || undefined);
	items.forEach(entry => node.appendChild(buildItem(entry)));
}

function buildItem(entry: Entry) {
	let node = html.node("article");
	node.appendChild(html.node("h3", {}, entry.title));
	if (entry.summary) {
		node.appendChild(html.node("p", {}, entry.summary))
	}
	return node;
}
