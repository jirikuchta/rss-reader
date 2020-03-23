export async function api(uri: string, init?: RequestInit) {
	try {
		let res = await fetch(uri, init);
		if (!res.ok) { throw Error(`${res.status} ${res.statusText}`); }
		return await res.json();
	} catch(e) {
		alert(e);
	}
}
