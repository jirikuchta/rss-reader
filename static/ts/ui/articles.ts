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

export const node = document.getElementById("articles") as HTMLElement;

const header = html.node("header");
const unreadCounter = html.node("span", {className:"count"});
let items: Item[] = [];

let markReadTimeout: number;

const showMoreObserver = new IntersectionObserver(
	entries => entries[0].isIntersecting && buildItems(),
	{root: node, rootMargin: "0% 0% 20% 0%"}
);

export function init() {
	build();

	pubsub.subscribe("articles-updated", () => items.forEach(i => i.sync()));
	pubsub.subscribe("articles-cleared", () => { clear(); build(); });
	pubsub.subscribe("counters-updated", syncCounter);

	node.addEventListener("scroll", onScroll);
	node.addEventListener("click", onClick);

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

function build() {
	buildHeader();
	buildItems();
}

function buildHeader() {
	let navItem = navigation.selected;

	let menu = html.button({icon:"menu", className:"menu"}, "", header)
	menu.addEventListener("click", e => {
		e.stopPropagation();
		navigation.toggleOpen(true);
	});

	let title = html.node("h4");
	title.append(navItem.icon, html.text(navItem.data.title), unreadCounter);

	syncCounter();

	header.replaceChildren(menu, title);
	node.append(header);
}

function syncCounter() {
	let count = String(navigation.selected.unreadCount || "");
	unreadCounter.replaceChildren(html.text(count));
}

async function buildItems() {
	let data = await articles.list(getFilters());
	let frag = html.fragment();

	data
		.filter(article => !items.find(item => item.id == article.id))
		.forEach(article => {
			let item = new Item(article);
			frag.append(item.node);
			items.push(item);
		});

	node.append(frag);

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

function onScroll(e: Event) {
	header.classList.toggle("has-shadow", !!node.scrollTop);
	clearTimeout(markReadTimeout);
	markReadTimeout = setTimeout(() => markRead(), 300);
}

function onClick(e: Event) {
	let itemNode: HTMLElement | null = (e.target as HTMLElement).closest("[data-id]");
	if (!itemNode) { return; }

	let item = items.find(item => item.node == itemNode);
	if (!item) { return; }

	item.selected = true;
}

function markRead() {
	if (!settings.getItem("markAsReadOnScroll")) { return; }
	let markReadItems = items.filter(i => !i.read && i.node.getBoundingClientRect().bottom <= 0)
	markReadItems.length && articles.markRead(markReadItems.map(i => i.id));
}

class Item {
	node = html.node("article");
	data: Article;
	protected bookmarkCheckbox = html.node("input", {type: "checkbox"});

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

	async sync() {
		this.data = await articles.get(this.data.id);
		this.read = this.data.read;
		this.bookmarkCheckbox.checked = this.data.starred;
	}

	protected build() {
		const { node, data, id } = this;

		let subscription = subscriptions.get(data.subscription_id)!;

		node.dataset.id = id.toString();
		node.classList.toggle(READ_CSS_CLASS, data.read);

		let header = html.node("header");
		header.appendChild(subscriptionIcon(subscription));
		header.append(
			html.node("h6", {}, subscription.title || subscription.feed_url),
			html.node("time", {}, format.date(data.time_published)),
			this.buildBookmark()
		);

		let text = html.node("div", {className:"text"});
		text.appendChild(html.node("h3", {}, data.title));
		text.appendChild(html.node("p", {}, data.summary));

		let picture;
		if (data.image_url && settings.getItem("showImages")) {
			picture = html.node("div", {className:"picture"});
			picture.appendChild(html.node("img", {src:data.image_url, loading:"lazy"}));
		}

		node.append(header, text);
		picture && node.append(picture);
	}

	protected buildBookmark() {
		let node = html.node("label", {title: "Read later", className: "bookmark"});
		node.addEventListener("click", e => e.stopPropagation());

		this.bookmarkCheckbox.addEventListener("change", async (e) => {
			await articles.edit(this.id, {
				"starred": this.bookmarkCheckbox.checked,
				"read": this.bookmarkCheckbox.checked ? false: this.data.read
			});
		});

		node.append(
			this.bookmarkCheckbox,
			html.icon("bookmark"),
			html.icon("bookmark-fill")
		);

		return node;
	}
}
