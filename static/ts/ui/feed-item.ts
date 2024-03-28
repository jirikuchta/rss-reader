import { Article } from "data/types";

import * as settings from "data/settings";
import * as articles from "data/articles";
import * as subscriptions from "data/subscriptions";

import * as format from "util/format";
import * as pubsub from "util/pubsub";
import * as command from "util/command";
import * as html from "util/html";

import FeedIcon from "ui/widget/feed-icon";

const ACTIVE_CSS_CLASS = "is-active";
const READ_CSS_CLASS = "is-read";

export default class FeedItem extends HTMLElement {
	constructor(protected data: Article) { super(); }

	get itemId() {
		return this.data.id;
	}

	get read() {
		return this.classList.contains(READ_CSS_CLASS);
	}

	set read(toggle: boolean) {
		this.classList.toggle(READ_CSS_CLASS, toggle);
	}

	get active() {
		return this.classList.contains(ACTIVE_CSS_CLASS);
	}

	set active(toggle: boolean) {
		this.classList.toggle(ACTIVE_CSS_CLASS, toggle);
		this.active && command.execute("detail:show", this.data);
	}

	async sync() {
		this.data = await articles.get(this.itemId);
		this.read = this.data.read;
	}

	connectedCallback() {
		this.read = this.data.read;

		this.append(buildHeader(this.data), buildText(this.data));

		let picture = buildPicture(this.data);
		picture && this.append(picture);

		pubsub.subscribe("articles-updated", this);
	}

	disconnectCallback() {
		pubsub.unsubscribe("articles-updated", this);
	}

	handleMessage(message:string, publisher?: any, data?: any) {
		message == "articles-updated" && this.sync();
	}
}

customElements.define("rr-feed-item", FeedItem);

function buildHeader(article: Article) {
	let subscription = subscriptions.get(article.subscription_id)!;
	let node = document.createElement("header");

	let title = document.createElement("h6");
	title.textContent = subscription.title || subscription.feed_url;

	let time = document.createElement("time");
	time.textContent = format.date(article.time_published);

	node.append(new FeedIcon(subscription), title, time, buildBookmark(article));

	return node;
}

function buildText(article: Article) {
	let node = document.createElement("div");
	node.className = "text";

	let title = document.createElement("h3");
	title.textContent = article.title;

	let summary = document.createElement("p");
	summary.textContent = article.summary || "";

	node.append(title, summary);

	return node;
}

function buildPicture(article: Article) {
	if (!article.image_url) { return; }
	if (!settings.getItem("showImages")) { return; }

	let node = document.createElement("div");
	node.className = "picture";

	let img = new Image();
	img.src = article.image_url;
	img.loading = "lazy";

	node.append(img);

	return node;
}

function buildBookmark(article: Article) {
	let node = document.createElement("label");
	node.title = "Read later";
	node.className = "bookmark";
	node.addEventListener("click", e => e.stopPropagation());

	let input = document.createElement("input");
	input.type = "checkbox";
	input.checked = article.starred;
	input.addEventListener("change", async (e) => {
		await articles.edit(article.id, {
			"starred": input.checked,
			"read": input.checked ? false: article.read
		});
	});

	node.append(input, html.icon("bookmark"), html.icon("bookmark-fill"));

	return node;
}
