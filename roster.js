const mongo = require("mongodb")
const mongoClient = mongo.MongoClient
const express = require("express")
const bodyParser = require("body-parser")

var app = express()
app.use(bodyParser.json())



app.post( "/AlleysRoster/", function (request, response) {
	var keyValue = { key : request.body.key, value : request.body.value }
	mongoClient.connect("mongodb://localhost/AlleysDB",
	function(error, db) {
		handleDatabaseError(error)
		var collection = getDatabaseCollection(db)
		collection.save( keyValue,
		function(error, result) {
			if (error) throw error
			response.json(keyValue)
			db.close()
		})
	})
})



app.get("/AlleysRoster", function(request, response) {
	mongoClient.connect("mongodb://localhost/AlleysDB",
	function(error, db) {
		handleDatabaseError(error)
		var collection = getDatabaseCollection(db)
		collection.findOne({$query:{},$orderby:{_id:-1}},
			function(error, result) {
				if (error) throw error
				response.json(result.value)
				db.close()
		})// .sort({value:1}).limit(1).pretty()
	})
})



app.get( "/AlleysRoster/:key", function (request, response) {
	var key = request.params.key
	mongoClient.connect("mongodb://localhost/AlleysDB",
	function(error, db) {
		handleDatabaseError(error)
		var collection = getDatabaseCollection(db)
		collection.findOne( { key : key },
			function(error, result) {
				if (error) throw error
				response.json(result.value)
				db.close()
		})
	})
})



app.put("/AlleysRoster/:key", function (request, response) {
	var key = request.params.key
	var keyValue = { key : request.body.key, value : request.body.value }
	mongoClient.connect("mongodb://localhost/AlleysDB",
	function(error, db) {
		handleDatabaseError(error)
		var collection = getDatabaseCollection(db)
		collection.update( { key : key }, keyValue, {upsert : true},
			function(error, result) {
				if (error) throw error
				response.json(keyValue)
				db.close()
		})
	})
})



app.delete("/AlleysRoster/:key", function(request, response) {
	var key = request.params.key
	mongoClient.connect("mongodb://localhost/AlleysDB",
		function(error, db) {
			handleDatabaseError(error)
			var collection = getDatabaseCollection(db)
			collection.deleteOne({key : key},
				function(error, result) {
					if(error) throw error
					response.json( key )
					db.close()
			})
	})
})



function getDatabaseCollection(db) {
	var database = db.db("AlleysDB")
	return database.collection("AlleysColl")
}



function handleDatabaseError(error) {
	if(error) {
		response.status(500).send("A team of highly trained monkeys " 
			+ "has been dispatched to deal with the situation.")
	}
}



app.listen(3000, function() {
	console.log("listening on port 3000...")
})



app.use(function(request, response, next) {
    response.status(404).send("The page could not be found!");
});



app.use(function(error, request, response, next) {
	response.status(500).send("A team of highly trained monkeys" 
		+ "has been dispatched to deal with the situation.")
})
