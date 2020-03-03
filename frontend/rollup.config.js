import typescript from "@rollup/plugin-typescript";

export default {
	input: "src/js/app.ts",
	output: { file: "public/js/app.js" },
	plugins: [typescript()]
}
