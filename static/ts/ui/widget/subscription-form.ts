import { Subscription, FeedLink } from "data/types";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";

import { ApiResponse } from "util/api";

import Dialog from "ui/widget/dialog";

export function openDialog(subscription?: Subscription) {
	let dialog = new Dialog(`${subscription ? "Edit" : "Add"} subscription`);

	let form = new SubscriptionForm(subscription);
	form.afterSubmit = () => dialog.close();

	let footer = document.createElement("footer");
	footer.append(form.submitBtn());

	dialog.append(form, footer);
	dialog.showModal();
}

export default class SubscriptionForm extends HTMLFormElement {
	id = "subscription-form";

	constructor(protected subscription?: Subscription) {
		super();
		this.addEventListener("submit", this);
	}

	async handleEvent(e: Event) {
		if (e.type == "submit") {
			e.preventDefault();

			let data: Partial<Subscription> = {
				title: this.feedName?.value,
				feed_url: this.url.value,
				category_id: this.category.value ? (await categories.getByName(this.category.value, true))?.id : null
			};

			let res: ApiResponse;
			if (this.subscription) {
				res = await subscriptions.edit(this.subscription.id, data);
			} else {
				res = await subscriptions.add(data);
			}

			this.validate(res);
			this.checkValidity() && this.afterSubmit();
		}
	}

	afterSubmit() {}

	connectedCallback() {
		this.noValidate = true;

		let label, input;

		label = document.createElement("label");
		label.textContent = "Feed URL";
		input = document.createElement("input");;
		input.name = "url";
		input.type = "url";
		input.required = true;
		label.append(input);
		this.append(label);

		label = document.createElement("label");
		label.textContent = "Category";
		input = document.createElement("input");
		input.name = "category";
		input.type = "text";
		label.append(input);
		this.append(label);

		let categoryList = document.createElement("datalist");
		categoryList.id = "category-list";
		categoryList.append(...categories.list().map(c => {
			let option = document.createElement("option");
			option.textContent = c.title;
			option.value = c.title;
			return option;
		}));
		this.category.setAttribute("list", categoryList.id);
		this.append(categoryList);

		if (this.subscription) {
			label = document.createElement("label");
			label.textContent = "Title";
			input = document.createElement("input");
			input.name = "feedName";
			input.type = "text";
			input.required = true;
			label.append(input);
			this.prepend(label);

			this.feedName.value = this.subscription.title;
			this.url.value = this.subscription.feed_url;
			if (this.subscription.category_id) {
				let cat = categories.get(this.subscription.category_id);
				cat && (this.category.value = cat.title);
			}
		}
	}

	submitBtn() {
		let btn = document.createElement("button");
		btn.type = "submit";
		btn.textContent = "Submit";;
		btn.setAttribute("form", this.id);
		return btn;
	}

	protected validate(res: ApiResponse) {
		this.clearValidation();

		switch (res.error?.code) {
			case "missing_field":
				let msg = "Please fill out this field.";
				res.error.field == "title" && this.feedName?.setCustomValidity(msg);
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
				let feedSelect = document.createElement("select");
				feedSelect.name = "feedSelect";
				feedSelect.append(
					feedSelectOption(this.url.value, "Select feed…"),
					...(res.error.links as FeedLink[]).map(l => feedSelectOption(l.href, l.title || l.href))
				);
				feedSelect.addEventListener("change", e => this.url.value = this.feedSelect.value);
				this.url.parentNode!.insertBefore(feedSelect, this.url.nextSibling);
				feedSelect.setCustomValidity("Provided URL is a HTML page referencing multiple feeds.");
			break;
		}

		this.reportValidity();
	}

	protected clearValidation() {
		this.feedSelect?.remove();
		this.feedName?.setCustomValidity("");
		this.url.setCustomValidity("");
		this.category.setCustomValidity("");
	}
}

customElements.define("rr-subscription-form", SubscriptionForm, { extends: "form" });

function feedSelectOption(value: string, title: string) {
	let node = document.createElement("option");
	node.textContent = title;
	node.value = value;
	return node;
}