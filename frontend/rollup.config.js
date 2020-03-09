import typescript from "@rollup/plugin-typescript";

export default {
	input: "src/js/app.ts",
	output: { file: "public/js/app.js" },
	plugins: [
		typescript({
			"baseUrl": "src/js",
			"target": "ES2018",
			"incremental": true
		})
	]
}
