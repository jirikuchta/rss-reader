import { Feed } from "data/types";
import * as pubsub from "util/pubsub";

let feeds: Feed[] = [];

export let selected: Feed | null = null;

export async function init() {
	let res = await fetch("/api/feeds/");
	feeds = await res.json();
}

export function list() { return feeds; }

export function select(feed: Feed) {
	selected = feed;
	pubsub.publish("feed-selected");
}

export async function add(uri: string) {
	let data = new FormData();
	data.append("uri", uri);
	let res = await fetch("/api/feeds/", {method: "POST", body: data});
	if (!res.ok) { return; }
	feeds.push(await res.json());
	pubsub.publish("feeds-changed");
}

export async function remove(feed: Feed) {
	let res = await fetch(`/api/feeds/${feed.id}/`, {method: "DELETE"});
	if (!res.ok) { return; }
	feeds = feeds.filter(item => item.id != feed.id);
	pubsub.publish("feeds-changed");
}
