import * as feeds_data from "data/feeds";
import * as layout from "ui/layout";

async function init() {
	await feeds_data.init();
	layout.init();
}

init();
