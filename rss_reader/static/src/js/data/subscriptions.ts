import { Subscription, CategoryId } from "data/types";
import { api } from "util/api";
import * as pubsub from "util/pubsub";

let subscriptions: Subscription[] = [];

export async function init() {
	let res:Subscription[] = await api("/api/subscriptions/");
	subscriptions = res;
}

export function list() { return subscriptions; }

export async function add(uri: string, categoryId?: CategoryId) {
	let res:Subscription = await api("/api/subscriptions/", "POST",{
		"uri": uri,
		"categoryId": categoryId ?? null
	});

	subscriptions.push(res);
	pubsub.publish("subscriptions-changed");

	return true;
}

export async function remove(subscription: Subscription) {
	type Res = {data:null, status:string};
	let res:Res = await api(`/api/subscriptions/${subscription.id}/`, "DELETE");
	if (!res || res.status != "ok") { return false; }

	subscriptions = subscriptions.filter(item => item.id != subscription.id);
	pubsub.publish("subscriptions-changed");

	return true;
}
