import { Feed, Entry } from "data/types";

export async function list(feed?: Feed) {
	let res = await fetch(`/api/entries/${feed ? feed.id + "/": ""}`);
	let entries: Entry[] = await res.json();
	return entries
}
