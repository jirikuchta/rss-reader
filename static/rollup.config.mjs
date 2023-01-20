import includePaths from "rollup-plugin-includepaths";
import terser from '@rollup/plugin-terser';

export default {
	input: ".build/app.js",
	output: { file: "app.js" },
	plugins: [
		includePaths({paths: [".build/"]}),
		terser()
	]
}
