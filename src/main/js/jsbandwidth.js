var JsBandwidth = function($http) {
	this.DEFAULT_OPTIONS = {
		downloadUrl: ""
		, uploadUrl: ""
		, uploadDataSize: 5 * 1024 * 1024
	};
	
	if (angular) {
		this.extend = angular.extend;
		var self = this;
		angular.module("jsBandwidth", [])
				.factory("jsBandwidth", ["$http", "$q", function($http, $q) {
					self.deferredConstructor = $q.defer;
					self.$http = $http;
					self.ajax = function(options) {
						var canceler = self.deferredConstructor();
						options.timeout = canceler.promise;
						var r = $http(options);
						r.cancel = function() {
							canceler.resolve();	
						};
						return r;
					};
					return self;
				}])
				.controller("JsBandwidthController", [ '$scope', "jsBandwidth", function($scope, jsBandwidth) {
					$scope.options = {downloadUrl: "/test.bin", uploadUrl: "/post"};

					var MEGABIT = 1000000;
					var convertToMbps = function(x) {
						return x < 0 ? x : Math.floor((x / MEGABIT) * 100) / 100;
					};

					var endTest = function(downloadSpeed, uploadSpeed, errorStatus) {
						$scope.downloadSpeed = downloadSpeed;
						$scope.downloadSpeedInMbps = convertToMbps(downloadSpeed);
						$scope.uploadSpeed = uploadSpeed;
						$scope.uploadSpeedInMbps = convertToMbps(uploadSpeed);
						$scope.errorStatus = errorStatus;
						$scope.test = null;
						if ($scope.oncomplete) {
							$scope.oncomplete();
						}
					};

					$scope.start = function() {
						$scope.downloadSpeed = $scope.downloadSpeedInMbps = $scope.uploadSpeed = $scope.uploadSpeedInMbps = $scope.errorStatus = null;
						$scope.test = jsBandwidth.testSpeed($scope.options);
						$scope.test.then(function(result) {
									endTest(result.downloadSpeed, result.uploadSpeed, null);
								}
								, function(error) {
									endTest(-1, -1, error.status);
								});
					};

					$scope.cancel = function() {
						$scope.test.cancel();
					};
				}]);
	} else if (jQuery) {
		this.extend = jQuery.extend;
		this.deferredConstructor = jQuery.Deferred;
		this.ajax = jQuery.ajax;
		this.ajax.cancel = this.ajax.abort;	
		jQuery.jsBandwidth = this;
	} else {
		throw "Either Angular or jQuery is mandatory for JsBandwidth";
	}
};

JsBandwidth.prototype.config = function(options) {
	this.DEFAULT_OPTIONS = options;
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
	options = this.extend({}, this.DEFAULT_OPTIONS, options);
	var deferred = this.deferredConstructor();
	var start = new Date().getTime();
	var r = this.ajax({
			method: "GET",
			url: options.downloadUrl + "?id=" + start,
			dataType: 'application/octet-stream',
			headers: {'Content-type': 'application/octet-stream'}});
	r.then(
			function(response) {
				deferred.resolve({downloadSpeed: self.calculateBandwidth((response.data || response).length, start), data: response.data || response});
			},
			function(response) {
				deferred.reject(response.error || response);
			}
		);
	deferred.promise.cancel = function() {
		r.cancel();
	};
	return deferred.promise;
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
	options = this.extend({}, this.DEFAULT_OPTIONS, options);
	// generate randomly the upload data
	if (!options.uploadData) {
		options.uploadData = new Array(Math.min(options.uploadDataSize, options.uploadDataMaxSize));
		for (var i = 0; i < options.uploadData.length; i++) {
			options.uploadData[i] = Math.floor(Math.random() * 256);
		}
	} else {
		options.uploadData = truncate(options.uploadData, options.uploadDataMaxSize);
	}
	var deferred = this.deferredConstructor();
	var start = new Date().getTime();
	var r = this.ajax({
			method: "POST",
			url: options.uploadUrl + "?id=" + start,
			data: options.uploadData,
			dataType: 'application/octet-stream',
			headers: {'Content-type': 'application/octet-stream'}});
	r.then(
			function(response) {
				deferred.resolve({uploadSpeed: self.calculateBandwidth(options.uploadData.length, start)});
			}
			, function(response) {
				deferred.reject(response.error || response);
			}    
		);
	deferred.promise.cancel = function() {
		r.cancel();
	};
	return deferred.promise;
};

JsBandwidth.prototype.testSpeed = function(options) {
	var self = this;
	var deferred = this.deferredConstructor();
	var r = self.testDownloadSpeed(options);
	deferred.promise.cancel = r.cancel;
	r.then(function(downloadResult) {
				options.uploadData = downloadResult.data;
				r = self.testUploadSpeed(options)
				deferred.promise.cancel = r.cancel;
				r.then(
						function(uploadResult) {
							deferred.resolve({downloadSpeed: downloadResult.downloadSpeed, uploadSpeed: uploadResult.uploadSpeed});
						}
						, function(response) {
							deferred.reject(response.error || response);
						}
					);
				}
				, function(response) {
					deferred.reject(response.error || response);
				}
			);
	return deferred.promise;
};

if (!module) module = {};
module.exports = new JsBandwidth();

