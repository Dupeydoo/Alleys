const request = require('request')
const express = require("express")
const bodyParser = require("body-parser")


var app = express()
app.use(bodyParser.json())



app.post("/AlleysRider/", function(request, response) {
	var start = request.body.start
	var end = request.body.end
	if(validateStartEnd(response, start, end)) {
		getBestDriverPrice(start, end, response)
	}
})



function getBestDriverPrice(start, end, response) {
	request("http://localhost:3002/AlleysMapping/" 
		+ start.toString() 
		+ "/" 
		+ end.toString(),

		function(error, mapResponse, body) {
			if(error) {
				writeErrorResponse(response, 500, "500 Internal Server Error: " 
					+ "A team of highly trained monkeys has been dispatched to " 
					+ "deal with the situation.")
			}

			else {
				getCheapestKmRate(body, response)
			}
		})
}



function getCheapestKmRate(distances, response) {
	request("http://localhost:3000/AlleysRoster",	
		function(error, rosterResponse, body) {
			if(error) {
				writeErrorResponse(response, 500, "500 Internal Server Error: " 
					+ "A team of highly trained monkeys has been dispatched to " 
					+ "deal with the situation.")
			}

			else {
				getSurgePrice(distances, body, response)
			}
		})
}



function getSurgePrice(distances, driver, response) {
	var distances = JSON.parse(distances)
	var driver = JSON.parse(driver)

	var surgeData = { 
		totalDistance: distances.totalDistance,
		aDistance: distances.aDistance,
		driver: driver.driver,
		rate: driver.rate,
		driverCount: driver.count
	}

	request("http://localhost:3001/AlleysSurge/" 
		+ JSON.stringify(surgeData),

		function(error, surgeResponse, body) {
			response.send(body)
		}
	)
}



function validateStartEnd(response, start, end) {
	if(!start || !end || Number.isInteger(start) || Number.isInteger(end)) {
		writeErrorResponse(response, 400, "400 Bad Request: Valid start and " 
			+ "end locations must be provided!")
		return false
	}
	return true
}



function writeErrorResponse(response, code, message) {
	response.status(code).send(message)
}



app.listen( 3003, function () {
	console.log( "listening on port 3003..." )
})



app.use(function(request, response, next) {
    writeErrorResponse(response, 404, "404: The resource could not be found!");
});



app.use(function(error, request, response, next) {
	writeErrorResponse(response, 500, "500:Internal Server Error, A " 
		+ "team of highly trained monkeys has been dispatched to deal" 
		+ " with the situation.")
})