import * as html from "util/html";


let current: Dialog | null = null;

export class Dialog {
	node: HTMLElement;

	constructor() {
		this.node = html.node("div", {id: "dialog"});
	}

	open() {
		current?.close();
		current = this;
		document.body.classList.add("with-dialog");
		document.body.appendChild(this.node);
	}

	close() {
		current = null;
		document.body.classList.remove("with-dialog");
		this.node.parentNode?.removeChild(this.node);
		this.onClose();
	}

	onClose() {}

	closeButton() {
		let button = html.button({icon: "cross", className: "close"});
		button.addEventListener("click", e => this.close());
		return button;
	}
}

export async function alert(text: string, description?: string): Promise<null> {
	let dialog = new Dialog();
	dialog.node.classList.add("alert");

	let header = html.node("header", {}, "", dialog.node);
	header.appendChild(dialog.closeButton());
	html.node("h3", {}, text, header);
	description && html.node("p", {}, description, header);

	let footer = html.node("footer", {}, "", dialog.node);
	let button = html.button({type:"submit"}, "OK", footer);
	button.addEventListener("click", _ => dialog.close());

	dialog.open();

	return new Promise(resolve => dialog.onClose = resolve);
}

export async function confirm(text: string, ok?: string, cancel?: string): Promise<boolean> {
	let dialog = new Dialog();

	let header = html.node("header", {}, "", dialog.node);
	header.appendChild(dialog.closeButton());
	html.node("h3", {}, text, header);

	let footer = html.node("footer", {}, "", dialog.node);
	let btnOk = html.button({type:"submit"}, ok || "OK", footer);
	let btnCancel = html.button({type:"button"}, cancel || "Cancel", footer);

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

window.addEventListener("keydown", e => e.keyCode == 27 && current?.close());
