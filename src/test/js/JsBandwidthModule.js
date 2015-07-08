if (window.require) {
var angular = require("angular");
require('npm-angular-resource')(window, angular);
var Qty = require("js-quantities");
var log4js = require('log4js');
var LOG = log4js.getLogger("JsBandwidth");
}

var JsBandwidthModule = angular.module("JsBandwidthModule", ["jsBandwidth"]);
JsBandwidthModule.controller("JsBandwidthController", [ '$scope', "jsBandwidth", function($scope, jsBandwidth) {
	$scope.options = {downloadUrl: "/test.bin", uploadUrl: "/post"};

	var convertToMbps = function(x) {
		return x < 0 ? x : Qty.parse(x + " bps").to("Mbps").toPrec(0.01).scalar;
	};

	var endTest = function(downloadSpeed, uploadSpeed, errorStatus) {
		$scope.downloadSpeed = downloadSpeed;
		$scope.downloadSpeedMbps = convertToMbps(downloadSpeed);
		$scope.uploadSpeed = uploadSpeed;
		$scope.uploadSpeedMbps = convertToMbps(uploadSpeed);
		$scope.errorStatus = errorStatus;
		$scope.test = null;
		if ($scope.oncomplete) {
			$scope.oncomplete();
		}
		if (LOG) LOG.info("Test speed ended" + (errorStatus ? " with error " + errorStatus : ""));
	};

	$scope.start = function() {
		if (LOG) LOG.info("Starting test speed");
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
