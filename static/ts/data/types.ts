export type SubscriptionId = number;
export type CategoryId = number;
export type ArticleId = number;

export interface Subscription {
	id: SubscriptionId;
	title: string;
	feed_url: string;
	favorite: boolean;
	web_url?: string;
	category_id?: CategoryId;
}

export interface Category {
	id: CategoryId;
	title: string;
}

export interface Article {
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

export interface ArticleFilters {
	subscription_id?: SubscriptionId
	category_id?: CategoryId
	limit?: number
	offset?: number
	starred_only?: boolean
	unread_only?: boolean
}

export interface FeedLink {
	href: string
	title?: string
}

export interface OPMLItem {
	title: string | null;
	xmlUrl: string | null;
	webUrl: string | null;
	category: string | null;
}

export interface Settings {
	navWidth?: number;
	articlesWidth?: number;
	collapsedCategories?: CategoryId[];
}
