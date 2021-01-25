import { Article } from "data/articles";
import * as html from "util/html";

let node:HTMLElement;

export function init() {
	build();
	return node;
}

export async function build(article?: Article) {
	node ? html.clear(node) : node = html.node("section", {"id": "detail"});
	if (!article) { return; }

	let frag = html.fragment()
	let header = html.node("header", {}, "", frag);
	let content = html.node("div", {}, "", frag);

	let title = html.node("h1", {}, "", header);
	html.node("a", {href: article.uri, target: "_blank", rel: "noopener noreferrer"}, article.title, title);

	content.innerHTML = article.content || article.summary || "";

	node.appendChild(frag);
}
