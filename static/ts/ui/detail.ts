import { Article } from "data/types";
import * as articles from "data/articles";
import * as subscriptions from "data/subscriptions";

import * as html from "util/html";
import * as format from "util/format";
import * as command from "util/command";
import Swipe from "util/swipe";

import * as uiarticles from "ui/articles";
import subscriptionIcon from "ui/widget/subscription-icon";

export const node = document.getElementById("detail") as HTMLElement;
const body = html.node("div", {className: "body"});


export function init() {
	let swipe = new Swipe(node);
	swipe.onSwipeRight = uiarticles.next;
	swipe.onSwipeLeft = uiarticles.prev;
	command.register("detail:show", show);
}

function show(article: Article) {
	html.clear(node);
	node.scrollTo(0, 0);

	node.append(
		buildToolbar(article),
		buildHeader(article),
		buildBody(article),
		buildCloseButton()
	);

	!article.read && articles.markRead([article.id]);

	toggleOpen(true);
}

function toggleOpen(force?:boolean) {
	node.classList.toggle("active", force);
}

function buildToolbar(article: Article) {
	let node = html.node("div", {className:"toolbar"});

	let label = html.node("label", {className:"full-content", title:"Load full content"}, "", node);
	let input = html.node("input", {type:"checkbox"});
	input.addEventListener("change", async (e) => {
		let full_content = input.checked ? (await articles.getFullContent(article.id)) : "";
		buildBody(article, full_content);
	});
	label.append(
		input,
		html.icon("cup-hot"),
		html.icon("cup-hot-fill")
	);

	return node;
}

function buildHeader(article: Article) {
	let node = html.node("header");

	let feed = subscriptions.get(article.subscription_id);
	if (feed && feed.web_url) {
		html.node("a", {className:"feed", href:feed.web_url, target:"_blank"}, "", node)
			.append(subscriptionIcon(feed), html.text(feed.title));
	}

	let title = html.node("h1", {}, "", node);
	title.append(html.node("a", {href: article.url, target:"_blank"}, article.title));

	let info = html.node("div", {className:"publish-info"}, "", node);
	html.node("time", {}, format.date(article.time_published), info);
	article.author && html.node("span", {}, article.author, info);

	return node;
}

function buildBody(article: Article, full_content?: string) {
	html.clear(body);

	if (article.content || full_content) {
		body.innerHTML = full_content || article.content || "";
		if (!body.querySelector("img") && article.image_url) {
			body.insertAdjacentElement("afterbegin", html.node("img", {src:article.image_url}));
		}
	} else {
		article.image_url && html.node("img", {src:article.image_url}, "", body);
		article.summary && html.node("p", {}, article.summary, body);
	}

	body.querySelectorAll("img").forEach(img => img.loading = "lazy");
	body.querySelectorAll("a").forEach(link => link.target = "_blank");

	return body;
}

function buildCloseButton() {
	let btn = html.button({type:"button", icon: "cross", classList:"close plain"});
	btn.addEventListener("click", _ => toggleOpen(false));
	return btn;
}
