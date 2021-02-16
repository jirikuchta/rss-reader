import * as html from "util/html";

import * as nav from "ui/nav";
import * as list from "ui/list";
import * as detail from "ui/detail";


let node = document.querySelector("main") as HTMLElement;

export async function init() {
	nav.init();
	list.init();
	detail.init();

	node.appendChild(nav.node);
	node.appendChild(list.node);
	node.appendChild(detail.node);

	new Resizer(nav.node, "sidebar-width");
	new Resizer(list.node, "articles-width");
}


class Resizer {
	_node: HTMLElement;
	_storageId?: string;

	constructor(node: HTMLElement, storageId?: string) {
		this._node = node;
		this._storageId = storageId;
		this._build();
	}

	_build() {
		let node = html.node("div", {className: "resizer"});
		node.addEventListener("mousedown", this);

		this._node.insertAdjacentElement("afterend", node);

		this._load();
	}

	handleEvent(ev: MouseEvent) {
		switch(ev.type) {
			case "mousedown":
				document.addEventListener("mousemove", this);
				document.addEventListener("mouseup", this);
				document.body.style.userSelect = "none";
				break;
			case "mouseup":
				document.removeEventListener("mousemove", this);
				document.removeEventListener("mouseup", this);
				document.body.style.userSelect = "";
				this._save();
				break;
			case "mousemove":
				this._resize(ev.clientX);
				break;
		}
	}

	_resize(pos: number) {
		let widthPx = pos - this._node.offsetLeft;
		let widthPerc = (widthPx / document.body.offsetWidth) * 100;
		this._node.style.flexBasis = `${widthPerc}%`;
	}

	_save() {
		let widthPerc = (this._node.offsetWidth / document.body.offsetWidth) * 100;
		this._storageId && localStorage.setItem(this._storageId, `${widthPerc}`);
	}

	_load() {
		let widthPerc = this._storageId && localStorage.getItem(this._storageId);
		widthPerc && (this._node.style.flexBasis = `${widthPerc}%`);
	}
}
