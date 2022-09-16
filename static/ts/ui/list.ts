import { Article, ArticleFilters } from "data/types";

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
let items: Item[] = [];

let markReadTimeout: number;

const showMoreObserver = new IntersectionObserver(
	entries => entries[0].isIntersecting && build(),
	{root: node, rootMargin: "0% 0% 20% 0%"}
);

export function init() {
	build();

	pubsub.subscribe("nav-item-selected", () => {
		html.clear(node);
		items = [];
		build();
	});

	pubsub.subscribe("articles-read", () => items.forEach(i => i.sync()));

	node.addEventListener("scroll", () => {
		clearTimeout(markReadTimeout);
		markReadTimeout = setTimeout(() => markRead(), 300);
	});

	document.body.addEventListener("keydown", e => {
		if (["Alt", "Control", "Shift", "OS", "Meta"].some(key => e.getModifierState(key))) { return; }
		if (e.isComposing) { return; }

		let selectedIndex = items.findIndex(i => i.isSelected);
		if (selectedIndex == -1) { return; }

		if (e.code == "ArrowRight") {
			let item = items[selectedIndex + 1];
			item && (item.isSelected = true) && item.focus();
		}

		if (e.code == "ArrowLeft") {
			let item = items[selectedIndex - 1];
			item && (item.isSelected = true) && item.focus();
		}
	});
}

export function selected() {
	return items.find(i => i.isSelected)?.id;
}

async function build() {
	let data = await articles.list(getFilters());

	data.forEach(article => {
		let item = new Item(article);
		item.node.addEventListener("click", () => item.isSelected = true);
		node.appendChild(item.node);
		items.push(item);
	});

	showMoreObserver.disconnect();
	data.length && showMoreObserver.observe(items[items.length - 1].node);
}

function getFilters() {
	let filters: ArticleFilters = {
		unread_only: true,
		offset: items.filter(i => !i.isRead).length
	};

	if (navigation.selected instanceof navigation.SubscriptionItem) {
		filters["subscription_id"] = navigation.selected.data.id;
	}

	if (navigation.selected instanceof navigation.CategoryItem) {
		filters["category_id"] = navigation.selected.data.id;
	}

	return filters;
}

function markRead() {
	let markReadItems = items.filter(i => !i.isRead && i.node.getBoundingClientRect().bottom <= 0)
	markReadItems.length && articles.markRead(markReadItems.map(i => i.id));
}

class Item {
	node: HTMLElement;
	protected data: Article;

	constructor(data: Article) {
		this.data = data;
		this.node = this.build();
	}

	get id() {
		return this.data.id;
	}

	get isRead() {
		return this.node.classList.contains(READ_CSS_CLASS);
	}

	set isRead(value: boolean) {
		this.node.classList.toggle(READ_CSS_CLASS, value);
	}

	get isSelected() {
		return this.node.classList.contains(SELECTED_CSS_CLASS);
	}

	set isSelected(value: boolean) {
		items.forEach(i => i.node.classList.toggle(
			SELECTED_CSS_CLASS, i.id == this.id ? value : (value ? false : i.isSelected)));
		value && pubsub.publish("article-selected");
	}

	focus() {
		let rect = this.node.getBoundingClientRect();
		if (rect.y <= 0 || rect.bottom > node.clientHeight) {
			(this.node.previousElementSibling || this.node).scrollIntoView(true);
		}
	}

	async sync() {
		this.data = await articles.get(this.data.id);
		this.isRead = this.data.read;
	}

	protected build() {
		let subscription = subscriptions.get(this.data.subscription_id)!;

		let elm = html.node("article");
		elm.dataset.id = this.id.toString();

		let header = html.node("header", {}, "", elm);
		header.appendChild(subscriptionIcon(subscription));
		header.appendChild(html.node("h6", {}, subscription.title || subscription.feed_url));
		header.appendChild(html.node("time", {}, format.date(this.data.time_published)));

		this.data.image_url && elm.appendChild(html.node("img", {src:this.data.image_url}));
		elm.appendChild(html.node("h3", {}, this.data.title));
		elm.appendChild(html.node("p", {}, this.data.summary));

		return elm;
	}
}
