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

import extend from "extend";
import XhrPromise from "xhrpromise";

export default class JsBandwidth {

	/**
	 * The default options 
	 */
	static get DEFAULT_OPTIONS() {
		return {
				latencyTestUrl: "/test"
				, downloadUrl: "/test.bin"
				, uploadUrl: "/post"
				, uploadDataSize: 5 * 1024 * 1024
				, uploadDataMaxSize: Number.MAX_VALUE
			};
	}

	/**
	 * Calculates the bandwidth in bps (bits per second)
	 * @param size the size in bytes to be transfered
	 * @param startTime the time when the transfer started. The end time is 
	 * considered to be now.
	 */
	static calculateBandwidth(size, start) {
		return (size * 8) / ((new Date().getTime() - start) / 1000);
	}

	static truncate(data, maxSize) {
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

	/**
	 * Creates a new js bandwidth tester.
	 * @param options the options
	 */
	constructor(options) {
		var self = this;
		this.options = extend({}, JsBandwidth.DEFAULT_OPTIONS, options);
	}

	testDownloadSpeed(options) {
		var self = this;
		options = extend({}, this.options, options);
		var start = new Date().getTime();
		var r = XhrPromise.create({
				method: "GET",
				url: options.downloadUrl + "?id=" + start,
				dataType: 'application/octet-stream',
				headers: {'Content-type': 'application/octet-stream'}});
		var r1 = r.then( 
				function(response) {
					return {downloadSpeed: JsBandwidth.calculateBandwidth((response.data || response).length, start), data: response.data || response};
				});
		r1.cancel = r.cancel;
		return r1;
	}

	testUploadSpeed(options) {
		var self = this;
		options = extend({}, this.options, options);
		// generate randomly the upload data
		if (!options.uploadData) {
			options.uploadData = new Array(Math.min(options.uploadDataSize, options.uploadDataMaxSize));
			for (var i = 0; i < options.uploadData.length; i++) {
				options.uploadData[i] = Math.floor(Math.random() * 256);
			}
		} else {
			options.uploadData = JsBandwidth.truncate(options.uploadData, options.uploadDataMaxSize);
		}
		var start = new Date().getTime();
		var r = XhrPromise.create({
				method: "POST",
				url: options.uploadUrl + "?id=" + start,
				data: options.uploadData,
				dataType: 'application/octet-stream',
				headers: {'Content-type': 'application/octet-stream'}});
		var r1 = r.then(
				function(response) {
					return {uploadSpeed: JsBandwidth.calculateBandwidth(options.uploadData.length, start)};
				});
		r1.cancel = r.cancel;
		return r1;
	}

	testLatency(options) {
		var self = this;
		options = extend({}, this.options, options);
		options.latencyTestUrl = options.latencyTestUrl || options.downloadUrl;
		var start = new Date().getTime();
		var r = XhrPromise.create({
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
	}

	testSpeed(options) {
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
	}

}

