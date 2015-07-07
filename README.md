# JSBandwidth

To test inside a browser the bandwidth, there's no easy way. This is what JsBandwidth tries to achieve.

This project was initially forked from https://code.google.com/p/jsbandwidth/.

## Set up
1. Set up a web server of your choice.
2. Depending on your web server, drop the corresponding project files in your web server's document root (or a sub-directory, if you wish). What `src/main/webapp/post.*` file to choose depends on your web server. The upload test needs to be able to send a POST request to the server. The receiving page doesn't have to do anything with the data. However, some servers will not allow you to send a POST request to a .htm file. Therefore, the project includes several blank server side script files (post.aspx, post.php, post.pl). `src/main/webapp/test.bin` is mandatory, but it's nothing more than random bytes. 

### Spring Controller

### Testing
To run the unit tests follow the below steps:

1. Install `http-server`: `npm install -g http-server`
2. Start web server in the main directory: `http-server -p 8081 .`
3. Visit `http://localhost:8081/src/test/test.html`

## JavaScript API
The JavaScript API works with both Angular and jQuery, depending on what library is included (if both, Angular is preferred).

First you need to get hold of the `jsBandwidth` object.

- In Angular

<pre><code>
myApp.controller('JsBandwidthTestController', ["$scope", "jsBandwidth", function ($scope, jsBandwidth) {
	$scope.test = function(options, callback) {
		jsBandwidth.testSpeed(options)
				.then(function(result) {
						$scope.downloadSpeed = result.downloadSpeed;
						$scope.uploadSpeed = result.uploadSpeed;
						$scope.errorStatus = null;
						callback();
					}
					, function(error) {
						$scope.downloadSpeed = -1;
						$scope.uploadSpeed = -1;
						$scope.errorStatus = error.status;
						callback();
					});
	};
}]);
</code></pre>

- In jQuery

<pre><code>
	var jsBandwidth = $.jsBandwidth;
</code></pre>

or 

<pre><code>
	var jsBandwidth = jQuery.jsBandwidth;
</code></pre>

- With require

<pre><code>
	var jsBandwidth = require("jsbandwidth");
</code></pre>

The `jsBandwidth` object has 3 methods with a similar signature:
- `testSpeed(options)`
- `testDownloadSpeed(options)`
- `testUploadSpeed(options)`

The `options` parameter is an object and it has the following fields
- `downloadUrl` the download URL used for testing. Usually a big binary content is expected to be downloaded.
- `uploadUrl` the upload URL used for testing. It should accept a POST method.
- `uploadData` the data that is sent to the server to test the upload
- `uploadDataSize` if `uploadData` is not specified, then a chunk of this size is randomly generated

All three methods return a [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) and you can use the `then` method.

### Example

	var jsBandwidth = require("jsbandwidth");
	jsBandwidth.testSpeed(options)
		.then(function (result) {
				console.log("Download speed is " + result.downloadSpeed + "bps and upload speed is " result.uploadSpeed + "bps");
			},
			function(error) {
				console.log("An error occured during net speed test.");
			});

### Formatting
The speed is calculated in bps (bits per second). If you want to format it differently, please use [js-quantities](https://github.com/gentooboontoo/js-quantities). If it doesn't support yet memory speed units, then use this [fork](https://github.com/beradrian/js-quantities/tree/memory-speed-units).
