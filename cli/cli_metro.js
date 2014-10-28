var socket = require("socket.io-client")("http://localhost:8181");

//var socket = require("socket.io-client")("http://bostontraintrack.com:8190");
//var socket = require("socket.io-client")("http://bostontraintrack.com:8183");

function printdata(data, color) {
  var trips = data[color].TripList.Trips;
  for (x in trips) {
    //console.log(trips[x]);
    if ("Position" in trips[x]) {
      //console.log("TripID: " + trips[x].TripID + " ");
      process.stdout.write("TripID: " + trips[x].TripID + " ");
      console.log("Position (" + 
          trips[x].Position.Timestamp + ") " + 
          "lat: " + trips[x].Position.Lat + ", long: " + trips[x].Position.Long + 
          ", heading: " + trips[x].Position.Heading );
    } else { }
  }
}

function onupdate(data) {

  console.log("update>>>");
  console.log(data);

}

console.log("...");

socket.on("connect", function() {

  console.log("connected! -->");

  //socket.on("update", onupdate);
  //socket.on("disconnect", function() { console.log("disconnected :("); } );

  //console.log("enabling!");
  socket.emit("enable:subway");

});

socket.on("update:subway", onupdate);
socket.on("disconnect", function() { console.log("disconnected :("); } );

//console.log("enabling!");
//socket.emit("enable");

//20sec
//setInterval( function() { process.exit(); }, 20000 );
//10min
setInterval( function() { process.exit(); }, 600000 );

