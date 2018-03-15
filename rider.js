const request = require('request')
const express = require("express")
const bodyParser = require("body-parser")


var app = express()
app.use( bodyParser.json() )



app.post("/AlleysRider/", function(request, response) {
	var start = request.body.start
	var end = request.body.end

	getMappingInformation(start, end, response)
})



function getMappingInformation(start, end, response) {
	request("http://localhost:3002/AlleysMapping/" 
		+ start.toString() 
		+ "/" 
		+ end.toString(),

		function(error, mapResponse, body) {
			if(error) {
				response.status(500).send("A team of highly trained monkeys has been dispatched to deal with the situation.")
			}

			else {
				response.json(body)
			}
		})
}



app.listen( 3003, function () {
	console.log( "listening on port 3003..." )
})