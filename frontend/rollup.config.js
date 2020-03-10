import includePaths from "rollup-plugin-includepaths";

export default {
	input: "src/js/.build/app.js",
	output: { file: "public/js/app.js" },
	plugins: [includePaths({paths: ["src/js/.build/"]})]
}
