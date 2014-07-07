//var socket = require("socket.io-client")("http://localhost:8182");
var socket = require("socket.io-client")("http://bostontraintrack.com:8182");

function printbusdata(data, ident) {
  var vehicle = data[ident].body.vehicle;
  for (var v in vehicle) {
    console.log(vehicle[v]);
  }
}

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

  console.log(data);

  if ("red" in data) {
    console.log(">>>red:");
    printdata(data, "red");
  }

  if ("blue" in data) {
    console.log(">>>blue:");
    printdata(data, "blue");
  }

  if ("orange" in data) {
    console.log(">>>orange:");
    printdata(data, "orange");
  }

  if ("green" in data) {
    console.log(">>>green:");
    printdata(data, "green");
  }

  if ("bus" in data) {
    console.log(">>>bus:");
    printbusdata(data, "bus");
  }

}

socket.on("connect", function() {
  socket.on("myevent", function(data) { console.log("this is my event!"); console.log(data); } );
  //socket.on("update", function(data) { console.log("update"); console.log(data); } );
  socket.on("update", onupdate);
  socket.on("disconnect", function() { console.log("disconnected :("); } );

  socket.emit("enable");
});



//socket.emit("myevent", { data: "data!", itis: "moredata!" });
