import { Subscription, FeedLink } from "data/types";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";

import { ApiResponse } from "util/api";
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
		let dialog = new Dialog(`${subscription ? "Edit" : "Add"} subscription`);

		let form = new SubscriptionForm(subscription);
		form.afterSubmit = () => dialog.close();

		let footer = document.createElement("footer");
		footer.append(form.submitBtn);

		dialog.append(form.node, footer);
		dialog.show();
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
		this.node = document.createElement("form");
		this.node.id = random.id();
		this.node.noValidate = true;

		this.submitBtn = document.createElement("button");
		this.submitBtn.type = "submit";
		this.submitBtn.textContent = "Submit";
		this.submitBtn.setAttribute("form", this.node.id);

		this.title = document.createElement("input");
		this.title.type = "text";
		this.title.required = true;

		this.url = document.createElement("input");;
		this.url.type = "url";
		this.url.required = true;

		this.category = document.createElement("input");
		this.category.type = "text";

		if (this.subscription) {
			this.title.value = this.subscription.title;
			this.url.value = this.subscription.feed_url;
			if (this.subscription.category_id) {
				let cat = categories.get(this.subscription.category_id);
				cat && (this.category.value = cat.title);
			}
		}

		this.subscription && this.node.append(labelInput("Title", this.title));
		this.node.append(labelInput("Feed URL", this.url));
		this.node.append(labelInput("Category", this.category));

		let categoryList = document.createElement("datalist");
		categoryList.id = random.id();;
		categoryList.append(...categories.list().map(c => {
			let option = document.createElement("option");
			option.textContent = c.title;
			option.value = c.title;
			return option;
		}));
		this.category.setAttribute("list", categoryList.id);
		this.node.append(categoryList);
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
				this.feedSelect = document.createElement("select");
				this.feedSelect.append(
					feedSelectOption(this.url.value, "Select feed…"),
					...(res.error.links as FeedLink[]).map(l => feedSelectOption(l.href, l.title || l.href))
				);
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

function feedSelectOption(value: string, title: string) {
	let node = document.createElement("option");
	node.value = value;
	node.title = title;
	return node;
}