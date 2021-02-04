import { Category, CategoryId } from "data/categories";
import { api } from "util/api";
import * as pubsub from "util/pubsub";

let subscriptions: Subscription[];

export type SubscriptionId = number;

export interface Subscription {
	id: SubscriptionId;
	title: string;
	feed_url: string;
	category_id?: CategoryId;
}

export function isSubscription(entity: Category | Subscription) {
	return (entity as Subscription).feed_url != undefined
}

export function init() {
	return sync();
}

export async function sync() {
	let res = await api("GET", "/api/subscriptions/");
	res.ok && (subscriptions = res.data) && pubsub.publish("subscriptions-changed");
}

export function get(id: SubscriptionId) {
	return subscriptions.filter(s => s.id == id)[0];
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
