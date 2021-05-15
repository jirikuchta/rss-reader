import { Subscription } from "data/types";
import * as html from "util/html";


export default function build(subscription: Subscription) {
	let node = html.node("span", {className: "subscription-icon"});

	let img = new Image();
	img.onload = () => {
		img.width == 1 && (node.dataset.content = subscription.title[0]);
		img.width > 1 && node.appendChild(img);
	};
	img.src = `/feed-icon/${subscription.id}/`;

	return node;
}
