import { Feed } from "data/types";

let feeds: Feed[] = [];
let selected: string | null = null;

export async function init() {
	type Data = {feeds:Feed[]};
	let res = await fetch("/feeds");
	let data:Data = await res.json();
	feeds = data.feeds;
}

export function list() { return feeds; }

export function getSelected() {
	if (!selected) { return null; }
	return feeds.filter(f => f.link == selected)[0] || null;
}
