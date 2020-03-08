import * as data from "./data";
import * as html from "./html";

export function init() {
	let node = document.querySelector("#feeds");
	data.list().forEach(feed => node.appendChild(html.node("article", {}, feed.title)));
}
