import { Settings } from "data/types";
import * as settings from "data/settings";

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

	new Resizer(nav.node, "navWidth");
	new Resizer(list.node, "articlesWidth");
}


class Resizer {
	_node: HTMLElement;
	_storageId: keyof Settings;

	constructor(node: HTMLElement, storageId: keyof Settings) {
		this._node = node;
		this._storageId = storageId;
		this._build();
	}

	_build() {
		let node = html.node("div", {className: "resizer"});
		node.addEventListener("mousedown", this);

		this._node.insertAdjacentElement("afterend", node);

		let width = settings.getItem(this._storageId);
		this._node.style.flexBasis = `${width}%`;
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

				let width = (this._node.offsetWidth / document.body.offsetWidth) * 100;
				settings.setItem(this._storageId, width);

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
}
