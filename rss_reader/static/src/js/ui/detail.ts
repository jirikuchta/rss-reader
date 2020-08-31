import * as html from "util/html";

let node:HTMLElement;

export function init() {
	build();
	return node;
}

async function build() {
	node ? html.clear(node) : node = html.node("section", {"id": "detail"});
}
