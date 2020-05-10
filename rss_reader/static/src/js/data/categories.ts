import { Category } from "data/types";
import { api } from "util/api";
import * as pubsub from "util/pubsub";

let categories: Category[] = [];

export async function init() {
    let res:Category[] = await api("/api/categories/");
    categories = res;
}

export function list() { return categories; }

export async function add(title: string) {
    let res:Category = await api("/api/categories/", "POST", {"title": title});

    categories.push(res);
    pubsub.publish("categories-changed");

    return res;
}

export async function remove(category: Category) {
    await api(`/api/categories/${category.id}/`, "DELETE");

    categories = categories.filter(item => item.id != category.id);
    pubsub.publish("categories-changed");

    return true;
}
