import * as types from "data/types";
import * as settings from "data/settings";
import * as counters from "data/counters";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as articles from "data/articles";

import * as pubsub from "util/pubsub";

import Icon from "ui/icon";
import Counter from "ui/counter";
import FeedIcon from "ui/widget/feed-icon";

import SubscriptionForm from "ui/widget/subscription-form";
import CategoryForm from "ui/widget/category-form";
import { PopupMenu } from "ui/widget/popup";
import { confirm } from "ui/widget/dialog";

import App from "app";

export default class Feeds extends HTMLElement {
	get items() {
		return [...this.querySelectorAll("rr-item-feeds")] as Item[];
	}

	get activeItem() {
		return this.items.find(i => i.active)!;
	}

	get app() {
		return this.closest("rr-app") as App;
	}

	connectedCallback() {
		this.replaceChildren(...buildItems());
		this.items[0].active = true;

		this.addEventListener("click", this);
		this.addEventListener("contextmenu", this);

		pubsub.subscribe("subscriptions-changed", this);
		pubsub.subscribe("categories-changed", this);
	}

	disconnectCallback() {
		pubsub.unsubscribe("subscriptions-changed", this);
		pubsub.unsubscribe("categories-changed", this);
	}

	handleMessage(message:string, publisher?: any, data?: any) {
		this.replaceChildren(...buildItems());
	}

	handleEvent(e: PointerEvent) {
		e.stopPropagation();

		let item = (e.target as HTMLElement).closest("rr-item-feeds") as Item;
		if (!item) { return; }

		switch(e.type) {
			case "click":
				this.items.forEach(i => i.active = false);
				item.active = true;

				let { app } = this;
				app.articles.update();
				app.toggleNav(false);
			break;
			case "contextmenu":
				e.preventDefault();
				showContextMenu(item, e);
			break;
		}
	}
}

customElements.define("rr-feeds", Feeds);

function buildItems() {
	let items: HTMLElement[] = [
		new Item({title: "All articles"}, "all"),
		new Item({title: "Starred"}, "starred"),
	];

	if (subscriptions.list().some(s => s.favorite)) {
		items.push(buildTitle("Favorites"), ...subscriptions.list()
			.filter(s => s.favorite)
			.map(s => new Item(s, "subscription"))
		);
	}

	items.push(buildTitle("Folders"), ...categories.list().map(c => {
		let node = document.createElement("div");
		let cat = new Item(c, "category");
		node.append(cat, ...subscriptions.list()
			.filter(s => s.category_id == c.id)
			.map(s => new Item(s, "subscription")
		));
		return node;
	}));

	items.push(buildTitle("Feeds"), ...subscriptions.list()
		.filter(s => !s.category_id)
		.map(s => new Item(s, "subscription"))
	);

	return items;
}

function buildTitle(title: string) {
	let node = document.createElement("h3");
	node.textContent = title;
	return node;
}

function showContextMenu(item: Item, e: PointerEvent) {
	let menu = new PopupMenu();

	if (item.type == "all") {
		menu.addItem("Mark as read", "check-all", () => articles.markRead());
	}

	if (item.type == "category") {
		let data = item.data as types.Category;
		menu.addItem("Mark as read", "check-all", () => categories.markRead(data.id));
		menu.addItem("Edit category", "pencil", () => CategoryForm.open(data));
		menu.addItem("Delete category", "trash", () => deleteCategory(data));
	}

	if (item.type == "subscription") {
		let data = item.data as types.Subscription;
		menu.addItem("Mark as read", "check-all", () => subscriptions.markRead(data.id));
		menu.addItem(`${data.favorite ? "Remove from" : "Add to"} favorites`, data.favorite ? "heart-fill" : "heart", () => subscriptions.edit(data.id, {favorite: !data.favorite}))
		menu.addItem("Edit subscription", "pencil", () => SubscriptionForm.open(data));
		menu.addItem("Unsubscribe", "trash", () => deleteSubscription(data));
	}

	menu.open(item, "below", [
		e.clientX - item.getBoundingClientRect().left + 8,
		e.clientY - item.getBoundingClientRect().bottom + 8
	]);
}

async function deleteCategory(category: types.Category) {
	if (await confirm(`Delete category ${category.title}? Any nested subscriptions will be moved to uncategorized.`)) {
		categories.remove(category.id);
	}
}

async function deleteSubscription(subscription: types.Subscription) {
	if (await confirm(`Unsubscribe from ${subscription.title}?`)) {
		subscriptions.remove(subscription.id);
	}
}

type ItemType = "all" | "starred" | "category" | "subscription";

interface HasTitle {
	title: string;
}

class Item extends HTMLElement {

	constructor(readonly data: HasTitle, readonly type: ItemType) { super(); }

	connectedCallback() {
		this.setAttribute("type", this.type);

		let title = document.createElement("span");
		title.className = "title";
		title.textContent = this.data.title;

		let counter = new Counter();
		counter.getCount = () => this.unreadCount;

		let icon = this.type == "category" ? buildCategoryOpener(this) : this.icon;
		this.append(icon, title, counter);
	}

	get active() {
		return this.classList.contains("is-active");
	}

	set active(active: boolean) {
		this.classList.toggle("is-active", active);
	}

	get itemId() {
		switch(this.type) {
			case "all": return -1; break;
			case "starred": return -1; break;
			case "subscription": return (this.data as types.Subscription).id; break;
			case "category": return (this.data as types.Category).id; break;
		}
	}

	get icon() {
		switch(this.type) {
			case "all": return new Icon("stack"); break;
			case "starred": return new Icon("bookmark-fill"); break;
			case "subscription": return new FeedIcon(this.data as types.Subscription); break;
			case "category": return new Icon("folder-fill"); break;
		}
	}

	get unreadCount() {
		switch(this.type) {
			case "all": return counters.sum(); break;
			case "starred": return 0; break;
			case "subscription": return counters.get(this.itemId) || 0; break;
			case "category": return subscriptions.list()
				.filter(s => s.category_id == this.itemId)
				.reduce((total, s) => total + (counters.get(s.id) || 0), 0);
			break;
		}
	}
}

customElements.define("rr-item-feeds", Item);

function buildCategoryOpener(item: Item) {
	let node = document.createElement("button");
	node.className = "plain btn-chevron";
	node.append(new Icon("chevron-down"));
	node.addEventListener("click", e => {
		e.stopPropagation();
		toggleCategory(item);
	});

	if (settings.getItem("collapsedCategories").includes(item.itemId)) {
		toggleCategory(item, true);
	}

	return node;
}

function toggleCategory(item: Item, collapsed?: boolean) {
	item.classList.toggle("collapsed", collapsed);
	let storageData = settings.getItem("collapsedCategories").filter(id => id != item.itemId);
	if (item.classList.contains("collapsed")) { storageData.push(item.itemId); }
	settings.setItem("collapsedCategories", storageData);
}
