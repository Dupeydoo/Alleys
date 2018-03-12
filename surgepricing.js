var express = require( "express" )
var app = express()



app.get( "/AlleysRoster/:aRoad&:journeyStart&:rosterCount", function ( request, response ) {
	var aRoad = request.params.aRoad
	var journeyStart = request.params.journeyStart
	var rosterCount = request.params.rosterCount
})



app.listen( 3001, function () {
	console.log( "listening on port 3001..." )
})