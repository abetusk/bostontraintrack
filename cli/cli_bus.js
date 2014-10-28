var socket = require("socket.io-client")("http://localhost:8181");

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

  //console.log(data);

  var st = "";
  for (var ind in data ) {
    st += " (" + ind + " " + data[ind] + ")";
  }

  console.log(st);

}

socket.on("connect", function() {
  socket.on("myevent", function(data) { console.log("this is my event!"); console.log(data); } );
  //socket.on("update", function(data) { console.log("update"); console.log(data); } );
  socket.on("update:bus", onupdate);
  socket.on("disconnect", function() { console.log("disconnected :("); } );

  socket.emit("enable:bus");
});


//socket.emit("myevent", { data: "data!", itis: "moredata!" });

