import * as types from "data/types";
import * as articles from "data/articles";
import * as subscriptions from "data/subscriptions";
import * as settings from "data/settings";

import Swipe from "util/swipe";
import * as format from "util/format";

import app from "app";
import icon from "ui/icon";
import Popup from "ui/widget/popup";
import FeedIcon from "ui/widget/feed-icon";


export default class Detail extends HTMLElement {
	constructor() {
		super();
		this.initSwipe();
	}

	set article(data: types.Article) {
		this.scrollTo(0, 0);

		let subscription = subscriptions.get(data.subscription_id);
		let article = new Article(data);
		article.fullContent = subscription?.auto_full_content || false;

		this.replaceChildren(article, new Tools(article));
		articles.markRead([data.id]);
	}

	protected initSwipe() {
		let swipe = new Swipe(this);
		swipe.onSwipe = async (dir) => {
			if (dir != "left" && dir != "right") { return; }
			try {
				// @ts-ignore
				let transition = document.startViewTransition(() => this.swipe(dir));
				await transition.updateCallbackDone;
			} catch (e: any) {
				this.swipe(dir);
			}
		};
	}

	protected swipe(dir: string) {
		dir == "left" && app.articles.next();
		dir == "right" && app.articles.prev();
	}
}

customElements.define("rr-detail", Detail);

class Tools extends HTMLElement {
	constructor(protected article: Article) { super(); }

	connectedCallback() {
		const { article } = this;

		let label: HTMLLabelElement;
		let input: HTMLInputElement;
		let subscription = subscriptions.get(article.data.subscription_id);

		label = document.createElement("label");
		label.title = "Full content";
		input = document.createElement("input");
		input.type = "checkbox";
		input.checked = subscription?.auto_full_content || false;
		input.addEventListener("change", e => {
			let target = e.target as HTMLInputElement;
			article.fullContent = target.checked;
		});
		label.append(input, icon("cup-hot"), icon("cup-hot-fill"));
		this.append(label);

		label = document.createElement("label");
		label.title = "Bookmark";
		input = document.createElement("input");
		input.type = "checkbox";
		input.checked = article.data.bookmarked;
		input.addEventListener("change", e => {
			let target = e.target as HTMLInputElement;
			articles.edit(article.data.id, {bookmarked: target.checked});
		});
		label.append(input, icon("bookmark"), icon("bookmark-fill"));
		this.append(label);

		label = document.createElement("label");
		label.title = "Font size";
		label.append(icon("font"));
		label.addEventListener("click", e => {
			let popup = new Popup();
			popup.node.classList.add("detail-font-size");

			let title = document.createElement("h4");
			title.textContent = "Font size";

			popup.node.append(title, buildRangeInput(10, 24, 2));
			popup.open(e.target as HTMLElement, "side");
		});
		this.append(label);
	}
}

customElements.define("rr-tools", Tools);

function buildRangeInput(min: number, max: number, step: number) {
	let input = document.createElement("input");
	input.type = "range";
	input.min = String(min);
	input.max = String(max);
	input.step = String(step);
	input.setAttribute("list", "steps");
	input.value = String(settings.getItem("detailFontSize"));
	input.addEventListener("input", e => settings.setItem("detailFontSize", Number(input.value)));

	let datalist = document.createElement("datalist");
	datalist.id = "steps";
	for(let i = min; i <= max; i += step) {
		let option = document.createElement("option");
		option.value = String(i);
		datalist.append(option);
	}

	let frag = document.createDocumentFragment();
	frag.append(input, datalist);

	return frag;
}


class Article extends HTMLElement {
	protected _fullContent = false;

	constructor(protected _data: types.Article) { super(); }

	get data() { return this._data; }

	get fullContent() { return this._fullContent; }
	set fullContent(toggle: boolean) {
		const { isConnected } = this;
		this._fullContent = toggle;
		isConnected && this.buildContent();
	}

	connectedCallback() {
		const { data } = this;
		this.append(buildHeader(data));
		this.buildContent();
	}

	protected async buildContent() {
		const { data, fullContent } = this;
		this.querySelector("rr-article-content")?.remove();
		let content = fullContent ? await articles.getFullContent(data.id) : "";
 		this.append(new ArticleContent(data, content));
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


class ArticleContent extends HTMLElement {
	constructor(protected article: types.Article, protected content?: string) {
		super();
		this.attachShadow({mode:"open"})
	}

	get shadow() { return this.shadowRoot!; }

	connectedCallback() {
		const { shadow, content, article } = this;

		shadow.innerHTML = content || article.content || article.summary || "";

		if (!shadow.querySelector("img, iframe") && article.image_url) {
			let img = document.createElement("img");
			img.src = article.image_url;
			shadow.prepend(img);
		}

		this.normalize();
		this.setCSS();

		app.addEventListener("settings-changed", this);
	}

	disconnectCallback() {
		app.removeEventListener("settings-changed", this);
	}

	handleEvent(event: Event) {
		event.type == "settings-changed" && this.setCSS();
	}

	normalize() {
		const { shadow, article } = this;

		shadow.querySelectorAll("img").forEach(elm => elm.loading = "lazy");
		shadow.querySelectorAll("a").forEach(elm => elm.target = "_blank");

		["style", "class"].forEach(attr => {
			shadow.querySelectorAll(`[${attr}]`)
				.forEach(elm => elm.removeAttribute(attr));
		});

		["src", "href"].forEach(attr => {
			shadow.querySelectorAll(`[${attr}]`).forEach(elm => {
				elm.setAttribute(attr, new URL(elm.getAttribute(attr)!, article.url).toString());
			});
		});
	}

	protected setCSS() {
		let css = new CSSStyleSheet();
		css.replaceSync(`
			:host {
				font-size: ${settings.getItem("detailFontSize")}px;
				line-height: 1.5em;
				box-sizing: border-box;
			}

			:host > * {
				margin: 24px auto;
				&:first-child { margin-top: 0; }
			}

			iframe, video, figure, img {
				display: block;
				max-width: 100%;
				height: auto !important;
				margin-inline: auto;
			}

			iframe, video {
				width: 100%;
				aspect-ratio: 16/9;
			}

			br, svg { display: none; }

			pre {
				padding: 16px;
				overflow: auto;
				background: var(--color-bg-secondary);
			}
		`);
		this.shadow.adoptedStyleSheets = [css];
	}
}

customElements.define("rr-article-content", ArticleContent);
