= JSBandwidth =

This project was initially forked from https://code.google.com/p/jsbandwidth/.

To test inside a browser the bandwidth, there's no easy way. This is what JsBandwidth tries to achieve.

== Set up ==
1. Set up a web server of your choice.
2. Depending on your web server, drop the corresponding project files in your web server's document root (or a sub-directory, if you wish). What `post.*` file to choose depends on your web server. The upload test needs to be able to send a POST request to the server. The receiving page doesn't have to do anything with the data. However, some servers will not allow you to send a POST request to a .htm file. Therefore, the project includes several blank server side script files (post.aspx, post.php, post.pl). `test.bin` is mandatory, but it's no more than random bytes. 

=== Spring Controller ===

== API ==
The JavaScript API works with both Angular and jQuery, depending on what library is included (if both, Angular is preferred).

== Example ==
var jsBandwidth = require("jsbandwidth");
jsBandwidth.testDownloadAndUpload(options)
		.then(function (result) {
				console.log("Download speed is " + result.downloadSpeed + "Mbps and upload speed is " result.uploadSpeed + "Mbps");
			},
			function(error) {
				console.log("An error occured during net speed test.");
			});

