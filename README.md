# ee-formdata-reader

formdata parser

## installation

	npm install ee-formdata-reader

## usage

	
	var reader = new FormdataReader( request );

	reader.on( "end", function(){
		log( reader.getForm() );
	} );
