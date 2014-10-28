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
var fs = require("fs");
//var MBTA_KEY = fs.readFileSync( "mbta.key" ).toString().trim();
var MBTA_KEY = fs.readFileSync( "../experimental/abetusk.key" ).toString().trim();

var g_verbose = 1;
var g_debug = 0;

var global_data = {};
var global_connect = { };
var global_status = { };

// has information by route id
//
var g_vehicle_data = { };

var g_total_connections = 0;

var g_port = 80;
var g_interval = 10000;
var g_req_url = "realtime.mbta.com";
var g_req_url_path = "/developer/api/v2/vehiclesbyroute?api_key=" + MBTA_KEY +
                     "&format=json&route=";

var g_route_info = { 
  "810_" : { "route" : "810_", "name" : "Green Line", "color" : "green" },
  "813_" : { "route" : "813_", "name" : "Green Line", "color" : "green" },
  "823_" : { "route" : "823_", "name" : "Green Line", "color" : "green" },
  "830_" : { "route" : "830_", "name" : "Green Line", "color" : "green" },
  "831_" : { "route" : "831_", "name" : "Green Line", "color" : "green" },
  "840_" : { "route" : "840_", "name" : "Green Line", "color" : "green" },
  "842_" : { "route" : "842_", "name" : "Green Line", "color" : "green" },
  "851_" : { "route" : "851_", "name" : "Green Line", "color" : "green" },
  "852_" : { "route" : "852_", "name" : "Green Line", "color" : "green" },
  "880_" : { "route" : "880_", "name" : "Green Line", "color" : "green" },
  "882_" : { "route" : "882_", "name" : "Green Line", "color" : "green" },
  "946_" : { "route" : "946_", "name" : "Blue Line", "color" : "blue" },
  "948_" : { "route" : "948_", "name" : "Blue Line", "color" : "blue" },
  "903_" : { "route" : "903_", "name" : "Orange Line", "color" : "orange" },
  "913_" : { "route" : "913_", "name" : "Orange Line", "color" : "orange" },
  "931_" : { "route" : "931_", "name" : "Red Line", "color" : "red" },
  "933_" : { "route" : "933_", "name" : "Red Line", "color" : "red" }
};

function flushSingleClientData( cli_id )
{
  if (g_verbose) { console.log(">>>>> flushing", cli_id ); }

  for (var route_id in g_vehicle_data)
  {
    for (var vid in g_vehicle_data[route_id])
    {

      var s = JSON.stringify( g_vehicle_data[route_id][vid] );
      if (g_verbose) { console.log("      ", vid, ">>>", s); }

      try 
      {
        global_connect[ cli_id ].emit( "update", g_vehicle_data[route_id][vid] );
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

        if (g_verbose) {
          console.log("  pushing " + cli_id + ">>>" + vehicle_data.id );
        }

        global_connect[ cli_id ].emit( "update", vehicle_data );
      }
    } catch (ee) {
      console.log("ERROR: pushing to client", cli_id, "(vehicle_id", vehicle_id, ") failed");
    }

  }

  if (g_verbose) {
    console.log( dts +  " connected clients:", conn_count, ", (", g_total_connections, "), (enabled: ", enable_count, "), vehicle_id:", vehicle_data.id );
  }


}


