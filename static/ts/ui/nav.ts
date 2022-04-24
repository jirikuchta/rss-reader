import { Category, Subscription } from "data/types";
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

type ItemType = "all" | "today" | "category" | "subscription" | "custom";

interface ItemData {
	id?: number;
	title: string;
}

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
			let item = new SubscriptionItem(s);
			uncategorized.appendChild(item.node);
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
	let categoryItem = new CategoryItem(category);

	list.appendChild(categoryItem.node);
	items.push(categoryItem);

	subscriptions.list()
		.filter(s => s.category_id == category.id)
		.forEach(s => {
			let item = new SubscriptionItem(s);
			list.appendChild(item.node);
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
	_type: ItemType;
	_data: ItemData;
	_node!: HTMLLIElement;
	_counter!: HTMLElement;

	constructor(data: ItemData, type?: ItemType) {
		this._type = type || "custom";
		this._data = data;

		this.build();
		this.updateCounter();

		items.push(this);
	}

	get data() {
		return this._data;
	}

	get id() {
		return this._data.id;
	}

	get node() {
		return this._node;
	}

	get type() {
		return this._type;
	}

	updateCounter() {};

	handleEvent(e: MouseEvent) {
		e.preventDefault();
		switch (e.type) {
			case "contextmenu":
				showContextMenu(this, e);
			break;
			case "click":
				selectItem(this);
			break;
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


class CategoryItem extends Item {
	_opener!: HTMLButtonElement;

	constructor(data: Category) {
		super(data, "category");
		this.node.classList.add("category");
	}

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
		if (e.type == "click" && e.target == this._opener) {
			return this.toggle();
		}
		super.handleEvent(e);
	}

	protected build() {
		super.build();
		let opener = html.button({icon: "chevron-down", className: "plain btn-chevron"});
		this.node.insertAdjacentElement("afterbegin", opener);
		this._opener = opener;
	}

	protected toggle() {
		this.node.classList.toggle("is-collapsed");
	}
}

class SubscriptionItem extends Item {

	constructor(data: Subscription) {
		super(data, "subscription");
	}

	get data() {
		return this._data as Subscription;
	}

	updateCounter() {
		html.clear(this._counter);
		let count = counters.get(this.data.id) || 0;
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
