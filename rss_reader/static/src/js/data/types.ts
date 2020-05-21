export type CategoryId = number;
export type SubscriptionId = number;
export type EntryId = number;

export interface Category {
	id: CategoryId;
	title: string;
}

export interface Subscription {
	id: SubscriptionId;
	title: string;
	uri: string;
	categoryId?: CategoryId;
}

export interface Entry {
	id: EntryId;
	title: string;
	uri: string;
	unread: boolean;
	starred: boolean;
	subscriptionId: SubscriptionId;
}

export function isSubscription(entity: Category | Subscription) {
	return (entity as Subscription).uri != undefined
}
