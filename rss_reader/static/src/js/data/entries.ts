import { Feed, Entry } from "data/types";
import * as pubsub from "util/pubsub";

export let selected: Entry | null = null

export async function list(feed?: Feed) {
	let res = await fetch(`/api/entries/${feed ? feed.id + "/": ""}`);
	let entries: Entry[] = await res.json();
	return entries
}

export function select(entry: Entry) {
	selected = entry;
	pubsub.publish("entry-selected");
}
