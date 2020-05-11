import * as html from "util/html";
import * as random from "util/random";

import { Subscription } from "data/types";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";

export default class SubscriptionForm {
	node: HTMLFormElement;
	_title: HTMLInputElement;
	_uri: HTMLInputElement;
	_category: HTMLInputElement;
	_subscription?: Subscription;

	constructor(subscription?: Subscription) {
		this._subscription = subscription;
		this._title = html.node("input", {value: subscription?.title || ""});
		this._uri = html.node("input", {value: subscription?.uri || ""});
		this._category = html.node("input");
		this.node = this._build();

		if (subscription && subscription.categoryId) {
			this._category.value = categories.list().find(
				cat => cat.id == subscription.categoryId)?.title || "";
		}
	}

	async submit() {
		let data: Partial<Subscription> = {
			title: this._title.value,
			uri: this._uri.value,
			categoryId: (await getCategory(this._category.value))?.id
		};

		if (this._subscription) {
			await subscriptions.edit(this._subscription.id, data);
		} else {
			await subscriptions.add(data);
		}
	}

	_build() {
		let node = html.node("form", {id: "subscription-form"});
		this._subscription && node.appendChild(buildTitleField(this._title));
		node.appendChild(buildUrlField(this._uri));
		node.appendChild(buildCategoryField(this._category));
		return node;
	}
}

function buildTitleField(input: HTMLInputElement) {
	let node = html.node("label", {}, "Title");
	node.appendChild(input);
	return node;
}

function buildUrlField(input: HTMLInputElement) {
	let node = html.node("label", {}, "Feed URL");
	node.appendChild(input);
	return node;
}

function buildCategoryField(input: HTMLInputElement) {
	let listId = random.str();
	let node = html.node("label", {}, "Category");

	input.setAttribute("list", listId);
	node.appendChild(input);

	let list = html.node("datalist", {id: listId}, "", node);
	categories.list().forEach(c => html.node("option", {value: c.title}, c.title, list));

	return node;
}

async function getCategory(title: string) {
	title = title.trim();
	if (!title) { return; }

	let category = categories.list()
		.find(cat => cat.title.trim().toLowerCase() == title.toLowerCase());

	if (!category) {
		category = await categories.add({title});
	}

	return category;
}
