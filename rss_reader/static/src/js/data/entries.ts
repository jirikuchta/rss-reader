import { Subscription, Entry } from "data/types";
import { api } from "util/api";

export async function list(subscription?: Subscription) {
	let res = await api("GET", "/api/entries/");
	return res.data as Entry[];
}
