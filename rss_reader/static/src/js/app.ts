import * as feeds from "data/feeds";
import * as layout from "ui/layout";

async function init() {
	await feeds.init();
	layout.init();
}

init();
