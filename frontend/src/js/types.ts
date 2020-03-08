export interface Feed {
	feed_type: "RSS" | "ATOM";
	title: string;
	link: string;
	items: FeedItem[];
}

export interface FeedItem {
	id: string;
	title: string;
	link: string;
	summary?: string;
	content?: string;
	comments_link?: string;
	author?: string;
	enclosures: Enclosure[];
	categories: string[];
}

export interface Enclosure {
	url: string;
	type: string;
	length?: number;
}

