import { Feed, Entry } from "data/types";
import { api } from "util/api";
import * as pubsub from "util/pubsub";

export let selected: Entry | null = null

export async function list(feed?: Feed) {
	type Res = {data:Entry[], status:string}
	let res:Res = await api(`/api/feeds/${feed ? feed.id + "/": ""}entries/`);
	if (!res || res.status != "ok") { return false; }
	return res.data;
}

export function select(entry: Entry) {
	selected = entry;
	pubsub.publish("entry-selected");
}
