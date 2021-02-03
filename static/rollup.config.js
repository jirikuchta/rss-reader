import includePaths from "rollup-plugin-includepaths";

export default {
	input: ".build/app.js",
	output: { file: "app.js" },
	plugins: [includePaths({paths: [".build/"]})]
}
