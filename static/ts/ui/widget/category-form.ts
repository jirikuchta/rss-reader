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
	_title!: HTMLInputElement;
	_category: Category;

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
		this._category = category;
		this._build();
		this.node.addEventListener("submit", this);
	}

	async handleEvent(e: Event) {
		if (e.type == "submit") {
			e.preventDefault();

			let res = await categories.edit(this._category.id, {
				title: this._title.value
			});

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

		this._title = html.node("input", {type: "text", required: "true", value: this._category.title});

		this.node.appendChild(labelInput("Title", this._title));
	}

	_validate(res: ApiResponse) {
		this._clearValidation();

		switch (res.error?.code) {
			case "missing_field":
				this._title.setCustomValidity("Please fill out this field.");
			break;
			case "already_exists":
				this._title.setCustomValidity(`Title already exists.`);
			break;
		}

		this.node.classList.toggle("invalid", !this.node.checkValidity());
		this.node.reportValidity();
	}

	_clearValidation() {
		this._title.setCustomValidity("");
	}
}
