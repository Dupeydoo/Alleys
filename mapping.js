const request = require("request")
const express = require("express")
var app = express()

const MAPS_API_KEY = "AIzaSyAMmf0RuNmg3VO3GVFGL1SJaKz4m2QAuVI"
const MAPPING_PORT = process.env.MAPPING_PORT ? process.env.MAPPING_PORT : 3000


app.get("/AlleysMapping/:start/:end", function(mapRequest, response) {
	var start = mapRequest.params.start
	var end = mapRequest.params.end
	var gMapsUrl = "https://maps.googleapis.com/maps/api/directions/json?origin=" + start 
		+ "&destination=" + end + "&region=uk&key=" + MAPS_API_KEY

	request.post(gMapsUrl, function(error, apiResponse, body) {
		var directions = JSON.parse(body)	
		if(!checkJsonResponse(response, directions)) { 
			return false 
		}

		var totalDistance = directions.routes[0].legs[0].distance.value

		if(checkMapResponse(error, response, totalDistance)) {
			var aRoadDistance = calculateARoadDistance(directions.routes[0].legs[0].steps)
			response.status(200).json(
				{totalDistance: totalDistance, aDistance: aRoadDistance}
			)
		}
	})
})



function calculateARoadDistance(routeSteps) {
	var stepsLength = routeSteps.length
	var aRoadMetres = 0;
	for(var i = 0; i < stepsLength - 1; i++) {
		var stepObject = routeSteps[i]
		if(stepObject.html_instructions.search(/<b>A[0-9]/) !== -1) {
			aRoadMetres += stepObject.distance.value
		}
	}
	return aRoadMetres;
}



function checkMapResponse(error, response, totalDistance) {
	if(error) {
		writeErrorResponse(response, 500, "500 Internal Server Error: " 
			+ "A team of highly trained monkeys has been dispatched " 
			+ "to deal with the situation.")
		return false
	}

	else if(totalDistance === 0 || totalDistance === undefined) {
		writeErrorResponse(response, 400, "400 Bad Request: Did you" 
		+ " provide a valid location for the start and " 
		+ "end locations?")
		return false
	}
	return true
}



function checkJsonResponse(response, directions) {
	status = directions.status
	 if(status === "OK") {
	 	return true
	 } 

	 else if(status === "NOT_FOUND") {
	 	writeErrorResponse(response, 404, "404 Not Found: " 
			+ "The start or end location could not be " 
			+ "geocoded.")
	 	return false
	 }
	 writeErrorResponse(response, 503, "503 Temporarily " 
	 	+ "Unavailable: " + status)
	 return false
}



function writeErrorResponse(response, code, message) {
	response.status(code).send(message)
}



app.listen(MAPPING_PORT, function() {
	console.log("Mapping is listening on " + MAPPING_PORT.toString())
})



app.use(function(request, response, next) {
    writeErrorResponse(response, 404, "404: The resource could not be found!");
});



app.use(function(error, request, response, next) {
	writeErrorResponse(response, 500, "500:Internal Server Error, A " 
		+ "team of highly trained monkeys has been dispatched to deal" 
		+ " with the situation.")
})