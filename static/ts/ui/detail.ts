import * as types from "data/types";
import * as subscriptions from "data/subscriptions";

import * as format from "util/format";

import App from "app";
import Icon from "ui/icon";
import FeedIcon from "ui/widget/feed-icon";

export default class Detail extends HTMLElement {
	get app() {
		return this.closest("rr-app") as App;
	}

	set article(article: types.Article) {
		this.scrollTo(0, 0);
		this.replaceChildren(
			buildHeader(article),
			buildBody(article),
			buildCloseBtn(this)
		);
	}
}

customElements.define("rr-detail", Detail);

function buildHeader(article: types.Article) {
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

	feed_link.className = "web";
	info.className = "publish-info";

	node.append(title, info);

	return node;
}

function buildBody(article: types.Article, full_content?: string) {
	let node = document.createElement("div");
	let shadow = node.attachShadow({mode:"open"});
	node.className = "body";

	shadow.innerHTML = full_content || article.content || article.summary || "";

	if (!shadow.querySelector("img") && article.image_url) {
		let img = document.createElement("img");
		img.src = article.image_url;
		shadow.prepend(img);
	}

	shadow.querySelectorAll("img").forEach(img => img.loading = "lazy");
	shadow.querySelectorAll("a").forEach(link => link.target = "_blank");
	shadow.querySelectorAll("[style]").forEach(elm => elm.removeAttribute("style"));

	const css = new CSSStyleSheet();
	css.replaceSync(`
		* {
			margin: 24px auto;
			max-width: 100% !important;
			&:first-child { margin-top: 0; }
		}

		iframe, video, figure, img {
			display: block;
			height: auto !important;
		}

		br { display: none; }
	`);
	shadow.adoptedStyleSheets = [css];

	return node;
}

function buildCloseBtn(detail: Detail) {
	let node = document.createElement("button");
	node.type = "button";
	node.classList.add("close");
	node.append(new Icon("cross"));
	node.addEventListener("click", _ => detail.app.toggleDetail(false));
	return node;
}
