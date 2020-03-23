import { Feed } from "data/types";
import { api } from "util/api";
import * as pubsub from "util/pubsub";

let feeds: Feed[] = [];

export let selected: Feed | null = null;

export async function init() {
	type Res = {data:Feed[], status: string};
	let res:Res = await api("/api/feeds/");
	if (res && res.status == "ok") { feeds = res.data; }
}

export function list() { return feeds; }

export function select(feed: Feed) {
	selected = feed;
	pubsub.publish("feed-selected");
}

export async function add(uri: string) {
	let body = new FormData();
	body.append("uri", uri);

	type Res = {data:Feed, status: string};
	let res:Res = await api("/api/feeds/", {method: "POST", body: body});
	if (!res || res.status != "ok") { return false; }

	feeds.push(res.data);
	pubsub.publish("feeds-changed");

	return true;
}

export async function remove(feed: Feed) {
	type Res = {data:null, status:string};
	let res:Res = await api(`/api/feeds/${feed.id}/`, {method: "DELETE"});
	if (!res || res.status != "ok") { return false; }

	feeds = feeds.filter(item => item.id != feed.id);
	pubsub.publish("feeds-changed");

	return true;
}
