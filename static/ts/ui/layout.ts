import * as settings from "data/settings";

import * as html from "util/html";
import * as command from "util/command";

import * as nav from "ui/nav";
import * as list from "ui/list";
import * as detail from "ui/detail";

let node = document.querySelector("main") as HTMLElement;

export async function init() {
	nav.init();
	list.init();
	detail.init();

	let wrap = document.querySelector("main > div") as HTMLElement;
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
		.addEventListener("click", e => { e.stopPropagation(); toggleNav(true); });

	document.body.addEventListener("click", onBodyClick);

	command.register("layout:showDetail", () => toggleDetail(true));

	new Resizer(nav.node, document.body, "navWidth");
	new Resizer(list.node, wrap, "listWidth");
}

export function toggleNav(force?: boolean) {
	node.classList.toggle("nav-open", force);
}

export function toggleDetail(force?: boolean) {
	node.classList.toggle("detail-open", force);
}

function onBodyClick(e: Event) {
	toggleNav(false);
}

class Resizer {
	protected node: HTMLElement;
	protected parent: HTMLElement;
	protected storageKey: "navWidth" | "listWidth";

	constructor(node: HTMLElement, parent: HTMLElement, storageKey: "navWidth" | "listWidth") {
		this.node = node;
		this.parent = parent;
		this.storageKey = storageKey;
		this._build();
	}

	_build() {
		let node = html.node("span", {className: "resizer"});
		node.addEventListener("pointerdown", this);
		this.node.insertAdjacentElement("afterend", node);
		this.node.style.flexBasis = settings.getItem(this.storageKey);
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
				settings.setItem(this.storageKey, this.node.style.flexBasis);
				document.body.style.userSelect = "";
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