function updateRoute( route_id, body ) 
{

  if (g_verbose) { console.log("updating route:", route_id ); }

  var json_data;
  try  { json_data = JSON.parse(body); } 
  catch (ee) { if (g_verbose) { console.log("json parse error:", ee ); }  return; }

  if (g_verbose) { console.log(json_data); }

  if (!("direction" in json_data)) { console.log("Could not find dirction in data, bailing out"); return; }

  for (var dir_ind in json_data["direction"])
  {
    if (!("trip" in json_data["direction"][dir_ind]))
    {
      console.log("Could not find trip in data, bailing out");
      return;
    }
  }

  var data = {};
  if (!(route_id in g_vehicle_data)) {
    g_vehicle_data[ route_id ] = data;
  }

  //if (route_id in g_vehicle_data) { data = g_vehicle_data[ route_id ]; }
  data = g_vehicle_data[ route_id ];


  // We sweep through and mark every entry as 'delete'.
  // If we encounter it below, we will mark it as 'update'.
  // New entries will be added and marked as 'new'.
  //
  for ( var vehicle_id in data )
  {
    data[vehicle_id].status = "delete";
  }

  // Save it in case we want it
  //
  global_data[ route_id ] = json_data;

  for ( var dir_ind in json_data["direction"] )
  {
    for ( var trip_ind in json_data["direction"][dir_ind]["trip"] )
    {

      if (!("vehicle" in json_data["direction"][dir_ind]["trip"][trip_ind])) {
        continue
      }

      var entry = json_data["direction"][dir_ind]["trip"][trip_ind]["vehicle"];
      var trip_name = json_data["direction"][dir_ind]["trip"][trip_ind]["trip_name"];

      //headsign doesn't appear for green lines?
      //var trip_headsign = json_data["direction"][dir_ind]["trip"][trip_ind"]["trip_headsign"];


      if (g_verbose) { console.log(entry); }

      if (!( "vehicle_timestamp" in entry)) { continue; }
      if (!( "vehicle_bearing" in entry)) { continue; }
      if (!( "vehicle_lat" in entry)) { continue; }
      if (!( "vehicle_lat" in entry)) { continue; }
      if (!( "vehicle_id" in entry)) { continue; }

      var vid = entry["vehicle_id"];
      var latstr = entry["vehicle_lat"];
      var lonstr = entry["vehicle_lon"];
      var headstr = entry["vehicle_bearing"];
      var timestr = entry["vehicle_timestamp"];

      if ((latstr == "") || (lonstr == "")) { continue; }

      var lat = parseFloat( latstr );
      var lon = parseFloat( lonstr );
      var heading = parseInt( headstr );

      if (vid == "") { continue; }

      if ( (latstr == "") || (lonstr == "") ) 
      { 

        if (g_verbose) {
          console.log("  " + route_id + ">>> " + vid + " DEL");
        }

        data[vid] = { id : vid, route : route_id, status : "delete" }; 
        continue;
      }

      if (g_verbose) {
        console.log("   " + 
                    route_id + ">>>> " + 
                    vid + ", (" + lat + ", " + lon + ") " +
                    "[" + latstr + " " + lonstr + "] " + heading );
      }

      if (vid in data)
      {
        if ( (Math.abs(lat - data[vid].lat) > 0.001) ||
             (Math.abs(lon - data[vid].lon) > 0.001) )
        {

          var dlat = Math.abs(lat - data[vid].lat);
          var dlon = Math.abs(lon - data[vid].lon);

          if (g_debug) { console.log("  update>>", vid, lat, lon, dlat, dlon, heading ); }
          if (g_verbose) { console.log("  update>>", vid, lat, lon, dlat, dlon, heading ); }

          data[vid].timestamp = timestr;
          data[vid].lat = lat;
          data[vid].lon = lon;
          data[vid].status = "update";
          data[vid].heading = heading;
          data[vid].id = vid;
          data[vid].route_id = route_id ;
          data[vid].route = g_route_info[route_id]["color"];
          data[vid].trip_name = trip_name;
        } else  {

          if (data[vid].status == "delete") {
            data[vid].status = "idle";
          }

        }

      } else {

        data[vid] = {
          id : vid,
          timestamp : entry["TimeStamp"],
          route : g_route_info[route_id]["color"],
          route_id : route_id,
          trip_name : trip_name,
          lat : lat,
          lon : lon,
          status : "new",
          heading : heading };

        if (g_debug) { console.log("  new>>", vid, lat, lon, heading ); }
        if (g_verbose) { console.log("  new>>", vid, lat, lon, heading ); }

      }

    }

  }

  // We need removal to be atomic, so put all
  // vehicles that are marked for delition into
  // a list then delete afterwards.
  //
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

    if (g_debug) { console.log("  delete>>>", remove_list[ind] ); }

    data[ remove_list[ind] ] = null;
    delete data[ remove_list[ind] ];
  }


}

function debugPrint() {
  console.log("DEBUG");
  for (var route in g_vehicle_data) {
    var train_data = g_vehicle_data[route];
    for (var vid in train_data) {
      console.log( vid, train_data[vid] );
    }
  }
}

function fetchRoute( route_id ) {

  if (g_verbose) {
    console.log("route_id:" , route_id );
  }

  if (g_verbose) { console.log("updating " , route_id); }
  var opt = { host: g_req_url, port:g_port, path: g_req_url_path + route_id };

  if (g_verbose) {
    console.log("opt:", opt);
  }

  try {
    var req = http.request( opt, function(res) {
      res.setEncoding('utf8');
      var body = '';
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() { 
        updateRoute( route_id , body ); 
      });
    });
    req.on('error', function(err) { console.log("got http error for", route_id, ":", err); });
    req.end();
  } catch (err2) {
    console.log("http request error? " + err2);
  }

  var c = countconn();
  var e = countenable();
  
  var dt = Date.now();
  var dts = dt.toString();

  if (g_verbose) {
    console.log( dts +  " connected clients: " + c + " (" + e + ") [" + g_total_connections + "]" );
  }


}

// Do an initial burst to setup all commuter lines
//
for (var r in g_route_info) {
  fetchRoute( r );
}

for (var route_id in g_route_info) {
  setInterval( 
      (function(r) {
        return function() { fetchRoute(r); };
      })( route_id ) , g_interval
    );
}


sockio.on('connection', function(socket) { 

  if (g_verbose) { console.log("connection!"); }

  g_total_connections++;
  var local_name = g_total_connections;
  global_connect[ local_name ] = socket;
  global_status [ local_name ] = { enable : false };

  socket.on("enable", function(msg) {
    if (g_verbose) { console.log("enable:", local_name); }
    global_status[ local_name ].enable = true;
    flushSingleClientData( local_name );
  });

  socket.on("disable", function(msg) {
    if (g_verbose) { console.log("disable:", local_name); }
    global_status[ local_name ].enable = false;
  });

  socket.on("disconnect", function() { 
    if (g_verbose) { console.log("disconnecting client ", local_name); }
    delete global_connect[ local_name ];
    delete global_status [ local_name ];

  });

});

sockio.listen(8194);

