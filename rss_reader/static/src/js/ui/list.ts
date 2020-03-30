import { Entry } from "data/types";

import * as subscriptions from "data/subscriptions";
import * as entries from "data/entries";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

let node:HTMLElement;


export function init() {
	build();
	pubsub.subscribe("subscription-selected", build);
	return node;
}

async function build() {
	node ? html.clear(node) : node = html.node("section", {"id": "list"});
	let items = await entries.list(subscriptions.selected || undefined);
	items && items.forEach(entry => node.appendChild(buildItem(entry)));
}

function buildItem(entry: Entry) {
	let node = html.node("article");
	node.appendChild(html.node("h3", {}, entry.title));
	entry.summary && node.appendChild(html.node("p", {}, entry.summary));
	node.addEventListener("click", e => entries.select(entry));
	return node;
}
