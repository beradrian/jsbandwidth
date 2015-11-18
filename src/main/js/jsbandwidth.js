var jqLite;

if (typeof jQuery != "undefined") {
	jqLite = jQuery;
} else if (typeof angular != "undefined") {
	jqLite = angular.element;
	jqLite.extend = angular.extend;
}


if (typeof angular != "undefined") {
	angular.module("jsBandwidth", ["ng"])
			.factory("jsBandwidth", ["$http", function($http) {
				return new JsBandwidth({ajax: $http});
			}])
			.controller("JsBandwidthController", [ '$scope', "jsBandwidth", function($scope, jsBandwidth) {
				$scope.options = {downloadUrl: "/test.bin", uploadUrl: "/post"};

				var MEGABIT = 1000000;
				$scope.convertToMbps = function(x) {
					return x < 0 || isNaN(x) ? x : Math.floor((x / MEGABIT) * 100) / 100;
				};

				$scope.start = function() {
					$scope.result = $scope.error = null;
					$scope.test = jsBandwidth.testSpeed($scope.options);
					$scope.test.then(function(result) {
								$scope.result = result;
								$scope.$emit("complete", result);
							}
							, function(error) {
								$scope.error = error;
								$scope.$emit("error", error);
							});
				};

				$scope.cancel = function() {
					$scope.test.cancel();
				};
			}]);
}

if (typeof jQuery != "undefined") {
	jQuery.jsBandwidth = JsBandwidth;
}

if (typeof angular === "undefined" && typeof angular === "undefined") {
 	throw "Either Angular or jQuery is mandatory for JsBandwidth";
}

/**
 * Creates a new js bandwidth tester.
 * @param options the options
 */
var JsBandwidth = function(options) {
	var self = this;
	this.options = jqLite.extend({}, this.DEFAULT_OPTIONS, options);
	
	// if we don't have an AJAX service amongst options
	if (!this.options.ajax) {
		if (typeof jQuery != "undefined") {
			this.options._ajax = jQuery.ajax;
		} else if (typeof angular != "undefined") {
			angular.injector(["ng"]).invoke(function($http) {
				self.options._ajax = $http;
			});
		}
	} else {
		this.options._ajax = this.options.ajax;
	}

	// wrap the ajax service, so that we can provide the cancel method to the promise
	var ajax;
	if (typeof jQuery != "undefined" && this.options._ajax === jQuery.ajax) {
		ajax = function() {
			var r = self.options._ajax.apply(this, arguments);
			r.cancel = r.abort;
			return r;
		}
	} else if (typeof angular != "undefined") {
		angular.injector(["ng"]).invoke(function($http, $q) {
			ajax = function(options) {
				var canceler = $q.defer();
				options.timeout = canceler.promise;
				var r = self.options._ajax(options);
				r.cancel = r.abort = function() {
					canceler.resolve("canceled");
				};
				return r;
			};
		});
	}
	this.options.ajax = ajax;
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
	options = jqLite.extend({}, this.options, options);
	var start = new Date().getTime();
	var r = options.ajax({
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
	options = jqLite.extend({}, this.options, options);
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
	var r = options.ajax({
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
	options = jqLite.extend({}, this.options, options);
	var start = new Date().getTime();
	var r = options.ajax({
			method: "HEAD",
			url: options.latencyTestUrl + "?id=" + start,
			dataType: 'application/octet-stream',
			headers: {'Content-type': 'application/octet-stream'}});
	var r1 = r.then(
			function(response) {
				return {latency: new Date().getTime() - start};
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

if (typeof module === "undefined") {
	module = {};
}
module.exports = new JsBandwidth();

