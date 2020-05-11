import { alert } from "ui/widget/dialog";

type METHODS = "GET" | "POST" | "PATCH" | "DELETE";

export async function api(method: METHODS, uri: string, data: any = null) {
	try {
		let init: RequestInit = {method: method};
		if (data) {
			init.body = JSON.stringify(data),
			init.headers = {"Content-Type": "application/json"};
		}
		let res = await fetch(uri, init);
		return await res.json();
	} catch(e) {
		alert(e);
	}
}
