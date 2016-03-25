jasmine.DEFAULT_TIMEOUT_INTERVAL = 11000;

var JsBandwidth = require("../../main/js/jsbandwidth.js");

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
	var jsbandwidth;

	beforeEach(function() {
		jsbandwidth = new JsBandwidth();
		jasmine.Ajax.install();
	});

	afterEach(function() {
		jasmine.Ajax.uninstall();
	});
	
	it('should get latency and net speed', function(done) {
		var data = getRandomData();
		var n = data.length;
		jsbandwidth.testSpeed({latencyTestUrl: "/test.bin", downloadUrl: "/test.bin", uploadUrl: "/post"}).then(
			function(result) {
				console.log("Test result: " + JSON.stringify(result));
				expect(result.latency).toBeGreaterThan(500);
				expect(result.latency).toBeLessThan(600);
				expect(result.downloadSpeed).toBeLessThan(2 * MEGABIT);
				expect(result.downloadSpeed).toBeGreaterThan(MEGABIT);
				done();
			}
		);
		
		console.log("Wait 500ms for latency ...");
		setTimeout(function() {
			var request = jasmine.Ajax.requests.mostRecent();
			expect(request.method).toBe('HEAD');
			expect(request.url).toMatch(/\/test.bin\?.*/);
			request.respondWith({
				"status": 200,
				"responseText": "",
				"responseHeaders": {"Access-Control-Allow-Origin": "*"}
			});
			var timeout = (n / MEGABIT * 8) * 1000 / 2 + 100;
			console.log("Wait " + timeout + "ms for " + n + " bytes ...");
			setTimeout(function() {
				var request = jasmine.Ajax.requests.mostRecent();
				expect(request.method).toBe('GET');
				expect(request.url).toMatch(/\/test.bin\?.*/);
				request.respondWith({
					"status": 200,
					"responseText": data,
					"responseHeaders": {"Access-Control-Allow-Origin": "*"}
				});
				setTimeout(function() {
					var request = jasmine.Ajax.requests.mostRecent();
					expect(request.method).toBe('POST');
					expect(request.url).toMatch(/\/post?.*/);
					request.respondWith({
						"status": 200,
						"responseText": "",
						"responseHeaders": {"Access-Control-Allow-Origin": "*"}
					});
				}, 100);
			}, timeout);
		}, 500 * 2);
	});

	it('should get error', function(done) {
		jsbandwidth.testSpeed({latencyTestUrl: "/xtest.bin", downloadUrl: "/xtest.bin", uploadUrl: "/post"})
				.then(function(result) {}, function(error) {
					expect(error.status).toEqual(404);
					done();
				});
		var request = jasmine.Ajax.requests.mostRecent();
		expect(request.method).toBe('HEAD');
		expect(request.url).toMatch(/\/xtest.bin\?.*/);
		request.respondWith({
			"status": 404,
			"responseText": "",
			"responseHeaders": {"Access-Control-Allow-Origin": "*"}
		});
	});

	it('should cancel speed test', function(done) {
		var data = getRandomData();
		var p = jsbandwidth.testSpeed({latencyTestUrl: "/test.bin", downloadUrl: "/test.bin", uploadUrl: "/post"});
		p.then(function(result) {}, function(error) {
					expect(error.status).toEqual(-1);
					done();
				});
		var request = jasmine.Ajax.requests.mostRecent();
		expect(request.method).toBe('HEAD');
		expect(request.url).toMatch(/\/test.bin\?.*/);
		p.cancel();
	});

});