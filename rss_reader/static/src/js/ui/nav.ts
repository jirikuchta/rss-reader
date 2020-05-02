import * as html from "util/html";

import Popup from "ui/popup";


let node:HTMLElement;

interface FeedData {
	name: string,
	category: string;
}

let categories:string[] = ["tech", "humor+art"];
let feeds:FeedData[] = [
	{"name": "Changelog master feed", "category": "tech"},
	{"name": "CSS-Tricks", "category": "tech"},
	{"name": "David Walsch Blog", "category": "tech"},
	{"name": "DEV Community", "category": "tech"},
	{"name": "Go Make Things", "category": "tech"},
	{"name": "Hacker News", "category": "tech"},
	{"name": "Hacker Noon - Medium", "category": "tech"},
	{"name": "ITNEXT - Medium", "category": "tech"},
	{"name": "Jim Fisher`s blog", "category": "tech"},
	{"name": "MDN recent document changes", "category": "tech"},
	{"name": "ROOT.cz - články", "category": "tech"},
	{"name": "Scotch.io RSS Feed", "category": "tech"},
	{"name": "SitePoint", "category": "tech"},
	{"name": "Zdroják", "category": "tech"},
	{"name": "C-Heads Magazine", "category": "humor+art"},
	{"name": "Explosm.net", "category": "humor+art"},
	{"name": "Hyperbole and a Half", "category": "humor+art"},
	{"name": "OPRÁSKI SČESKÍ HISTORJE", "category": "humor+art"},
	{"name": "Roumenův Rouming", "category": "humor+art"},
	{"name": "this isn`t happiness.", "category": "humor+art"},
];


export function init() {
	build();
	return node;
}

async function build() {
	node ? html.clear(node) : node = html.node("nav");
	categories.forEach(cat => node.appendChild(buildCategory(cat)));
}

function buildCategory(cat: string) {
	let node = html.node("ul");

	node.appendChild(buildItem(cat, true));
	feeds.filter(feed => feed.category == cat).forEach(feed => node.appendChild(buildItem(feed.name)));

	return node;
}

function buildItem(name: string, isCategory: boolean = false) {
	let node = html.node("li", {tabIndex: "0"});

	if (isCategory) {
		node.classList.add("category");
		let btn = html.button({icon: "chevron-down", className: "plain btn-chevron"}, "", node);
		btn.addEventListener("click", e => node.classList.toggle("collapsed"));
	}

	node.appendChild(html.node("span", {className: "title"}, name));
	node.appendChild(html.node("span", {className: "count"}, "50"));

	let btn = html.button({className: "plain btn-dots", icon: "dots-horizontal"}, "", node);
	btn.addEventListener("click", e => showItemPopup(btn));

	return node;
}

function showItemPopup(target: HTMLElement) {
	let popup = new Popup();
	html.node("div", {}, "ahfsadfa sdf as fas fsa fas foj", popup.node);
	popup.open(target, "side");
}
