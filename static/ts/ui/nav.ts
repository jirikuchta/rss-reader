import { Category, Subscription } from "data/types";
import * as settings from "data/settings";
import * as articles from "data/articles";
import * as categories from "data/categories";
import * as subscriptions from "data/subscriptions";
import * as counters from "data/counters";

import * as html from "util/html";
import * as pubsub from "util/pubsub";

import subscriptionIcon from "ui/widget/subscription-icon";
import SubscriptionForm from "ui/widget/subscription-form";
import CategoryForm from "ui/widget/category-form";
import { open as openSettings } from "ui/widget/settings";
import { PopupMenu } from "ui/widget/popup";
import { confirm } from "ui/widget/dialog";


const SELECTED_CSS_CLASS = "selected";
const COLLAPSED_CSS_CLASS = "collapsed";

export const node = document.querySelector("nav") as HTMLElement;
const scroll = node.querySelector(".scroll") as HTMLElement;

export let selected: Item;

let items: Item[] = [];

interface HasTitle {
	title: string;
}

export function init() {
	buildHeader();
	build();

	node.addEventListener("click", onClick);
	node.addEventListener("contextmenu", onContextMenu);

	document.body.addEventListener("click", e => toggleOpen(false));

	// FIXME: may cause two consecutive builds
	pubsub.subscribe("subscriptions-changed", build);
	pubsub.subscribe("categories-changed", build);

	pubsub.subscribe("counters-updated", syncCounters);
}

export function toggleOpen(force?: boolean) {
	document.body.classList.toggle("nav-open", force);
}

async function build() {
	html.clear(scroll);

	items = [];

	let list: HTMLElement;
	list = html.node("ul", {}, "", scroll);

	let allItem = new AllItem();
	list.appendChild(allItem.node);

	list.appendChild((new ReadLaterItem()).node);

	if (subscriptions.list().some(s => s.favorite)) {
		buildFavorites();
	}

	html.node("h3", {}, "Folders", scroll);
	categories.list().forEach(c => buildCategory(c));

	html.node("h3", {}, "Feeds", scroll);
	list = html.node("ul", {}, "", scroll);
	subscriptions.list()
		.filter(s => !s.category_id)
		.forEach(s => list.appendChild(new SubscriptionItem(s).node));

	syncCounters();
	select(allItem);
}

function buildHeader() {
	let node = document.querySelector("nav header") as HTMLElement;

	let logo = html.node("a", {id:"logo", href:"/"}, "", node);
	html.icon("rss", "", logo);

	let addBtn = html.button({icon: "plus", title: "Add feed"}, "", node);
	addBtn.addEventListener("click", e => SubscriptionForm.open());

	let themeBtn = html.button({className:"theme", title: "Set theme"}, "", node);
	themeBtn.append(html.icon("circle-half"), html.icon("sun-fill"), html.icon("moon-fill"));
	themeBtn.addEventListener("click", e => {
		e.stopPropagation();
		showThemeMenu(themeBtn);
	});

	let settingsBtn = html.button({icon: "gear-fill", title: "Settings"}, "", node);
	settingsBtn.addEventListener("click", e => openSettings());
}

function buildFavorites() {
	html.node("h3", {}, "Favorites", scroll);
	subscriptions.list().filter(s => s.favorite).forEach(s => {
		scroll.appendChild(new SubscriptionItem(s).node);
	});
}

function buildCategory(category: Category) {
	let list = html.node("ul", {}, "", scroll);
	let item = new CategoryItem(category);

	list.appendChild(item.node);
	items.push(item);

	subscriptions.list()
		.filter(s => s.category_id == category.id)
		.forEach(s => list.appendChild(new SubscriptionItem(s).node));
}

function select(item: Item) {
	node.querySelector(`.${SELECTED_CSS_CLASS}`)?.classList.remove(SELECTED_CSS_CLASS);
	item.node.classList.add(SELECTED_CSS_CLASS);
	selected = item;
	articles.clear();
	toggleOpen(false);
}

function syncCounters() {
	items.forEach(i => i.syncCounter());
}

abstract class Item {
	node!: HTMLLIElement;
	protected _data: HasTitle;
	protected counter!: HTMLElement;

	constructor(data: HasTitle) {
		this._data = data;

		this.build();
		this.syncCounter();

		items.push(this);
	}

	get data() {
		return this._data;
	}

	protected build() {
		let node = html.node("li");
		let counter = html.node("span", {className: "count"});

		node.appendChild(html.node("span", {className: "title"}, this.data.title));
		node.appendChild(counter)

		this.node = node;
		this.counter = counter;
	}

	abstract get icon(): HTMLElement | SVGElement;
	abstract get unreadCount(): number;
	abstract syncCounter(): void;
}

export class AllItem extends Item {

	constructor() {
		super({title: "All articles"});
	}

	get icon() {
		return html.icon("stack");
	}

	get unreadCount() {
		return counters.sum();
	}

