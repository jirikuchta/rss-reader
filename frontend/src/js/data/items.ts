import { FeedItem } from "data/types";
import * as feeds from "data/feeds";

export function list() {
	let selected_feed = feeds.getSelected()
	if (selected_feed) { return selected_feed.items; }
}
