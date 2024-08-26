import { SubscriptionId } from "data/types";
import api from "util/api";
import app, { dispatchEvent } from "app";

const counters: Map<SubscriptionId, number> = new Map();

export function init() {
	sync();
	setInterval(sync, 60*1000);
	app.addEventListener("articles-changed", sync);
}

export async function sync() {
	let res = await api("GET", "/api/counters/");
	if (!res.ok) { return; }

	let prevSum = sum();
	counters.clear();

	for (const [id, count] of Object.entries(res.data)) {
		counters.set(Number(id), count as number)
	}

	if (prevSum != sum()) {
		dispatchEvent("counters-changed");
	}
}

export function list() { return counters; }
export function get(id: SubscriptionId) { return counters.get(id); }

export function sum() {
	return Array.from(counters.values()).reduce((res, count) => res + count, 0);
}
