
import { Category, Subscription } from "data/types";

import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as counters from "data/counters";
import { isSubscription } from "data/subscriptions";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

import subscriptionIcon from "ui/widget/subscription-icon";
import SubscriptionForm from "ui/widget/subscription-form";
import CategoryForm from "ui/widget/category-form";
import Dialog, { confirm } from "ui/widget/dialog";

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

	let header = html.node("header", {}, "", node);
	html.node("h3", {}, "Subscriptions", header);
	let btn = html.button({icon: "plus-circle"}, "", header);
	btn.addEventListener("click", e => editSubscription());

	categories.list().forEach(c => node.appendChild(buildCategory(c)));

	let uncategorized = html.node("ul", {}, "", node);
	subscriptions.list()
		.filter(s => s.category_id === null)
		.forEach(s => {
			let item = new Item(s);
			uncategorized.appendChild(item.node);
			items.push(item);
		});

	updateCounters();
}

function buildCategory(category: Category) {
	let list = html.node("ul");

	let categoryItem = new Item(category);
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

function buildButtons(entity: Category | Subscription) {
	let frag = html.fragment();

	let dotsBtn = html.button({icon: "dots-horizontal", className: "btn-dots"}, "", frag);
	dotsBtn.addEventListener("click", e => {
		e.stopPropagation();
		dotsBtn.classList.toggle("active");
	});

	let editBtn = html.button({icon: "pencil", title: "Edit"}, "", frag);
	editBtn.addEventListener("click", e => {
		e.stopPropagation();
		if (isSubscription(entity)) {
			editSubscription(entity as Subscription);
		} else {
			editCategory(entity as Category);
		}
	});

	let checkBtn = html.button({icon: "check-all", title: "Mark as read"}, "", frag);
	checkBtn.addEventListener("click", e => {
		e.stopPropagation();
		if (isSubscription(entity)) {
			subscriptions.markRead((entity as Subscription).id);
		} else {
			categories.markRead((entity as Category).id);
		}
	});

	return frag;
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
	protected _node?: HTMLLIElement;
	protected counter?: HTMLSpanElement;
	protected data: Category | Subscription;

	constructor(data: Category | Subscription) {
		this.data = data;
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
				node.classList.toggle("is-collapsed");
			});
		}

		node.appendChild(html.node("span", {className: "title"}, this.data.title));
		node.appendChild(buildButtons(this.data));
		node.appendChild(counter);

		this._node = node;
		this.counter = counter;

		this.updateCounter();
		node.addEventListener("click", e => selectItem(this));

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

		this.counter.appendChild(html.text(`${count || ""}`));
	}
}

function editSubscription(subscription?: Subscription) {
	let dialog = new Dialog();

	let subscriptionForm = new SubscriptionForm(subscription);
	subscriptionForm.afterSubmit = () => dialog.close();

	let header = html.node("header", {}, `${subscription ? "Edit" : "Add"} subscription`, dialog.node);
	header.appendChild(dialog.closeButton());

	dialog.node.appendChild(subscriptionForm.node);

	let footer = html.node("footer", {}, "", dialog.node);
	footer.appendChild(subscriptionForm.submitBtn);

	if (subscription) {
		let deleteBtn = html.button({className: "plain delete", "icon": "trash"}, "Unsubscribe", footer);
		deleteBtn.addEventListener("click", e => deleteSubscription(subscription));
	}

	dialog.open();
}

function editCategory(category: Category) {
	let dialog = new Dialog();

	let categoryForm = new CategoryForm(category);
	categoryForm.afterSubmit = () => dialog.close();

	let header = html.node("header", {}, "Edit category", dialog.node);
	header.appendChild(dialog.closeButton());

	dialog.node.appendChild(categoryForm.node);

	let footer = html.node("footer", {}, "", dialog.node);
	footer.appendChild(categoryForm.submitBtn);

	let deleteBtn = html.button({className: "plain delete", "icon": "trash"}, "Delete category", footer);
	deleteBtn.addEventListener("click", e => deleteCategory(category));

	dialog.open();
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
