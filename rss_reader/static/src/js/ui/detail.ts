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
	entries.selected && (node.innerHTML = entries.selected.content || "");
}
