import { Entry } from "data/types";

import * as feeds from "data/feeds";
import * as entries from "data/entries";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

let node = document.querySelector("#entries") as HTMLElement;

export function init() {
	build();
	pubsub.subscribe("feed-selected", build);
}

export async function build() {
	html.clear(node);
	let items = await entries.list(feeds.selected || undefined);
	items.forEach(entry => node.appendChild(buildItem(entry)));
}

function buildItem(entry: Entry) {
	let node = html.node("article");
	node.appendChild(html.node("h3", {}, entry.title));
	entry.summary && node.appendChild(html.node("p", {}, entry.summary));
	node.addEventListener("click", e => entries.select(entry));
	return node;
}
