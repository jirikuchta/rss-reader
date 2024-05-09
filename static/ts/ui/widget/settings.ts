import { OPMLItem, Subscription, Settings } from "data/types";
import * as settings from "data/settings";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";

import * as opml from "util/opml";

import Dialog from "ui/widget/dialog";


export function open() {
	let dialog = new Dialog("Settings");
	dialog.classList.add("settings");

	dialog.append(buildDisplaySection(), buildOPMLSection())
	dialog.show();
}

function buildDisplaySection() {
	let node = document.createElement("section");

	let title = document.createElement("h3");
	title.textContent = "General";
	node.append(title);

	let options: Partial<Record<keyof Settings, string>> = {
		unreadOnly: "Hide Read Articles",
		markAsReadOnScroll: "Auto-Mark As Read On Scroll",
		showImages: "Show images in article list"
	};
	for (const [key, title] of Object.entries(options)) {
		let label = document.createElement("label");
		label.textContent = title;

		let input = document.createElement("input");
		input.type = "checkbox";
		input.checked = !!settings.getItem(key as keyof Settings);
		input.addEventListener("change", e => settings.setItem(key as keyof Settings, (e.target as HTMLInputElement).checked));

		label.append(input);
		node.append(label);
	}

	return node
}

function buildOPMLSection() {
	let node = document.createElement("section");

	let title = document.createElement("h3");
	title.textContent = "OPML import/export";
	node.append(title);

	let importNode = document.createElement("label");
	importNode.className = "droparea";
	importNode.textContent = "Click to choose OPML file or drop one here";
	importNode.addEventListener("dragover", e => e.preventDefault());
	importNode.addEventListener("drop", e => e.preventDefault());

	let importInput = document.createElement("input");
	importInput.type = "file";
	importInput.addEventListener("input", onFileInput);
	importNode.append(importInput);

	let exportNode = document.createElement("h3");
	exportNode.textContent = "Export to OPML file";

	let exportLink = document.createElement("a");
	exportLink.textContent = "Download OPML file";
	exportLink.href = window.URL.createObjectURL(new Blob([opml.serialize()], {type: "application/xml"}));
	exportLink.download = "subscriptions.opml";
	exportNode.append(exportLink);

	node.append(title, importNode, exportNode);

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
