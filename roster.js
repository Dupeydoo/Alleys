var mongo = require( "mongodb" )
var mongoClient = mongo.MongoClient
var express = require( "express" )
var bodyParser = require( "body-parser" )
var app = express()
app.use( bodyParser.json() )

// AIzaSyDjMt3pvIJis3Wa5y7VJSVyOmO7_UgRDVI


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
				console.log( "updated " + result )
				db.close()
		}
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
					console.log("deleted")
					db.close()
				})
		})
})





app.listen( 3000, function () {
	console.log( "listening on port 3000..." )
})