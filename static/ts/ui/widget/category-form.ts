import { Category } from "data/types";
import * as categories from "data/categories";

import { ApiResponse } from "util/api"

import Dialog from "ui/widget/dialog";

export function openDialog(category: Category) {
	let dialog = new Dialog("Edit category");

	let form = new CategoryForm(category);
	form.afterSubmit = () => dialog.close();

	let footer = document.createElement("footer");
	footer.append(form.submitBtn());

	dialog.append(form, footer);
	dialog.showModal();
}


export default class CategoryForm extends HTMLFormElement {
	id = "category-form";

	constructor(protected category: Category) {
		super();
		this.addEventListener("submit", this);
	}

	async handleEvent(e: Event) {
		if (e.type != "submit") { return; }
		e.preventDefault();

		let res = await categories.edit(this.category.id, {
			title: this.categoryName.value
		});

		this.validate(res);
		this.checkValidity() && this.afterSubmit();
	}

	afterSubmit() {}

	connectedCallback() {
		this.noValidate = true;

		let title = document.createElement("input");
		title.type = "text";
		title.name = "categoryName";
		title.required = true;
		title.value = this.category.title;

		let label = document.createElement("label");
		label.textContent = "Title";
		label.append(title);

		this.append(label);
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
				this.categoryName.setCustomValidity("Please fill out this field.");
			break;
			case "already_exists":
				this.categoryName.setCustomValidity(`Title already exists.`);
			break;
		}

		this.reportValidity();
	}

	protected clearValidation() {
		this.categoryName.setCustomValidity("");
	}
}

customElements.define("rr-category-form", CategoryForm, { extends: "form" });