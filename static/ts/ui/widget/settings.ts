import { OPMLItem, Subscription } from "data/types";
import * as settings from "data/settings";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";

import * as html from "util/html";
import * as opml from "util/opml";

import Dialog from "ui/widget/dialog";


export function open() {
	let dialog = new Dialog();
	dialog.node.classList.add("settings");

	let header = html.node("header", {}, "Settings", dialog.node);
	header.appendChild(dialog.closeButton());

	dialog.node.appendChild(buildDisplaySection());
	dialog.node.appendChild(buildOPMLSection());

	dialog.open();
}

function buildDisplaySection() {
	let node = html.node("section");

	html.node("h3", {}, "General", node);

	let label;

	label = html.node("label", {}, "Theme", node);
	let select = html.node("select", {}, "", label);
	html.node("option", {value:"system"}, "System", select);
	html.node("option", {value:"light"}, "Light", select);
	html.node("option", {value:"dark"}, "Dark", select);
	select.value = settings.getItem("theme");
	select.addEventListener("change", e => settings.setItem("theme", select.value as "system" | "light" | "dark"));

	label = html.node("label", {}, "Hide Read Articles", node);
	let input1 = html.node("input", {type:"checkbox"}, "", label);
	input1.checked = settings.getItem("unreadOnly");
	input1.addEventListener("change", e => settings.setItem("unreadOnly", input1.checked));

	label = html.node("label", {}, "Auto-Mark As Read On Scroll", node);
	let input2 = html.node("input", {type:"checkbox"}, "", label);
	input2.checked = settings.getItem("markAsReadOnScroll");
	input2.addEventListener("change", e => settings.setItem("markAsReadOnScroll", input2.checked));

	label = html.node("label", {}, "Show images in article list", node);
	let input3 = html.node("input", {type:"checkbox"}, "", label);
	input3.checked = settings.getItem("showImages");
	input3.addEventListener("change", e => settings.setItem("showImages", input3.checked));

	return node
}

function buildOPMLSection() {
	let node = html.node("section");

	html.node("h3", {}, "OPML import/export", node);

	let droparea = html.node("label", {className: "droparea"}, "Click to choose OPML file or drop one here", node);
	droparea.addEventListener("dragover", e => e.preventDefault());
	droparea.addEventListener("drop", e => e.preventDefault());

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
