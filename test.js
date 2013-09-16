

	var   fs 				= require( "fs" )
		, Class 			= require( "ee-class" )
		, log 				= require( "ee-log" )
		, FormdataReader 	= require( "./" )
		, Readable 			= require( "stream" ).Readable;


	var Request = new Class( {
		inherits: Readable


		, init: function(){
			Readable.call( this );
			this.file = fs.createReadStream( "./test/post1.mime" );

			this.on( "newListener", function( evt, listener ){
				this.file.on( evt, listener );
			}.bind( this ) );
		}


		, getHeader: function(){
			return "multipart/form-data";
		}


		, _read: function( size ){
			//this.push( this.file.read( size ) );
		}
	} );


	var reader = new FormdataReader( { request: new Request() } );

	reader.on( "end", function(){
		log( reader.getForm() );
	} );
