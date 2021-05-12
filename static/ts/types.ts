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
	status: number;
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
	url: string;
	read: boolean;
	starred: boolean;
	time_published: Date;
	content?: string;
	summary?: string;
}

interface ArticleFilters {
	subscription_id?: SubscriptionId
	category_id?: CategoryId
	limit?: number
	offset?: number
	starred_only?: boolean
	unread_only?: boolean
}

interface FeedLink {
	href: string
	title?: string
}
