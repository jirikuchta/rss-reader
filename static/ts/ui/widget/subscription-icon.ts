import { Subscription } from "data/types";
import * as html from "util/html";

export default function build(subscription: Subscription) {
	let node = html.node("span", {className: "subscription-icon"});
	node.dataset.content = subscription.title[0];

	let img = new Image();
	img.onload = () => node.appendChild(img);
	img.src = `https://www.google.com/s2/favicons?domain=${subscription.web_url}&alt=feed/`;

	return node;
}
