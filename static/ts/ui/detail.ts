import * as types from "data/types";
import * as articles from "data/articles";
import * as subscriptions from "data/subscriptions";

import * as format from "util/format";

import App from "app";
import Icon from "ui/icon";
import FeedIcon from "ui/widget/feed-icon";

const BODY_CSS = `
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
`;

export default class Detail extends HTMLElement {
	get app() {
		return this.closest("rr-app") as App;
	}

	set article(data: types.Article) {
		let article = new Article(data);
		this.replaceChildren(article, new Tools(article), buildCloseButton(this.app));
		await articles.markRead([data.id]);
	}
}

customElements.define("rr-detail", Detail);

class Tools extends HTMLElement {
	constructor(protected article: Article) { super(); }

	connectedCallback() {
		let { article } = this;

		let label: HTMLLabelElement;
		let input: HTMLInputElement;

		label = document.createElement("label");
		label.title = "Full content";
		input = document.createElement("input");
		input.type = "checkbox";
		input.addEventListener("change", e => {
			let target = e.target as HTMLInputElement;
			article.toggleContent(target.checked);
		});
		label.append(input, new Icon("cup-hot"), new Icon("cup-hot-fill"));
		this.append(label);

		label = document.createElement("label");
		label.title = "Read later";
		input = document.createElement("input");
		input.type = "checkbox";
		input.addEventListener("change", e => {
			let target = e.target as HTMLInputElement;
			articles.edit(article.data.id, {starred: target.checked});
		});
		label.append(input, new Icon("bookmark"), new Icon("bookmark-fill"));
		this.append(label);
	}
}

customElements.define("rr-tools", Tools);

class Article extends HTMLElement {
	constructor(protected _data: types.Article) { super(); }

	get data() { return this._data; }

	connectedCallback() {
		let { data } = this;
		this.append(buildHeader(data), buildBody(data));
	}

	async toggleContent(full: boolean) {
		let { data } = this;
		let content = full ? await articles.getFullContent(data.id) : "";
		let body = this.querySelector(".body") as HTMLElement;
		body.replaceWith(buildBody(data, content));
	}
}

customElements.define("rr-article", Article);

function buildHeader(article: types.Article) {
	let node = document.createElement("header");

	let feed = subscriptions.get(article.subscription_id);
	if (feed && feed.web_url) {
		let webLink = document.createElement("a");
		webLink.className = "web";
		webLink.href = feed.web_url;
		webLink.target = "_blank";
		webLink.append(new FeedIcon(feed), feed.title);
		node.append(webLink);
	}

	let title = document.createElement("h1");
	let titleLink = document.createElement("a");
	titleLink.href = article.url;
	titleLink.target = "_blank";
	titleLink.textContent = article.title;
	title.append(titleLink);
	node.append(title);

	let publishInfo = document.createElement("div");
	publishInfo.className = "publish-info";
	node.append(publishInfo);

	let publishTime = document.createElement("time");
	publishTime.textContent = format.date(article.time_published);
	publishInfo.append(publishTime);

	if (article.author) {
		let author = document.createElement("span");
		author.textContent = article.author;
		publishInfo.append(author);
	}

	return node;
}

function buildBody(article: types.Article, content?: string) {
	let node = document.createElement("div");
	node.className = "body";

	let css = new CSSStyleSheet();
	css.replaceSync(BODY_CSS);

	let shadow = node.attachShadow({mode:"open"});
	shadow.adoptedStyleSheets = [css];

	shadow.innerHTML = content || article.content || article.summary || "";

	if (!shadow.querySelector("img") && article.image_url) {
		let img = document.createElement("img");
		img.src = article.image_url;
		shadow.prepend(img);
	}

	shadow.querySelectorAll("img").forEach(elm => elm.loading = "lazy");
	shadow.querySelectorAll("a").forEach(elm => elm.target = "_blank");
	shadow.querySelectorAll("[style]").forEach(elm => elm.removeAttribute("style"));

	return node;
}

function buildCloseButton(app: App) {
	let node = document.createElement("button");
	node.className = "close";
	node.append(new Icon("cross"));
	node.addEventListener("click", e => app.toggleDetail(false));
	return node;
}
