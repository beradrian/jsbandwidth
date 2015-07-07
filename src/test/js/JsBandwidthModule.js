var JsBandwidthModule = angular.module("JsBandwidthModule", ["jsBandwidth"]);
JsBandwidthModule.controller("JsBandwidthController", [ '$scope', "jsBandwidth", function($scope, jsBandwidth) {
	$scope.options = {downloadUrl: "test.bin", uploadUrl: "post"};
	
	var convertToMbps = function(x) {
		return Qty.parse(x + " bps").to("Mbps").toPrec(0.01).scalar;
	};
	
	$scope.start = function() {
		jsBandwidth.testSpeed($scope.options)
				.then(function(result) {
						$scope.downloadSpeed = result.downloadSpeed;
						$scope.downloadSpeedMbps = convertToMbps(result.downloadSpeed);
						$scope.uploadSpeed = result.uploadSpeed;
						$scope.uploadSpeedMbps = convertToMbps(result.uploadSpeed);
						$scope.errorStatus = null;
						if ($scope.oncomplete) {
							$scope.oncomplete();
						}
					}
					, function(error) {
						$scope.downloadSpeed = -1;
						$scope.downloadSpeedMbps = -1;
						$scope.uploadSpeed = -1;
						$scope.uploadSpeedMbps = -1;
						$scope.errorStatus = error.status;
						if ($scope.oncomplete) {
							$scope.oncomplete();
						}
					});
	};
}]);