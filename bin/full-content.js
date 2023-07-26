#!/usr/bin/env node

const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

(async () => {
	const url = process.argv[2];

	const response = await fetch(url);
	const body = await response.text();

	const doc = new JSDOM(body, {url});
	const readability = new Readability(doc.window.document);

	console.log(JSON.stringify(readability.parse()));
})();
