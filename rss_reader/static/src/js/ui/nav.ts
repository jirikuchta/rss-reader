import { Category } from "data/types";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

import SubscriptionForm from "ui/widget/subscription-form";
import Popup from "ui/widget/popup";
import { Dialog } from "ui/widget/dialog";


let node:HTMLElement;


export function init() {
	build();

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

	categories.list().forEach(cat => node.appendChild(buildCategory(cat)));
}

function buildCategory(category: Category) {
	let node = html.node("ul");
	node.appendChild(buildItem(category.title, true));

	subscriptions.list()
		.filter(s => s.categoryId == category.id)
		.forEach(s => node.appendChild(buildItem(s.title)))

	return node;
}

function buildItem(name: string, isCategory: boolean = false) {
	let node = html.node("li", {tabIndex: "0"});

	if (isCategory) {
		node.classList.add("category");
		let btn = html.button({icon: "chevron-down", className: "plain btn-chevron"}, "", node);
		btn.addEventListener("click", e => node.classList.toggle("is-collapsed"));
	}

	node.appendChild(html.node("span", {className: "title"}, name));
	node.appendChild(html.node("span", {className: "count"}, "50"));

	let btn = html.button({className: "plain btn-dots", icon: "dots-horizontal"}, "", node);
	btn.addEventListener("click", e => showItemPopup(btn));

	return node;
}

function showItemPopup(target: HTMLElement) {
	let popup = new Popup();
	html.node("div", {}, "ahfsadfa sdf as fas fsa fas foj", popup.node);
	popup.open(target, "below");
}


export function editSubscription() {
	let dialog = new Dialog();
	let subscriptionForm = new SubscriptionForm();

	let header = html.node("header", {}, "", dialog.node);
	header.appendChild(subscriptionForm.node);

	let footer = html.node("footer", {}, "", dialog.node);
	let btnOk = html.button({type:"submit"}, "Submit", footer);
	let btnCancel = html.button({type:"button"}, "Cancel", footer);

	dialog.open();

	return new Promise(resolve => {
		dialog.onClose = () => resolve(false);
		btnOk.addEventListener("click", e => subscriptionForm.submit());
		btnCancel.addEventListener("click", e => dialog.close());
	});
}
