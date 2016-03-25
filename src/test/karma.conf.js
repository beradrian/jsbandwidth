module.exports = function(config) {
	config.set({
		basePath: '../..'
		, logLevel: 'DEBUG'
		, frameworks: ["jasmine-ajax", "jasmine", "commonjs"]
		, files: ["src/test/spec/*Spec.js", {pattern: "src/main/js/*.js", included: true}, 
		  		{pattern: "node_modules/extend/**/*.js", included: true, watched: false}, {pattern: "node_modules/extend/**/*", included: false, watched: false}]
		, preprocessors: {
			"**/*Spec.js": ["commonjs"]
			, "node_modules/extend/**/*.js": ["commonjs"]
			, "src/main/js/*.js": ["babel", "commonjs"]
		}
		, browsers: ["Chrome", "Firefox"]
		, singleRun: true
		, browserify: {
			debug: true,
			transform: [["babelify", { "presets": ["es2015"], "plugins": ["babel-plugin-add-module-exports"] }]]
		}
		, babelPreprocessor: {
			options: {
				presets: ['es2015']
				, plugins: ["babel-plugin-add-module-exports"]
			}
		}
	});
};
