import { Article, ArticleFilters } from "data/types";

import * as subscriptions from "data/subscriptions";
import * as articles from "data/articles";

import * as html from "util/html";
import * as pubsub from "util/pubsub";
import * as format from "util/format";

import { selected as selectedNavItem } from "ui/nav";
import subscriptionIcon from "ui/widget/subscription-icon";


const SELECTED_CSS_CLASS = "is-selected";
const READ_CSS_CLASS = "is-read";

export const node = html.node("section", {"id": "list"});

let items: Article[] = [];
let selectedIndex: number = -1;

const observer = new IntersectionObserver(
	entries => entries[0].isIntersecting && build(),
	{root: node, rootMargin: "0% 0% 33% 0%", threshold: 1}
);

export function init() {
	build();
	pubsub.subscribe("nav-item-selected", _ => {clear(); build()});

	document.body.addEventListener("keydown", e => {
		e.code == "ArrowRight" && select(selectedIndex + 1, true);
		e.code == "ArrowLeft" && select(selectedIndex - 1, true);
	});
}

export function getSelectedArticle() {
	return items[selectedIndex];
}

function clear() {
	html.clear(node);
	items = [];
	selectedIndex = -1;
}

async function build() {
	observer.disconnect();

	let data = await articles.list(getFilters());
	if (!data.length) { return; }

	data.forEach((article, i) => node.appendChild(buildItem(article, i)));
	items = items.concat(data);

	observer.observe(node.querySelector("article:last-child")!);
}

function buildItem(article: Article, index: number) {
	let subscription = subscriptions.get(article.subscription_id);
	if (!subscription) { return html.fragment(); }

	let node = html.node("article");
	node.addEventListener("click", _ => select(items.findIndex(i => i.id == article.id)));

	let header = html.node("header", {}, "", node);
	header.appendChild(subscriptionIcon(subscription));
	header.appendChild(html.node("h6", {}, subscription.title || subscription.feed_url));
	header.appendChild(html.node("time", {}, format.date(article.time_published)));

	node.appendChild(html.node("h3", {}, article.title));
	node.appendChild(html.node("p", {}, article.summary));

	return node;
}

function getFilters() {
	let filters: ArticleFilters = {
		unread_only: true,
		offset: node.querySelectorAll(`article:not(.${READ_CSS_CLASS})`).length
	};

	if (selectedNavItem) {
		if (selectedNavItem.type == "subscription") {
			filters["subscription_id"] = selectedNavItem.id;
		} else {
			filters["category_id"] = selectedNavItem.id;
		}
	}

	return filters;
}

function select(index: number, scrollIntoView = false) {
	let articleNode = node.querySelector(`article:nth-of-type(${index + 1})`);
	if (!articleNode) { return; }

	node.querySelector(`.${SELECTED_CSS_CLASS}`)?.classList.remove(SELECTED_CSS_CLASS);
	articleNode.classList.add(SELECTED_CSS_CLASS);
	articleNode.classList.add(READ_CSS_CLASS);
	scrollIntoView && articleNode.scrollIntoView(false);

	selectedIndex = index;
	pubsub.publish("article-selected");
}
