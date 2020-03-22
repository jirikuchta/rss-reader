import { Feed } from "data/types";
import * as feeds from "data/feeds";
import * as html from "util/html";
import * as pubsub from "util/pubsub";

let node = document.querySelector("#feeds") as HTMLElement;

export function init() {
	build();
	pubsub.subscribe("feeds-changed", build);
}

async function build() {
	html.clear(node);
	node.appendChild(buildHeader());

	let items = await feeds.list();
	items.forEach(feed => node.appendChild(buildItem(feed)));
}

function buildHeader() {
	let node = html.node("header", {}, "Feeds");
	let addBtn = html.node("button", {}, "➕");
	addBtn.addEventListener("click", e => addItem());
	node.appendChild(addBtn);
	return node;
}

function buildItem(feed: Feed) {
	let node = html.node("article", {}, feed.title);
	node.addEventListener("click", e => feeds.select(feed));

	let removeBtn = html.node("button", {}, "➖");
	removeBtn.addEventListener("click", e => removeItem(feed));
	node.appendChild(removeBtn);

	return node;
}

async function addItem() {
	let uri = prompt();
	if (!uri) { return; }
	await feeds.add(uri);
}

async function removeItem(feed: Feed) {
	await feeds.remove(feed);
}
