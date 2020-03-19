import * as feeds_data from "data/feeds";
import * as feeds from "ui/feeds";
import * as entries from "ui/entries";

async function init() {
	await feeds_data.init();
	await feeds.init();
	entries.init();
}

init()
