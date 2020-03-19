import { Feed } from "data/types";
import * as pubsub from "util/pubsub";

let feeds: Feed[] = [];
let selected_feed_id: number | null = null;

export async function init() {
	let res = await fetch("/api/feeds/");
	feeds = await res.json();
}

export function list() { return feeds; }

export function getSelected() {
	if (selected_feed_id == null) { return null; }
	let feed = feeds.filter(feed => feed.id == selected_feed_id)[0];
	return feed ? feed : null;
}

export function select(feed: Feed) {
	selected_feed_id = feed.id;
	pubsub.publish("selected-feed-change");
}
