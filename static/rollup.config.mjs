import includePaths from "rollup-plugin-includepaths";

export default {
	input: ".build/app.js",
	output: { file: "dist/app.js" },
	plugins: [includePaths({paths: [".build/"]})]
}
