import { alert } from "ui/widget/dialog";

export async function api(uri: string, method: string = "GET", data: any = null) {
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
