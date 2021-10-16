import { Category, Subscription } from "data/types";
import * as settings from "data/settings";

import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as counters from "data/counters";
import { isSubscription } from "data/subscriptions";

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

export function init() {
	build();

	// FIXME: may cause two consecutive builds
	pubsub.subscribe("subscriptions-changed", build);
	pubsub.subscribe("categories-changed", build);
	pubsub.subscribe("counters-updated", updateCounters);
}

async function build() {
	html.clear(node);
	items = [];

	let scroll = html.node("div", {className: "scroll"}, "", node);

	categories.list().forEach(c => scroll.appendChild(buildCategory(c)));

	let uncategorized = html.node("ul", {}, "", scroll);
	subscriptions.list()
		.filter(s => s.category_id === null)
		.forEach(s => {
			let item = new Item(s);
			uncategorized.appendChild(item.node);
			items.push(item);
		});

	let footer = html.node("footer", {}, "", node);

	let addBtn = html.button({icon: "plus"}, "", footer);
	addBtn.addEventListener("click", e => SubscriptionForm.open());

	let settingsBtn = html.button({icon: "gear"}, "", footer);
	settingsBtn.addEventListener("click", e => openSettings());

	updateCounters();
}

function buildCategory(category: Category) {
	let list = html.node("ul");

	let categoryItem = new Item(category);
	categoryItem.node.classList.toggle(
		"is-collapsed",
		(settings.getItem("collapsedCategories") || []).includes(category.id));

	list.appendChild(categoryItem.node);
	items.push(categoryItem);

	subscriptions.list()
		.filter(s => s.category_id == category.id)
		.forEach(s => {
			let item = new Item(s);
			list.appendChild(item.node);
			items.push(item);
		});

	return list;
}

function selectItem(item: Item) {
	node.querySelector(`.${SELECTED_CSS_CLASS}`)?.classList.remove(SELECTED_CSS_CLASS);
	item.node.classList.add(SELECTED_CSS_CLASS);
	selected = item;
	pubsub.publish("nav-item-selected");
}

function updateCounters() {
	items.forEach(i => i.updateCounter());
}

class Item {
	protected _data: Category | Subscription;
	protected _node?: HTMLLIElement;
	protected counter?: HTMLSpanElement;

	constructor(data: Category | Subscription) {
		this._data = data;
	}

	get data() {
		return this._data;
	}

	get node() {
		if (this._node) { return this._node; };

		let node = html.node("li");
		let counter = node.appendChild(html.node("span", {className: "count"}));

		if (this.type == "subscription") {
			node.appendChild(subscriptionIcon(this.data as Subscription));

		} else {
			node.classList.add("category");
			let btn = html.button({icon: "chevron-down", className: "plain btn-chevron"}, "", node);
			btn.addEventListener("click", e => {
				e.stopPropagation();
				toggleCategory(this);
			});
		}

		node.appendChild(html.node("span", {className: "title"}, this.data.title));
		node.appendChild(counter);

		this._node = node;
		this.counter = counter;

		this.updateCounter();

		node.addEventListener("click", e => selectItem(this));
		node.addEventListener("contextmenu", e => showItemPopup(this, e));

		return this._node;
	}

	get id() {
		return this.data.id;
	}

	get type() {
		return isSubscription(this.data) ? "subscription" : "category";
	}

	updateCounter() {
		if (!this.counter) { return; }
		html.clear(this.counter);

		let count = 0;
		if (this.type == "category") {
			count = subscriptions.list()
				.filter(s => s.category_id == this.id)
				.reduce((total, s) => total + (counters.get(s.id) || 0), 0);
		} else {
			count = counters.get(this.id) || 0;
		}

		html.clear(this.counter);
		count && this.counter.appendChild(html.text(`${count}`));
	}
}

function toggleCategory(item: Item) {
	item.node.classList.toggle("is-collapsed");
	let data = settings.getItem("collapsedCategories") || [];
	if (item.node.classList.contains("is-collapsed")) {
		data.push(item.data.id);
	} else {
		data = data.filter(i => i != item.data.id);
	}
	settings.setItem("collapsedCategories", data);
}

function showItemPopup(item: Item, e: MouseEvent) {
	e.preventDefault();

	let menu = new PopupMenu();

	if (item.type == "subscription") {
		menu.addItem("Mark as read", "check-all", () => subscriptions.markRead((item.data as Subscription).id));
		menu.addItem("Edit subscription", "pencil", () => SubscriptionForm.open(item.data as Subscription));
		menu.addItem("Unsubscribe", "trash", () => deleteSubscription(item.data as Subscription));
	} else {
		menu.addItem("Mark as read", "check-all", () => categories.markRead((item.data as Category).id));
		menu.addItem("Edit category", "pencil", () => CategoryForm.open(item.data as Category));
		menu.addItem("Delete category", "trash", () => deleteCategory(item.data as Category));
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
