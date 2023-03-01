import { Article } from "data/types";
import * as articles from "data/articles";
import * as subscriptions from "data/subscriptions";

import * as html from "util/html";
import * as format from "util/format";
import * as uitools from "util/uitools";
import * as command from "util/command";
import Swipe from "util/swipe";

import * as list from "ui/list";
import subscriptionIcon from "ui/widget/subscription-icon";

export const node = document.getElementById("detail") as HTMLElement;

export function init() {
	let swipe = new Swipe(node);
	swipe.onSwipeRight = list.next;
	swipe.onSwipeLeft = list.prev;
	command.register("detail:show", show);
}

function show(article: Article) {
	html.clear(node);
	node.scrollTo(0, 0);

	node.appendChild(buildHeader(article));
	node.appendChild(buildBody(article));

	!article.read && articles.markRead([article.id]);

	command.execute("layout:showDetail");
}

function buildHeader(article: Article) {
	let node = html.node("header");

	let feed = subscriptions.get(article.subscription_id);
	if (feed && feed.web_url) {
		let feedLink = uitools.externalLink(html.node("a", {className:"feed", href:feed.web_url}, "", node));
		feedLink.append(subscriptionIcon(feed), html.text(feed.title));
	}

	let title = html.node("h1", {}, "", node);
	title.append(uitools.externalLink(html.node("a", {href: article.url}, article.title)))

	let info = html.node("div", {className:"publish-info"}, "", node);
	html.node("time", {}, format.date(article.time_published), info);
	article.author && html.node("span", {}, article.author, info);

	return node;
}

function buildBody(article: Article) {
	let node = html.node("div", {className: "body"});
	if (article.content) {
		node.innerHTML = article.content;
		if (article.content.indexOf("<img") == -1 && article.image_url) {
			node.insertAdjacentElement("afterbegin", html.node("img", {src:article.image_url}));
		}
	} else {
		article.image_url && html.node("img", {src:article.image_url}, "", node);
		article.summary && html.node("p", {}, article.summary, node);
	}
	node.querySelectorAll("img").forEach(img => img.loading = "lazy");

	return node;
}