	syncCounter() {
		html.clear(this.counter);
		let count = this.unreadCount;
		count && this.counter.appendChild(html.text(`${count}`));
	}

	protected build() {
		super.build();
		this.node.insertAdjacentElement("afterbegin", this.icon);
	}
}

export class ReadLaterItem extends Item {

	constructor() {
		super({title: "Read later"});
	}

	get icon() {
		return html.icon("bookmark-fill");
	}

	get unreadCount() {
		return 0;
	}

	syncCounter() {}

	protected build() {
		super.build();
		this.node.insertAdjacentElement("afterbegin", this.icon);
	}
}

export class CategoryItem extends Item {
	protected opener!: HTMLButtonElement;

	get data() {
		return super.data as Category;
	}

	get icon() {
		return html.icon("folder-fill");
	}

	get unreadCount() {
		return subscriptions.list()
			.filter(s => s.category_id == this.data.id)
			.reduce((total, s) => total + (counters.get(s.id) || 0), 0);
	}

	syncCounter() {
		html.clear(this.counter);
		let count = this.unreadCount;
		count && this.counter.appendChild(html.text(`${count}`));
	}

	protected build() {
		super.build();

		this.opener = html.button({icon: "chevron-down", className: "plain btn-chevron"});
		this.opener.addEventListener("click", e => {
			e.stopPropagation();
			this.toggle();
		});

		this.node.classList.add("category");
		this.node.insertAdjacentElement("afterbegin", this.opener);

		if (settings.getItem("collapsedCategories").includes(this.data.id)) {
			this.toggle(true);
		}
	}

	protected toggle(force?: boolean) {
		this.node.classList.toggle(COLLAPSED_CSS_CLASS, force);

		let data = settings.getItem("collapsedCategories");
		if (this.node.classList.contains(COLLAPSED_CSS_CLASS)) {
			data.push(this.data.id);
		} else {
			data = data.filter(id => id != this.data.id);
		}
		settings.setItem("collapsedCategories", data);
	}
}

export class SubscriptionItem extends Item {
	get data() {
		return super.data as Subscription;
	}

	get icon() {
		return subscriptionIcon(this.data);
	}

	get unreadCount() {
		return counters.get(this.data.id) || 0;
	}

	syncCounter() {
		html.clear(this.counter);
		let count = this.unreadCount;
		count && this.counter.appendChild(html.text(`${count}`));
	}

	protected build() {
		super.build();
		this.node.insertAdjacentElement("afterbegin", this.icon);
	}
}

function findItem(e: Event) {
	let itemNode: HTMLElement | null = (e.target as HTMLElement).closest("li");
	if (!itemNode) { return; }
	return items.find(item => item.node == itemNode);
}

function onClick(e: Event) {
	e.stopPropagation();
	let item = findItem(e);
	item && select(item);
}

function onContextMenu(e: MouseEvent) {
	e.preventDefault();
	let item = findItem(e);
	item && showContextMenu(item, e);
}

function showContextMenu(item: Item, e: MouseEvent) {
	let menu = new PopupMenu();

	if (item instanceof AllItem) {
		menu.addItem("Mark as read", "check-all", () => articles.markRead());
	}

	if (item instanceof CategoryItem) {
		menu.addItem("Mark as read", "check-all", () => categories.markRead(item.data.id));
		menu.addItem("Edit category", "pencil", () => CategoryForm.open(item.data));
		menu.addItem("Delete category", "trash", () => deleteCategory(item.data));
	}

	if (item instanceof SubscriptionItem) {
		menu.addItem("Mark as read", "check-all", () => subscriptions.markRead(item.data.id));
		menu.addItem(`${item.data.favorite ? "Remove from" : "Add to"} favorites`, item.data.favorite ? "heart-fill" : "heart", () => subscriptions.edit(item.data.id, {favorite: !item.data.favorite}))
		menu.addItem("Edit subscription", "pencil", () => SubscriptionForm.open(item.data));
		menu.addItem("Unsubscribe", "trash", () => deleteSubscription(item.data));
	}

	menu.open(item.node, "below", [
		e.clientX - item.node.getBoundingClientRect().left + 8,
		e.clientY - item.node.getBoundingClientRect().bottom + 8
	]);
}

function showThemeMenu(node: HTMLElement) {
	let menu = new PopupMenu();
	menu.addItem("OS Default", "circle-half", () => settings.setItem("theme", "system"));
	menu.addItem("Light", "sun-fill", () => settings.setItem("theme", "light"));
	menu.addItem("Dark", "moon-fill", () => settings.setItem("theme", "dark"));
	menu.open(node, "side", [-8, 8]);
}


async function deleteCategory(category: Category) {
	if (await confirm(`Delete category ${category.title}? Any nested subscriptions will be moved to uncategorized.`)) {
		categories.remove(category.id);
	}
}

async function deleteSubscription(subscription: Subscription) {
	if (await confirm(`Unsubscribe from ${subscription.title}?`)) {
		subscriptions.remove(subscription.id);
	}
}
