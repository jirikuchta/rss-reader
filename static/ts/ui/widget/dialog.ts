import * as html from "util/html";


export default class Dialog {
	node: HTMLDialogElement;

	constructor() {
		this.node = html.node("dialog");
	}

	open() {
		document.body.append(this.node);
		this.node.showModal();
	}

	close() {
		this.node.close();
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

	return new Promise(resolve => dialog.onClose = resolve as () => void);
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
