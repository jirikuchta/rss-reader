import { Category, Subscription } from "data/types";
import * as settings from "data/settings";
import * as articles from "data/articles";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as counters from "data/counters";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

import subscriptionIcon from "ui/widget/subscription-icon";
import SubscriptionForm from "ui/widget/subscription-form";
import CategoryForm from "ui/widget/category-form";
import { open as openSettings } from "ui/widget/settings";
import { PopupMenu } from "ui/widget/popup";
import { confirm } from "ui/widget/dialog";

const SELECTED_CSS_CLASS = "is-selected";

export const node = html.node("nav");
export let selected: Item;

let items: Item[] = [];
const scroll = html.node("div", {className: "scroll"}, "", node);

interface HasTitle {
	title: string;}

export function init() {
	buildList();
	node.appendChild(buildFooter());

	// FIXME: may cause two consecutive builds
	pubsub.subscribe("subscriptions-changed", buildList);
	pubsub.subscribe("categories-changed", buildList);

	pubsub.subscribe("counters-updated", updateCounters);
}

export function toggle(force?: boolean) {
	node.classList.toggle("is-open", force);
}

async function buildList() {
	html.clear(scroll);
	items = [];

	let list: HTMLElement;

	list = html.node("ul", {}, "", scroll);
	let allItem = new AllItem();
	list.appendChild(allItem.node);


	if (subscriptions.list().some(s => s.favorite)) {
		buildFavorites();
	}

	html.node("h3", {}, "Feeds", scroll);

	categories.list().forEach(c => buildCategory(c));

	list = html.node("ul", {}, "", scroll);
	subscriptions.list()
		.filter(s => !s.category_id)
		.forEach(s => list.appendChild(new SubscriptionItem(s).node));

	updateCounters();
	select(allItem);
}

function buildFooter() {
	let footer = html.node("footer");

	let addBtn = html.button({icon: "plus"}, "", footer);
	addBtn.addEventListener("click", e => SubscriptionForm.open());

	let settingsBtn = html.button({icon: "gear"}, "", footer);
	settingsBtn.addEventListener("click", e => openSettings());

	return footer;
}

function buildFavorites() {
	html.node("h3", {}, "Favorites", scroll);
	subscriptions.list().filter(s => s.favorite).forEach(s => {
		scroll.appendChild(new SubscriptionItem(s).node);
	});
}

function buildCategory(category: Category) {
	let list = html.node("ul", {}, "", scroll);
	let item = new CategoryItem(category);

	list.appendChild(item.node);
	items.push(item);

	subscriptions.list()
		.filter(s => s.category_id == category.id)
		.forEach(s => list.appendChild(new SubscriptionItem(s).node));
}

function select(item: Item) {
	node.querySelector(`.${SELECTED_CSS_CLASS}`)?.classList.remove(SELECTED_CSS_CLASS);
	item.node.classList.add(SELECTED_CSS_CLASS);
	selected = item;
	pubsub.publish("nav-item-selected");
}

function updateCounters() {
	items.forEach(i => i.updateCounter());
}

class Item {
	_data: HasTitle;
	_node!: HTMLLIElement;
	_counter!: HTMLElement;

	constructor(data: HasTitle) {
		this._data = data;

		this.build();
		this.updateCounter();

		items.push(this);
	}

	get data() {
		return this._data;
	}

	get node() {
		return this._node;
	}

	updateCounter() {};

	handleEvent(e: MouseEvent) {
		e.preventDefault();
		switch (e.type) {
			case "contextmenu": showContextMenu(this, e); break;
			case "click": select(this); break;
		}
	}

	protected build() {
		let node = html.node("li");
		let counter = html.node("span", {className: "count"});

		node.appendChild(html.node("span", {className: "title"}, this.data.title));
		node.appendChild(counter)

		node.addEventListener("click", this);
		node.addEventListener("contextmenu", this);

		this._node = node;
		this._counter = counter;
	}
}

export class AllItem extends Item {

	constructor() { super({title: "All articles"}); }

	updateCounter() {
		html.clear(this._counter);
		let count = counters.sum();
		count && this._counter.appendChild(html.text(`${count}`));
	}

	protected build() {
		super.build();
		this.node.insertAdjacentElement("afterbegin", html.icon("stack"));
	}
}

export class CategoryItem extends Item {
	_opener!: HTMLButtonElement;

	get data() {
		return this._data as Category;
	}

	updateCounter() {
		html.clear(this._counter);
		let count = subscriptions.list()
			.filter(s => s.category_id == this.data.id)
			.reduce((total, s) => total + (counters.get(s.id) || 0), 0);
		count && this._counter.appendChild(html.text(`${count}`));
	}

	handleEvent(e: MouseEvent) {
		if (e.type == "click" && e.currentTarget == this._opener) {
			e.stopPropagation();
			return this.toggle();
		}
		super.handleEvent(e);
	}

	protected build() {
		super.build();

		this._opener = html.button({icon: "chevron-down", className: "plain btn-chevron"});
		this._opener.addEventListener("click", this);

		this.node.classList.add("category");
		this.node.insertAdjacentElement("afterbegin", this._opener);

		if (settings.getItem("collapsedCategories").includes(this.data.id)) {
			this.toggle(true);
		}
	}

	protected toggle(force?: boolean) {
		this.node.classList.toggle("is-collapsed", force);

		let data = settings.getItem("collapsedCategories");
		if (this.node.classList.contains("is-collapsed")) {
			data.push(this.data.id);
		} else {
			data = data.filter(id => id != this.data.id);
		}
		settings.setItem("collapsedCategories", data);
	}
}

export class SubscriptionItem extends Item {

	get data() {
		return this._data as Subscription;
	}

	updateCounter() {
		html.clear(this._counter);
		let count = counters.get(this.data.id);
		count && this._counter.appendChild(html.text(`${count}`));
	}

	protected build() {
		super.build();
		this.node.insertAdjacentElement("afterbegin", subscriptionIcon(this.data));
	}
}

function showContextMenu(item: Item, e: MouseEvent) {
	e.preventDefault();

	let menu = new PopupMenu();

	if (item instanceof AllItem) {
		menu.addItem("Mark as read", "check-all", () => articles.markRead());
	}

	if (item instanceof CategoryItem) {
		menu.addItem("Mark as read", "check-all", () => categories.markRead(item.data.id));
		menu.addItem("Edit category", "pencil", () => CategoryForm.open(item.data));
		menu.addItem("Delete category", "trash", () => deleteCategory(item.data));
	}

	if (item instanceof SubscriptionItem) {
		menu.addItem("Mark as read", "check-all", () => subscriptions.markRead(item.data.id));
		menu.addItem(`${item.data.favorite ? "Remove from" : "Add to"} favorites`, item.data.favorite ? "heart-fill" : "heart", () => subscriptions.edit(item.data.id, {favorite: !item.data.favorite}))
		menu.addItem("Edit subscription", "pencil", () => SubscriptionForm.open(item.data));
		menu.addItem("Unsubscribe", "trash", () => deleteSubscription(item.data));
	}

	menu.open(item.node, "below", [
		e.clientX - item.node.getBoundingClientRect().left + 8,
		e.clientY - item.node.getBoundingClientRect().bottom + 8
	]);
}

async function deleteCategory(category: Category) {
	if (await confirm(`Delete category ${category.title}? Any nested subscriptions will be moved to uncategorized.`)) {
		categories.remove(category.id);
	}
}

async function deleteSubscription(subscription: Subscription) {
	if (await confirm(`Unsubscribe from ${subscription.title}?`)) {
		subscriptions.remove(subscription.id);
	}
}
