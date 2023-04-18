import { Article, ArticleFilters, ArticleId, SubscriptionId } from "data/types";
import * as counters from "data/counters";
import * as pubsub from "util/pubsub";
import api from "util/api";

const articles: Map<ArticleId, Article> = new Map();

export async function list(filters?: ArticleFilters) {
	let res = await api("GET", "/api/articles/", filters) as {data: Article[]};
	res.data.forEach(article => {
		article.time_published = new Date(article.time_published);
		articles.set(article.id, article);
	});
	return res.data;
}

export async function get(id: ArticleId) {
	if (!articles.has(id)) {
		let res = await api("GET", `/api/articles/${id}/`) as {data: Article};
		res.data.time_published = new Date(res.data.time_published);
		articles.set(id, res.data);
	}
	return articles.get(id)!;
}

export async function markRead(ids?: ArticleId[]) {
	let res = await api("POST", "/api/articles/mark-read/", ids ? {ids} : {all: true});
	if (!res.ok) { return; }

	Array.from(articles.values())
		.filter(a => ids ? ids.includes(a.id) : true)
		.forEach(a => a.read = true);

	counters.sync();
	pubsub.publish("articles-read");
}

export async function edit(id: ArticleId, data: Partial<Article>) {
	let res = await api("PATCH", `/api/articles/${id}/`, data);
	res.ok && articles.set(id, res.data as Article);
	return articles.get(id);
}

export function syncRead(ids: SubscriptionId[]) {
	Array.from(articles.values())
		.filter(a => ids.includes(a.subscription_id))
		.forEach(a => a.read = true);
	pubsub.publish("articles-read");
}

export function clear() {
	articles.clear();
	pubsub.publish("articles-cleared");
}
