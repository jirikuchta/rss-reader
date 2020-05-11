import { SubscriptionId, Subscription } from "data/types";
import { api } from "util/api";
import * as pubsub from "util/pubsub";

let subscriptions: Subscription[] = [];

export async function init() {
	let res:Subscription[] = await api("GET", "/api/subscriptions/");
	subscriptions = res;
}

export function list() { return subscriptions; }

export async function add(data: Partial<Subscription>) {
	let res:Subscription = await api("POST", "/api/subscriptions/", data);
	subscriptions.push(res);
	pubsub.publish("subscriptions-changed");
}

export async function edit(id: SubscriptionId, data: Partial<Subscription>) {
	await api("PATCH", `/api/subscriptions/${id}/`, data);
	pubsub.publish("subscriptions-changed");
}

export async function remove(id: SubscriptionId) {
	type Res = {data:null, status:string};
	let res:Res = await api("DELETE", `/api/subscriptions/${id}/`);
	if (!res || res.status != "ok") { return false; }

	subscriptions = subscriptions.filter(s => s.id != id);
	pubsub.publish("subscriptions-changed");

	return true;
}
