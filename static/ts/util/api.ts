type METHODS = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export default async function api(method: METHODS, uri: string, data: any = null) {
	let init: RequestInit = {method: method};

	if (data) {
		if (method == "GET") {
			let params = new URLSearchParams();
			Object.keys(data).forEach(k => params.append(k, data[k]));
			uri += `?${params.toString()}`;
		} else {
			init.body = JSON.stringify(data);
			init.headers = new Headers({"Content-Type": "application/json"});
		}
	}

	let res = await fetch(uri, init);
	let body = res.status != 204 ? await res.json() : null;

	return <ApiResponse> {
		ok: res.ok,
		[res.ok ? "data" : "error"]: res.ok ? body : body["error"]
	};
}
