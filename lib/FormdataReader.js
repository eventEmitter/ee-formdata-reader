


	var   Class 			= require( "ee-class" )
		, type 				= require( "ee-types" )
		, EventEmitter 		= require( "ee-event-emitter" )
		, machineId 		= require( "ee-machine-id" )
		, log 				= require( "ee-log" )
		, path 				= require( "path" )
		, MimeDecoder 		= require( "ee-mime-decoder" )
		, StreamURLDecoder 	= require( "ee-stream-url-decoder" )
		, StreamCollector 	= require( "ee-stream-collector" );





	module.exports = new Class( {
		inherits: EventEmitter


		, maxLength 		: 2 << 26 	// a request may not send more than 128 MB ( 134'217'728 Bytes ) of data
		, maxFormdataLength	: 2 << 20 	// a single form non file field may not be larger 2 MB ( 2'097'152 Bytes )
		, maxFileLength 	: 2 << 26 	// a single file may not bigger than 128 MB ( 134'217'728 Bytes )

		// counters
		, dataReceived: 0
		, fieldDataReceived: 0
		, fileDataReceived: 0


		, form: null


		, cachePath 		: null 		// the path to cache the files on

		// the temp file name will be constructed as follows: [ cacheId, machineId, pid, pidTime, ++cacheSequenceId ].join( "-" ) 
		// e.g. «ee-form-data-A97562B3CDDD3EFFA97562B3CDDD3EFF-4059-1378557945760-0». this will produce unique filenames even when
		// using a remote storage system 
		, cachId 			: "ee-formdata-reader"
		, cacheSequenceId 	: 0
		, pidTime 			: Date.now()
		, pid  				: process.pid
		, machineId 		: null



		, init: function( options, request ){
			this.request = type.object( request ) ? request : ( type.object( options.request ) ? options.request : options );

			// get machine id
			machineId.get( function( id ){
				this.machineId = id;
			}.bind( this ) );

			// store settings
			if ( type.number( options.maxLength ) ) 		this.maxLength 			= options.maxLength;
			if ( type.number( options.maxFormdataLength ) ) this.maxFormdataLength 	= options.maxFormdataLength;
			if ( type.number( options.maxFileLength ) ) 	this.maxFileLength 		= options.maxFileLength;
			if ( type.string( options.cachePath ) ) 		this.cachePath 			= options.cachePath;
			if ( type.string( options.cachId ) ) 			this.cachId 			= options.cachId;


			// select the correct MimeDecoder
			if ( this.request.getHeader( "content-type" ) === "application/x-www-form-urlencoded" ){
				this.decoder = new StreamURLDecoder();
				this.decoder.on( "data", this.handleFormData.bind( this ) );
			}
			else {
				this.decoder = new MimeDecoder(this.request.getHeader( "content-type" ));
				this.decoder.on( "data", this.handleMimePart.bind( this ) );
				this.isMultipart = true;
			}

			// handle decoder end
			this.decoder.on( "end", this.handleOnEnd.bind( this ) );

			// redirect data to decoder
			this.request.on( "data", this.handleData.bind( this ) );
			this.request.on( "end", function(){
				this.decoder.end();
			}.bind( this ) );
		}


		, getForm: function(){
			return this.form;
		}


		// data from the request
		, handleData: function( chunk ){
			this.dataReceived += chunk.length;
			if ( this.dataReceived <= this.maxLength ){
				this.decoder.write( chunk );
			}
			else {
				// cancel request, send 413 response
				this.request.abort( 413 );
			}
		}


		// mime parts, file uploads
		, handleMimePart: function( part ){
			var filename, fn, collector;

			if ( part.isStream() ){
				if ( this.cachePath ){
					// cache file on fs
					fn 			= part.hasHeader( "content-disposition" ) ? ( part.getHeader( "content-disposition" ).filename || "" ) : "";
					filename 	= path.join( this.cachePath, [ this.cacheId, this.machineId, this.pid, this.pidTime, ++this.cacheSequenceId, fn ].join( "-" ) );
					part.data 	= filename;

					part.pipe( fs.createwriteStream( filename ) );
				}
				else {
					// cache in memory
					collector = new StreamCollector();
					collector.on( "end", function( data ){part.data = data; }.bind( this ) );
					part.pipe( collector );
				}
			}
		}


		// form data
		, handleFormData: function( data ){
			if ( !this.form ) this.form = data;
			else {
				Object.keys( data ).forEach( function( key ){
					this.__storeValue( key, data[ key ] );
				}.bind( this ) );
			}
		}


		, _storeValue: function(key, value){
			if (!this.form) this.form = {};

			switch (type(this.form[key])){
				case "undefined":
					this.form[key] = value;
					break;

				case "array":
					this.form[key].push(value); 
					break;

				default:
					this.form[key] = [this.form[key]];
					this.form[key].push(value); 
					break;
			}
		}


		, _storeMultipartParts: function(parts, parentName) {
			parts.forEach(function(part) {
				var header = part.getHeader('content-disposition');
				
				if (part.hasChildren()){
					this._storeMultipartParts(part.parts, (header ? header.name : 'undefined'));
				}
				else {
					if (header) {
						if (header.value === "file") this._storeValue(parentName || 'undefined', {data: part.data, filename: header.name || header.filename});
						else this._storeValue(header.name || header.filename || 'undefined', part.data.toString().trim());
					}
				}
			}.bind( this ) );
		}


		// streaming finished
		, handleOnEnd: function(){
			if (this.isMultipart) this._storeMultipartParts(this.decoder.getMessage().parts);
			this.emit( "end" );
		}
	} );