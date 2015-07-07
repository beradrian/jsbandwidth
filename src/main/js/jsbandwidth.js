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
					self.ajax = $http;			
					return self;
				}]);
	} else if (jQuery) {
		this.extend = jQuery.extend;
		this.deferredConstructor = jQuery.Deferred;
		this.ajax = jQuery.ajax;
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
	this.ajax({
			method: "GET",
			url: options.downloadUrl + "?id=" + start,
			dataType: 'application/octet-stream',
			headers: {'Content-type': 'application/octet-stream'}})
			.then(
				function(response) {
					deferred.resolve({downloadSpeed: self.calculateBandwidth((response.data || response).length, start), data: response.data || response});
				},
				function(response) {
					deferred.reject(response.error || response);
				}
			);
	return deferred.promise;
};

JsBandwidth.prototype.testUploadSpeed = function(options) {
	var self = this;
	options = this.extend({}, this.DEFAULT_OPTIONS, options);
	// generate randomly the upload data
	if (!options.uploadData) {
		options.uploadData = new Array(options.uploadDataSize);
		for (var i = 0; i < options.uploadData.length; i++) {
			options.uploadData[i] = Math.floor(Math.random() * 256);
		}
	}
	var deferred = this.deferredConstructor();
	var start = new Date().getTime();
	this.ajax({
			method: "POST",
			url: options.uploadUrl + "?id=" + start,
			data: options.uploadData,
			dataType: 'application/octet-stream',
			headers: {'Content-type': 'application/octet-stream'}})
			.then(
				function(response) {
					deferred.resolve({uploadSpeed: self.calculateBandwidth(options.uploadData.length, start)});
				}
				, function(response) {
					deferred.reject(response.error || response);
				}    
			);
	return deferred.promise;
};

JsBandwidth.prototype.testSpeed = function(options) {
	var self = this;
	var deferred = this.deferredConstructor();
	self.testDownloadSpeed(options)
			.then(function(downloadResult) {
				options.uploadData = downloadResult.data;
				self.testUploadSpeed(options)
						.then(
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

