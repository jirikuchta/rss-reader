import * as categories from "data/categories";
import { Category } from "data/categories";
import * as subscriptions from "data/subscriptions";
import { Subscription, isSubscription } from "data/subscriptions";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

import { setSelectedNavItem } from "ui/list";
import SubscriptionForm from "ui/widget/subscription-form";
import CategoryForm from "ui/widget/category-form";
import { PopupMenu } from "ui/widget/popup";
import { Dialog, confirm } from "ui/widget/dialog";


let node:HTMLElement;


export function init() {
	build();

	// FIXME: may cause two consecutive builds
	pubsub.subscribe("subscriptions-changed", build);
	pubsub.subscribe("categories-changed", build);

	return node;
}

async function build() {
	node ? html.clear(node) : node = html.node("nav");

	let header = html.node("header", {}, "", node);
	html.node("h3", {}, "Subscriptions", header);
	let btn = html.button({icon: "plus-circle"}, "", header);
	btn.addEventListener("click", e => editSubscription());

	categories.list()
		.forEach(cat => node.appendChild(buildCategory(cat)));

	let uncategorized = html.node("ul", {}, "", node);
	subscriptions.list()
		.filter(s => s.categoryId == null)
		.forEach(s => uncategorized.appendChild(buildItem(s)));
}

function buildCategory(category: Category) {
	let list = html.node("ul");
	list.appendChild(buildItem(category));

	subscriptions.list()
		.filter(s => s.categoryId == category.id)
		.forEach(s => list.appendChild(buildItem(s)))

	return list;
}

function buildItem(entity: Category | Subscription) {
	let node = html.node("li", {tabIndex: "0"});

	if (isSubscription(entity)) {
		node.appendChild(html.node("span", {className: "title"}, entity.title));
		node.appendChild(html.node("span", {className: "count"}, "50"));
	} else {
		node.classList.add("category");
		let btn = html.button({icon: "chevron-down", className: "plain btn-chevron"}, "", node);
		btn.addEventListener("click", e => node.classList.toggle("is-collapsed"));
		node.appendChild(html.node("span", {className: "title"}, entity.title));
		node.appendChild(html.node("span", {className: "count"}, "50"));
	}

	node.addEventListener("click", e => setSelectedNavItem(entity));

	let btn = html.button({className: "plain btn-dots", icon: "dots-horizontal"}, "", node);
	btn.addEventListener("click", e => showItemPopup(entity, btn));

	return node;
}

function showItemPopup(entity: Category | Subscription, target: HTMLElement) {
	let menu = new PopupMenu();

	if (isSubscription(entity)) {
		menu.addItem("Mark as read", "check-all", () => subscriptions.markRead((entity as Subscription).id));
		menu.addItem("Edit subscription", "pencil", () => editSubscription(entity as Subscription));
		menu.addItem("Unsubscribe", "trash", () => deleteSubscription(entity as Subscription));
	} else {
		menu.addItem("Mark as read", "check-all", () => categories.markRead((entity as Category).id));
		menu.addItem("Edit category", "pencil", () => editCategory(entity as Category));
		menu.addItem("Delete category", "trash", () => deleteCategory(entity as Category));
	}

	menu.open(target, "below");
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

	dialog.open();
}

async function deleteSubscription(subscription: Subscription) {
	if (await confirm(`Unsubscribe from ${subscription.title}?`)) {
		subscriptions.remove(subscription.id);
	}
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

	dialog.open();
}

async function deleteCategory(category: Category) {
	if (await confirm(`Delete category ${category.title}? Any nested subscriptions would be `)) {
		categories.remove(category.id);
	}
}
