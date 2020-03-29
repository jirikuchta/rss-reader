import * as html from "util/html";


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
	let frag = html.fragment();

	let catNode = node.appendChild(html.node("div", {className: "nav-item category", tabIndex: "0"}));
	let btn = html.button({icon: "chevron-down", className: "plain opener"});
	btn.addEventListener("click", e => catNode.classList.toggle("collapsed"));
	catNode.appendChild(btn);
	catNode.appendChild(html.node("span", {className: "title"}, cat));
	catNode.appendChild(html.node("span", {className: "count"}, "50"));
	catNode.appendChild(html.button({className: "plain menu-opener", icon: "dots-horizontal"}));

	let items = html.node("ul");
	feeds.filter(feed => feed.category == cat).forEach(feed => items.appendChild(buildFeed(feed.name)));

	frag.appendChild(catNode);
	frag.appendChild(items);

	return frag;
}

function buildFeed(feed: string) {
	let node = html.node("li", {className: "nav-item", tabIndex: "0"});
	node.appendChild(html.node("span", {className: "title"}, feed));
	node.appendChild(html.node("span", {className: "count"}, "50"));
	html.button({className: "plain menu-opener", icon: "dots-horizontal"}, "", node);
	return node;
}
