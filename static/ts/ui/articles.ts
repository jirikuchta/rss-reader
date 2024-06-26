import * as types from "data/types";
import * as subscriptions from "data/subscriptions";
import * as settings from "data/settings";
import * as articles from "data/articles";

import * as format from "util/format";
import * as pubsub from "util/pubsub";
import Swipe from "util/swipe";

import FeedIcon from "ui/widget/feed-icon";
import { PopupMenu } from "ui/widget/popup";

import app from "app";
import Counter from "ui/counter";
import Icon from "ui/icon";

export default class Articles extends HTMLElement {
	protected _sorting: "newest" | "oldest" = "newest";
	protected _unreadOnly = true;
	protected markReadTimeout?: number;
	protected showMoreObserver = new IntersectionObserver(
		entries => entries[0].isIntersecting && this.buildItems(),
		{root: this, rootMargin: "0% 0% 20% 0%"}
	);

	constructor() {
		super();
		this.addEventListener("click", this);
		this.addEventListener("scroll", this);

		let swipe = new Swipe(this);
		swipe.onSwipe = async dir => {
			dir == "right" && app.toggleNav(true);
		};
	}

	connectedCallback() {
		this.build();
	}

	handleEvent(e: Event) {
		e.type == "click" && this.onClick(e);
		e.type == "scroll" && this.onScroll(e);
	}

	update() {
		this.scrollTo(0, 0);
		this.build();
	}

	next() {
		let item = this.items.find(i => i.active)?.nextElementSibling;
		if (item && item instanceof Item) { this.activeItem = item; }
	}

	prev() {
		let item = this.items.find(i => i.active)?.previousElementSibling;
		if (item && item instanceof Item) { this.activeItem = item; }
	}

	get items() {
		return [...this.querySelectorAll("rr-item-articles")] as Item[];
	}

	get filters() {
		let { items } = this;
		let selectedFeed = app.feeds.activeItem;

		let filters: types.ArticleFilters = {
			offset: items.filter(i => this._unreadOnly ? !i.read : true).length,
			unread_only: this._unreadOnly,
			order: this.sorting == "newest" ? "desc" : "asc"
		};

		if (selectedFeed.type == "starred") {
			filters.starred_only = true;
			filters.offset = items.length;
			delete filters.unread_only;
		}

		if (selectedFeed.type == "subscription") {
			filters["subscription_id"] = selectedFeed.itemId;
		}

		if (selectedFeed.type == "category") {
			filters["category_id"] = selectedFeed.itemId;
		}

		return filters;
	}

	get activeItem() { return this.items.find(i => i.active) || null; }
	set activeItem(item: Item | null) {
		this.items.forEach(item => item.active = false);
		item = item || this.items[0];
		if (!item) { return; }

		item.active = true;
		app.toggleDetail(true);
		app.detail.article = item.data;
	}

	get sorting() { return this._sorting; }
	set sorting(value: "newest" | "oldest") {
		this._sorting = value;
		this.update();
	}

	get unreadOnly() { return this._unreadOnly; }
	set unreadOnly(value: boolean) {
		this._unreadOnly = value;
		this.update();
	}

	protected async build() {
		let navItem = app.feeds.activeItem;

		let title = document.createElement("h4");
		title.append(navItem.icon, navItem.data.title);

		let counter = new Counter();
		counter.getCount = () => navItem.unreadCount;

		let filters = document.createElement("button");
		filters.append(new Icon("filter"));
		filters.addEventListener("click", e => this.popupFilters(filters));

		let header = document.createElement("header");
		header.append(title, counter, filters);

		this.replaceChildren(header);
		this.buildItems();
	}

	protected async buildItems() {
		let { items } = this;

		let data = await articles.list(this.filters);
		let newItems = data
			.filter(article => !items.find(i => i.itemId == article.id))
			.map(article => new Item(article));

		if (newItems.length) {
			this.append(...newItems);
			this.showMoreObserver.disconnect();
			let lastItem = this.items.pop();
			lastItem && this.showMoreObserver.observe(lastItem);
		}
	}

	protected onClick(e: Event) {
		let item = (e.target as HTMLElement).closest("rr-item-articles") as Item;
		if (item) { this.activeItem = item; }
	}

