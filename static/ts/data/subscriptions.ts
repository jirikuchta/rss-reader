import api from "util/api";
import * as pubsub from "util/pubsub";

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

export function list() { return Array.from(subscriptions.values()); }
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
	return await api("PUT", `/api/subscriptions/${id}/read/`);
}

export function isSubscription(entity: Category | Subscription) {
	return (entity as Subscription).feed_url != undefined
}
