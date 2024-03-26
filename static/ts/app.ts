import * as settings from "data/settings";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as articles from "data/subscriptions";
import * as counters from "data/counters";

import * as nav from "ui/nav";
import FeedItems from "ui/feed-items";
import * as detail from "ui/detail";

import Resizer from "ui/widget/resizer";

const main = document.querySelector("main")!;

async function init() {
	settings.init();

	await categories.init();
	await subscriptions.init();
	await articles.init();

	let feedItems = new FeedItems();
	main.append(feedItems, detail.node);

	nav.node.insertAdjacentElement("afterend", new Resizer(nav.node, "navWidth"));
	feedItems.insertAdjacentElement("afterend", new Resizer(feedItems, "articlesWidth"));

	nav.init();
	detail.init();

	counters.init();
}

init();
