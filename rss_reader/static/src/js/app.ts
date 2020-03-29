import * as subscriptions from "data/subscriptions";
import * as layout from "ui/layout";

async function init() {
	await subscriptions.init();
	layout.init();
}

init();
