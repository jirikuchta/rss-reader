import { Subscription } from "data/types";

export default class FeedIcon extends HTMLElement {
	constructor(protected subscription: Subscription) { super (); }

	connectedCallback() {
		let { title, web_url } = this.subscription;
		this.dataset.content = title[0];

		let img = new Image();
		img.onload = () => this.append(img);
		img.src = `https://www.google.com/s2/favicons?domain=${web_url}&alt=feed/`;
	}
}

customElements.define("rr-feed-icon", FeedIcon);
