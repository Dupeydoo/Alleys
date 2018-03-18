const express = require( "express" )
var app = express()

const SURGE_PORT = process.env.SURGE_PORT ? process.env.SURGE_PORT : 3002
const DRIVER_LIMIT = 5
const MULTIPLIER = 2


app.get( "/AlleysSurge/:surgeParameters", function(request, response) {
	var parameters = JSON.parse(request.params.surgeParameters)
	var totalDistance = parameters.totalDistance / 1000
	var aDistance = parameters.aDistance / 1000
	var rate = parameters.rate

	var normalPrice = (totalDistance - aDistance) * rate
	var aPrice = MULTIPLIER * (aDistance * rate) 
	var price = calculateFinalPrice(normalPrice, aPrice, parameters.driverCount)
	
	response.status(200).send("Driver: " + parameters.driver + ", " 
		+ "Price: " + formatPrice(price) + " Pound Sterling.")
})


function formatPrice(price) {
	return (price / 100).toFixed(2)
}


function calculateFinalPrice(normalPrice, aPrice, driverCount) {
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


function writeErrorResponse(response, code, message) {
	response.status(code).send(message)
	logError(code, message)
}


function logError(code, message) {
	console.error(new Date() + " [HTTP Code: " + code + ", Message: " + message + "]")
}


app.listen(SURGE_PORT, function() {
	console.log("Surge pricing is listening on " + SURGE_PORT)
})


app.use(function(request, response, next) {
    writeErrorResponse(response, 404, "404: The resource could not be found!");
});


app.use(function(error, request, response, next) {
	writeErrorResponse(response, 500, "500 Internal Server Error: " 
		+ "Something has gone wrong on the server. Please try " 
		+ "again in a little while.")
})