import * as articles from "data/articles";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

import * as list from "ui/list";


export const node = html.node("section", {"id": "detail"});

export function init() {
	build();
	pubsub.subscribe("article-selected", build);
}

export async function build() {
	html.clear(node);
	node.scrollTo(0, 0);

	let articleId = list.selected();
	if (!articleId) { return; }

	let article = await articles.get(articleId);
	if (!article) { return; }

	let frag = html.fragment()

	let header = html.node("header", {}, "", frag);
	let title = html.node("h1", {}, "", header);
	html.node("a", {href: article.url, target: "_blank", rel: "noopener noreferrer"}, article.title, title);

	let content = html.node("div", {}, "", frag);
	if (article.content) {
		content.innerHTML = article.content
	} else {
		article.image_url && html.node("img", {src:article.image_url}, "", content);
		article.summary && html.node("p", {}, article.summary, content);
	}


	node.appendChild(frag);

	!article.read && articles.markRead([article.id]);
}
