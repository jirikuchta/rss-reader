import { SubscriptionId, Subscription } from "data/types";
import { api } from "util/api";
import * as pubsub from "util/pubsub";

let subscriptions: Subscription[] = [];

export async function init() {
	let res = await api("GET", "/api/subscriptions/");
	res.ok && (subscriptions = res.data);
}

export function list() { return subscriptions; }

export async function add(data: Partial<Subscription>) {
	let res = await api("POST", "/api/subscriptions/", data);
	if (res.ok) {
		subscriptions.push(res.data);
		pubsub.publish("subscriptions-changed");
	}
	return res;
}

export async function edit(id: SubscriptionId, data: Partial<Subscription>) {
	let res = await api("PATCH", `/api/subscriptions/${id}/`, data);
	if (res.ok) {
		let i = subscriptions.findIndex(s => s.id == id);
		if (i != -1) {
			subscriptions[i] = res.data;
			pubsub.publish("subscriptions-changed");
		}
	}
	return res;
}

export async function remove(id: SubscriptionId) {
	let res = await api("DELETE", `/api/subscriptions/${id}/`);
	if (res.ok) {
		let i = subscriptions.findIndex(s => s.id == id);
		if (i != -1) {
			subscriptions.splice(i, 1);
			pubsub.publish("subscriptions-changed");
		}
	}
	return res;
}

export async function markRead(id: SubscriptionId) {
	return await api("PUT", `/api/subscriptions/${id}/read/`);
}
