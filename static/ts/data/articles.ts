import { Article, ArticleFilters, ArticleId } from "data/types";
import * as counters from "data/counters";
import * as pubsub from "util/pubsub";
import api from "util/api";

const articles: Map<ArticleId, Article> = new Map();

export async function init() {
	pubsub.subscribe("nav-item-selected", () => articles.clear());
}

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
		let res = await api("GET", `/api/articles/${id}/`);
		articles.set(id, res.data as Article);
	}
	return articles.get(id)!;
}

export async function markRead(ids?: ArticleId[]) {
	let res = await api("POST", "/api/articles/mark-read/", ids ? {ids} : {all: true});
	if (!res.ok) { return; }

	articles.forEach(a => {
		if (ids && !ids.includes(a.id)) { return; }
		articles.set(a.id, Object.assign(a, {read: true}));
	});

	counters.sync();
	pubsub.publish("articles-read");
}
