import { Category } from "data/types";
import * as categories from "data/categories";

import { ApiResponse } from "util/api"
import * as html from "util/html";
import * as random from "util/random";
import { labelInput } from "util/uitools";

import Dialog from "ui/widget/dialog";


export default class CategoryForm {
	node!: HTMLFormElement;
	submitBtn!: HTMLButtonElement;
	protected title!: HTMLInputElement;
	protected category: Category;

	static open(category: Category) {
		let dialog = new Dialog();

		let categoryForm = new CategoryForm(category);
		categoryForm.afterSubmit = () => dialog.close();

		let header = html.node("header", {}, "Edit category", dialog.node);
		header.appendChild(dialog.closeButton());

		dialog.node.appendChild(categoryForm.node);

		let footer = html.node("footer", {}, "", dialog.node);
		footer.appendChild(categoryForm.submitBtn);

		dialog.open();
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
		this.node = html.node("form", {id: random.id()});
		this.node.noValidate = true;

		this.submitBtn = document.createElement("button");
		this.submitBtn.type = "submit";
		this.submitBtn.textContent = "Submit";;
		this.submitBtn.setAttribute("form", this.node.id);

		this.title = html.node("input", {type: "text", required: "true", value: this.category.title});

		this.node.appendChild(labelInput("Title", this.title));
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
