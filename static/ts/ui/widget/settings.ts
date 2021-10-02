import { OPMLItem, Subscription } from "data/types";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";

import * as html from "util/html";
import * as opml from "util/opml";

import Dialog from "ui/widget/dialog";


export function open() {
	let dialog = new Dialog();

	let header = html.node("header", {}, "Settings", dialog.node);
	header.appendChild(dialog.closeButton());

	dialog.node.appendChild(buildOPML());

	dialog.open();
}

function buildOPML() {
	let node = html.node("section", {id: "opml"});

	html.node("h3", {}, "Import from OPML file", node);
	let droparea = html.node("div", {className: "droparea"}, "", node);
	let input = html.node("input", {type: "file"}, "", droparea);
	input.addEventListener("input", onFileInput);

	html.node("h3", {}, "Export to OPML file", node);
	let href = window.URL.createObjectURL(new Blob([opml.serialize()], {type: "application/xml"}));
	html.node("a", {href, download: "subscriptions.opml"}, "Download OPML file", node);

	return node;
}

function onFileInput(e: Event) {
	let reader = new FileReader();
	reader.onload = evt => processImport(opml.parse(evt.target!.result as string));
	reader.readAsText((e.target as HTMLInputElement)!.files![0]);
}

async function processImport(items: OPMLItem[]) {
	for (let item of items) {
		let category = item.category ? (await categories.getByName(item.category, true)) : null;
		let data: Partial<Subscription> = {
			feed_url: item.xmlUrl || item.webUrl || ""
		}
		item.title && (data["title"] = item.title);
		item.webUrl && (data["web_url"] = item.webUrl);
		category && (data["category_id"] = category.id);
		await subscriptions.add(data);
	};
}
