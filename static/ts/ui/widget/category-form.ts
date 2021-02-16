import * as html from "util/html";
import * as random from "util/random";

import * as categories from "data/categories";


export default class CategoryForm {
    node!: HTMLFormElement;
    submitBtn!: HTMLButtonElement;
    _title!: HTMLInputElement;
    _category: Category;

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

export function labelInput(text: string, input: HTMLInputElement) {
    let label = html.node("label", {}, text);
    input.required && label.classList.add("required");

    let id = random.id();
    label.setAttribute("for", id);
    input.setAttribute("id", id);

    let frag = html.fragment();
    frag.appendChild(label);
    frag.appendChild(input);

    return frag;
}
