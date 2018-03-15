const https = require("https")
const querystring = require('querystring');

const express = require( "express" )
var app = express()

const mapsApiKey = "AIzaSyAMmf0RuNmg3VO3GVFGL1SJaKz4m2QAuVI"



app.get("/AlleysMapping/:start/:end", function(request, response) {
	var start = request.params.start
	var end = request.params.end

	var request = https.request({
		protocol: "https:",
		host: "maps.googleapis.com",
		path: "/maps/api/directions/json?" + querystring.stringify({
			origin: start,
			destination: end,
			region: "uk",
			key: mapsApiKey
		}),
		method: "POST"
	}, 

	function(apiResponse) {
		console.log(apiResponse.statusCode)
		var responseBody = ""
		apiResponse.on("data", function(resultData) {
			responseBody += resultData
		})

		apiResponse.on("end", function() {
			var directions = JSON.parse(responseBody)
			//directions contains the legs of the journey
			// each leg contains DirectionStep objects.
			var aRoadDistance = calculateARoadDistance(directions.routes[0].legs[0].steps);
			response.json(
				{totalDistance: directions.routes[0].legs[0].distance.value, aDistance: aRoadDistance}
			)
		})
	})

	request.on("error", function() {
		response.send("500: Internal Server Error: A team of highly trained monkeys " 
			+ "has been dispatched to deal with the situation.")
	})
	
	request.end()
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



app.listen( 3002, function () {
	console.log( "listening on port 3002..." )
})



app.use(function(error, request, response, next){
    response.status(404).send("The page could not be found!");
});