import { Category } from "data/categories";
import { Subscription } from "data/subscriptions";
import * as articles from "data/articles";
import { Article } from "data/articles";
import { build as buildDetail } from "ui/detail";
import * as html from "util/html";

const SELECTED_CSS_CLASS = "is-selected";
const READ_CSS_CLASS = "is-read";

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
	article.summary && node.appendChild(html.node("p", {}, article.summary));
	node.addEventListener("click", _ => selectItem(node, article));
	return node;
}

async function selectItem(itemNode: HTMLElement, article: Article) {
	node.querySelector(`.${SELECTED_CSS_CLASS}`)?.classList.remove(SELECTED_CSS_CLASS);
	itemNode.classList.add(SELECTED_CSS_CLASS);

	buildDetail(article);

	await articles.toggle_read(article);
	itemNode.classList.add(READ_CSS_CLASS);
}
