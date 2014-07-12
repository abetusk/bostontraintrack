/*

    Copyright (C) 2013 Abram Connelly

    This file is part of bostontraintrack.

    bostontraintrack is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    bostontraintrack is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with bostontraintrack.  If not, see <http://www.gnu.org/licenses/>.

*/

// Updated version of metro server to transmit only deltas.
// Modeled off of the commuter rail server.

var http = require("http");
var sockio = require('socket.io')();

var g_verbose = 0;

var global_connect = { };
var global_status = { };

var g_line_vehicle_data = { 
  "red" : {},
  "orange" : {},
  "blue" : {}
};

var global_data = { n: 0, 
                    interval : { red : 10000, orange : 13000, blue : 17000 },
                    port : 80,
                    name : [ "red", "blue", "orange" ],

                    url : "developer.mbta.com",
                    path : { red : "/lib/rthr/red.json",
                             blue: "/lib/rthr/blue.json",
                             orange: "/lib/rthr/orange.json" }
                  };

console.log("setting up colors...");


function flushSingleClientData( cli_id )
{

  console.log(">>>>> flushing", cli_id );

  for (var route in g_line_vehicle_data)
  {

    console.log("  ", route, ">>");

    var train_data = g_line_vehicle_data[route];
    for (var vid in train_data)
    {

      var s = JSON.stringify( train_data[vid] );
      console.log("      ", vid, ">>>", s);
      //console.log( train_data[vid] );

      try 
      {
        global_connect[ cli_id ].emit( "update", train_data[vid] );
      } catch (ee) {
        console.log("ERROR: flushing to client", cli_id, "(vehicle_id", vid , ") failed");
      }

    }
  }

}

function countconn() {
  var conn_count=0;
  for (var cli_id in global_connect) { conn_count++; }
  return conn_count;
}

function countenable() {
  var enable_count=0;
  for (var cli_id in global_connect) {
    try {
      if (global_status[ cli_id ].enable) { enable_count++; }
    } catch (ee) { return -1; }
  }
  return enable_count;
}

function pushData( vehicle_data ) 
{

  var conn_count = 0;
  var enable_count=0;

  var dt = Date.now();
  var dts = dt.toString();


  for (var cli_id in global_connect) 
  {
    conn_count++;

    try 
    {
      if (global_status[ cli_id ].enable) 
      {
        enable_count++;

        console.log("  pushing " + cli_id + ">>>" + vehicle_data.id );

        global_connect[ cli_id ].emit( "update", vehicle_data );
      }
    } catch (ee) {
      console.log("ERROR: pushing to client", cli_id, "(vehicle_id", vehicle_id, ") failed");
    }

  }

  console.log( dts +  " connected clients:", conn_count, ", (", global_data.n, "), (enabled: ", enable_count, "), vehicle_id:", vehicle_data.id );


}


