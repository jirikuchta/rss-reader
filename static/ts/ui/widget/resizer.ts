import { Settings } from "data/types";
import * as settings from "data/settings";

type StorageKey = keyof Pick<Settings, "navWidth" | "articlesWidth">;

export default class Resizer extends HTMLElement {
	protected parentWidth!: number;
	protected parentOffset!: number;

	constructor(protected node: HTMLElement, protected storageKey: StorageKey) {
		super();
	}

	connectedCallback() {
		this.addEventListener("pointerdown", this);
		this.node.style.width = settings.getItem(this.storageKey);
	}

	handleEvent(ev: MouseEvent) {
		switch(ev.type) {
			case "pointerdown":
				let parent = this.node.parentNode as HTMLElement;
				this.parentWidth = parent.offsetWidth;
				this.parentOffset = parent.offsetLeft;
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

	protected resize(pos: number) {
		let widthPx = Math.max(0, pos - this.parentOffset);
		let widthPerc = Math.min(100, (widthPx / this.parentWidth) * 100);
		this.node.style.width = `${widthPerc}%`;
	}
}

customElements.define("rr-resizer", Resizer);
