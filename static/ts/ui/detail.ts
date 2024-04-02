import { Article } from "data/types";
import * as articles from "data/articles";
import * as subscriptions from "data/subscriptions";

import * as html from "util/html";
import * as format from "util/format";

import icon from "ui/icon";
import FeedIcon from "ui/widget/feed-icon";

const body = html.node("div", {className: "body"});
body.attachShadow({mode:"open"});

export default class Detail extends HTMLElement {
	toggle(toggle?: boolean) {
		this.classList.toggle("is-open", toggle);
	}

	set article(article: Article) {
		this.scrollTo(0, 0);
		this.replaceChildren(
			buildToolbar(article),
			buildHeader(article),
			buildBody(article),
			buildCloseBtn(this)
		);
	}
}

customElements.define("rr-detail", Detail);

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
	label.append(input, icon("cup-hot"), icon("cup-hot-fill"));

	return node;
}

function buildHeader(article: Article) {
	let node = document.createElement("header");

	let feed_link = document.createElement("a");
	let title = document.createElement("h1");
	let info = document.createElement("div");

	let feed = subscriptions.get(article.subscription_id);
	if (feed && feed.web_url) {
		feed_link.href = feed.web_url;
		feed_link.target = "_blank";
		feed_link.append(new FeedIcon(feed), feed.title);
		node.append(feed_link);
	}

	let title_link = document.createElement("a");
	title_link.href = article.url;
	title_link.target = "_blank";
	title_link.textContent = article.title;
	title.append(title_link);

	let time = document.createElement("time");
	time.textContent = format.date(article.time_published);
	info.append(time);

	let author;
	if (article.author) {
		author = document.createElement("span");
		author.textContent = article.author;
		info.append(author);
	}

	node.append(title, info);

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

function buildCloseBtn(detail: Detail) {
	let node = document.createElement("button");
	node.type = "button";
	node.classList.add("close", "plain");
	node.append(icon("cross"));
	node.addEventListener("click", _ => detail.toggle(false));
	return node;
}
