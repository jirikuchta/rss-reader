import { SubscriptionId } from "data/types";
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

	let prevSum = sum();
	counters.clear();

	for (const [id, count] of Object.entries(res.data)) {
		counters.set(Number(id), count as number)
	}

	prevSum != sum() && pubsub.publish("counters-updated");
}

export function list() { return counters; }
export function get(id: SubscriptionId) { return counters.get(id); }

function sum() {
	return Array.from(counters.values()).reduce((res, count) => res + count, 0);
}
