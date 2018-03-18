/**
* The roster microservice is an example of a storage as a service API. It 
* communicates with the Alleys mongo database. It allows drivers to add
* themselves to the roster, leave the roster and update their rate. A HTTP
* GET method is also provided to allow another service to retrieve the
* cheapest driver and rate, as well as the count of drivers in the roster.
*
* 
* HTTP 1.1 Methods: POST, GET, PUT, DELETE
* Author: 640010970
*
* Example curls:
*
* curl -X POST http://machine_name/AlleysRoster -H 'Content-Type: 
* application/json' -d '{"name" : "Laura", "rate" : 102}'
* 
* curl -X GET http://machine_name/AlleysRoster
*
* curl -X PUT http://machine_name/AlleysRoster/Bertwick -H 
* 'Content-Type: application/json' -d '{"name" : "Bertwick", "rate" : 20}'
*
* curl -X DELETE http://machine_name/AlleysRoster/Danny
*/

const mongo = require("mongodb")
const mongoClient = mongo.MongoClient
const express = require("express")
const bodyParser = require("body-parser")

// ROSTER_PORT (number): The port the roster service listens on.
const ROSTER_PORT = process.env.ROSTER_PORT ? process.env.ROSTER_PORT : 3001

// MONGO_PROTOCOL (string): The protocol mongo uses for connections.
const MONGO_PROTOCOL = "mongodb://"

// MONGO_SERVICE (string): The address used to connect to mongo.
const MONGO_SERVICE = MONGO_PROTOCOL + "rostermongo/AlleysDB"

// serverError (string): The server error to display when something goes wrong.
var serverError = "500 Internal Server Error: Something has gone wrong on the server." 
	+ " Please try again in a little while."

// notFound (string): The error to display when a resource could not be found.
var notFound = "404 Not Found: The resource could not be found."

// badRequest (string): The error to display when the requester provides incorrect input.
var badRequest = "400 Bad Request: Did you provide a string name for the driver and a" 
	+ " number for the rate"

// app (obj): The express object used to route API calls.
var app = express()
app.use(bodyParser.json())


app.post( "/AlleysRoster/", function (request, response) {
	var keyValue = { name : request.body.name, rate : request.body.rate }
	if(!validateInput("create", response, keyValue)) { return false }

	mongoClient.connect(MONGO_SERVICE,
	function(error, db) {
		handleDatabaseError(error, response)
		var collection = getDatabaseCollection(db, response)
		
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
		var collection = getDatabaseCollection(db, response)
		var min = collection.find().sort({rate: 1}).limit(1)

		min.count(function(error, count) {
			handleDatabaseError(error, response)
			if(count > 0) {
				min.forEach(function(minimum) {
					
					collection.count(function(error, result) {
						if(result > 0) {
							handleDatabaseError(error, response)
							response.status(200).json({driver: minimum.name, 
								rate: minimum.rate, count: result
							})
						}

						else {
							response.status(204).send()
						}
					})
				})
			}

			else {
				response.status(204).send()
			}
		})
	})
})


app.put("/AlleysRoster/:name", function (request, response) {
	var name = request.params.name
	var keyValue = { name : request.body.name, rate : request.body.rate }
	
	if(!validateInput("update", response, keyValue, name)) { 
		return false 
	}

	mongoClient.connect(MONGO_SERVICE,
	function(error, db) {
		handleDatabaseError(error, response)
		var collection = getDatabaseCollection(db, response)
		
		collection.update({ name : name }, keyValue, {upsert : true},
			function(error, result) {
				handleDatabaseError(error, response)
				
				var modified = result.result.nModified
				if(modified) {
					response.status(200).json(keyValue)
				} 

				else {
					response.status(201).json(keyValue)
				}
				db.close()
		})
	})
})


app.delete("/AlleysRoster/:name", function(request, response) {
	var name = request.params.name
	
	mongoClient.connect(MONGO_SERVICE,
	function(error, db) {
		handleDatabaseError(error, response)
		var collection = getDatabaseCollection(db, response)
		
		collection.deleteOne({name : name},
			function(error, result) {
				handleDatabaseError(error, response)
				
				if(result.deletedCount === 0) {
					response.status(204).send()
				} 

				else {
					response.status(200).json(name)
				}
				db.close()
		})
	})
})


function getDatabaseCollection(db, response) {
	var database = db.db("AlleysDB")
	return database.collection("AlleysColl")
}


function handleDatabaseError(error, response) {
	if(error) {
		writeErrorResponse(response, 500, serverError)
	}
}


function validateInput(method="create", response, nameRate=0, name=0) {
	var rate = nameRate.rate
	if(method === "create") {
		if(!nameRate.name || !rate || !Number.isInteger(rate)) {
			writeErrorResponse(response, 400, badRequest + "?")
			return false
		}
	}

	else if(method === "update") {
		if(!nameRate.name || !rate || !Number.isInteger(rate) || !name) {
			writeErrorResponse(response, 400, badRequest + " and a name to update?")
			return false
		}
	}
	return true
}


function writeErrorResponse(response, code, message) {
	response.status(code).send(message)
	logError(code, message)
}


function logError(code, message) {
	console.error(new Date() + " [HTTP Code: " + code + ", Message: " + message + "]")
}


app.listen(ROSTER_PORT, function() {
	console.log("Roster is listening on " + ROSTER_PORT)
})


app.use(function(request, response, next) {
    writeErrorResponse(response, 404, notFound);
});


app.use(function(error, request, response, next) {
	writeErrorResponse(response, 500, serverError)
})
