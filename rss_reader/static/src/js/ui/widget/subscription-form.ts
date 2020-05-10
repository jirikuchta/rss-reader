import * as html from "util/html";

import { Subscription } from "data/types";
import * as subscriptions from "data/subscriptions";
import * as categories from "data/categories";

const CategoryListId = "subscriptionFormCategoryList";


export default class SubscriptionForm {
	node: HTMLFormElement;
	_subscription?: Subscription;
	_inputs: {
		url: HTMLInputElement;
		category: HTMLInputElement;
	};

	constructor(subscription?: Subscription) {
		this._subscription = subscription;
		this._inputs = {
			url: buildURLInput(subscription?.uri),
			category: buildCategoryInput(subscription?.title)
		};
		this.node = this._build();
	}

	_build() {
		let node = html.node("form");
		node.appendChild(this._inputs.url);
		node.appendChild(this._inputs.category);
		node.appendChild(buildCategoryList());
		return node;
	}

	async submit() {
		let category;
		if (this._inputs.category.value) {
			category = await categories.add(this._inputs.category.value);
		}
		subscriptions.add(this._inputs.url.value, category?.id);
	}
}

function buildURLInput(value?: string) {
	return html.node("input", {placeholder: "Feed URL", value: value || ""});
}

function buildCategoryInput(value?: string) {
	let node = html.node("input", {value: value || ""});
	node.setAttribute("list", CategoryListId);
	return node;
}

function buildCategoryList() {
	let node = html.node("datalist", {id: CategoryListId});
	categories.list().forEach(category => html.node(
		"option", {value: category.title}, category.title, node));
	return node;
}
