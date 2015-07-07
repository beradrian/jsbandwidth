var testApp = angular.module('JsBandwidthTestApp', ["jsBandwidth"]);
/*
testApp.config(function($provide) {
    $provide.decorator('$httpBackend', function($delegate) {
        var proxy = function(method, url, data, callback, headers) {
            var interceptor = function() {
                var _this = this,
                    _arguments = arguments;
                setTimeout(function() {
                    callback.apply(_this, _arguments);
                }, 1000);
            };
            return $delegate.call(this, method, url, data, interceptor, headers);
        };
        for(var key in $delegate) {
            proxy[key] = $delegate[key];
        }
        return proxy;
    });
});
*/

var prefix = "http://localhost:8081/";

testApp.controller('JsBandwidthTestController', ["$scope", "jsBandwidth", function ($scope, jsBandwidth) {
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

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('JsBandwidthTestController', function() {
	var $httpBackend, $rootScope, createController, jsBandwidth;

	// Set up the module
	beforeEach(module('JsBandwidthTestApp'));

	beforeEach(inject(function($injector) {
		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');
		// Get hold of a scope (i.e. the root scope)
		$rootScope = $injector.get('$rootScope');
		jsBandwidth = $injector.get('jsBandwidth');
		// The $controller service is used to create instances of controllers
		var $controller = $injector.get('$controller');
		createController = function() {
			return $controller('JsBandwidthTestController', {'$scope' : $rootScope });
		};
	}));

	afterEach(function() {
         $httpBackend.verifyNoOutstandingExpectation();
         $httpBackend.verifyNoOutstandingRequest();
	});

	it('should get net speed', function(done) {
		var dataSize = 1000000;
		var data = new Array(dataSize);
		for (var i = 0; i < data.length; i++) {
			data[i] = Math.floor(Math.random() * 256);
		}
		$httpBackend.when('GET', /(.+\/)?test\.bin(\?.+)?/).respond(200, data, {"Access-Control-Allow-Origin": "*"});
		$httpBackend.when('POST', /(.+\/)?post(\?.+)?/).respond(200, '', {"Access-Control-Allow-Origin": "*"});
		createController();
		$rootScope.test({downloadUrl: prefix + "test.bin", uploadUrl: prefix + "post"}, function() {
			expect($rootScope.downloadSpeed).toBeLessThan(1000000);
			done();
		});
		setTimeout(function() {
			$httpBackend.flush();
		}, (dataSize / 1000000 * 8) * 1000 + 100);
	});

	it('should get error', function() {
		$httpBackend.when('GET', /(.+\/)?test\.binx(\?.+)?/).respond(404, '', {"Access-Control-Allow-Origin": "*"});
		createController();
		$rootScope.test({downloadUrl: prefix + "test.binx", uploadUrl: prefix + "post"}, function() {
			expect($rootScope.errorStatus).toEqual(404);
		});
		$httpBackend.flush();
	});
});
