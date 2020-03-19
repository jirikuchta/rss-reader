import * as feeds from "data/feeds";
export function list() {
    let selected_feed = feeds.getSelected();
    return selected_feed ? selected_feed.items : [];
}
