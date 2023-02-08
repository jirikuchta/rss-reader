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

	html.button({type:"button", icon: "cross", classList:"close plain"}, "", node)
		.addEventListener("click", (e) => {
			toggleNav(false);
			toggleDetail(false);
		});

	html.button({type:"button", icon: "menu", classList:"menu plain"}, "", node)
		.addEventListener("click", (e) => toggleNav(true));

	pubsub.subscribe("article-selected", () => toggleDetail(true));
	pubsub.subscribe("nav-item-selected", () => toggleNav(false));

	new Resizer(nav.node, document.body, "navWidth");
	new Resizer(list.node, wrap, "listWidth");
}

export function toggleNav(force?: boolean) {
	node.classList.toggle("nav-open", force);
}

export function toggleDetail(force?: boolean) {
	node.classList.toggle("detail-open", force);
}

class Resizer {
	protected node: HTMLElement;
	protected parent: HTMLElement;
	protected storageKey: keyof Settings;

	constructor(node: HTMLElement, parent: HTMLElement, storageKey: keyof Settings) {
		this.node = node;
		this.parent = parent;
		this.storageKey = storageKey;
		this._build();
	}

	_build() {
		let node = html.node("span", {className: "resizer"});
		node.addEventListener("pointerdown", this);

		this.node.insertAdjacentElement("afterend", node);

		let width = settings.getItem(this.storageKey);
		this.node.style.flexBasis = `${width}%`;
	}

	handleEvent(ev: MouseEvent) {
		switch(ev.type) {
			case "pointerdown":
				document.addEventListener("pointermove", this);
				document.addEventListener("pointerup", this);
				document.body.style.userSelect = "none";
				break;
			case "pointerup":
				document.removeEventListener("pointermove", this);
				document.removeEventListener("pointerup", this);
				document.body.style.userSelect = "";

				let width = (this.node.offsetWidth / document.body.offsetWidth) * 100;
				settings.setItem(this.storageKey, width);

				break;
			case "pointermove":
				this._resize(ev.x);
				break;
		}
	}

	_resize(pos: number) {
		let widthPx = pos - this.parent.offsetLeft;
		let widthPerc = (widthPx / this.parent.offsetWidth) * 100;
		this.node.style.flexBasis = `${widthPerc}%`;
	}
}
