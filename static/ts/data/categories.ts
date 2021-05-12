import * as subscriptions from "data/subscriptions";
import api from "util/api";
import * as pubsub from "util/pubsub";

let categories: Category[] = [];

export async function init() {
	let res = await api("GET", "/api/categories/");
	res.ok && (categories = res.data);
}

export function get(): Category[];
export function get(id: CategoryId): Category;
export function get(id?: CategoryId):  Category | Category[] {
	if (id === undefined) { return categories; }
	return categories.filter(s => s.id == id)[0];
}

export async function add(data: Partial<Category>) {
	let res = await api("POST", "/api/categories/", data);
	if (res.ok) {
		categories.push(res.data);
		pubsub.publish("categories-changed");
	}
	return res;
}

export async function edit(id: CategoryId, data: Partial<Category>) {
	let res = await api("PATCH", `/api/categories/${id}/`, data);
	if (res.ok) {
		let i = categories.findIndex(s => s.id == id);
		if (i != -1) {
			categories[i] = res.data;
			pubsub.publish("categories-changed");
		}
	}
	return res;
}

export async function remove(id: CategoryId) {
	let res = await api("DELETE", `/api/categories/${id}/`);
	if (res.ok) {
		let i = categories.findIndex(s => s.id == id);
		if (i != -1) {
			categories.splice(i, 1);
			subscriptions.sync();
			pubsub.publish("categories-changed");
		}
	}
	return res;
}

export async function markRead(id: CategoryId) {
	return await api("PUT", `/api/categories/${id}/read/`);
}
