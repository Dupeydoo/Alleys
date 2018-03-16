const request = require('request')
const express = require("express")
const bodyParser = require("body-parser")


var app = express()
app.use(bodyParser.json())



app.post("/AlleysRider/", function(request, response) {
	var start = request.body.start
	var end = request.body.end
	getBestDriverPrice(start, end, response)
})



function getBestDriverPrice(start, end, response) {
	request("http://localhost:3002/AlleysMapping/" 
		+ start.toString() 
		+ "/" 
		+ end.toString(),

		function(error, mapResponse, body) {
			if(error) {
				response.status(500).send("A team of highly trained monkeys " 
					+ "has been dispatched to deal with the situation.")
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
				response.status(500).send("A team of highly trained monkeys " 
					+ "has been dispatched to deal with the situation.")
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



app.listen( 3003, function () {
	console.log( "listening on port 3003..." )
})