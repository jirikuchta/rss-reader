import api from "util/api";

export async function get(filters?: ArticleFilters) {
	let res = await api("GET", "/api/articles/", filters);
	(res.data as Article[]).forEach(a => a.time_published = new Date(a.time_published));
	return res.data as Article[];
}

export async function toggle_read(article: Article) {
	await api("PATCH", `/api/articles/${article.id}/`, {"read": true});
}
