/**
* The mapping microservice provides direction data for normal and A roads
* for Alleys. It implement a single idempotent GET HTTP method which responds
* to provision of a start and end location.
*
* 
* HTTP 1.1 Methods: GET
* Author: 640010970
*
* Example curl:
* curl -X GET machine_ip/AlleysMapping/London/Inverness
*/

const request = require("request")
const express = require("express")

// MAPS_API_KEY (string): The google maps API key used to connect to the Directions service. 
const MAPS_API_KEY = "AIzaSyAMmf0RuNmg3VO3GVFGL1SJaKz4m2QAuVI"

// MAPPING_PORT (number): The port the mapping service listens on.
const MAPPING_PORT = process.env.MAPPING_PORT ? process.env.MAPPING_PORT : 3000

// serverError (string): The server error to display when something goes wrong.
var serverError = "500 Internal Server Error: Something has gone wrong on the " 
	+ "server. Please try again in a little while."

// notFound (string): The error to display when a resource could not be found.	
var notFound = "404 Not Found: The resource could not be found!"

// app (obj): The express object used to route API calls.
var app = express()

/**
* GET URL route to return total and A road distance between the two
* locations provided.
*
* @param  URL (string): machine_name/AlleysMapping/start/end
* @param  function(request, response): The callback executed 
* when the route is matched.
*/
app.get("/AlleysMapping/:start/:end", function(mapRequest, response) {
	var start = mapRequest.params.start
	var end = mapRequest.params.end
	var gMapsUrl = "https://maps.googleapis.com/maps/api/directions/json?origin=" 
		+ start + "&destination=" + end + "&region=uk&key=" + MAPS_API_KEY

	// Make a request to the Google Maps Direction Service API.
	request.post(gMapsUrl, function(error, apiResponse, body) {
		var directions = JSON.parse(body)
		// Check the response to see if Google responded with
		// an error status. 
		if(!checkJsonResponse(response, directions)) { 
			return false 
		}

		// Get the distances from the response by calculating the A road distance.
		var totalDistance = directions.routes[0].legs[0].distance.value
		if(checkMapResponse(error, response, totalDistance)) {
			var aRoadDistance = calculateARoadDistance(directions.routes[0].legs[0].steps)
			response.status(200).json(
				{totalDistance: totalDistance, aDistance: aRoadDistance}
			)
		}
	})
})

/**
* Calculates the distance spent on A roads from a steps array
* from the Google Maps Directions Service API.
*
* @param    routeSteps (arr:`obj`) An array of step objects.
* @returns  aRoadMetres (number): The distance spent on A roads. 
*/
function calculateARoadDistance(routeSteps) {
	var stepsLength = routeSteps.length
	var aRoadMetres = 0
	for(var i = 0; i < stepsLength - 1; i++) {
		var stepObject = routeSteps[i]

		// Regex search in the step html_instructions for any A road
		// references.
		if(stepObject.html_instructions.search(/<b>A[0-9]/) !== -1) {
			aRoadMetres += stepObject.distance.value
		}
	}
	return aRoadMetres
}

/**
* Checks the response from the Directions Service for fatal
* or incorrect output. 
*
* @param    error (obj): The error object to check.
* @param    response (obj): The response to send to the caller.
* @param    totalDistance (number): The total journey distance.
* @returns  (bool): False if validation fails, true otherwise. 
*/
function checkMapResponse(error, response, totalDistance) {
	if(error) {
		writeErrorResponse(response, 500, serverError)
		return false
	}

	// If the user provided incorrect input this might happen.
	else if(totalDistance === 0 || totalDistance === undefined) {
		var badRequest = "400 Bad Request: Did you provide a valid " 
			+ "location for the start and end locations?"
		writeErrorResponse(response, 400, badRequest)
		return false
	}
	return true
}

/**
* Checks the Google Maps Direction Service response for error
* status'.
*
* @param    response (obj): The response to send to the caller.
* @param    directions (obj): The directions result from Google.
* @returns  (bool): False if validation fails, true otherwise.
*/
function checkJsonResponse(response, directions) {
	status = directions.status
	 if(status === "OK") {
	 	return true
	 } 

	 else if(status === "NOT_FOUND") {
	 	writeErrorResponse(response, 404, notFound + " Could not geocode locations.")
	 	return false
	 }
	 // For some reason the data is unavailable. For instance, REQUEST_DENIED status.
	 // Though google sees a REQUEST_DENIED as a client Authorisation error or 401 the
	 // actual rider client did not do anything wrong if the API key is incorrect so
	 // 503 is used as it covers the other possible unavailable states of the google API.
	 writeErrorResponse(response, 503, "503 Temporarily Unavailable: " + status)
	 return false
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
app.listen(MAPPING_PORT, function() {
	console.log("Mapping is listening on " + MAPPING_PORT.toString())
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