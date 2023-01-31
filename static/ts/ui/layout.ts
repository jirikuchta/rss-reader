import { Settings } from "data/types";
import * as settings from "data/settings";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

import * as nav from "ui/nav";
import * as list from "ui/list";
import * as detail from "ui/detail";


let node = document.querySelector("main") as HTMLElement;

export async function init() {
	nav.init();
	list.init();
	detail.init();

	let wrap = html.node("div", {}, "", node);
	wrap.appendChild(list.node);
	wrap.appendChild(detail.node);

	node.appendChild(nav.node);
	node.appendChild(wrap);

	html.button({type:"button", icon: "cross", classList:"close"}, "", node)
		.addEventListener("click", (e) => {
			toggleNav(false);
			toggleDetail(false);
		});

	html.button({type:"button", icon: "menu", classList:"menu"}, "", node)
		.addEventListener("click", (e) => toggleNav(true));

	pubsub.subscribe("article-selected", () => toggleDetail(true));
	pubsub.subscribe("nav-item-selected", () => toggleNav(false));

	new Resizer(nav.node, "navWidth");
	new Resizer(list.node, "articlesWidth");
}

export function toggleNav(force?: boolean) {
	node.classList.toggle("nav-open", force);
}

export function toggleDetail(force?: boolean) {
	node.classList.toggle("detail-open", force);
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
		let node = html.node("span", {className: "resizer"});
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
