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

	protected title!: HTMLInputElement;
	protected url!: HTMLInputElement;
	protected category!: HTMLInputElement;
	protected subscription?: Subscription;
	protected feedSelect?: HTMLSelectElement;

	constructor(subscription?: Subscription) {
		this.subscription = subscription;
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
				title: this.title.value,
				feed_url: this.url.value,
				category_id: (await categories.getByName(this.category.value, true))?.id
			};

			let res: ApiResponse;
			if (this.subscription) {
				res = await subscriptions.edit(this.subscription.id, data);
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

		this.title = html.node("input", {type: "text", required: "true"});
		this.url = html.node("input", {type: "url", required: "true"});
		this.category = html.node("input", {type: "text"});

		if (this.subscription) {
			this.title.value = this.subscription.title;
			this.url.value = this.subscription.feed_url;
			if (this.subscription.category_id) {
				let cat = categories.get(this.subscription.category_id);
				cat && (this.category.value = cat.title);
			}
		}

		this.subscription && this.node.appendChild(labelInput("Title", this.title));
		this.node.appendChild(labelInput("Feed URL", this.url));
		this.node.appendChild(labelInput("Category", this.category));

		let categoryList = html.node("datalist", {id: random.id()});
		categories.list().forEach(c => html.node("option", {value: c.title}, c.title, categoryList));
		this.category.setAttribute("list", categoryList.id);
		this.node.appendChild(categoryList);
	}

	_validate(res: ApiResponse) {
		this._clearValidation();

		switch (res.error?.code) {
			case "missing_field":
				let msg = "Please fill out this field.";
				res.error.field == "title" && this.title.setCustomValidity(msg);
				res.error.field == "uri" && this.url.setCustomValidity(msg);
			break;
			case "invalid_field":
				res.error.field == "categoryId" && this.category.setCustomValidity("Category not found.");
			break;
			case "parser_error":
				this.url.setCustomValidity("No valid RSS/Atom feed found.");
			break;
			case "already_exists":
				this.url.setCustomValidity("You are already subscribed to this feed.");
			break;
			case "ambiguous_feed_url":
				this.feedSelect = html.node("select");
				html.node("option", {value: this.url.value}, "Select feed…", this.feedSelect);
				(res.error.links as FeedLink[]).forEach(l => html.node("option", {value: l.href}, l.title || l.href, this.feedSelect));
				this.feedSelect.addEventListener("change", e => this.url.value = this.feedSelect!.value);
				this.url.parentNode!.insertBefore(this.feedSelect, this.url.nextSibling);
				this.feedSelect.setCustomValidity("Provided URL is a HTML page referencing multiple feeds.");
			break;
		}

		this.node.classList.toggle("invalid", !this.node.checkValidity());
		this.node.reportValidity();
	}

	_clearValidation() {
		this.feedSelect?.remove();
		this.title.setCustomValidity("");
		this.url.setCustomValidity("");
		this.category.setCustomValidity("");
	}
}
