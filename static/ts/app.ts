import * as settings from "data/settings";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as articles from "data/subscriptions";
import * as counters from "data/counters";
import * as nav from "ui/nav";
import * as uiarticles from "ui/articles";
import * as detail from "ui/detail";
import Resizer from "ui/widget/resizer";

async function init() {
	settings.init();

	new Resizer(nav.node, "navWidth");
	new Resizer(uiarticles.node, "articlesWidth");

	await categories.init();
	await subscriptions.init();
	await articles.init();

	nav.init();
	uiarticles.init();
	detail.init();

	counters.init();
}

init();
