import { Feed } from "./types";

let feeds: Feed[] = [];

export async function init() {
	type Data = {feeds:Feed[]};
	let res = await fetch("/feeds");
	let data:Data = await res.json();
	feeds = data.feeds;
}

export function list() { return feeds; }
