import { Subscription, SubscriptionId, isSubscription} from "data/subscriptions";
import { Category } from "data/categories";
import { api, ApiResponse } from "util/api";

export type ArticleId = number;

export interface Article {
	id: ArticleId;
	title: string;
	uri: string;
	subscriptionId: SubscriptionId;
}

export async function list(entity?: Subscription | Category) {
	let res: ApiResponse;
	if (entity) {
		if (isSubscription(entity)) {
			res = await api("GET", `/api/subscriptions/${entity['id']}/articles/`);
		} else {
			res = await api("GET", `/api/categories/${entity['id']}/articles/`);
		}
	} else {
		res = await api("GET", `/api/articles/`);
	}
	return res.data as Article[];
}
