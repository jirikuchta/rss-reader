import { Category } from "data/categories";
import { Subscription } from "data/subscriptions";
import * as articles from "data/articles";
import { Article } from "data/articles";
import * as html from "util/html";

let node:HTMLElement;
let selectedNavItem: Category | Subscription;

export function init() {
	build();
	return node;
}

export function setSelectedNavItem(item: Category | Subscription) {
	selectedNavItem = item;
	build();
}

async function build() {
	node ? html.clear(node) : node = html.node("section", {"id": "list"});
	let items = await articles.list(selectedNavItem);
	items && items.forEach(article => node.appendChild(buildItem(article)));
}

function buildItem(article: Article) {
	let node = html.node("article");
	node.appendChild(html.node("h3", {}, article.title));
	return node;
}
