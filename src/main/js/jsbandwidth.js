if (typeof angular != "undefined") {
	angular.module("jsBandwidth", ["ng"])
			.factory("jsBandwidth", ["$http", function($http) {
				return new JsBandwidth();
			}])
			.controller("JsBandwidthController", [ '$scope', "jsBandwidth", function($scope, jsBandwidth) {
				var MEGABIT = 1000000;
				$scope.convertToMbps = function(x) {
					return x < 0 || isNaN(x) ? x : Math.floor((x / MEGABIT) * 100) / 100;
				};

				$scope.start = function() {
					$scope.result = $scope.error = null;
					$scope.isRunning = true;
					$scope.test = jsBandwidth.testSpeed($scope.options);
					$scope.test.then(function(result) {
								$scope.result = result;
								$scope.isRunning = false;
								$scope.$emit("complete", result);
							}
							, function(error) {
								$scope.error = error;
								$scope.isRunning = false;
								$scope.$emit("error", error);
							});
				};

				$scope.cancel = function() {
					$scope.test.cancel();
				};
			}]);
}

var extend = (typeof jQuery != "undefined" ? jQuery.extend : (typeof angular != "undefined" ? angular.extend : require("extend")));

var XHRPromise = {get: function(options) {
	var xhr = new XMLHttpRequest();
	var p = new Promise(function(resolve, reject) {
		xhr.open(options.method, options.url);
		for (var h in options.headers) {
			if (options.headers.hasOwnProperty(h)) {
				xhr.setRequestHeader(h, options.headers[h]);
			}
		}
		xhr.onload = function () {
			if (this.readyState != 4) {
				return;
			}
			if (this.status >= 200 && this.status < 300) {
				resolve(this.responseText);
			} else {
				reject({
				  status: this.status,
				  statusText: this.statusText
				});
			}
		};
		xhr.onreadystatechange = function() {
			if (this.status == 0) {
				reject(REJECT_RESPONSE);
			};
		};
		xhr.onerror = function () {
			reject({
				status: this.status,
				statusText: this.statusText
			});
		};
		xhr.onabort = function () {
			reject(REJECT_RESPONSE);
		};
		xhr.send();
	});
	p.xhr = xhr;
	p.abort = p.cancel = function() {
		p.xhr.abort();
	};
	p.xhr.send();
	return p;
}};

var REJECT_RESPONSE = {
			status: -1,
			statusText: "Canceled"
		};

/**
 * Creates a new js bandwidth tester.
 * @param options the options
 */
var JsBandwidth = function(options) {
	var self = this;
	this.options = extend({}, this.DEFAULT_OPTIONS, options);
};

/**
 * The default options 
 */
JsBandwidth.DEFAULT_OPTIONS = JsBandwidth.prototype.DEFAULT_OPTIONS = {
	latencyTestUrl: "/test"
	, downloadUrl: "/test.bin"
	, uploadUrl: "/post"
	, uploadDataSize: 5 * 1024 * 1024
	, uploadDataMaxSize: Number.MAX_VALUE
};

/**
 * Calculates the bandwidth in bps (bits per second)
 * @param size the size in bytes to be transfered
 * @param startTime the time when the transfer started. The end time is 
 * considered to be now.
 */
JsBandwidth.prototype.calculateBandwidth = function(size, start) {
	return (size * 8) / ((new Date().getTime() - start) / 1000);
};


JsBandwidth.prototype.testDownloadSpeed = function(options) {
	var self = this;
	options = extend({}, this.options, options);
	var start = new Date().getTime();
	var r = XHRPromise.get({
			method: "GET",
			url: options.downloadUrl + "?id=" + start,
			dataType: 'application/octet-stream',
			headers: {'Content-type': 'application/octet-stream'}});
	var r1 = r.then( 
			function(response) {
				return {downloadSpeed: self.calculateBandwidth((response.data || response).length, start), data: response.data || response};
			});
	r1.cancel = r.cancel;
	return r1;
};

var truncate = function(data, maxSize) {
	if (maxSize === undefined) {
		return;
	}
	if (data.length > maxSize) {
		if (data.substring) {
			data = data.substring(0, maxSize);
		} else {
			data.length = maxSize;
		}
	}
	return data;
}

JsBandwidth.prototype.testUploadSpeed = function(options) {
	var self = this;
	options = extend({}, this.options, options);
	// generate randomly the upload data
	if (!options.uploadData) {
		options.uploadData = new Array(Math.min(options.uploadDataSize, options.uploadDataMaxSize));
		for (var i = 0; i < options.uploadData.length; i++) {
			options.uploadData[i] = Math.floor(Math.random() * 256);
		}
	} else {
		options.uploadData = truncate(options.uploadData, options.uploadDataMaxSize);
	}
	var start = new Date().getTime();
	var r = XHRPromise.get({
			method: "POST",
			url: options.uploadUrl + "?id=" + start,
			data: options.uploadData,
			dataType: 'application/octet-stream',
			headers: {'Content-type': 'application/octet-stream'}});
	var r1 = r.then(
			function(response) {
				return {uploadSpeed: self.calculateBandwidth(options.uploadData.length, start)};
			});
	r1.cancel = r.cancel;
	return r1;
};

JsBandwidth.prototype.testLatency = function(options) {
	var self = this;
	options = extend({}, this.options, options);
	options.latencyTestUrl = options.latencyTestUrl || options.downloadUrl;
	var start = new Date().getTime();
	var r = XHRPromise.get({
			method: "HEAD",
			url: options.latencyTestUrl + "?id=" + start,
			dataType: 'application/octet-stream',
			headers: {'Content-type': 'application/octet-stream'}});
	var r1 = r.then(
			function(response) {
				// time divided by 2 because of 3-way TCP handshake
				return {latency: (new Date().getTime() - start) / 2};
			});
	r1.cancel = r.cancel;
	return r1;
};

JsBandwidth.prototype.testSpeed = function(options) {
	var self = this;
	var r;
	r = self.testLatency(options);
	var r1 = r.then(
			function(latencyResult) {	
				r = self.testDownloadSpeed(options);
				var r1 = r.then(
						function(downloadResult) {
							options.uploadData = downloadResult.data;
							r = self.testUploadSpeed(options);
							var r1 = r.then(
									function(uploadResult) {
										return {latency: latencyResult.latency, 
												downloadSpeed: downloadResult.downloadSpeed, 
												uploadSpeed: uploadResult.uploadSpeed};
									}
									);
							r1.cancel = r.cancel;
							return r1;
						}
						);
				r1.cancel = r.cancel;
				return r1;
			});
	r1.cancel = r.cancel;
	return r1;
};

if (typeof module !== "undefined") {
	module.exports = JsBandwidth;
}

