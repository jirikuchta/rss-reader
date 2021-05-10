import { get as getSubscription, isSubscription } from "data/subscriptions";
import { list as listArticles } from "data/articles";

import * as html from "util/html";
import * as pubsub from "util/pubsub";
import * as format from "util/format";

import { selected as selectedNavItem } from "ui/nav";
import subscriptionIcon from "ui/widget/subscription-icon";


const SELECTED_CSS_CLASS = "is-selected";
const READ_CSS_CLASS = "is-read";

export const node = html.node("section", {"id": "list"});
export let selected: Article;

const observer = new IntersectionObserver(
	entries => entries[0].isIntersecting && buildItems(),
	{root: node, rootMargin: "0% 0% 33% 0%", threshold: 1}
);

export function init() {
	build();
	pubsub.subscribe("nav-item-selected", build);
}

async function build() {
	html.clear(node);
	buildItems();
}

async function buildItems() {
	observer.disconnect();
	let items = await listArticles(get_filters());
	if (items.length) {
		items.forEach(article => node.appendChild(buildItem(article)));
		observer.observe(node.querySelector("article:last-child")!);
	}
}

function buildItem(article: Article) {
	let subscription = getSubscription(article.subscription_id);

	let node = html.node("article");
	node.addEventListener("click", _ => selectItem(node, article));

	let header = html.node("header", {}, "", node);
	header.appendChild(subscriptionIcon(subscription));
	header.appendChild(html.node("h6", {}, subscription.title));
	header.appendChild(html.node("time", {}, format.date(article.time_published)));

	node.appendChild(html.node("h3", {}, article.title));
	node.appendChild(html.node("p", {}, article.summary));

	return node;
}

function get_filters() {
	let filters: ArticleFilters = {
		unread_only: true,
		offset: node.querySelectorAll(`article:not(.${READ_CSS_CLASS})`).length
	};

	if (selectedNavItem) {
		if (isSubscription(selectedNavItem)) {
			filters["subscription_id"] = selectedNavItem.id;
		} else {
			filters["category_id"] = selectedNavItem.id;
		}
	}

	return filters;
}

async function selectItem(itemNode: HTMLElement, article: Article) {
	node.querySelector(`.${SELECTED_CSS_CLASS}`)?.classList.remove(SELECTED_CSS_CLASS);
	itemNode.classList.add(SELECTED_CSS_CLASS);
	itemNode.classList.add(READ_CSS_CLASS);
	selected = article;
	pubsub.publish("article-selected");
}
