var socket = require("socket.io-client")("http://localhost:8181");


function printdata(data, color) {
  var trips = data[color].TripList.Trips;
  for (x in trips) {
    if ("Position" in trips[x]) {
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
  socket.emit("enable");
});

socket.on("update", onupdate);
socket.on("disconnect", function() { console.log("disconnected :("); } );

setInterval( function() { process.exit(); }, 600000 );

