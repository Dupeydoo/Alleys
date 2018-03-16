const express = require( "express" )
var app = express()

const SURGE_PORT = process.env.SURGE_PORT ? process.env.SURGE_PORT : 3002
const DRIVER_LIMIT = 5
const MULTIPLIER = 2


app.get( "/AlleysSurge/:surgeParameters", function(request, response) {
	var surgeParameters = JSON.parse(request.params.surgeParameters)
	var parameters = surgeParameters
	var journeyTime = new Date()

	var totalDistance = parameters.totalDistance / 1000
	var aDistance = parameters.aDistance / 1000
	var driver = parameters.driver
	var rate = parameters.rate
	var driverCount = parameters.driverCount

	var normalPrice = (totalDistance - aDistance) * rate
	var aPrice = MULTIPLIER * (aDistance * rate)
	var price = calculatePrice(normalPrice, aPrice, journeyTime, driverCount)
	
	response.send("Driver: " + driver.toString() + ", " + "Price: " + (price / 100).toFixed(2) + " Pound Sterling.")
})



function calculatePrice(normalPrice, aPrice, journeyTime, driverCount) {
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
}



app.listen(SURGE_PORT, function() {
	console.log("Surge pricing is listening on " + SURGE_PORT.toString())
})



app.use(function(request, response, next) {
    writeErrorResponse(response, 404, "404: The resource could not be found!");
});



app.use(function(error, request, response, next) {
	writeErrorResponse(response, 500, "500:Internal Server Error, A " 
		+ "team of highly trained monkeys has been dispatched to deal" 
		+ " with the situation.")
})