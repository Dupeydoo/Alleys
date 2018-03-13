const mongoCalls = require("./mongocalls")
const express = require( "express" )
const bodyParser = require( "body-parser" )
var app = express()
app.use( bodyParser.json() )



app.post( "/AlleysRoster/", function ( request, response ) {
	var keyValue = { key : request.body.key, value : request.body.value }
	mongoCalls.alleysCreate(keyValue, response)
})



app.get( "/AlleysRoster/:key", function ( request, response ) {
	var key = request.params.key
	mongoCalls.alleysRead(key, response)
})



app.get("/AlleysRoster/", function (request, response) {
	mongoCalls.alleysReadAll(response)
})



app.put("/AlleysRoster/:key", function (request, response) {
	var key = request.params.key
	var keyValue = { key : request.body.key, value : request.body.value }
	mongoCalls.alleysUpdate(key, keyValue, response)
})



app.delete("/AlleysRoster/:key", function(request, response) {
	var key = request.params.key
	mongoCalls.alleysDelete(key, response)
})



app.listen( 3000, function () {
	console.log( "listening on port 3000..." )
})