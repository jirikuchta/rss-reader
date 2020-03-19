export interface Feed {
	id: number;
	title: string;
	uri: string;
	entries?: Entry[];
}

export interface Entry {
	id: string;
	title: string;
	uri: string;
	summary?: string;
	content?: string;
	comments_link?: string;
	author?: string;
}

export interface Enclosure {
	url: string;
	type: string;
	length?: number;
}

