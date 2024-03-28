import * as html from "util/html";
import icon from "ui/icon";

export default class Dialog {
	node: HTMLDialogElement;

	constructor() {
		this.node = html.node("dialog");
		this.node.addEventListener("close", e => this.close());
	}

	open() {
		document.body.append(this.node);
		this.node.showModal();
	}

	close() {
		this.node.close();
		this.node.remove();
		this.onClose();
	}

	onClose() {}

	closeButton() {
		let btn = document.createElement("button");
		btn.className = "close";
		btn.append(icon("cross"));
		btn.addEventListener("click", e => this.close());
		return btn;
	}
}

export async function alert(text: string, description?: string): Promise<null> {
	let dialog = new Dialog();
	dialog.node.classList.add("alert");

	let header = html.node("header", {}, "", dialog.node);
	header.appendChild(dialog.closeButton());
	html.node("h3", {}, text, header);
	description && html.node("p", {}, description, header);


	let button = document.createElement("button");
	button.type = "submit";
	button.textContent = "OK";;
	button.addEventListener("click", _ => dialog.close());

	let footer = html.node("footer", {}, "", dialog.node);
	footer.append(button);

	dialog.open();

	return new Promise(resolve => dialog.onClose = resolve as () => void);
}

export async function confirm(text: string, ok?: string, cancel?: string): Promise<boolean> {
	let dialog = new Dialog();

	let header = html.node("header", {}, "", dialog.node);
	header.appendChild(dialog.closeButton());
	html.node("h3", {}, text, header);

	let btnOk = document.createElement("button");
	btnOk.type = "submit";
	btnOk.textContent = ok || "OK";

	let btnCancel = document.createElement("button");
	btnCancel.type = "button";
	btnCancel.textContent = cancel || "Cancel";

	let footer = html.node("footer", {}, "", dialog.node);
	footer.append(btnOk, btnCancel);

	dialog.open();

	return new Promise(resolve => {
		dialog.onClose = () => resolve(false);
		btnOk.addEventListener("click", e => {
			resolve(true);
			dialog.close();
		});
		btnCancel.addEventListener("click", e => dialog.close());
	});
}
