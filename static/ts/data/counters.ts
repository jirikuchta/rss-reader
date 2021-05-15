import api from "util/api";
import * as pubsub from "util/pubsub";

const counters: Map<SubscriptionId, number> = new Map();

export function init() {
	sync();
	setInterval(sync, 60*1000);
}

export async function sync() {
	let res = await api("GET", "/api/counters/");
	if (!res.ok) { return; }
	counters.clear();
	for (const [key, value] of Object.entries(res.data)) {
		counters.set(Number(key), value as number)
	}
	pubsub.publish("subscriptions-changed");
}

export function list() { return counters; }
export function get(id: SubscriptionId) { return counters.get(id); }
