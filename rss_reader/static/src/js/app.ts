import * as feeds_data from "data/feeds";

import * as feeds from "ui/feeds";
import * as items from "ui/items";

async function init() {
	await feeds_data.init();
	feeds.init();
	items.init();
}

init()
