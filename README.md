# JSBandwidth

To test inside a browser the bandwidth, there's no easy way. This is what JsBandwidth tries to achieve.

This project was initially forked from https://code.google.com/p/jsbandwidth/.

## Set up
1. Set up a web server of your choice.
2. Depending on your web server, drop the corresponding project files in your web server's document root (or a sub-directory, if you wish). What `src/main/webapp/post.*` file to choose depends on your web server. The upload test needs to be able to send a POST request to the server. The receiving page doesn't have to do anything with the data. However, some servers will not allow you to send a POST request to a .htm file. Therefore, the project includes several blank server side script files (post.aspx, post.php, post.pl). `src/main/webapp/test.bin` is mandatory, but it's nothing more than random bytes. 

### Spring Controller

If you want to use a Spring Controller to post test data you can define a controller method like this

	@RequestMapping("/test-post")
	public @ResponseBody String testPost() {
		return "true";
	}
	
and then specify `options.uploadUrl='/test-post'`.

Please be aware that some servers, like Tomcat, by their default setup can impose a limit on the upload data size to avoid DoS attacks. You either modify that setup or specify `options.uploadDataMaxSize`.

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
- `uploadDataMaxSize` if specified `uploadData` is going to be truncated to this maximum length. Some servers, like Tomcat, by their default setup can impose a limit on the upload data size to avoid DoS attacks. You either modify that setting or use `options.uploadDataMaxSize`. The usual limit is 2Mb.
- `uploadDataSize` if `uploadData` is not specified, then a chunk of this size is randomly generated instead

All three methods return a [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) and you can use the `then` method. That promise is also augmented with a `cancel()` method.

### Example

	var jsBandwidth = require("jsbandwidth");
	jsBandwidth.testSpeed(options)
		.then(function (result) {
				console.log("Download speed is " + result.downloadSpeed + "bps and upload speed is " result.uploadSpeed + "bps");
			},
			function(error) {
				console.log("An error occured during net speed test.");
			});

### Angular controller			
An Angular controller, called `JsBandwidthController`, is provided for your convenience. The controller uses the service and it defines the following fields/methods in the scope
- `test` this is the service running the speed test. If null or undefined, there's no test currently running, so it can be used for checking if a speed test is currently running.
- `options` the options used to run the speed test
- `downloadSpeed` the estimated download speed in bps. If null, the test is in progress. If negative or 0, then an error occured.
- `downloadSpeedInMbps` the estimated download speed in Mbps. If null, the test is in progress. If negative or 0, then an error occured.
- `uploadSpeed` the estimated upload speed in bps. If null, the test is in progress. If negative or 0, then an error occured.
- `uploadSpeedInMbps` the estimated upload speed in Mbps. If null, the test is in progress. If negative or 0, then an error occured.
- `errorStatus` if null or undefined, then a test is in progress or completed successfully. If not null, then an error occured during the last speed test.
- `oncomplete` a function called after the test is completed.

Below is an example on how to use it in your page:

	<div data-ng-controller="JsBandwidthController" class="netSpeedTest"
			data-ng-init="options.downloadUrl='/test.bin'; options.uploadUrl='/post'">
		<span data-ng-if="errorStatus != null">
			<span th:text="#{Error}">Error</span>
			: <span data-ng-bind="errorStatus"></span>
		</span>
		<span data-ng-if="downloadSpeedInMbps > 0">
			<span th:text="#{Speed.download}">Download speed:</span>
			<span data-ng-bind="downloadSpeedInMbps"></span><span th:text="#{Mbps}"></span>
			<span th:text="#{Speed.upload}">Upload speed</span>
			<span data-ng-bind="uploadSpeedInMbps"></span><span th:text="#{Mbps}"></span>
		</span>
		<button th:text="#{Speed.test.start}" data-ng-if="!test" data-ng-click="start()" class="start">Start test</button>
		<button th:text="#{Speed.test.cancel}" data-ng-if="test" data-ng-click="cancel()" class="cancel">Cancel test</button>
	</div>

### Formatting
The speed is calculated in bps (bits per second). If you want to format it differently, please use [js-quantities](https://github.com/gentooboontoo/js-quantities). If it doesn't support yet memory speed units, then use this [fork](https://github.com/beradrian/js-quantities/tree/memory-speed-units).
