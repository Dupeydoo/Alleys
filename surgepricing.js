const express = require( "express" )
var app = express()



app.get( "/AlleysSurge/:aRoad&:rosterCount", function ( request, response ) {
	var aRoad = request.params.aRoad
	var rosterCount = request.params.rosterCount
	var journeyTime = new Date()
	var multiplier = 1

	if(aRoad) {
		multiplier *= 2
	}

	if(journeyTime.getHours() > 22 || journeyTime.getHours() < 5) {
		multiplier *= 2
	}

	if(rosterCount < 5) {
		multiplier *= 2
	}

	response.json({"multiplier" : multiplier})
})



app.listen( 3001, function () {
	console.log( "listening on port 3001..." )
})