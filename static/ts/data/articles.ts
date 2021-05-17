import { Article, ArticleFilters } from "data/types";
import * as counters from "data/counters";
import api from "util/api";

export async function list(filters?: ArticleFilters) {
	let res = await api("GET", "/api/articles/", filters);
	(res.data as Article[]).forEach(a => a.time_published = new Date(a.time_published));
	return res.data as Article[];
}

export async function markRead(articles: Article[]) {
	let res = await api("POST", "/api/articles/mark-read/", {ids: articles.map(a => a.id)});
	res.ok && counters.sync();
}
