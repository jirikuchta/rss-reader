type SubscriptionId = number;
type CategoryId = number;
type ArticleId = number;

interface ApiErrorData {
	code: string;
	field?: string;
	[key: string]: any;
}

interface ApiResponse {
	ok: boolean;
	data?: any;
	error?: ApiErrorData;
}

interface Subscription {
	id: SubscriptionId;
	title: string;
	feed_url: string;
	category_id?: CategoryId;
}

interface Category {
	id: CategoryId;
	title: string;
}

interface Article {
	id: ArticleId;
	subscription_id: SubscriptionId;
	title: string;
	content?: string;
	summary?: string;
	url: string;
}

interface ArticleFilters {
	subscription_id?: SubscriptionId
	category_id?: CategoryId
	limit?: number
	offset?: number
	starred?: boolean
	include_read?: boolean
}
