module.exports = function(config) {
	var deps = "@(extend|xhrpromise)";
	var cfg = {
		basePath: '../..'
		, logLevel: 'DEBUG'
		, frameworks: ["jasmine-ajax", "jasmine", "commonjs"]
		, files: ["src/test/spec/*Spec.js", {pattern: "src/main/js/*.js", included: true}, 
				{pattern: "node_modules/" + deps + "/*.js", included: true, watched: false}, 
				{pattern: "node_modules/" + deps + "/**/*", included: false, watched: false}]
		, preprocessors: {
			"**/*Spec.js": ["commonjs"]
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
	};
	cfg.preprocessors["node_modules/" + deps + "/**/*.js"] =  ["commonjs"];
	config.set(cfg);
};
