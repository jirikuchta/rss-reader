import * as entries from "data/entries";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

let node:HTMLElement;

export function init() {
	build();
	pubsub.subscribe("entry-selected", build);
	return node;
}

async function build() {
	node ? html.clear(node) : node = html.node("div", {"id": "detail"});

	let entry = entries.selected;
	if (!entry) { return; }

	let header = html.node("header");

	let title = html.node("h3");
	title.appendChild(html.node("a", {href: entry.uri, target: "_blank"}, entry.title));
	header.appendChild(title);

	let body = html.node("div", {"id": "entry-content"});
	body.innerHTML = entry.content || "";

	node.appendChild(header);
	node.appendChild(body);
}
