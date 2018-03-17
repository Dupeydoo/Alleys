const request = require("request")
const express = require("express")
const bodyParser = require("body-parser")

const RIDER_PORT = process.env.RIDER_PORT ? process.env.RIDER_PORT : 3003
const MAPPING_PORT = process.env.MAPPING_PORT ? process.env.MAPPING_PORT : 3000
const ROSTER_PORT = process.env.ROSTER_PORT ? process.env.ROSTER_PORT : 3001
const SURGE_PORT = process.env.SURGE_PORT ? process.env.SURGE_PORT : 3002
const HOST = process.env.IS_DOCKER ? "192.168.99.100" : "localhost"

var serverError = "500 Internal Server Error: Something has gone wrong on the server. Please try again in a little while."

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
	var mapUrl = "http://" + HOST + ":" + MAPPING_PORT 
		+ "/AlleysMapping/" + start + "/" + end
	request(mapUrl,
		function(error, mapResponse, body) {
			if(checkApiError(error, response, mapResponse)) {
				getCheapestKmRate(body, response)
			}
	})
}


function getCheapestKmRate(distances, response) {
	var rosterUrl = "http://" + HOST + ":" + ROSTER_PORT 
		+ "/AlleysRoster"
	request(rosterUrl,	
		function(error, rosterResponse, body) {
			if(checkApiError(error, response, rosterResponse)) {
				getSurgePrice(distances, body, response)
			}
	})
}


function getSurgePrice(distances, driver, response) {
	var distances = JSON.parse(distances)
	var driver = JSON.parse(driver)
	var surgeData = parseSurgeData(distances, driver)
	var surgeUrl = "http://" + HOST + ":" + SURGE_PORT 
		+ "/AlleysSurge/" + JSON.stringify(surgeData)
	request(surgeUrl, 
		function(error, surgeResponse, body) {
			if(checkApiError(error, response, surgeResponse)) {
				response.status(200).send(body)
			}
	})
}


function parseSurgeData(distances, driver) {
	return { totalDistance: distances.totalDistance, aDistance: distances.aDistance,
			 driver: driver.driver, rate: driver.rate, driverCount: driver.count }
}


function validateStartEnd(response, start, end) {
	if(!start || !end || Number.isInteger(start) || Number.isInteger(end) || start === end) {
		var badRequest = "400 Bad Request: Valid start and end locations must be provided!"
		writeErrorResponse(response, 400, badRequest)
		return false
	}
	return true
}


function checkApiError(error, response, apiResponse) {
	if(error) {
		writeErrorResponse(response, 500, serverError)
		return false
	}

	else if(apiResponse.statusCode > 299) {
		writeErrorResponse(response, apiResponse.statusCode, serverError)
		return false
	}
	return true
}


function writeErrorResponse(response, code, message) {
	response.status(code).send(message)
	logError(code, message)
}


function logError(code, message) {
	console.error(new Date().toDateString() + " [HTTP Code: " + code + ", Message: " + message + "]")
}


app.listen(RIDER_PORT, function() {
	console.log("Rider is listening on " + RIDER_PORT.toString())
})


app.use(function(request, response, next) {
    writeErrorResponse(response, 404, "404: The resource could not be found!");
});


app.use(function(error, request, response, next) {
	writeErrorResponse(response, 500, serverError)
})