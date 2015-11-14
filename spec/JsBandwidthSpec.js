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
//		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should get net speed', function(done) {
		var data = getRandomData();
		$scope.options = {downloadUrl: "/test.bin", uploadUrl: "/post"};
		$scope.$on("complete", function() {
			expect($scope.downloadSpeed).toBeLessThan(MEGABIT);
			expect($scope.downloadSpeed).toBeGreaterThan(MEGABIT / 2);
			done();
		});
		$scope.start();
		$httpBackend.expectGET(/\/test\.bin.*/g).respond(200, data, {"Access-Control-Allow-Origin": "*"});
		$httpBackend.expect('POST', /\/post.*/g).respond(200, '', {"Access-Control-Allow-Origin": "*"});
		setTimeout(function() {
			$httpBackend.flush();
		}, (data.length / MEGABIT * 8) * 1000 + 100);
	});

	it('should get error', function(done) {
		$scope.options = {downloadUrl: "/test.binx", uploadUrl: "/post"};
		$scope.$on("error", function() {
			expect($scope.error.status).toEqual(404);
			done();
		});
		$scope.start();
		$httpBackend.expectGET(/\/test\.binx.*/g).respond(404, '', {"Access-Control-Allow-Origin": "*"});
		$httpBackend.flush();
		expect($scope.error.status).toEqual(404);
	});

	it('should cancel speed test', function(done) {
		var data = getRandomData();
		$scope.options = {downloadUrl: "/test.bin", uploadUrl: "/post"};
		$scope.$on("error", function() {
			expect($scope.error.status).toEqual(-1);
			done();
		});
		$scope.start();
		$httpBackend.when('GET', /\/test\.bin.*/g).respond(200, data, {"Access-Control-Allow-Origin": "*"});
		$httpBackend.when('POST', /\/post.*/g).respond(200, '', {"Access-Control-Allow-Origin": "*"});
		setTimeout(function() {
			$httpBackend.flush();
		}, 1000);
		$scope.cancel();
		$rootScope.$digest();
	});

});