const mongo = require("mongodb")
const mongoClient = mongo.MongoClient
const express = require("express")
const bodyParser = require("body-parser")

const ROSTER_PORT = process.env.ROSTER_PORT ? process.env.ROSTER_PORT : 3001
const MONGO_PROTOCOL = "mongodb://"
const MONGO_SERVICE = MONGO_PROTOCOL + "rostermongo/AlleysDB"
const MONGO_LOCAL = MONGO_PROTOCOL + "localhost/AlleysDB"


var app = express()
app.use(bodyParser.json())




app.post( "/AlleysRoster/", function (request, response) {
	var keyValue = { name : request.body.name, rate : request.body.rate }
	if(!validateInput("create", response, keyValue)) { return false }

	mongoClient.connect(MONGO_SERVICE,
	function(error, db) {
		handleDatabaseError(error, response)
		var collection = getDatabaseCollection(db)
		collection.save(keyValue,
		function(error, result) {
			handleDatabaseError(error, response)
			response.status(201).json(keyValue)
			db.close()
		})
	})
})



app.get("/AlleysRoster", function(request, response) {
	mongoClient.connect(MONGO_SERVICE,
	function(error, db) {
		handleDatabaseError(error, response)
		var collection = getDatabaseCollection(db)
		var min = collection.find().sort({rate: 1}).limit(1)
			.forEach(function(minimum) {
				collection.count(function(error, result) {
					if(result > 0) {
						handleDatabaseError(error, response)
						response.status(200).json({
							driver: minimum.name, 
							rate: minimum.rate, 
							count: result
						})
					}

					else {
						writeErrorResponse(response, 404, "404: The " + 
							"resource could not be found.")
					}
				})
			})
	})
})



app.get( "/AlleysRoster/:name", function (request, response) {
	var name = request.params.name
	mongoClient.connect(MONGO_SERVICE,
	function(error, db) {
		handleDatabaseError(error, response)
		var collection = getDatabaseCollection(db)
		collection.findOne( { name : name },
			function(error, result) {
				if(result === null) {
					writeErrorResponse(response, 404, "404: The " 
						+ " resource could not be found.")	
				} else {
					handleDatabaseError(error, response)
					response.status(200).json(result.rate)
				}
				db.close()
		})
	})
})



app.put("/AlleysRoster/:name", function (request, response) {
	var name = request.params.name
	var keyValue = { name : request.body.name, rate : request.body.rate }
	if(!validateInput("update", response, keyValue, name)) { return false }

	mongoClient.connect(MONGO_SERVICE,
	function(error, db) {
		handleDatabaseError(error, response)
		var collection = getDatabaseCollection(db)
		collection.update( { name : name }, keyValue, {upsert : true},
			function(error, result) {
				handleDatabaseError(error, response)
				response.status(200).json(keyValue)
				db.close()
		})
	})
})



app.delete("/AlleysRoster/:name", function(request, response) {
	var name = request.params.name
	mongoClient.connect(MONGO_SERVICE,
		function(error, db) {
			handleDatabaseError(error, response)
			var collection = getDatabaseCollection(db)
			collection.deleteOne({name : name},
				function(error, result) {
					handleDatabaseError(error, response)
					if(result.deletedCount === 0) {
						writeErrorResponse(response, 204, "204 No Content: " 
							+ "The resource does not exist! Nothing deleted.")
					} else {
						response.status(200).json(name)
					}
					db.close()
			})
	})
})



function getDatabaseCollection(db) {
	var database = db.db("AlleysDB")
	return database.collection("AlleysColl")
}



function handleDatabaseError(error, response) {
	if(error) {
		writeErrorResponse(response, 500, "A team of highly trained monkeys " 
			+ "has been dispatched to deal with the situation.")
	}
}



function validateInput(method="create", response, nameRate=0, name=0) {
	if(method === "create") {
		var rate = nameRate.rate
		if(!nameRate.name || !rate || !Number.isInteger(rate)) {
			writeErrorResponse(response, 400, "400 Bad Request: Did you" 
				+ " provide a string name for the driver and " 
				+ "a number for the rate?")
			return false
		}
	}

	else if(method === "update") {
		var rate = nameRate.rate
		if(!nameRate.name || !rate || !Number.isInteger(rate) || !name) {
			writeErrorResponse(response, 400, "400 Bad Request: Did you" 
				+ " provide a string driver name, a number for the rate" 
				+ " and a name to update?")
			return false
		}
	}
	return true
}



function writeErrorResponse(response, code, message) {
	response.status(code).send(message)
}



app.listen(ROSTER_PORT, function() {
	console.log("Roster is listening on " + ROSTER_PORT)
})



app.use(function(request, response, next) {
    writeErrorResponse(response, 404, "404: The resource could not be found!");
});



app.use(function(error, request, response, next) {
	writeErrorResponse(response, 500, "500:Internal Server Error, A " 
		+ "team of highly trained monkeys has been dispatched to deal" 
		+ " with the situation.")
})
