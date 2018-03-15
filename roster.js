const mongo = require( "mongodb" )
const mongoClient = mongo.MongoClient

const express = require( "express" )
const bodyParser = require( "body-parser" )
var app = express()
app.use( bodyParser.json() )



app.post( "/AlleysRoster/", function ( request, response ) {
	var keyValue = { key : request.body.key, value : request.body.value }
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
})




app.get( "/AlleysRoster/:key", function ( request, response ) {
	var key = request.params.key
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
})




app.get("/AlleysRoster/", function (request, response) {
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
})



app.put("/AlleysRoster/:key", function (request, response) {
	var key = request.params.key
	var keyValue = { key : request.body.key, value : request.body.value }
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
})



app.delete("/AlleysRoster/:key", function(request, response) {
	var key = request.params.key
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



app.listen( 3000, function () {
	console.log( "listening on port 3000..." )
})
