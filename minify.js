(function() {
	/* jshint node: true */
	var
		fs = require("fs"),
		path = require("path"),
		uglify = require("uglify-js"),
		nopt = require("nopt");

	var basename = path.basename(__filename),
		w = console.log,
		e = console.error,
		opt;

	// Shimming path.relative with 0.8.8's version if it doesn't exist
	if(!path.relative){
		path.relative = require('./path-relative-shim').relative;
	}

	function printUsage() {
		w("webOS-Ports service minifier");
		w("Usage: " + __filename + " [Flags] [path/to/manifest.json]");
		w("Flags:");
		w("-destdir DESTDIR:", "Target directory, prepended to any output file but skipped within generated files (current dir)");
		w("-beautify:", "Output pretty version that's less compressed but has code on separate lines");
		w("-h, -?, -help:", "Show this message");
	}

	// properly split path based on platform
	function pathSplit(inPath) {
		var sep = process.platform == "win32" ? "\\" : "/";
		return inPath.split(sep);
	}

	var concatJs = function(reldir, scripts) {
		w("");
		var blob = "";
		var script = "";
		for (var i=0; i<scripts.length; i++) {
			script=reldir+scripts[i];
			w(script);
			blob += "\n// " + path.relative(process.cwd(), script) + "\n" + compressJsFile(script) + "\n";
		}
		return blob;
	};

	var compressJsFile = function(inPath) {
		var outputOpts = {
//			beautify: false,
//			indent_level: 4,
			ascii_only: true
		};
		if (opt.beautify) {
			outputOpts.beautify = true;
			outputOpts.indent_level = 4;
		}
		var result = uglify.minify(inPath, {output: outputOpts});
		return result.code;
	};

	var knownOpts = {
		"destdir": path,  // absolute path (resolved by nopt)
		"help": Boolean,
		"beautify": Boolean
	};

	var shortHands = {
		"destdir": ['--destdir'],
		"h": ['--help'],
		"?": ['--help'],
		"help": ['--help'],
		"beautify": ['--beautify']
	};

	opt = nopt(knownOpts, shortHands, process.argv, 2);
	opt.manifest = opt.argv.remain[0] || (__dirname + '/manifest.json');
	opt.srcdir = path.dirname(opt.manifest);

	if (opt.help) {
		printUsage();
		process.exit();
	}

	// Send message to parent node process, if any
	process.on('uncaughtException', function (err) {
		e(err.stack);
		if (process.send) {
			// only available if parent-process is node
			process.send({error: err});
		}
		process.exit(1);
	});
	// receive error messages from child node processes
	process.on('message', function(msg) {
		console.dir(basename, msg);
		if (msg.error && msg.error.stack) {
			console.error(basename, msg.error.stack);
		}
		if (process.send) {
			process.send(msg);
		}
	});

	opt.destdir = opt.destdir || process.cwd();
	w(opt);

	// read manifest.json
	data = fs.readFileSync(opt.manifest, 'utf8');
	manifest = JSON.parse(data);
	// uglify code
	dataOut = concatJs(opt.srcdir + '/javascript/', manifest.files.javascript);
	// write result
	fs.writeFileSync(opt.destdir + '/node_module.js', dataOut, 'utf8');

})();
