/**
* The rider microservice acts as the orchestrator of the Alleys REST system.
* It makes HTTP requests to other microservices and processes the results
* whether they are correct or an error code and message. When the final fare
* is received from the surge service, the result is sent to the user.
*
* 
* HTTP 1.1 Methods: GET
* Author: 640010970
*
* Example curl:
* curl -X GET machine_ip/AlleysRider/London/Inverness
* 
* Output: "Driver: <cheapest-driver>, Price: <cheapest-fare> Pound Sterling."
*/


const request = require("request")
const express = require("express")
const bodyParser = require("body-parser")

// The ports are derived dynamically from env variables set by docker-compose.
// RIDER_PORT (number): The port the rider service listens on.
const RIDER_PORT = process.env.RIDER_PORT ? process.env.RIDER_PORT : 3003

// MAPPING_PORT (number): The port the mapping service listens on.
const MAPPING_PORT = process.env.MAPPING_PORT ? process.env.MAPPING_PORT : 3000

// ROSTER_PORT (number): The port the roster service listens on.
const ROSTER_PORT = process.env.ROSTER_PORT ? process.env.ROSTER_PORT : 3001

// SURGE_PORT (number): The port the surge service listens on.
const SURGE_PORT = process.env.SURGE_PORT ? process.env.SURGE_PORT : 3002

// serverError (string): The server error to display when something goes wrong.
var serverError = "500 Internal Server Error: Something has gone wrong on the server. " + 
	"Please try again in a little while."

// app (obj): The express object used to route API calls.
var app = express()
app.use(bodyParser.json())


/**
* GET URL route to return the cheapest driver and fare based on
* a start and end location.
*
* @param  URL (string): machine_name/AlleysRider/start/end
* @param  function(request, response): The callback executed 
* when the route is matched.
*/
app.get("/AlleysRider/:start/:end", function(request, response) {
	var start = request.params.start
	var end = request.params.end
	if(validateStartEnd(response, start, end)) {
		getBestDriverPrice(start, end, response)
	}
})


/**
* Makes a request to the mapping service for directions data.
* On success the function which requests the roster service is
* called with the result.
*
* @param  start (string): The location the rider wants to start at.
* @param  end (string): The locations the rider wants to finish at.
* @param  response (obj): The response to send to the user.
*
*/
function getBestDriverPrice(start, end, response) {
	var mapUrl = "http://mapping:" + MAPPING_PORT 
		+ "/AlleysMapping/" + start + "/" + end

	// Make a request to the mapping service.
	request(mapUrl,
		function(error, mapResponse, body) {
			if(checkApiError(error, response, mapResponse)) {
				getCheapestKmRate(body, response)
			}
	})
}

/**
* Makes a request to the roster service, on success the function
* which requests the surge service is called with the result.
*
* @param  distances (obj): An object containing the distance of the
* journey in total and on A roads.
* @param  response (obj): The reponse to send to the user.
*
*/
function getCheapestKmRate(distances, response) {
	var rosterUrl = "http://roster:" + ROSTER_PORT 
		+ "/AlleysRoster"
	// Make a request to the roster service.
	request(rosterUrl,	
		function(error, rosterResponse, body) {
			if(checkApiError(error, response, rosterResponse)) {
				getSurgePrice(distances, body, response)
			}
	})
}

/**
* Parses the result from the roster service and makes the final
* request required to the surge service to respond to the user.
*
* @param  distances (obj): An object containing the distance of the
* journey in total and on A roads.
* @param  driver (obj): An object containing the name and fare of 
* the cheapest driver.
* @param  response (obj): The response to send to the user.
*
*/
function getSurgePrice(distances, driver, response) {
	// Parse the data needed to use in the algorithm.
	var distances = JSON.parse(distances)
	var driver = JSON.parse(driver)
	var surgeData = parseSurgeData(distances, driver)
	var surgeUrl = "http://surge:" + SURGE_PORT 
		+ "/AlleysSurge/" + JSON.stringify(surgeData)

	// Make a request to the surge service.
	request(surgeUrl, 
		function(error, surgeResponse, body) {
			if(checkApiError(error, response, surgeResponse)) {
				response.status(200).send(body)
			}
	})
}

/**
* This function parses some of the data needed for the surge
* price algorithm. 
*
* @param   distances (obj): An object containing the distance of the
* journey  in total and on A roads.
* @param   driver (obj): An object containing the name and fare of 
* the cheapest driver.
* @returns  (obj): An object containing the data needed for the 
* surge algorithm.
*/
function parseSurgeData(distances, driver) {
	return { totalDistance: distances.totalDistance, aDistance: distances.aDistance,
			 driver: driver.driver, rate: driver.rate, driverCount: driver.count }
}

/**
* Validates the start and end dates provided as inputs to the API.
* 
* @param    response (obj): The response sent to the user.
* @param    start (string): The location where the user's journey starts.
* @param    end (string): The location where the user's journey ends.
* @returns  (bool): false if validation fails, true if it succeeds.
*/
function validateStartEnd(response, start, end) {
	// The start and end should not be undefined, an empty string, a number or equal.
	if(!start || !end || Number.isInteger(start) || Number.isInteger(end) || start === end) {
		// The user has provided a bad location so a 400 code is sent.
		var badRequest = "400 Bad Request: Valid start and end locations must be provided!"
		writeErrorResponse(response, 400, badRequest)
		return false
	}
	return true
}

/**
* Checks to see if there was an error when a call to the other microservices
* was made. 
*
* @param    error (obj): The error object from a HTTP request.
* @param    response (obj): The response to send an error code with.
* @param    apiResponse (obj): The response received from the microservice
* which was called.
* @returns  (bool): false if the results were an error, true otherwise.
*/
function checkApiError(error, response, apiResponse) {
	if(error) {
		// Presumably a connection based or fatal error.
		writeErrorResponse(response, 500, serverError)
		return false
	}

	// If the response code does not fall in the ok range, or does not contain
	// any content.
	else if(apiResponse.statusCode > 299 || apiResponse.statusCode === 204) {
		writeErrorResponse(response, apiResponse.statusCode, apiResponse.body)
		return false
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
	response.status(code).send(message)
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
app.listen(RIDER_PORT, function() {
	console.log("Rider is listening on " + RIDER_PORT.toString())
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
    writeErrorResponse(response, 404, "404: The resource could not be found!");
});

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