import * as data from "./data"

import * as feeds from "./feeds";
import * as items from "./items";

async function init() {
	await data.init();
	feeds.init();
	items.init();
}

init()
