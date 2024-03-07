export function date(d: Date | string) {
	if (typeof d === "string") { d = new Date(d); }
	let today = new Date;

	let date_str = d.toLocaleDateString();
	let time_str = d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});

	if (d.getMonth() == today.getMonth() && d.getFullYear() == today.getFullYear()) {
		if (d.getDate() == today.getDate()) { date_str = "today"; }
		if (d.getDate() == today.getDate()-1) { date_str = "yesterday"; }
	}

	return `${date_str} ${time_str}`;
}
