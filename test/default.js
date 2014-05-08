
	
	var   Class 			= require('ee-class')
		, log 				= require('ee-log')
		, assert 			= require('assert')
		, travis 			= require('ee-travis')
		, fs 				= require('fs')
		, FormdataReader 	= require('../')
		, Readable 			= require('stream').Readable
		, project 			= require('ee-project')
		, crypto 			= require('crypto');


	var md5 = function(buf){
		return crypto.createHash('md5').update(buf).digest('hex');
	}


	// request simumaltor
	var createRequest = function(message, contentType){
		return new (new Class({
			inherits: Readable

			, init: function(){
				Readable.call( this );
				this.file = fs.createReadStream(project.root+'test/'+message);

				this.on('newListener', function(evt, listener){
					this.file.on(evt, listener);
				}.bind( this ));
			}


			, getHeader: function(){
				return contentType;
			}


			, _read: function( size ){}
		}));
	}
	


	var calculateMessageHash = function(message) {
		var hash = '';


		Object.keys(message).forEach(function(key){// log(message[key]);
			if (Array.isArray(message[key])){
				message[key].forEach(function(subMessage){
					hash += md5(subMessage.data ? subMessage.data : subMessage);
				});
			}
			else hash += md5(message[key]);
		});

		return hash;
	}



	describe('The Formdata Reader', function(){
		it('Should be able to decode multipart post message 1', function(done){
			var reader = new FormdataReader(createRequest('post1.mime', 'multipart/form-data; boundary=AaB03x'));

			reader.on('end', function(){
				var form = reader.getForm();
				assert.equal('4debfdb23bf13d11084b5f6f42f93b897a22164bf25f145183087da4784e81f8cd3b27fe8dee2773db1b7bd3297454cf', calculateMessageHash(form), 'message hash is different!')
				done();
			});
		});


		it('Should be able to decode multipart post message 2', function(done){
			var reader = new FormdataReader(createRequest('post2.mime', 'multipart/mixed; boundary="----------------------------722570873451616639732247"'));

			reader.on('end', function(){
				var form = reader.getForm();
				assert.equal('fb93818d01553e9fead6873b780580aec239dddc9c7a19eef9af0052da451a8a', calculateMessageHash(form), 'message hash is different!')
				done();
			});
		});


		it('Should be able to decode multipart post message 3', function(done){
			var reader = new FormdataReader({
				request: createRequest('post3.mime', 'multipart/form-data; boundary=--------------------------673022500147059248960166')
			});

			reader.on('end', function(){
				var form = reader.getForm();
				assert.equal('fb93818d01553e9fead6873b780580aefb93818d01553e9fead6873b780580aec239dddc9c7a19eef9af0052da451a8ac239dddc9c7a19eef9af0052da451a8a', calculateMessageHash(form), 'message hash is different!')
				done();
			});
		});

		it('Should be able to decode an empty multipart post', function(done){
			var reader = new FormdataReader({
				request: createRequest('post4.mime', 'multipart/form-data;')
			});

			reader.on('end', function(){
				assert.equal(JSON.stringify({}), JSON.stringify(reader.getForm()), 'message hash is different!')
				done();
			});
		});
	});
