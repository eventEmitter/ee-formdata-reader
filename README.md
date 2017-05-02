# ee-formdata-reader

[![Greenkeeper badge](https://badges.greenkeeper.io/eventEmitter/ee-formdata-reader.svg)](https://greenkeeper.io/)

simple but powerful formdata parser. parses mutipart & urlencoded data from request. caches files in memory or on the disk.

## installation

	npm install ee-formdata-reader


## build status

[![Build Status](https://travis-ci.org/eventEmitter/ee-formdata-reader.png?branch=master)](https://travis-ci.org/eventEmitter/ee-formdata-reader)


## usage
	
	// reader with defaults
	var reader = new FormdataReader(request);

	// reader with custom limits. all limits are optional
	var reader = new FormdataReader({
		  request: request
		, maxLength: 1000 * 1000 * 10 		// 10mb, defaults to 128mb
		, maxFormdataLength: 10000 			// 10k for non file form fields, defaults to 2 mb
		, maxFileLength: 1000 * 1000 * 2 	// 2mb, defaults to 128mb
		, cachePath: '/tmp' 				// store files on the fs instead in memory, defaults to memory
		, cacheId: 'some machine id' 		// if files are stored on the filesystem they will contain a 
											// machine identifier in their filename so one can use shared
											// storage solutions between mutliple machines. defaults to 
											// an identifier provided by the «ee-machine-id» package
	});

	// when the request has ended and all data has been received, decoded and cached
	// the reader will emit an «end» event
	reader.on('end', function(){
		// you may retreive the formdata using the «getForm» method
		log(reader.getForm());
	});


## example
	
	var reader = new FormdataReader(request);

	reader.on('end', function(){
		log(reader.getForm());
		// name: 'Michael'
		// files: [
		//    {
		//        data: 2e 2e 2e 20 63 6f 6e 74 65 6e 74 73 20 6f 66 20 66 69 6c 65 31 2e 74 78 74 20 2e 2e 2e 
		//        , filename: "file1.txt"
		//    }
		//    , {
		//        data: 2e 2e 2e 63 6f 6e 74 65 6e 74 73 20 6f 66 20 66 69 6c 65 32 2e 67 69 66 2e 2e 2e 
		//        , filename: "file2.gif"
		//    }
		// ]
	});
