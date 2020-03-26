import * as html from "util/html";

import * as feeds from "ui/feeds";
import * as entries from "ui/entries";
import * as detail from "ui/detail";


let node = document.querySelector("main") as HTMLElement;

export function init() {
	let sidebarNode = html.node("div", {id: "layout-sidebar"});
	let entriesNode = html.node("div", {id: "layout-entries"});
	let detailNode = html.node("div", {id: "layout-detail"});

	sidebarNode.appendChild(feeds.init());
	entriesNode.appendChild(entries.init());
	detailNode.appendChild(detail.init());

	node.appendChild(sidebarNode);
	node.appendChild(entriesNode);
	node.appendChild(detailNode);

	node.insertBefore((new Resizer(sidebarNode, entriesNode)).node, entriesNode);
	node.insertBefore((new Resizer(entriesNode, detailNode)).node, detailNode);
}


class Resizer {
	node: HTMLElement;
	_ln: HTMLElement;
	_rn: HTMLElement;
	_lnMinWidth: number;
	_rnMinWidth: number;

	constructor(leftNode: HTMLElement, rightNode: HTMLElement) {
		this._ln = leftNode;
		this._rn = rightNode;
		this._lnMinWidth = parseInt(getComputedStyle(leftNode).minWidth) || 0;
		this._rnMinWidth = parseInt(getComputedStyle(rightNode).minWidth) || 0;

		this.node = html.node("div", {className: "layout-resizer"});
		this.node.addEventListener("mousedown", this);

		this._load();
	}

	handleEvent(ev: MouseEvent) {
		switch(ev.type) {
			case "mousedown":
				document.addEventListener("mousemove", this);
				document.addEventListener("mouseup", this);
				break;
			case "mouseup":
				document.removeEventListener("mousemove", this);
				document.removeEventListener("mouseup", this);
				this._save();
				break;
			case "mousemove":
				this._resize(ev.clientX);
				break;
		}
	}

	_resize(pos: number) {
		let totalWidth = this._ln.offsetWidth + this._rn.offsetWidth;
		let lnWidth = Math.max(this._lnMinWidth, pos - this._ln.offsetLeft);

		if (pos > this.node.offsetLeft) {
			lnWidth = Math.min(lnWidth, totalWidth - this._rnMinWidth);
		}

		this._ln.style.flexBasis = `${lnWidth}px`;
		this._rn.style.flexBasis = `${totalWidth - lnWidth}px`;;
	}

	_save() {
		localStorage.setItem(`${this._ln.id}-width`, `${this._ln.offsetWidth}`);
		localStorage.setItem(`${this._rn.id}-width`, `${this._rn.offsetWidth}`);
	}

	_load() {
		let lnWidth = localStorage.getItem(`${this._ln.id}-width`);
		let rnWidth = localStorage.getItem(`${this._rn.id}-width`);
		lnWidth && (this._ln.style.flexBasis = `${lnWidth}px`);
		rnWidth && (this._rn.style.flexBasis = `${rnWidth}px`);
	}
}
