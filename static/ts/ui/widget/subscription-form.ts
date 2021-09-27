import { Subscription, FeedLink } from "data/types";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";

import { ApiResponse } from "util/api";
import * as html from "util/html";
import * as random from "util/random";
import { labelInput } from "util/uitools";

import Dialog from "ui/widget/dialog";


export default class SubscriptionForm {
	node!: HTMLFormElement;
	submitBtn!: HTMLButtonElement;
	_title!: HTMLInputElement;
	_url!: HTMLInputElement;
	_category!: HTMLInputElement;
	_subscription?: Subscription;
	_feedSelect?: HTMLSelectElement;

	constructor(subscription?: Subscription) {
		this._subscription = subscription;
		this._build();
		this.node.addEventListener("submit", this);
	}

	static open(subscription?: Subscription) {
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

	async handleEvent(e: Event) {
		if (e.type == "submit") {
			e.preventDefault();

			let data: Partial<Subscription> = {
				title: this._title.value,
				feed_url: this._url.value,
				category_id: (await getCategory(this._category.value))?.id
			};

			let res: ApiResponse;
			if (this._subscription) {
				res = await subscriptions.edit(this._subscription.id, data);
			} else {
				res = await subscriptions.add(data);
			}

			this._validate(res);
			this.node.checkValidity() && this.afterSubmit();
		}
	}

	afterSubmit() {}

	_build() {
		this.node = html.node("form", {id: random.id()});
		this.node.noValidate = true;

		this.submitBtn = html.button({type: "submit"}, "Submit");
		this.submitBtn.setAttribute("form", this.node.id);

		this._title = html.node("input", {type: "text", required: "true"});
		this._url = html.node("input", {type: "url", required: "true"});
		this._category = html.node("input", {type: "text"});

		if (this._subscription) {
			this._title.value = this._subscription.title;
			this._url.value = this._subscription.feed_url;
			this._url.disabled = true;
			if (this._subscription.category_id) {
				let cat = categories.get(this._subscription.category_id);
				cat && (this._category.value = cat.title);
			}
		}

		this._subscription && this.node.appendChild(labelInput("Title", this._title));
		this.node.appendChild(labelInput("Feed URL", this._url));
		this.node.appendChild(labelInput("Category", this._category));

		let categoryList = buildCategoryList();
		this._category.setAttribute("list", categoryList.id);
		this.node.appendChild(categoryList);
	}

	_validate(res: ApiResponse) {
		this._clearValidation();

		switch (res.error?.code) {
			case "missing_field":
				let msg = "Please fill out this field.";
				res.error.field == "title" && this._title.setCustomValidity(msg);
				res.error.field == "uri" && this._url.setCustomValidity(msg);
			break;
			case "invalid_field":
				res.error.field == "categoryId" && this._category.setCustomValidity("Category not found.");
			break;
			case "parser_error":
				this._url.setCustomValidity("No valid RSS/Atom feed found.");
			break;
			case "already_exists":
				this._url.setCustomValidity("You are already subscribed to this feed.");
			break;
			case "ambiguous_feed_url":
				this._feedSelect = html.node("select");
				html.node("option", {value: this._url.value}, "Select feed…", this._feedSelect);
				(res.error.links as FeedLink[]).forEach(l => html.node("option", {value: l.href}, l.title || l.href, this._feedSelect));
				this._feedSelect.addEventListener("change", e => this._url.value = this._feedSelect!.value);
				this._url.parentNode!.insertBefore(this._feedSelect, this._url.nextSibling);
				this._feedSelect.setCustomValidity("Provided URL is a HTML page referencing multiple feeds.");
			break;
		}

		this.node.classList.toggle("invalid", !this.node.checkValidity());
		this.node.reportValidity();
	}

	_clearValidation() {
		this._feedSelect?.remove();
		this._title.setCustomValidity("");
		this._url.setCustomValidity("");
		this._category.setCustomValidity("");
	}
}

function buildCategoryList() {
	let node = html.node("datalist", {id: random.id()});
	categories.list().forEach(c => html.node("option", {value: c.title}, c.title, node));
	return node;
}

async function getCategory(title: string) {
	title = title.trim();
	if (!title) { return; }

	let category = categories.list().find(
		cat => cat.title.trim().toLowerCase() == title.toLowerCase());

	if (!category) {
		let res = await categories.add({title});
		res.ok && (category = res.data);
	}

	return category;
}
