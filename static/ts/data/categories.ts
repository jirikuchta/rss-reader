import { CategoryId, Category } from "data/types";
import * as subscriptions from "data/subscriptions";
import api from "util/api";
import * as pubsub from "util/pubsub";

const categories: Map<CategoryId, Category> = new Map();

export async function init() {
	let res = await api("GET", "/api/categories/");
	res.ok && (res.data as Category[]).forEach(s => categories.set(s.id, s));
}

export function list() { return Array.from(categories.values()); }
export function get(id: CategoryId) { return categories.get(id); }

export async function add(data: Partial<Category>) {
	let res = await api("POST", "/api/categories/", data);
	if (!res.ok) { return res; }
	categories.set(res.data.id as CategoryId, res.data as Category);
	pubsub.publish("categories-changed");
	return res;
}

export async function edit(id: CategoryId, data: Partial<Category>) {
	let res = await api("PATCH", `/api/categories/${id}/`, data);
	if (!res.ok) { return res; }
	categories.set(res.data.id as CategoryId, res.data as Category);
	pubsub.publish("categories-changed");
	return res;
}

export async function remove(id: CategoryId) {
	let res = await api("DELETE", `/api/categories/${id}/`);
	if (!res.ok) { return res; }
	categories.delete(id);
	subscriptions.sync();
	pubsub.publish("categories-changed");
	return res;
}

export async function markRead(id: CategoryId) {
	return await api("PUT", `/api/categories/${id}/read/`);
}
