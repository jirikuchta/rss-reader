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
export let selected: Category | Subscription;

export function init() {
	build();

	// FIXME: may cause two consecutive builds
	pubsub.subscribe("subscriptions-changed", build);
	pubsub.subscribe("categories-changed", build);
}

async function build() {
	html.clear(node);

	let header = html.node("header", {}, "", node);
	html.node("h3", {}, "Subscriptions", header);
	let btn = html.button({icon: "plus-circle"}, "", header);
	btn.addEventListener("click", e => editSubscription());

	categories.list().forEach(c => node.appendChild(buildCategory(c)));

	let uncategorized = html.node("ul", {}, "", node);
	subscriptions.list().forEach(s => {
		s.category_id === null && uncategorized.appendChild(buildItem(s))
	});
}

function buildCategory(category: Category) {
	let list = html.node("ul");
	list.appendChild(buildItem(category));
	subscriptions.list().forEach(s => {
		s.category_id == category.id && list.appendChild(buildItem(s));
	});
	return list;
}

function buildItem(entity: Category | Subscription) {
	let node = html.node("li");

	if (isSubscription(entity)) {
		node.appendChild(subscriptionIcon(entity as Subscription));
		node.appendChild(html.node("span", {className: "title"}, entity.title));
		let count = counters.get(entity.id);
		count &&  node.appendChild(html.node("span", {className: "count"}, `${count}`));
	} else {
		node.classList.add("category");
		let btn = html.button({icon: "chevron-down", className: "plain btn-chevron"}, "", node);
		btn.addEventListener("click", e => {
			e.stopPropagation();
			node.classList.toggle("is-collapsed");
		});
		node.appendChild(html.node("span", {className: "title"}, entity.title));
		node.appendChild(html.node("span", {className: "count"}, "50"));
	}

	node.appendChild(buildButtons(entity));

	node.addEventListener("click", e => selectItem(node, entity));

	return node;
}

function buildButtons(entity: Category | Subscription) {
	let frag = html.fragment();

	let btn = html.button({icon: "check-all"}, "", frag);
	btn.addEventListener("click", e => {
		e.stopPropagation();
		if (isSubscription(entity)) {
			subscriptions.markRead((entity as Subscription).id);
		} else {
			categories.markRead((entity as Category).id);
		}
	});

	btn = html.button({icon: "pencil"}, "", frag);
	btn.addEventListener("click", e => {
		e.stopPropagation();
		if (isSubscription(entity)) {
			editSubscription(entity as Subscription);
		} else {
			editCategory(entity as Category);
		}
	});

	return frag;
}

function selectItem(itemNode: HTMLElement, entity: Category | Subscription) {
	node.querySelector(`.${SELECTED_CSS_CLASS}`)?.classList.remove(SELECTED_CSS_CLASS);
	itemNode.classList.add(SELECTED_CSS_CLASS);
	selected = entity;
	pubsub.publish("nav-item-selected");
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

