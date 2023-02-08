import { Settings } from "data/types";
import * as pubsub from "util/pubsub";

const DEFAULTS: Settings = {
	navWidth: 15,
	listWidth: 30,
	collapsedCategories: [],
	unreadOnly: true,
	markAsReadOnScroll: true,
	showImages: true
}

export function init() {
	let key: keyof Settings;
	for (key in DEFAULTS) {
		localStorage.getItem(key) === null && setItem(key, DEFAULTS[key]!);
	}
}

export function getItem<K extends keyof Settings>(key: K) {
	let data = localStorage.getItem(key);
	return (JSON.parse(data!) as Settings[K]);
}

export function setItem<K extends keyof Settings>(key: K, value: NonNullable<Settings[K]>) {
	localStorage.setItem(key, JSON.stringify(value));
	pubsub.publish("settings-changed", key);
}

export function removeItem<K extends keyof Settings>(key: K) {
	localStorage.removeItem(key);
}