	protected onScroll(e: Event) {
		clearTimeout(this.markReadTimeout);
		this.markReadTimeout = setTimeout(() => {
			let { items } = this;
			if (!settings.getItem("markAsReadOnScroll")) { return; }
			let markReadItems = items.filter(i => !i.read && i.getBoundingClientRect().bottom <= 0)
			markReadItems.length && articles.markRead(markReadItems.map(i => i.itemId));
		}, 300);
	}

	protected popupFilters(node: HTMLElement) {
		let menu = new PopupMenu();

		menu.addItem("Newest first", "sort-down", () => this.sorting = "newest")
			.classList.toggle("selected", this.sorting == "newest");

		let item = menu.addItem("Oldest first", "sort-up", () => this.sorting = "oldest")
		item.classList.toggle("selected", this.sorting == "oldest");
		item.classList.add("separator");

		menu.addItem("Unread only", "eye", () => this.unreadOnly = true)
			.classList.toggle("selected", this.unreadOnly);

		menu.addItem("All articles", "eye-fill", () => this.unreadOnly = false)
			.classList.toggle("selected", !this.unreadOnly);

		menu.open(node, "side", [-8, 8]);
	}
}

customElements.define("rr-articles", Articles);

const ACTIVE_CSS_CLASS = "is-active";
const READ_CSS_CLASS = "is-read";

class Item extends HTMLElement {
	constructor(protected _data: types.Article) { super(); }

	get data() { return this._data; }

	get itemId() {
		return this.data.id;
	}

	get read() {
		return this.classList.contains(READ_CSS_CLASS);
	}

	set read(toggle: boolean) {
		this.classList.toggle(READ_CSS_CLASS, toggle);
	}

	get active() {
		return this.classList.contains(ACTIVE_CSS_CLASS);
	}

	set active(toggle: boolean) {
		this.classList.toggle(ACTIVE_CSS_CLASS, toggle);
		this.active && this.focus();
	}

	set starred(toggle: boolean) {
		let input = this.querySelector(".bookmark input") as HTMLInputElement;
		input.checked = toggle;
	}

	focus() {
		let rect = this.getBoundingClientRect();
		if (rect.y <= 0 || rect.bottom > document.body.clientHeight) {
			(this.previousElementSibling || this).scrollIntoView(true);
		}
	}

	async sync() {
		this._data = await articles.get(this.itemId);
		this.read = this.data.read;
		this.starred = this.data.starred;
	}

	connectedCallback() {
		this.read = this.data.read;

		this.append(buildHeader(this.data), buildText(this.data));
		if (this.data.image_url && settings.getItem("showImages")) {
			this.append(buildPicture(this.data.image_url));
		}

		pubsub.subscribe("articles-updated", this);
	}

	disconnectCallback() {
		pubsub.unsubscribe("articles-updated", this);
	}

	handleMessage(message:string, publisher?: any, data?: any) {
		message == "articles-updated" && this.sync();
	}
}

customElements.define("rr-item-articles", Item);

function buildHeader(article: types.Article) {
	let subscription = subscriptions.get(article.subscription_id)!;
	let node = document.createElement("header");

	let title = document.createElement("h6");
	title.textContent = subscription.title || subscription.feed_url;

	let time = document.createElement("time");
	time.textContent = format.date(article.time_published);

	node.append(new FeedIcon(subscription), title, time, buildBookmark(article));

	return node;
}

function buildText(article: types.Article) {
	let node = document.createElement("div");

	let title = document.createElement("h3");
	title.textContent = article.title;

	let summary = document.createElement("p");
	summary.textContent = article.summary || "";

	node.append(title, summary);

	return node;
}

function buildPicture(image_url: string) {
	let node = document.createElement("picture");
	let img = new Image();
	img.src = image_url;
	img.loading = "lazy";
	node.append(img);
	return node;
}

function buildBookmark(article: types.Article) {
	let node = document.createElement("label");
	node.title = "Read later";
	node.className = "bookmark";
	node.addEventListener("click", e => e.stopPropagation());

	let input = document.createElement("input");
	input.type = "checkbox";
	input.checked = article.starred;
	input.addEventListener("change", async (e) => {
		await articles.edit(article.id, {
			"starred": input.checked,
			"read": input.checked ? false: article.read
		});
	});

	node.append(input, new Icon("bookmark"), new Icon("bookmark-fill"));

	return node;
}
