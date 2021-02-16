import api from "util/api";

export async function list(filters?: ArticleFilters) {
	let res = await api("GET", "/api/articles/", filters);
	return res.data as Article[];
}

export async function toggle_read(article: Article) {
	await api("PUT", `/api/articles/${article.id}/read/`);
}