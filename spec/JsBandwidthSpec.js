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

describe("JsBandwidthSpec", function() {
	var $httpBackend, $rootScope, $controller, $scope;

	beforeEach(module("jsBandwidth"));

	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
		$controller = $injector.get('$controller');
		$rootScope = $injector.get('$rootScope');
		$scope = $rootScope.$new();
		$controller('JsBandwidthController', {'$scope' : $scope});
	}));

	afterEach(function() {
		if(!$scope.$$phase) {
			$httpBackend.verifyNoOutstandingExpectation();
		}
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should get latency and net speed', function(done) {
		var data = getRandomData();
		var n = data.length;
		$scope.options = {latencyTestUrl: "/test", downloadUrl: "/test.bin", uploadUrl: "/post"};
		$scope.$on("complete", function() {
			expect($scope.result.latency).toBeGreaterThan(500);
			expect($scope.result.latency).toBeLessThan(600);
			expect($scope.result.downloadSpeed).toBeLessThan(2 * MEGABIT);
			expect($scope.result.downloadSpeed).toBeGreaterThan(MEGABIT);
			done();
		});
		$scope.start();
		$httpBackend.expect('HEAD', /\/test.*/g).respond(200, "", {"Access-Control-Allow-Origin": "*"});
		$httpBackend.when('GET', /\/test\.bin.*/g).respond(200, data, {"Access-Control-Allow-Origin": "*"});
		$httpBackend.when('POST', /\/post.*/g).respond(200, '', {"Access-Control-Allow-Origin": "*"});
		var timeout = (n / MEGABIT * 8) * 1000 / 2 + 100;
		console.log("Wait " + timeout + "ms for " + n + " bytes ...");
		setTimeout(function() {
			$httpBackend.flush(1);
			setTimeout(function() {
				$httpBackend.flush();
			}, timeout);
		}, 500);
	});

	it('should get error', function(done) {
		$scope.options = {latencyTestUrl: "/test.binx", downloadUrl: "/test.binx", uploadUrl: "/post"};
		$scope.$on("error", function() {
			expect($scope.error.status).toEqual(404);
			done();
		});
		$scope.start();
		$httpBackend.expect('HEAD', /\/test\.binx.*/g).respond(404, '', {"Access-Control-Allow-Origin": "*"});
		$httpBackend.flush();
		expect($scope.error.status).toEqual(404);
	});

	it('should cancel speed test', function(done) {
		var data = getRandomData();
		$scope.options = {latencyTestUrl: "/test.bin", downloadUrl: "/test.bin", uploadUrl: "/post"};
		$scope.$on("error", function() {
			expect($scope.error.status).toEqual(-1);
			done();
		});
		$scope.start();
		$httpBackend.when('HEAD', /\/test\.bin.*/g).respond(200, data, {"Access-Control-Allow-Origin": "*"});
		$httpBackend.when('GET', /\/test\.bin.*/g).respond(200, data, {"Access-Control-Allow-Origin": "*"});
		$httpBackend.when('POST', /\/post.*/g).respond(200, '', {"Access-Control-Allow-Origin": "*"});
		setTimeout(function() {
			console.log("Just wait to cancel ...");
			//$httpBackend.flush();
		}, 1000);
		$scope.cancel();
		$rootScope.$digest();
	});

});