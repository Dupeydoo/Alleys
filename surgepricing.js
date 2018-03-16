const express = require( "express" )
var app = express()

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



app.listen( 3001, function () {
	console.log( "listening on port 3001..." )
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