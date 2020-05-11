import { Subscription, Entry } from "data/types";
import { api } from "util/api";

export async function list(subscription?: Subscription) {
	let res:Entry[] = await api("GET", "/api/entries/");
	return res;
}
