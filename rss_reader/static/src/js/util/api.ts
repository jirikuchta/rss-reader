type METHODS = "GET" | "POST" | "PATCH" | "DELETE";

export interface ClientError {
	code: string;
	field?: string;
	[key: string]: any;
}

export interface ApiResponse {
	ok: boolean;
	data?: any;
	error?: ClientError;
}

export async function api(method: METHODS, uri: string, data: any = null) {
	let init: RequestInit = {method: method};

	if (data) {
		init.body = JSON.stringify(data);
		init.headers = new Headers({"Content-Type": "application/json"});
	}

	let res = await fetch(uri, init);
	let body = await res.json();

	return <ApiResponse> {
		ok: res.ok,
		[res.ok ? "data" : "error"]: res.ok ? body : body["error"]
	};
}
