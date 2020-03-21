import * as entries from "data/entries";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

let node = document.querySelector("#detail") as HTMLElement;

export function init() {
	build();
	pubsub.subscribe("entry-selected", build);
}

export async function build() {
	html.clear(node);

	let entry = entries.selected;
	if (!entry) { return; }

	let header = html.node("header");
	header.appendChild(html.node("h3", {}, entry.title));

	let body = html.node("div", {"id": "entry-content"});
	body.innerHTML = entry.content || "";

	node.appendChild(header);
	node.appendChild(body);
}
