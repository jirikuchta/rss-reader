export interface Subscription {
	id: number;
	title: string;
	uri: string;
}

export interface Entry {
	id: string;
	title: string;
	uri: string;
	unread: boolean;
	starred: boolean;
	summary?: string;
	content?: string;
	comments_link?: string;
	author?: string;
}
