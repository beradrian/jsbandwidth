var testApp = angular.module('JsBandwidthTestApp', ["JsBandwidthModule"]);
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

jasmine.DEFAULT_TIMEOUT_INTERVAL = 11000;

var MEGABIT = 1000000;
var getRandomData = function(size) {
	var dataSize = size ? size : MEGABIT;
	var data = new Array(dataSize);
	for (var i = 0; i < data.length; i++) {
		data[i] = Math.floor(Math.random() * 256);
	}	
	return data;
};

describe('JsBandwidthControllerTest', function() {
	var $httpBackend, $rootScope, createController;

	// Set up the module
	beforeEach(module('JsBandwidthTestApp'));

	beforeEach(inject(function($injector) {
		// Set up the mock http service responses
		$httpBackend = $injector.get('$httpBackend');
		// Get hold of a scope (i.e. the root scope)
		$rootScope = $injector.get('$rootScope');
		// The $controller service is used to create instances of controllers
		var $controller = $injector.get('$controller');
		createController = function() {
			return $controller('JsBandwidthController', {'$scope' : $rootScope });
		};
	}));

	afterEach(function() {
         $httpBackend.verifyNoOutstandingExpectation();
         $httpBackend.verifyNoOutstandingRequest();
	});

	it('should get net speed', function(done) {
		var data = getRandomData();
		$httpBackend.when('GET', /(.+\/)?test\.bin(\?.+)?/).respond(200, data, {"Access-Control-Allow-Origin": "*"});
		$httpBackend.when('POST', /(.+\/)?post(\?.+)?/).respond(200, '', {"Access-Control-Allow-Origin": "*"});
		createController();
		$rootScope.options = {downloadUrl: "test.bin", uploadUrl: "post"};
		$rootScope.oncomplete = function() {
			expect($rootScope.downloadSpeed).toBeLessThan(MEGABIT);
			expect($rootScope.downloadSpeed).toBeGreaterThan(MEGABIT / 2);
			done();
		};
		$rootScope.start();
		setTimeout(function() {
			$httpBackend.flush();
		}, (data.length / MEGABIT * 8) * 1000 + 100);
	});

	it('should get error', function() {
		$httpBackend.when('GET', /(.+\/)?test\.binx(\?.+)?/).respond(404, '', {"Access-Control-Allow-Origin": "*"});
		createController();
		$rootScope.options = {downloadUrl: "test.binx", uploadUrl: "post"};
		$rootScope.oncomplete = function() {
			expect($rootScope.errorStatus).toEqual(404);
		};
		$rootScope.start();
		$httpBackend.flush();
	});

	it('should cancel speed test', function() {
		var data = getRandomData();
		$httpBackend.when('GET', /(.+\/)?test\.bin(\?.+)?/).respond(200, data, {"Access-Control-Allow-Origin": "*"});
		$httpBackend.when('POST', /(.+\/)?post(\?.+)?/).respond(200, '', {"Access-Control-Allow-Origin": "*"});
		createController();
		$rootScope.options = {downloadUrl: "test.bin", uploadUrl: "post"};
		$rootScope.oncomplete = function() {
			expect($rootScope.errorStatus).toEqual(0);
		};
		$rootScope.start();
		$rootScope.cancel();
	});
});
