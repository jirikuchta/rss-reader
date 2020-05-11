import { CategoryId, Category } from "data/types";

import { api } from "util/api";
import * as pubsub from "util/pubsub";

let categories: Category[] = [];

export async function init() {
	let res:Category[] = await api("GET", "/api/categories/");
	categories = res;
}

export function list() { return categories; }

export async function add(data: Partial<Category>) {
	let res:Category = await api("POST", "/api/categories/", data);
	categories.push(res);
	pubsub.publish("categories-changed");
	return res;
}

export async function edit(id: CategoryId, data: Partial<Category>) {
	await api("PATCH", `/api/categories/${id}/`, data);
	pubsub.publish("categories-changed");
}

export async function remove(id: CategoryId) {
	await api("DELETE", `/api/categories/${id}/`);
	categories = categories.filter(c => c.id != id);
	pubsub.publish("categories-changed");
}
