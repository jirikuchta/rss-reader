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
