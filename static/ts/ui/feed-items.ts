import { ArticleFilters } from "data/types";
import * as settings from "data/settings";
import * as articles from "data/articles";

import * as pubsub from "util/pubsub";

import FeedItem from "ui/feed-item";
import FeedItemsHeader from "ui/feed-items-header";
import * as navigation from "ui/nav";

export default class FeedItems extends HTMLElement {
	protected markReadTimeout?: number;
	protected showMoreObserver = new IntersectionObserver(
		entries => entries[0].isIntersecting && this.buildItems(),
		{root: this, rootMargin: "0% 0% 20% 0%"}
	);

	connectedCallback() {
		this.build();

		this.addEventListener("click", this);
		this.addEventListener("scroll", this);

		pubsub.subscribe("articles-cleared", this);
	}

	disconnectCallback() {
		pubsub.unsubscribe("articles-cleared", this);
	}

	handleMessage(message:string, publisher?: any, data?: any) {
		if (message == "articles-cleared") {
			this.clear();
			this.build();
		}
	}

	handleEvent(e: Event) {
		e.type == "click" && this.onClick(e);
		e.type == "scroll" && this.onScroll(e);
	}

	get items() {
		return [...this.querySelectorAll("rr-feed-item")] as FeedItem[];
	}

	get filters() {
		let { items } = this;

		let filters: ArticleFilters = {
			offset: items.filter(i => settings.getItem("unreadOnly") ? !i.read : true).length
		};

		if (settings.getItem("unreadOnly") && !(navigation.selected instanceof navigation.ReadLaterItem)) {
			filters.unread_only = true;
		}

		if (navigation.selected instanceof navigation.ReadLaterItem) {
			filters.starred_only = true;
			filters.offset = items.length;
			delete filters.unread_only;
		}

		if (navigation.selected instanceof navigation.SubscriptionItem) {
			filters["subscription_id"] = navigation.selected.data.id;
		}

		if (navigation.selected instanceof navigation.CategoryItem) {
			filters["category_id"] = navigation.selected.data.id;
		}

		return filters;
	}

	protected async build() {
		this.replaceChildren(new FeedItemsHeader());
		this.buildItems();
	}

	protected clear() {
		this.replaceChildren();
		this.scrollTo(0, 0);
	}

	protected async buildItems() {
		let { items } = this;

		let data = await articles.list(this.filters);
		let newItems = data
			.filter(article => !items.find(i => i.itemId == article.id))
			.map(article => new FeedItem(article));

		if (newItems.length) {
			this.append(...newItems);
			this.showMoreObserver.disconnect();
			let lastItem = this.items.pop();
			lastItem && this.showMoreObserver.observe(lastItem);
		}
	}

	protected onClick(e: Event) {
		let { items } = this;

		let item = (e.target as HTMLElement).closest("rr-feed-item") as FeedItem;
		if (!item) { return; }

		items.forEach(item => item.active = false);
		item.active = true;
	}

	protected onScroll(e: Event) {
		clearTimeout(this.markReadTimeout);
		this.markReadTimeout = setTimeout(() => {
			let { items } = this;
			if (!settings.getItem("markAsReadOnScroll")) { return; }
			let markReadItems = items.filter(i => !i.read && i.getBoundingClientRect().bottom <= 0)
			markReadItems.length && articles.markRead(markReadItems.map(i => i.itemId));
		}, 300);
	}
}

customElements.define("rr-feed-items", FeedItems);
