import * as articles from "data/articles";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

import { getSelectedArticleId } from "ui/list";


export const node = html.node("section", {"id": "detail"});

export function init() {
	build();
	pubsub.subscribe("article-selected", build);
}

export async function build() {
	html.clear(node);

	let article = await getArticle();
	if (!article) { return; }

	let frag = html.fragment()

	let header = html.node("header", {}, "", frag);
	let title = html.node("h1", {}, "", header);
	html.node("a", {href: article.url, target: "_blank", rel: "noopener noreferrer"}, article.title, title);

	let content = html.node("div", {}, "", frag);
	content.innerHTML = article.content || article.summary || "";

	node.appendChild(frag);

	!article.read && articles.markRead([article.id]);
}


async function getArticle() {
	let articleId = getSelectedArticleId();
	if (!articleId) { return; }
	return (await articles.get(articleId));
}
