import { Category } from "data/types";
import * as categories from "data/categories";

import { ApiResponse } from "util/api"
import * as random from "util/random";
import { labelInput } from "util/uitools";

import Dialog from "ui/widget/dialog";


export default class CategoryForm {
	node!: HTMLFormElement;
	submitBtn!: HTMLButtonElement;
	protected title!: HTMLInputElement;
	protected category: Category;

	static open(category: Category) {
		let dialog = new Dialog("Edit category");

		let form = new CategoryForm(category);
		form.afterSubmit = () => dialog.close();

		let footer = document.createElement("footer");
		footer.append(form.submitBtn);

		dialog.append(form.node, footer);
		dialog.show();
	}

	constructor(category: Category) {
		this.category = category;
		this._build();
		this.node.addEventListener("submit", this);
	}

	async handleEvent(e: Event) {
		if (e.type == "submit") {
			e.preventDefault();

			let res = await categories.edit(this.category.id, {
				title: this.title.value
			});

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
		this.submitBtn.textContent = "Submit";;
		this.submitBtn.setAttribute("form", this.node.id);

		this.title = document.createElement("input");
		this.title.type = "text";
		this.title.required = true;
		this.title.value = this.category.title;

		this.node.append(labelInput("Title", this.title));
	}

	_validate(res: ApiResponse) {
		this._clearValidation();

		switch (res.error?.code) {
			case "missing_field":
				this.title.setCustomValidity("Please fill out this field.");
			break;
			case "already_exists":
				this.title.setCustomValidity(`Title already exists.`);
			break;
		}

		this.node.classList.toggle("invalid", !this.node.checkValidity());
		this.node.reportValidity();
	}

	_clearValidation() {
		this.title.setCustomValidity("");
	}
}
