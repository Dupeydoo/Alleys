/**
* The surgepricing microservice implements the surge pricing algorithm of
* the Alleys ride-sharing service. It responds to an idempotent GET request
* over HTTP with the final rider fare in Pound Sterling.
* 
* HTTP 1.1 Methods: GET
* Author: 640010970
*
* Example curl:
* curl -X GET machine_ip/AlleysSurge/{"totalDistance":10000, "aDistance": 5000,
* 	"driver": "Spok", "rate": 20, "driverCount": 5}
* 
* Output: "Driver: Spok, Price: 3.00 Pound Sterling."
*/


const express = require( "express" )

// app (obj): The express object used to route API calls.
var app = express()

// SURGE_PORT (number): The port the surge service listens on.
const SURGE_PORT = process.env.SURGE_PORT ? process.env.SURGE_PORT : 3002

// DRIVER_LIMIT (number): If the number of drivers in the roster
// is less than this limit the rate is doubled.
const DRIVER_LIMIT = 5

// MULTIPLIER (number): The multiplier applied to the rate under different conditions.
const MULTIPLIER = 2


/**
* GET URL route to calculate the best driver and fare.
*
* @param  URL (string): machine_name/AlleysSurge/parameters
* @param  function(request, response): Callback function to
* respond to matching of the route.
*/
app.get( "/AlleysSurge/:surgeParameters", function(request, response) {
	// Parse the parameters and convert metres to kilometres.
	var parameters = JSON.parse(request.params.surgeParameters)
	var totalDistance = parameters.totalDistance / 1000
	var aDistance = parameters.aDistance / 1000
	var rate = parameters.rate

	// Obtain the A road and non-A road prices.
	var normalPrice = (totalDistance - aDistance) * rate
	var aPrice = MULTIPLIER * (aDistance * rate) 
	var price = calculateFinalPrice(normalPrice, aPrice, parameters.driverCount)
	
	response.status(200).send("Driver: " + parameters.driver + ", " 
		+ "Price: " + formatPrice(price) + " Pound Sterling.")
})

/**
* Returns a price in pennies in pounds at 2 DP.
*
* @param    price (number): The price to convert.
* @returns  (string): The price in pounds.
*
*/
function formatPrice(price) {
	return (price / 100).toFixed(2)
}

/**
* Calculates the final fare that is displayed to the user.
*
* @param    normalPrice (number): The price of the non-A road part
* of the journey.
* @param    aPrice (number): The price of the A road part.
* @param    driverCount (number): The number of drivers in the roster.
* @returns  (number): The total fare of the journey.
*/
function calculateFinalPrice(normalPrice, aPrice, driverCount) {
	// Get the current server time, double the rates if necessary. 
	var journeyTime = new Date()
	if(journeyTime.getHours() > 22 && journeyTime.getHours() < 5) {
		normalPrice *= MULTIPLIER
		aPrice *= MULTIPLIER
	}

	if(driverCount < DRIVER_LIMIT) {
		normalPrice *= MULTIPLIER
		aPrice *= MULTIPLIER
	}
	return normalPrice + aPrice
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
app.listen(SURGE_PORT, function() {
	console.log("Surge pricing is listening on " + SURGE_PORT)
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
	writeErrorResponse(response, 500, "500 Internal Server Error: " 
		+ "Something has gone wrong on the server. Please try " 
		+ "again in a little while.")
})