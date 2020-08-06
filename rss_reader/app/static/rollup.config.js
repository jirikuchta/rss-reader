import includePaths from "rollup-plugin-includepaths";

export default {
	input: "src/js/.build/app.js",
	output: { file: "dist/js/app.js" },
	plugins: [includePaths({paths: ["src/js/.build/"]})]
}
