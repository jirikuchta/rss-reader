import * as html from "util/html";
import * as random from "util/random";
import { ApiResponse } from "util/api";

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
		this._title = html.node("input", {type: "text"});
		this._uri = html.node("input", {type: "text"});
		this._category = html.node("input", {type: "text"});
		this.node = this._build();

		if (subscription) {
			this._title.value = subscription.title;
			this._uri.value = subscription.uri;
			if (subscription.categoryId) {
				this._category.value = categories.list().find(
				cat => cat.id == subscription.categoryId)?.title || "";
			}
		}
	}

	async submit() {
		let data: Partial<Subscription> = {
			title: this._title.value,
			uri: this._uri.value,
			categoryId: (await getCategory(this._category.value))?.id
		};

		let res: ApiResponse;
		if (this._subscription) {
			res = await subscriptions.edit(this._subscription.id, data);
		} else {
			res = await subscriptions.add(data);
		}

		return res
	}

	_build() {
		let node = html.node("form");

		this._subscription && node.appendChild(labelInput("Title", this._title, true));
		node.appendChild(labelInput("Feed URL", this._uri, true));
		node.appendChild(labelInput("Category", this._category));

		let categoryList = buildCategoryList();
		this._category.setAttribute("list", categoryList.id);
		node.appendChild(categoryList);

		return node;
	}
}

function labelInput(text: string, input: HTMLInputElement, required: boolean = false) {
	let label = html.node("label", {}, text);
	required && label.classList.add("required");

	let id = random.str();
	label.setAttribute("for", id);
	input.setAttribute("id", id);

	let frag = html.fragment();
	frag.appendChild(label);
	frag.appendChild(input);

	return frag;
}

function buildCategoryList() {
	let node = html.node("datalist", {id: random.str()});
	categories.list().forEach(
		c => html.node("option", {value: c.title}, c.title, node));
	return node;
}

async function getCategory(title: string) {
	title = title.trim();
	if (!title) { return; }

	let category = categories.list()
		.find(cat => cat.title.trim().toLowerCase() == title.toLowerCase());

	if (!category) {
		let res = await categories.add({title});
		res.ok && (category = res.data);
	}

	return category;
}
