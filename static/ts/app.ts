import * as settings from "data/settings";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as articles from "data/subscriptions";
import * as counters from "data/counters";
import * as layout from "ui/layout";

async function init() {
	settings.init();
	await categories.init();
	await subscriptions.init();
	await articles.init();

	counters.init();
	layout.init();
}

init();
