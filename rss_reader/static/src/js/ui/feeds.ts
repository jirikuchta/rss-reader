import { Feed } from "data/types";
import * as feeds from "data/feeds";
import * as html from "util/html";

let node = document.querySelector("#feeds") as HTMLElement;

export async function init() {
	html.clear(node);
	let items = await feeds.list();
	items.forEach(feed => node.appendChild(buildItem(feed)));
}

function buildItem(feed: Feed) {
	let node = html.node("article", {}, feed.title);
	node.addEventListener("click", e => feeds.select(feed));
	return node;
}
