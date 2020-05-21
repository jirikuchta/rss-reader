type METHODS = "GET" | "POST" | "PATCH" | "DELETE";

export interface ErrorData {
	code: string;
	field?: string;
	[key: string]: any;
}

export interface ApiResponse {
	ok: boolean;
	data?: any;
	error?: ErrorData;
}

export async function api(method: METHODS, uri: string, data: any = null) {
	let init: RequestInit = {method: method};

	if (data) {
		init.body = JSON.stringify(data);
		init.headers = new Headers({"Content-Type": "application/json"});
	}

	let res = await fetch(uri, init);
	let body = res.status != 204 ? await res.json() : null;

	return <ApiResponse> {
		ok: res.ok,
		[res.ok ? "data" : "error"]: res.ok ? body : body["error"]
	};
}
