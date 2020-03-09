import { Feed } from "data/types";
import * as feeds from "data/feeds";
import * as html from "util/html";

let node = document.querySelector("#feeds");

export function init() {
	html.clear(node);
	feeds.list().forEach(feed => buildItem(feed)));
}

function buildItem(feed: Feed) {
	let node = html.node("article", {}, feed.title);
	return node;
}
