import { Article, ArticleFilters } from "data/types";

import * as settings from "data/settings";
import * as subscriptions from "data/subscriptions";
import * as articles from "data/articles";

import * as html from "util/html";
import * as pubsub from "util/pubsub";
import * as format from "util/format";
import * as command from "util/command";

import * as navigation from "ui/nav";
import subscriptionIcon from "ui/widget/subscription-icon";


const SELECTED_CSS_CLASS = "is-selected";
const READ_CSS_CLASS = "is-read";
const STARRED_CSS_CLASS = "is-starred";

export const node = document.getElementById("list") as HTMLElement;
let items: Item[] = [];

let markReadTimeout: number;

const showMoreObserver = new IntersectionObserver(
	entries => entries[0].isIntersecting && build(),
	{root: node, rootMargin: "0% 0% 20% 0%"}
);

export function init() {
	build();

	pubsub.subscribe("articles-read", () => items.forEach(i => i.syncRead()));
	pubsub.subscribe("articles-cleared", () => { clear(); build(); });

	node.addEventListener("scroll", e => {
		clearTimeout(markReadTimeout);
		markReadTimeout = setTimeout(() => onScroll(), 300);
	});

	document.body.addEventListener("keydown", e => {
		if (["Alt", "Control", "Shift", "OS", "Meta"].some(key => e.getModifierState(key))) { return; }
		if (e.isComposing) { return; }
		e.code == "ArrowRight" && next();
		e.code == "ArrowLeft" && prev();
	});
}

export function next() {
	let selectedIndex = items.findIndex(i => i.selected);
	if (selectedIndex == -1) { return; }
	let item = items[selectedIndex + 1];
	item && (item.selected = true) && item.focus();
}

export function prev() {
	let selectedIndex = items.findIndex(i => i.selected);
	if (selectedIndex == -1) { return; }
	let item = items[selectedIndex - 1];
	item && (item.selected = true) && item.focus();
}

function clear() {
	html.clear(node);
	node.scrollTo(0, 0);
	items = [];
}

async function build() {
	let data = await articles.list(getFilters());

	data.forEach(article => {
		let item = new Item(article);
		item.node.addEventListener("click", () => item.selected = true);
		node.appendChild(item.node);
		items.push(item);
	});

	showMoreObserver.disconnect();
	data.length && showMoreObserver.observe(items[items.length - 1].node);
}

function getFilters() {
	let filters: ArticleFilters = {
		offset: items.filter(i => settings.getItem("unreadOnly") ? !i.read : true).length
	};

	if (settings.getItem("unreadOnly") && !(navigation.selected instanceof navigation.ReadLaterItem)) {
		filters.unread_only = true;
	}

	if (navigation.selected instanceof navigation.ReadLaterItem) {
		filters.starred_only = true;
		filters.offset = items.length;
		delete filters.unread_only;
	}

	if (navigation.selected instanceof navigation.SubscriptionItem) {
		filters["subscription_id"] = navigation.selected.data.id;
	}

	if (navigation.selected instanceof navigation.CategoryItem) {
		filters["category_id"] = navigation.selected.data.id;
	}

	return filters;
}

function onScroll() {
	if (!settings.getItem("markAsReadOnScroll")) { return; }
	let markReadItems = items.filter(i => !i.read && i.node.getBoundingClientRect().bottom <= 0)
	markReadItems.length && articles.markRead(markReadItems.map(i => i.id));
}

class Item {
	node = html.node("article");
	data: Article;

	constructor(data: Article) {
		this.data = data;
		this.build();
	}

	get id() {
		return this.data.id;
	}

	get read() {
		return this.data.read;
	}

	set read(value: boolean) {
		this.data.read = value;
		this.node.classList.toggle(READ_CSS_CLASS, value);
	}

	get selected() {
		return this.node.classList.contains(SELECTED_CSS_CLASS);
	}

	set selected(selected: boolean) {
		items.forEach(i => i.node.classList.toggle(
			SELECTED_CSS_CLASS, i.id == this.id ? selected : (selected ? false : i.selected)));
		selected && command.execute("detail:show", this.data)
	}

	focus() {
		let rect = this.node.getBoundingClientRect();
		if (rect.y <= 0 || rect.bottom > node.clientHeight) {
			(this.node.previousElementSibling || this.node).scrollIntoView(true);
		}
	}

	async syncRead() {
		this.read = (await articles.get(this.data.id)).read;
	}

	protected build() {
		let subscription = subscriptions.get(this.data.subscription_id)!;

		this.node.dataset.id = this.id.toString();
		this.node.classList.toggle(READ_CSS_CLASS, this.data.read && !this.data.starred);
		this.node.classList.toggle(STARRED_CSS_CLASS, this.data.starred);

		let header = html.node("header", {}, "", this.node);
		let body = html.node("div", {className:"body"}, "", this.node);

		header.appendChild(subscriptionIcon(subscription));
		header.append(
			html.node("h6", {}, subscription.title || subscription.feed_url),
			html.node("time", {}, format.date(this.data.time_published)),
			this.buildReadLaterButton()
		);

		let text = html.node("div", {className:"text"}, "", body);
		text.appendChild(html.node("h3", {}, this.data.title));
		text.appendChild(html.node("p", {}, this.data.summary));

		if (this.data.image_url && settings.getItem("showImages")) {
			let picture = html.node("div", {className:"picture"}, "", body);
			picture.appendChild(html.node("img", {src:this.data.image_url, loading:"lazy"}));
		}
	}

	protected buildReadLaterButton() {
		let btn = html.button({title:"Read later", className:"read-later"});
		btn.append(html.icon("bookmark"), html.icon("bookmark-fill"));
		btn.addEventListener("click", async (e) => {
			e.stopPropagation();
			let data = await articles.edit(this.data.id, {"starred": !this.data.starred});
			this.node.classList.toggle(STARRED_CSS_CLASS, data!.starred);
		});
		return btn;
	}
}
