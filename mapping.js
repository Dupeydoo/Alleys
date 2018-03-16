const request = require("request")
const express = require( "express" )
var app = express()

const mapsApiKey = "AIzaSyAMmf0RuNmg3VO3GVFGL1SJaKz4m2QAuVI"


app.get("/AlleysMapping/:start/:end", function(mapRequest, response) {
	var start = mapRequest.params.start
	var end = mapRequest.params.end

	request("https://maps.googleapis.com/maps/api/directions/json?origin=" + start.toString() 
		+ "&destination=" + end.toString() + "&region=uk&key=" + mapsApiKey,

		function(error, apiResponse, body) {
			var directions = JSON.parse(body)
			var totalDistance = directions.routes[0].legs[0].distance.value
			if(error) {
				writeErrorResponse(response, 500, "A team of highly trained monkeys " 
					+ "has been dispatched to deal with the situation.")
			}

			else if(totalDistance === 0) {
				writeErrorResponse(response, 400, "400 Bad Request: Did you" 
				+ " provide a valid location for the start and " 
				+ "end locations?")
			}

			else {
				var aRoadDistance = calculateARoadDistance(directions.routes[0].legs[0].steps)
				response.json(
					{totalDistance: totalDistance, aDistance: aRoadDistance}
				)
			}
		})
})



function calculateARoadDistance(routeSteps) {
	var stepsLength = routeSteps.length
	var aM = 0;
	for(var i = 0; i < stepsLength - 1; i++) {
		var stepObject = routeSteps[i]
		if(stepObject.html_instructions.search(/<b>A[0-9]/) !== -1) {
			aM += stepObject.distance.value
		}
	}
	return aM;
}



function writeErrorResponse(response, code, message) {
	response.status(code).send(message)
}



app.listen( 3002, function () {
	console.log( "listening on port 3002..." )
})



app.use(function(request, response, next) {
    writeErrorResponse(response, 404, "404: The resource could not be found!");
});



app.use(function(error, request, response, next) {
	writeErrorResponse(response, 500, "500:Internal Server Error, A " 
		+ "team of highly trained monkeys has been dispatched to deal" 
		+ " with the situation.")
})