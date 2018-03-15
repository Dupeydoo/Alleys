const http = require("http")
const querystring = require('querystring');


const express = require( "express" )
const bodyParser = require( "body-parser" )


var app = express()
app.use( bodyParser.json() )



app.post("/AlleysRider/", function(request, response) {
	var start = request.body.start
	var end = request.body.end

	getMappingInformation(start, end, response)
})



function getMappingInformation(start, end, response) {
	var request = http.request({
		protocol: "http:",
		host: "localhost",
		port: "3002",
		path: "/AlleysMapping/" 
			+ start.toString() 
			+ "/" 
			+ end.toString(),
		method: "GET"
	}, 

	function(mapResponse) {
		var responseBody = ""
		mapResponse.on("data", function(resultData) {
			responseBody += resultData
		})

		mapResponse.on("end", function() {
			var distances = JSON.parse(responseBody)
			response.json(distances)
		})
	})

	request.on("error", function(error) {
		console.log(error.message)
		response.send("500: Internal Server Error: A team of highly trained monkeys " 
			+ "has been dispatched to deal with the situation.")
	})
	
	request.end()
}



app.listen( 3003, function () {
	console.log( "listening on port 3003..." )
})