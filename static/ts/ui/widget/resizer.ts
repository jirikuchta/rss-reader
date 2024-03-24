import { Settings } from "data/types";
import * as settings from "data/settings";
import * as html from "util/html";

type StorageKey = keyof Pick<Settings, "navWidth" | "articlesWidth">;

export default class Resizer {
	protected node: HTMLElement;
	protected storageKey: StorageKey;
	protected offsetLeft!: number;
	protected parentWidth!: number;

	constructor(node: HTMLElement, storageKey: StorageKey) {
		this.node = node;
		this.storageKey = storageKey;
		this.build();
	}

	handleEvent(ev: MouseEvent) {
		switch(ev.type) {
			case "pointerdown":
				this.offsetLeft = this.node.offsetLeft;
				this.parentWidth = (this.node.parentNode as HTMLElement).offsetWidth;
				document.body.style.userSelect = "none";
				document.addEventListener("pointermove", this);
				document.addEventListener("pointerup", this);
			break;
			case "pointerup":
				document.body.style.userSelect = "";
				settings.setItem(this.storageKey, this.node.style.width);
				document.removeEventListener("pointermove", this);
				document.removeEventListener("pointerup", this);
			break;
			case "pointermove":
				this.resize(ev.x);
			break;
		}
	}

	protected build() {
		let node = html.node("span", {className: "resizer"});
		node.addEventListener("pointerdown", this);
		this.node.insertAdjacentElement("afterend", node);
		this.node.style.width = settings.getItem(this.storageKey);
	}

	protected resize(pos: number) {
		let widthPx = Math.max(0, pos - this.offsetLeft);
		let widthPerc = Math.min(100, (widthPx / this.parentWidth) * 100);
		this.node.style.width = `${widthPerc}%`;
	}
}
