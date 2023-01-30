import { Article } from "data/types";
import * as articles from "data/articles";
import * as subscriptions from "data/subscriptions";

import * as html from "util/html";
import * as pubsub from "util/pubsub";
import * as format from "util/format";

import * as list from "ui/list";
import subscriptionIcon from "ui/widget/subscription-icon";


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

	frag.appendChild(buildHeader(article));

	let content = html.node("div", {className: "content"}, "", frag);
	if (article.content) {
		content.innerHTML = article.content;
		if (article.content.indexOf("<img") == -1 && article.image_url) {
			content.insertAdjacentElement("afterbegin", html.node("img", {src:article.image_url}));
		}
	} else {
		article.image_url && html.node("img", {src:article.image_url}, "", content);
		article.summary && html.node("p", {}, article.summary, content);
	}
	content.querySelectorAll("img").forEach(img => img.loading = "lazy");

	node.appendChild(frag);

	!article.read && articles.markRead([article.id]);
}

function buildHeader(article: Article) {
	let node = html.node("header");

	let feed = subscriptions.get(article.subscription_id);
	if (feed && feed.web_url) {
		let feedLink = html.node("a", {className:"feed", href:feed.web_url, target: "_blank", rel: "noopener noreferrer"}, "", node);
		feedLink.append(subscriptionIcon(feed), html.text(feed.title));
	}

	let title = html.node("h1", {}, "", node);
	html.node("a", {href: article.url, target: "_blank", rel: "noopener noreferrer"}, article.title, title);

	let info = html.node("div", {className:"publish-info"}, "", node);
	html.node("time", {}, format.date(article.time_published), info);
	article.author && html.node("span", {}, article.author, info);

	return node;
}
