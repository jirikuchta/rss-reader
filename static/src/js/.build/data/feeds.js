import * as pubsub from "util/pubsub";
let feeds = [];
let selected = null;
export async function init() {
    let res = await fetch("/feeds");
    let data = await res.json();
    feeds = data.feeds;
}
export function list() { return feeds; }
export function getSelected() {
    if (!selected) {
        return null;
    }
    return feeds.filter(f => f.link == selected)[0] || null;
}
export function select(feed) {
    selected = feed.link;
    pubsub.publish("selected-feed-change");
}
