import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as layout from "ui/layout";

async function init() {
	await categories.init();
	await subscriptions.init();
	layout.init();
}

init();
