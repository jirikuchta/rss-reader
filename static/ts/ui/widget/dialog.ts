import Icon from "ui/icon";

export default class Dialog extends HTMLDialogElement {
	constructor(protected _title: string) {
		super();
		this.addEventListener("close", e => this.remove());
	}

	connectedCallback() {
		let header = document.createElement("header");

		let title = document.createElement("h3");
		title.textContent = this._title;
		header.append(title);

		let close = document.createElement("button");
		close.className = "close";
		close.append(new Icon("cross"));
		close.addEventListener("click", e => this.close());
		header.append(close);

		this.prepend(header);
	}

	show() {
		document.body.append(this);
		this.showModal();
	}
}

customElements.define("rr-dialog", Dialog, { extends: "dialog"});

export async function alert(text: string): Promise<null> {
	let dialog = new Dialog(text);
	dialog.classList.add("alert");

	let button = document.createElement("button");
	button.type = "submit";
	button.textContent = "OK";;
	button.addEventListener("click", _ => dialog.close());

	let footer = document.createElement("footer");
	footer.append(button);

	dialog.append(footer);
	dialog.show();

	return new Promise(resolve => dialog.addEventListener("close", () => resolve(null)));
}

export async function confirm(text: string, ok?: string, cancel?: string): Promise<boolean> {
	let dialog = new Dialog(text);

	let btnOk = document.createElement("button");
	btnOk.type = "submit";
	btnOk.textContent = ok || "OK";

	let btnCancel = document.createElement("button");
	btnCancel.type = "button";
	btnCancel.textContent = cancel || "Cancel";

	let footer = document.createElement("footer");
	footer.append(btnOk, btnCancel);

	dialog.append(footer);
	dialog.show();

	return new Promise(resolve => {
		dialog.addEventListener("close", () => resolve(false));
		btnOk.addEventListener("click", e => {
			resolve(true);
			dialog.close();
		});
		btnCancel.addEventListener("click", e => dialog.close());
	});
}
