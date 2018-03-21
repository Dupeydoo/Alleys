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
var serverError = "500 Internal Server Error: Something has gone wrong on the " 
	+ "server. Please try again in a little while."


// app (obj): The express object used to route API calls.
var app = express()
app.use(bodyParser.json())


/**
* POST URL route to create a new driver in the database.
*
* @param  URL (string): machine_name/AlleysRoster
* @param  function(request, response): The callback executed 
* when the route is matched.
*/
app.post( "/AlleysRoster/", function (request, response) {
	var keyValue = { name : request.body.name, rate : request.body.rate }
	
	// Check for a valid key-value pair.
	if(!validateRosterInput("create", response, keyValue)) { 
		return false 
	}

	mongoClient.connect(MONGO_SERVICE,
	function(error, db) {
		handleDatabaseError(error, response)
		var collection = getDatabaseCollection(db, response)
		
		collection.save(keyValue,
		function(error, result) {
			// Save the results. A 201 created code is returned
			// on success.
			handleDatabaseError(error, response)
			response.status(201).json(keyValue)
			db.close()
		})
	})
})

/**
* GET URL route to read the cheapest driver and the count
* of drivers in the roster.
*
* @param  URL (string): machine_name/AlleysRoster
* @param  function(request, response): The callback executed 
* when the route is matched.
*/
app.get("/AlleysRoster", function(request, response) {
	mongoClient.connect(MONGO_SERVICE,
	function(error, db) {
		handleDatabaseError(error, response)
		var collection = getDatabaseCollection(db, response)

		// Return a cursor containing the cheapest document.
		var min = collection.find().sort({rate: 1}).limit(1)

		min.count(function(error, count) {
			handleDatabaseError(error, response)
			// If the cursor count is 0 the db itself does not
			// exist or is empty.
			if(count > 0) {
				// Extract the results from the cursor.
				min.forEach(function(minimum) {

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
							// If there's nothing then No Content.
							response.status(204).json()
						}
						db.close()
					})
				})
			}

			else {
				// If there's nothing then No Content.
				response.status(204).json()
				db.close()
			}
		})
	})
})

/**
* PUT URL route to update a driver in the roster. If the driver
* does not exist they are created in line with the HTTP/1.1 spec.
*
* @param  URL (string): machine_name/AlleysRoster/<driver-name>
* @param  function(request, response): The callback executed 
* when the route is matched.
*/
app.put("/AlleysRoster/:name", function (request, response) {
	var name = request.params.name
	var keyValue = { name : request.body.name, rate : request.body.rate }
	
	// Check the key and key-value pair are valid.
	if(!validateRosterInput("update", response, keyValue, name)) { 
		return false 
	}

	mongoClient.connect(MONGO_SERVICE,
	function(error, db) {
		handleDatabaseError(error, response)
		var collection = getDatabaseCollection(db, response)
		
		// Update the document. When upsert === true then a document
		// is created if it does not already exist.
		collection.update({ name : name }, keyValue, {upsert : true},
			function(error, result) {
				handleDatabaseError(error, response)
				
				// If an item was modified it was updated so
				// a code of 200. 201 if it was created.
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

/**
* DELETE URL route to delete a driver in the roster by name.
*
* @param  URL (string): machine_name/AlleysRoster/<driver-name>
* @param  function(request, response): The callback executed 
* when the route is matched.
*/
app.delete("/AlleysRoster/:name", function(request, response) {
	var name = request.params.name
	
	mongoClient.connect(MONGO_SERVICE,
	function(error, db) {
		handleDatabaseError(error, response)
		var collection = getDatabaseCollection(db, response)
		
		// Delete the driver, if nothing was deleted then
		// a 204 code is sent. If the driver is duplicated
		// all instances of the driver are removed.
		collection.deleteMany({name : name},
			function(error, result) {
				handleDatabaseError(error, response)
				
				if(result.deletedCount === 0) {
					response.status(204).json()
				} 

				else {
					response.status(200).json(name)
				}
				db.close()
		})
	})
})

/**
* Initialises the database collection for Alleys.
*
* @param    db (obj): The database object passed from the connect 
* callback.
* @param    response (obj): The response to send to the caller.
* @returns  (obj): The Alleys database collection.
*/
function getDatabaseCollection(db, response) {
	var database = db.db("AlleysDB")
	return database.collection("AlleysColl")
}

/**
* Checks and handles fatal database errors.
*
* @param  error (obj): The mongo error object to check. 
* @param  response (obj): The response to send to the caller.
*/
function handleDatabaseError(error, response) {
	if(error) {
		writeErrorResponse(response, 500, serverError)
	}
}

/**
* Validate the input provided to a HTTP method.
*
* @param    method (string): The HTTP method type to validate
* @param    response (obj) The response to send to the caller.
* @param    nameRate (obj/number): If not the default, an object
* containing a name and rate.
* @param    name (string/number): The name provided to a PUT HTTP
* method. 
* @returns  (bool): False if validation fails, true otherwise.  
*/
function validateRosterInput(method="create", response, nameRate=0, name=0) {
	var badRequest = "400 Bad Request: Did you provide a string name for " 
	+ "the driver and a number for the rate"
	
	var rate = nameRate.rate
	if(method === "create") {
		// If the name and rate are not undefined or empty, and 
		// the rate is not a number.
		if(!nameRate.name || !rate || !Number.isInteger(rate)) {
			writeErrorResponse(response, 400, badRequest + "?")
			return false
		}
	}

	else if(method === "update") {
		// If the name and rate and URL name are not undefined
		//  or empty, and the rate is not a number.
		if(!nameRate.name || !rate || !Number.isInteger(rate) || !name) {
			writeErrorResponse(response, 400, badRequest 
				+ " and a name to update?")
			return false
		}
	}
	return true
}

/**
* Writes an error response with a code and message.
*
* @param  response (obj): The response to write information to.
* @param  code (number): The HTTP status code to send.
* @param  message (string): The message to send the user.
*/
function writeErrorResponse(response, code, message) {
	response.status(code).json({"Error Code" : code, "Message" : message})
	logError(code, message)
}

/**
* Logs an error and its HTTP code. Most errors are recorded to allow
* verbose tracking for developers.
*
* @param  code (number): The HTTP status code to log.
* @param  message (string): The message to log.
*/
function logError(code, message) {
	console.error(new Date() + " [HTTP Code: " + code + ", Message: " + message + "]")
}

/**
* Instructs the express server to listen on a port.
*
* @param  port (number): The port to listen for requests on.
* @param  function(): The callback to execute when the port is bound to.
*/
app.listen(ROSTER_PORT, function() {
	console.log("Roster is listening on " + ROSTER_PORT)
})

/**
* A route to detect any errors as the result of the user specifying
* a resource that cannot be found. Invalid HTTP methods are also caught
* here.
*
* @param  function(request, response, next): The callback executed when an invalid 
* URI is provided.
*/
app.use(function(request, response, next) {
	var notFound = "404 Not Found: The resource could not be found!"
    writeErrorResponse(response, 404, notFound)
})

/**
* A route to detect any unknown or unexpected server errors that cannot be
* handled by the usual CRUD methods.
*
* @param  function(error, request, response, next): The callback executed when an
* unexpecter server error occurs.
*/
app.use(function(error, request, response, next) {
	writeErrorResponse(response, 500, serverError)
})
