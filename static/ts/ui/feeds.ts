import * as types from "data/types";
import * as settings from "data/settings";
import * as counters from "data/counters";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as articles from "data/articles";

import Icon from "ui/icon";
import Counter from "ui/counter";
import FeedIcon from "ui/widget/feed-icon";

import { openDialog as openSubscriptionForm } from "ui/widget/subscription-form";
import { openDialog as openCategoryForm } from "ui/widget/category-form";
import { PopupMenu } from "ui/widget/popup";
import { confirm } from "ui/widget/dialog";

import app from "app";

export default class Feeds extends HTMLElement {
	get items() {
		return [...this.querySelectorAll("rr-item-feeds")] as Item[];
	};

	get activeItem() {
		return this.items.find(i => i.active)!;
	}

	connectedCallback() {
		this.replaceChildren(...buildItems());

		let homepage = settings.getItem("homepage");
		(this.items.find(i => i.homepageId == homepage) || this.items[0]).active = true;

		this.addEventListener("click", this);
		this.addEventListener("contextmenu", this);

		app.addEventListener("subscriptions-changed", this);
		app.addEventListener("categories-changed", this);
	}

	disconnectedCallback() {
		this.removeEventListener("click", this);
		this.removeEventListener("contextmenu", this);

		app.removeEventListener("subscriptions-changed", this);
		app.removeEventListener("categories-changed", this);
	}

	handleEvent(e: Event) {
		let item = (e.target as HTMLElement).closest("rr-item-feeds") as Item;
		switch(e.type) {
			case "click":
				if (!item) { return; }
				e.stopPropagation();
				this.items.forEach(i => i.active = false);
				item.active = true;

				app.articles.update();
				app.toggleNav(false);
				app.toggleDetail(false);
			break;
			case "contextmenu":
				if (!item) { return; }
				e.stopPropagation();
				e.preventDefault();
				showContextMenu(item, e as PointerEvent);
			break;
			case "subscriptions-changed":
			case "categories-changed":
				this.replaceChildren(...buildItems());
			break;
		}
	}
}

customElements.define("rr-feeds", Feeds);

function buildItems() {
	let items: HTMLElement[] = [
		new Item({title: "All articles"}, "all"),
		new Item({title: "Bookmarks"}, "bookmarked"),
	];

	if (subscriptions.list().some(s => s.favorite)) {
		items.push(buildTitle("Favorites"), ...subscriptions.list()
			.filter(s => s.favorite)
			.map(s => new Item(s, "subscription"))
		);
	}

	if (categories.list().length) {
		items.push(buildTitle("Folders"), ...categories.list().map(c => {
			let node = document.createElement("div");
			let cat = new Item(c, "category");
			node.append(cat, ...subscriptions.list()
				.filter(s => s.category_id == c.id)
				.map(s => new Item(s, "subscription")
			));
			return node;
		}));
	}

	let uncategorized = subscriptions.list().filter(s => !s.category_id);
	if (uncategorized.length) {
		items.push(
			buildTitle("Feeds"),
			...uncategorized.map(s => new Item(s, "subscription")));
	}

	return items;
}

function buildTitle(title: string) {
	let node = document.createElement("h3");
	node.textContent = title;
	return node;
}

function showContextMenu(item: Item, e: PointerEvent) {
	let menu = new PopupMenu();

	const { homepageId } = item;
	let isHomepage = settings.getItem("homepage") == homepageId;

	if (item.type == "all") {
		menu.addItem("Mark as read", "check-all", () => articles.markRead());
		!isHomepage && menu.addItem("Set as start page", "house-door", () => settings.setItem("homepage", homepageId));
	}

	if (item.type == "bookmarked") {
		!isHomepage && menu.addItem("Set as start page", "house-door", () => settings.setItem("homepage", homepageId));
	}

	if (item.type == "category") {
		let data = item.data as types.Category;
		menu.addItem("Mark as read", "check-all", () => categories.markRead(data.id));
		menu.addItem("Edit category", "pencil", () => openCategoryForm(data));
		!isHomepage && menu.addItem("Set as start page", "house-door", () => settings.setItem("homepage", homepageId));
		menu.addItem("Delete category", "trash", () => deleteCategory(data));
	}

	if (item.type == "subscription") {
		let data = item.data as types.Subscription;
		menu.addItem("Mark as read", "check-all", () => subscriptions.markRead(data.id));
		menu.addItem(`${data.favorite ? "Remove from" : "Add to"} favorites`, data.favorite ? "heart-fill" : "heart", () => subscriptions.edit(data.id, {favorite: !data.favorite}))
		menu.addItem("Edit subscription", "pencil", () => openSubscriptionForm(data));
		!isHomepage && menu.addItem("Set as start page", "house-door", () => settings.setItem("homepage", homepageId));
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

type ItemType = "all" | "bookmarked" | "category" | "subscription";

interface HasTitle {
	title: string;
}

class Item extends HTMLElement {

	constructor(readonly data: HasTitle, readonly type: ItemType) { super(); }

	connectedCallback() {
		const { type } = this;
		this.setAttribute("type", type);

		const { icon } = this;
		const { title } = this.data;

		let name = document.createElement("span");
		name.className = "title";
		name.textContent = title;

		let counter = new Counter();
		counter.getCount = () => this.unreadCount;

		let img = type == "category" ? buildCategoryOpener(this) : icon;

		this.append(img, name, counter);
	}

	get active() {
		return this.classList.contains("is-active");
	}

	set active(active: boolean) {
		this.classList.toggle("is-active", active);
	}

	get itemId() {
		const { type, data } = this;
		if (type == "category") { return (data as types.Category).id; }
		if (type == "subscription") { return (data as types.Subscription).id; }
		return -1;
	}

	get icon() {
		const { type, data } = this;
		if (type == "all") { return new Icon("stack"); }
		if (type == "bookmarked") { return new Icon("bookmark-fill"); }
		if (type == "category") { return new Icon("folder-fill"); }
		return new FeedIcon(data as types.Subscription);
	}

	get unreadCount() {
		const { type, itemId } = this;
		if (type == "all") { return counters.sum(); };
		if (type == "bookmarked") { return 0; };
		if (type == "category") { return subscriptions.list()
			.filter(s => s.category_id == itemId)
			.reduce((total, s) => total + (counters.get(s.id) || 0), 0); }
		return counters.get(itemId) || 0;;

	}

	get homepageId() {
		const { type, itemId } = this;
		if (type == "category") { return `c-${itemId}`; }
		if (type == "subscription") { return `s-${itemId}`; }
		return type;
	}
}

customElements.define("rr-item-feeds", Item);

function buildCategoryOpener(item: Item) {
	let node = document.createElement("button");
	node.append(new Icon("chevron"));
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
