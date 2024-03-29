import { Article } from "data/types";
import * as articles from "data/articles";
import * as subscriptions from "data/subscriptions";

import * as html from "util/html";
import * as format from "util/format";
import * as command from "util/command";

import FeedIcon from "ui/widget/feed-icon";

export const node = document.createElement("section");
node.id = "detail";

const body = html.node("div", {className: "body"});

const CSS_OPEN_CLASS = "is-open";

export function init() {
	body.attachShadow({mode:"open"});
	command.register("detail:show", show);
}

function show(article: Article) {
	node.scrollTo(0, 0);
	node.replaceChildren(
		buildToolbar(article),
		buildHeader(article),
		buildBody(article),
		buildCloseButton()
	);
	node.classList.add(CSS_OPEN_CLASS);
	if (!article.read) {
		articles.markRead([article.id]);
	}
}

function buildToolbar(article: Article) {
	let node = html.node("div", {className:"toolbar"});

	let input, label;

	input = html.node("input", {type:"checkbox"});
	input.addEventListener("change", async (e) => {
		let checked = (e.target as HTMLInputElement).checked;
		let content = checked ? await articles.getFullContent(article.id) : ""
		buildBody(article, content);
	});
	label = html.node("label", {className:"full-content", title:"Load full content"}, "", node);
	label.append(input, html.icon("cup-hot"), html.icon("cup-hot-fill"));

	return node;
}

function buildHeader(article: Article) {
	let node = html.node("header");

	let feed = subscriptions.get(article.subscription_id);
	if (feed && feed.web_url) {
		html.node("a", {className:"feed", href:feed.web_url, target:"_blank"}, "", node)
			.append(new FeedIcon(feed), html.text(feed.title));
	}

	let title = html.node("h1", {}, "", node);
	title.append(html.node("a", {href: article.url, target:"_blank"}, article.title));

	let info = html.node("div", {className:"publish-info"}, "", node);
	html.node("time", {}, format.date(article.time_published), info);
	article.author && html.node("span", {}, article.author, info);

	return node;
}

function buildBody(article: Article, full_content?: string) {
	let shadow = body.shadowRoot!;

	shadow.innerHTML = full_content || article.content || article.summary || "";

	if (!shadow.querySelector("img") && article.image_url) {
		let img = document.createElement("img");
		img.src = article.image_url;
		shadow.prepend(img);
	}

	shadow.querySelectorAll("img").forEach(img => img.loading = "lazy");
	shadow.querySelectorAll("a").forEach(link => link.target = "_blank");

	const css = document.createElement("link");
	css.setAttribute("rel", "stylesheet");
	css.setAttribute("href", "/static/article.css");
	shadow.prepend(css);

	return body;
}

function buildCloseButton() {
	let btn = html.button({type:"button", icon: "cross", classList:"close plain"});
	btn.addEventListener("click", _ => node.classList.remove(CSS_OPEN_CLASS));
	return btn;
}
