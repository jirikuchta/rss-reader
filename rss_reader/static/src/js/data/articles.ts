import { Subscription, SubscriptionId, isSubscription} from "data/subscriptions";
import { Category } from "data/categories";
import { api, ApiResponse } from "util/api";

export type ArticleId = number;

export interface Article {
	id: ArticleId;
	subscriptionId: SubscriptionId;
	title: string;
	content?: string;
	summary?: string;
	uri: string;
}

export async function list(entity?: Subscription | Category) {
	let res: ApiResponse;
	if (entity) {
		if (isSubscription(entity)) {
			res = await api("GET", `/api/articles/`, {"subscription_id": entity.id});
		} else {
			res = await api("GET", `/api/articles/`, {"category_id": entity.id});
		}
	} else {
		res = await api("GET", `/api/articles/`);
	}
	return res.data as Article[];
}
