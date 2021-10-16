import { Settings } from "data/types";


export function getItem<K extends keyof Settings>(key: K) {
	let data = localStorage.getItem(key);
	if (data) { return (JSON.parse(data) as Settings[K]); }
}

export function setItem<K extends keyof Settings>(key: K, value: NonNullable<Settings[K]>) {
	localStorage.setItem(key, JSON.stringify(value));
}

export function removeItem<K extends keyof Settings>(key: K) {
	localStorage.removeItem(key);
}