function updateLine( color_name , body ) 
{

  console.log("updating line:", color_name );

  var json_data;
  try  { json_data = JSON.parse(body); } 
  catch (ee) { console.log("json parse error:", ee ); return; }

  console.log(json_data);

  if (!("TripList" in json_data)) { console.log("Could not find TripList in data, bailing out"); return; }
  if (!("Trips" in json_data["TripList"])) { console.log("Could not find Trips in data, bailing out"); return; }

  var data = g_line_vehicle_data[ color_name ];

  for ( var vehicle_id in data )
  {
    data[vehicle_id].status = "delete";
  }

  // Save it in case we want it
  //
  global_data[ color_name ] = json_data;

  //for (var ind in json_data["Messages"])
  for ( var ind in json_data["TripList"]["Trips"] )
  {

    //var entry = json_data.Messages[ind];
    var entry = json_data["TripList"]["Trips"][ind];

    console.log(entry);

    if (!("TripID" in entry)) { continue; }
    if (!("Position" in entry)) { continue; }
    if (!( "Lat" in entry["Position"])) { continue; }
    if (!( "Long" in entry["Position"])) { continue; }
    if (!( "Heading" in entry["Position"])) { continue; }

    var vid = entry["TripID"];
    var latstr = entry["Position"]["Lat"];
    var lonstr = entry["Position"]["Long"];
    var headstr = entry["Position"]["Heading"];

    if ((latstr == "") || (lonstr == "")) { continue; }

    var lat = parseFloat( entry["Position"]["Lat"] );
    var lon = parseFloat( entry["Position"]["Long"] );
    var heading = parseInt( entry["Position"]["Heading"] );

    //var vid = entry["Vehicle"];

    //latstr = entry["Latitude"];
    //lonstr = entry["Longitude"];

    if (vid == "") { continue; }

    if ( (latstr == "") || (lonstr == "") ) 
    { 

      console.log("  " + color_name + ">>> " + vid + " DEL");

      data[vid] = { id : vid, route : color_name , status : "delete" }; 
      continue;
    }

    //var lat = parseFloat(entry["Latitude"]);
    //var lon = parseFloat(entry["Longitude"]);

    console.log("   " + color_name + ">>>>" + vid + ", (" + lat + ", " + lon + ") [" + latstr + " " + lonstr + "] " + heading );

    //console.log("vid in data?", (vid in data) );

    if (vid in data)
    {
      if ( (Math.abs(lat - data[vid].lat) > 0.001) ||
           (Math.abs(lon - data[vid].lon) > 0.001) )
      {

        var dlat = Math.abs(lat - data[vid].lat);
        var dlon = Math.abs(lon - data[vid].lon);

        console.log("  update>>", vid, lat, lon, dlat, dlon, heading );

        data[vid].timestamp = entry["TimeStamp"];
        data[vid].lat = lat;
        data[vid].lon = lon;
        data[vid].status = "update";
        data[vid].heading = heading;
        data[vid].id = vid;
        data[vid].route = color_name ;
      } else  {

        if (data[vid].status == "delete") {
          data[vid].status = "idle";
        }

      }


    } else {

      data[vid] = { id : vid, timestamp : entry["TimeStamp"], route: color_name, lat : lat, lon : lon, status : "new", heading : heading };

      console.log("  new>>", vid, lat, lon, heading );
    }

  }

  var remove_list = [];

  for ( var vid in data )
  {

    if ( data[vid].status != "idle" ) {
      pushData( data[vid] );
    }
    if (data[vid].status == "delete") { remove_list.push(vid); }
  }

  for (var ind=0; ind<remove_list.length; ind++)
  {
    delete data[ remove_list[ind] ];
  }


}

function debugPrint() {
  console.log("DEBUG");
  for (var route in g_line_vehicle_data) {
    var train_data = g_line_vehicle_data[route];
    for (var vid in train_data) {
      console.log( vid, train_data[vid] );
    }
  }
}

function fetchLine( color_name ) {

  console.log("line:" , color_name );

  if (g_verbose) { console.log("updating " , color_name ); }
  var opt = { host: global_data.url, port:global_data.port, path: global_data.path[ color_name ] };

  console.log("opt:", opt);

  try {
    var req = http.request( opt, function(res) {
      res.setEncoding('utf8');
      var body = '';
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() { 
        updateLine( color_name , body ); 
      });
    });
    req.on('error', function(err) { console.log("got http erro:", err); });
    req.end();
  } catch (err2) {
    console.log("http request error? " + err2);
  }

  var c = countconn();
  var e = countenable();
  
  var dt = Date.now();
  var dts = dt.toString();

  console.log( dts +  " connected clients: " + c + ", (" +  global_data.n + "), (enabled: " +  e + ")");


}

// Do an initial burst to setup all commuter lines
//
for (var i=0; i<global_data.name.length; i++) {
  fetchLine( global_data.name[i]);
}

for (var i=0; i<global_data.name.length; i++) {
  var color_name = global_data.name[i];
  setInterval( 
      (function(RBO) {
        return function() { fetchLine(RBO); };
      })( color_name ) , global_data.interval[color_name] 
    );
}


sockio.on('connection', function(socket) { 
  console.log("connection!"); 

  global_data.n++;
  var local_name = global_data.n;
  global_connect[ local_name ] = socket;
  global_status [ local_name ] = { enable : false };

  socket.on("enable", function(msg) {
    console.log("enable:", local_name);
    global_status[ local_name ].enable = true;
    flushSingleClientData( local_name );
  });

  socket.on("disable", function(msg) {
    console.log("disable:", local_name);
    global_status[ local_name ].enable = false;
  });

  socket.on("disconnect", function() { 
    console.log("disconnecting client ", local_name); 
    delete global_connect[ local_name ];
    delete global_status [ local_name ];

  });

});

sockio.listen(8184);

