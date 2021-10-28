import { Article, ArticleFilters, ArticleId } from "data/types";

import * as subscriptions from "data/subscriptions";
import * as articles from "data/articles";

import * as html from "util/html";
import * as pubsub from "util/pubsub";
import * as format from "util/format";

import * as navigation from "ui/nav";
import subscriptionIcon from "ui/widget/subscription-icon";


const SELECTED_CSS_CLASS = "is-selected";
const READ_CSS_CLASS = "is-read";

export const node = html.node("section", {"id": "list"});

let markReadTimeout: number;

const showMoreObserver = new IntersectionObserver(
	entries => entries[0].isIntersecting && build(),
	{root: node, rootMargin: "0% 0% 20% 0%"}
);

export function init() {
	build();

	pubsub.subscribe("nav-item-selected", () => {
		html.clear(node);
		build();
	});

	pubsub.subscribe("articles-read", async () => {
		let nodes = node.querySelectorAll(`article:not(.${READ_CSS_CLASS})`);
		for (let n of nodes) {
			let article = await articles.get(parseArticleId(n as HTMLElement));
			article?.read && n.classList.add(READ_CSS_CLASS);
		}
	});

	node.addEventListener("scroll", () => {
		clearTimeout(markReadTimeout);
		markReadTimeout = setTimeout(() => markRead(), 300);
	});

	document.body.addEventListener("keydown", e => {
		if (["Alt", "Control", "Shift", "OS", "Meta"].some(key => e.getModifierState(key))) { return; }
		if (!["ArrowRight", "ArrowLeft"].includes(e.code)) { return; }
		if (e.isComposing) { return; }

		let n = getSibling(e.code == "ArrowRight" ? "next" : "prev");
		n && select(n, true);
	});
}

export function getSelectedArticleId() {
	let elm = getSelectedNode();
	return elm ? parseArticleId(elm) : null;
}

async function build() {
	let data = await articles.list(getFilters());

	data.forEach(article => {
		let elm = buildItem(article);
		elm && node.appendChild(elm);
	});

	showMoreObserver.disconnect();
	data.length && showMoreObserver.observe(node.querySelector("article:last-of-type")!);
}

function buildItem(article: Article) {
	let subscription = subscriptions.get(article.subscription_id);
	if (!subscription) { return; }

	let elm = html.node("article");
	elm.dataset.id = article.id.toString();

	let header = html.node("header", {}, "", elm);
	header.appendChild(subscriptionIcon(subscription));
	header.appendChild(html.node("h6", {}, subscription.title || subscription.feed_url));
	header.appendChild(html.node("time", {}, format.date(article.time_published)));

	elm.appendChild(html.node("h3", {}, article.title));
	elm.appendChild(html.node("p", {}, article.summary));

	elm.addEventListener("click", () => select(elm));

	return elm;
}

function getFilters() {
	let filters: ArticleFilters = {
		unread_only: true,
		offset: node.querySelectorAll(`article:not(.${READ_CSS_CLASS})`).length
	};

	if (navigation.selected) {
		if (navigation.selected.type == "subscription") {
			filters["subscription_id"] = navigation.selected.id;
		} else {
			filters["category_id"] = navigation.selected.id;
		}
	}

	return filters;
}

function select(n: HTMLElement, focus = false) {
	getSelectedNode()?.classList.remove(SELECTED_CSS_CLASS);

	n.classList.add(SELECTED_CSS_CLASS);
	n.classList.add(READ_CSS_CLASS);

	if (focus) {
		let rect = n.getBoundingClientRect();
		if (rect.y <= 0 || rect.bottom > node.clientHeight) {
			(n.previousElementSibling || n).scrollIntoView(true);
		}
	}

	pubsub.publish("article-selected");
}

function getSelectedNode() {
	let elm = node.querySelector(`.${SELECTED_CSS_CLASS}`);
	return elm ? (elm as HTMLElement) : null;
}

function getSibling(dir: "prev" | "next") {
	let n = getSelectedNode();
	if (!n) { return dir == "next" ? node.firstElementChild as HTMLElement : null; }
	return (dir == "next" ? n.nextElementSibling : n.previousElementSibling) as HTMLElement | null;
}

function parseArticleId(elm: HTMLElement) {
	return Number(elm.dataset.id);
}

function markRead() {
	let nodes = node.querySelectorAll(`article:not(.${READ_CSS_CLASS})`);
	let ids: ArticleId[] = [];

	for (let i = 0; i < nodes.length; i++) {
		let n = nodes[i] as HTMLElement;
		if (n.getBoundingClientRect().bottom > 0) { break; }
		ids.push(parseArticleId(n));
	}

	ids.length && articles.markRead(ids);
}

