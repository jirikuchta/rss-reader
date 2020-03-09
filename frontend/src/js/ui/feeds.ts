import { Feed } from "data/types";
import * as feeds from "data/feeds";
import * as html from "util/html";

let node = document.querySelector("#feeds");

export function init() {
	html.clear(node);
	feeds.list().forEach(feed => node.appendChild(buildItem(feed)));
}

function buildItem(feed: Feed) {
	let node = html.node("article", {}, feed.title);
	node.addEventListener("click", e => feeds.select(feed));
	return node;
}
