import * as feeds_data from "data/feeds";
import * as feeds from "ui/feeds";
import * as entries from "ui/entries";
import * as detail from "ui/detail";

async function init() {
	await feeds_data.init();

	feeds.init();
	entries.init();
	detail.init();
}

init()
