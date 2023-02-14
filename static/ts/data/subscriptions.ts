import { SubscriptionId, Subscription, CategoryId } from "data/types";
import * as counters from "data/counters";
import * as articles from "data/articles";
import * as pubsub from "util/pubsub";
import api from "util/api";

const subscriptions: Map<SubscriptionId, Subscription> = new Map();

export function init() {
	return sync();
}

export async function sync() {
	let res = await api("GET", "/api/subscriptions/");
	if (!res.ok) { return; }
	(res.data as Subscription[]).forEach(s => subscriptions.set(s.id, s));
	pubsub.publish("subscriptions-changed");
}

export function list(categoryId?: CategoryId) {
	return Array.from(subscriptions.values())
		.filter(s => !categoryId || categoryId == s.category_id) ;
}
export function get(id: SubscriptionId) { return subscriptions.get(id); }

export async function add(data: Partial<Subscription>) {
	let res = await api("POST", "/api/subscriptions/", data);
	if (!res.ok) { return res; }
	subscriptions.set((res.data as Subscription).id, res.data as Subscription);
	pubsub.publish("subscriptions-changed");
	return res;
}

export async function edit(id: SubscriptionId, data: Partial<Subscription>) {
	let res = await api("PATCH", `/api/subscriptions/${id}/`, data);
	if (!res.ok) { return res; }
	subscriptions.set((res.data as Subscription).id, res.data as Subscription);
	pubsub.publish("subscriptions-changed");
	return res;
}

export async function remove(id: SubscriptionId) {
	let res = await api("DELETE", `/api/subscriptions/${id}/`);
	if (!res.ok) { return res; }
	subscriptions.delete(id);
	pubsub.publish("subscriptions-changed");
	return res;
}

export async function markRead(id: SubscriptionId) {
	let res = await api("POST", `/api/subscriptions/${id}/mark-read/`);
	res.ok && counters.sync();
	articles.syncRead([id]);
	counters.sync();
}
