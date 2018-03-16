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
			if(error) {
				response.status(500).send("A team of highly trained monkeys " 
					+ "has been dispatched to deal with the situation.")
			}

			else {
				var directions = JSON.parse(body)
				var aRoadDistance = calculateARoadDistance(directions.routes[0].legs[0].steps)
				response.json(
					{totalDistance: directions.routes[0].legs[0].distance.value, aDistance: aRoadDistance}
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



app.listen( 3002, function () {
	console.log( "listening on port 3002..." )
})



app.use(function(request, response, next){
    response.status(404).send("The page could not be found!");
});