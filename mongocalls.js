const mongo = require( "mongodb" )
const mongoClient = mongo.MongoClient

// app read
function alleysRead(key, response) {
	mongoClient.connect( "mongodb://localhost/AlleysDB",
	function( error, db ) {
	if ( error ) throw error
	var database = db.db( "AlleysDB" )
	var collection = database.collection( "AlleysColl" )
	collection.findOne( { key : key },
		function( error, result ) {
			if ( error ) throw error
			response.json( result.value )
			db.close()
		})
	})
}

// app read all
function alleysReadAll(response) {
	mongoClient.connect( "mongodb://localhost/AlleysDB",
	function( error, db ) {
		if ( error ) throw error
		var database = db.db( "AlleysDB" )
		var collection = database.collection( "AlleysColl" )
		var keys = []

		collection.find().toArray(
		function( error, result ) {
			if ( error ) throw error

			for (i = 0; i < result.length; i++) {
				keys.push( result[ i ].key )
			}

			response.json( keys )
			db.close()
		})
	})
}

// app create
function alleysCreate(keyValue, response) {
	mongoClient.connect( "mongodb://localhost/AlleysDB",
	function( error, db ) {
		if ( error ) throw error
		var database = db.db( "AlleysDB" )
		var collection = database.collection( "AlleysColl" )
		collection.save( keyValue,
		function( error, result ) {
			if ( error ) throw error
			response.json( keyValue )
			db.close()
		})
	})
}

// app.update
function alleysUpdate(key, keyValue, response) {
	mongoClient.connect( "mongodb://localhost/AlleysDB",
	function( error, db ) {
		if ( error ) throw error
		var database = db.db( "AlleysDB" )
		var collection = database.collection( "AlleysColl" )
		collection.update( { key : key }, keyValue, {upsert : true},
			function( error, result ) {
				if ( error ) throw error
				response.json( keyValue )
				db.close()
		})
	})
}

// app.delete
function alleysDelete(key, response) {
	mongoClient.connect("mongodb://localhost/AlleysDB",
		function(error, db) {
			if(error) throw error
			var database = db.db("AlleysDB")
			var collection = database.collection("AlleysColl")
			collection.deleteOne({key : key},
				function(error, result) {
					if(error) throw error
					response.json( key )
					db.close()
			})
	})
}


module.exports.alleysRead = alleysRead;
module.exports.alleysReadAll = alleysReadAll;
module.exports.alleysCreate = alleysCreate;
module.exports.alleysUpdate = alleysUpdate;
module.exports.alleysDelete = alleysDelete;

