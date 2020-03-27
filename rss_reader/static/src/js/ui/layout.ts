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

	new Resizer(sidebarNode, "sidebar-width");
	new Resizer(entriesNode, "entries-width");
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

		this._node.classList.add("with-resizer");
		this._node.appendChild(node);

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
