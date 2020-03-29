import { Subscription } from "data/types";
import { api } from "util/api";
import * as pubsub from "util/pubsub";

let subscriptions: Subscription[] = [];

export let selected: Subscription | null = null;

export async function init() {
	type Res = {data:Subscription[], status: string};
	let res:Res = await api("/api/subscriptions/");
	if (res && res.status == "ok") { subscriptions = res.data; }
}

export function list() { return subscriptions; }

export function select(subscription: Subscription) {
	selected = subscription;
	pubsub.publish("subscription-selected");
}

export async function add(uri: string) {
	let body = new FormData();
	body.append("uri", uri);

	type Res = {data:Subscription, status: string};
	let res:Res = await api("/api/subscriptions/", {method: "POST", body: body});
	if (!res || res.status != "ok") { return false; }

	subscriptions.push(res.data);
	pubsub.publish("subscriptions-changed");

	return true;
}

export async function remove(subscription: Subscription) {
	type Res = {data:null, status:string};
	let res:Res = await api(`/api/subscriptions/${subscription.id}/`, {method: "DELETE"});
	if (!res || res.status != "ok") { return false; }

	subscriptions = subscriptions.filter(item => item.id != subscription.id);
	pubsub.publish("subscriptions-changed");

	return true;
}
