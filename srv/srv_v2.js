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

// Updated version of subway server to transmit only deltas.
// Modeled off of the commuter rail server.

var http = require("http");
var fs = require("fs");
var sockio = require('socket.io')();
var protobuf = require("protobufjs");
var builder = protobuf.loadProtoFile("gtfs-realtime.proto");
var feedmessage = builder.build("transit_realtime.FeedMessage");

var g_route_info = JSON.parse( fs.readFileSync('route_info.json', 'utf8') );

var g_verbose = 1;
var g_debug = 0;

var g_mbta_type = [ "", "subway", "commuter", "bus" ];

var global_data = {};
var global_connect = { };
var global_status = { };

// has information by vehicle id
//
var g_vehicle_data = { };

var g_total_connections = 0;
var g_interval = 10000;
var g_http_mbta_opt = { host:"developer.mbta.com", port:80, path:"/lib/GTRTFS/Alerts/VehiclePositions.pb" };

function flushSingleClientData( cli_id, feed_type )
{
  var update_feed = ((typeof feed_type === "undefined") ? "update" : ("update:" + feed_type));
  var feed = ((typeof feed_type === "undefined") ? "" : feed_type );

  var all_feed = false;
  if (!feed_type) { all_feed = true; }

  //if (g_verbose) { console.log(">>>>> flushing", cli_id ); }

  for (var vid in g_vehicle_data)
  {

    if ((!all_feed) && 
        (g_vehicle_data[vid].route_group != feed)) {
      continue;
    }

    var s = JSON.stringify( g_vehicle_data[vid] );

    //if (g_verbose) { console.log("      ", vid, update_feed, ">>>", s); }

    try 
    {
      global_connect[ cli_id ].emit( update_feed, g_vehicle_data[vid] );
    } catch (ee) {
      if (g_verbose) {
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

function countenable( feed_type ) {
  var feed = ((typeof feed_type === "undefined") ? "" : (":" + feed_type));
  var enable_count=0;
  for (var cli_id in global_connect) {
    try {
      if (global_status[ cli_id + feed].enable) { enable_count++; }
    } catch (ee) {
      console.log(ee, cli_id, feed);
      return -1; }
  }
  return enable_count;
}

// Push a single vehicle update to all clients.
//
function pushData( vehicle_data ) 
{
  var conn_count = 0;
  var enable_count = [0,0,0,0];
  var dts = Date.now().toString();

  for (var cli_id in global_connect) 
  {
    conn_count++;

    for (var f_ind=0; f_ind<g_mbta_type.length; f_ind++) {
      var feed = g_mbta_type[f_ind];
      if (feed.length > 0) {
        if (vehicle_data.route_group != feed) { continue; }
        feed = ":" + feed;
      }

      try 
      {
        if (global_status[ cli_id + feed ].enable) 
        {
          if (g_verbose) {
            console.log(dts, "push>>>> cli", cli_id, "feed", feed, "vid", vehicle_data.id );
          }

          enable_count[f_ind]++;
          global_connect[ cli_id ].emit( "update" + feed, vehicle_data );
        }
      } catch (ee) {
        console.log("ERROR: pushing to client", cli_id, "(vehicle_id", vehicle_id, ") failed");
      }
    }
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

function updateVehiclePositions( buf ) {

  var fm = feedmessage.decode(buf);
  if (!fm) {
    if (g_verbose) {
      console.log("ERROR: updateVehiclePositions could not decode buffer");
    }
    return;
  }

  var ent = fm.entity;
  var n = ent.length;

  // We sweep through and mark every entry as 'delete'.
  // If we encounter it below, we will mark it as 'update'.
  // New entries will be added and marked as 'new'.
  //
  for ( var vehicle_id in g_vehicle_data )
  {
    g_vehicle_data[vehicle_id].status = "delete";
  }

  // Walk our enttity list and update our vehicle data
  // structure.
  //
  for ( var i=0; i<n; i++ )
  {

    if (g_debug) { console.log( "ent[", i, "]:", ent[i]); }

    var veh = ent[i].vehicle;

    var vid = veh.vehicle.id;
    var lat = veh.position.latitude;
    var lon = veh.position.longitude;
    var heading = veh.position.bearing;
    var route_id = veh.trip.route_id;
    var trip_id = veh.trip.trip_id;
    var timestr = veh.timestamp.low;

    var route_name = "?";
    var route_group = "?";
    var route_info = "?";
    if ( route_id in g_route_info ) {
      route_name = g_route_info[route_id]["route_name"];
      route_group = g_route_info[route_id]["route_group"];
      route_info = g_route_info[route_id]["info"];
    }

    if (g_verbose) {
      //console.log("veh>>", vid,  route_name, route_group, route_id, "(", lat, lon, heading, ")" );
    }

    if (vid in g_vehicle_data)
    {

      // If the vid is in our vehicle list already and it's position has
      // changed, update it.
      //
      // Else, mark it as idle.
      //
      if ( (Math.abs(lat - g_vehicle_data[vid].lat) > 0.001) ||
           (Math.abs(lon - g_vehicle_data[vid].lon) > 0.001) )
      {

        var dlat = Math.abs(lat - g_vehicle_data[vid].lat);
        var dlon = Math.abs(lon - g_vehicle_data[vid].lon);

        //if (g_debug) { console.log("  update>>", vid, lat, lon, dlat, dlon, heading ); }
        //if (g_verbose) { console.log("  update>>", vid, lat, lon, dlat, dlon, heading ); }

        g_vehicle_data[vid].timestamp = timestr;
        g_vehicle_data[vid].lat = lat;
        g_vehicle_data[vid].lon = lon;
        g_vehicle_data[vid].status = "update";
        g_vehicle_data[vid].heading = heading;
        g_vehicle_data[vid].id = vid;
        g_vehicle_data[vid].route_id = route_id ;
        g_vehicle_data[vid].route = route_name;
        g_vehicle_data[vid].trip_name = trip_id;
        g_vehicle_data[vid].route_group = route_group;
        g_vehicle_data[vid].route_info = route_info;
      } else  {

        if (g_vehicle_data[vid].status == "delete") {
          g_vehicle_data[vid].status = "idle";
        }

      }

    } else {

      g_vehicle_data[vid] = {
        id : vid,
        timestamp : timestr,
        route : route_name,
        route_id : route_id,
        route_group : route_group,
        route_info : route_info,
        trip_name : trip_id,
        lat : lat,
        lon : lon,
        status : "new",
        heading : heading };

      //if (g_debug) { console.log("  new>>", vid, lat, lon, heading ); }
      //if (g_verbose) { console.log("  new>>", vid, lat, lon, heading ); }

    }

  }

  // We need removal to be atomic, so put all
  // vehicles that are marked for delition into
  // a list then delete afterwards.
  //
  var remove_list = [];
  for ( var vid in g_vehicle_data )
  {

    // For anything other than an 'idle' message (that is,
    // a 'new' or 'delete'), push it to the client.
    //
    if ( g_vehicle_data[vid].status != "idle" ) {
      pushData( g_vehicle_data[vid] );
    }

    if (g_vehicle_data[vid].status == "delete") { remove_list.push(vid); }
  }

  for (var ind=0; ind<remove_list.length; ind++)
  {

    if (g_debug) { console.log("  delete>>>", remove_list[ind] ); }

    g_vehicle_data[ remove_list[ind] ] = null;
    delete g_vehicle_data[ remove_list[ind] ];
  }

}

// Makes the request to the MBTA real time server, collects
// the chunks of the (binary data) response and calls 
// 'updateVehiclePositions' when the data is ready.
//
function fetchVehiclePositions() {

  try {
    var req = http.request( g_http_mbta_opt, function(res) {
      var body = new Buffer([]);
      res.on('data', function(chunk) {
        var c = new Buffer( chunk );
        var b = Buffer.concat([ body, c ]);
        body = b;
      });
      res.on('end', function() { updateVehiclePositions( body ); });
    });
    req.on('error', function(err) {
      if (g_verbose) {
        console.log("got http error:", err);
      }
    });
    req.end();
  } catch (err2) {

    if (g_verbose) {
      console.log("http request error? " + err2);
    }
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
fetchVehiclePositions();

// And set up our polling to fetch new data every
// g_inteval seconds.
//
setInterval( fetchVehiclePositions, g_interval );

// We want clients to subscribe to individual feeds ('subway',
// 'bus', 'commuter' or all) to limit bandwidth.  We keep
// a 'global_status' hash map that tells us whether the clients
// are enabled for that feed.  The key being the 'local_name'
// (the connection number) with the type of feed concatenated
// (with a colon separation).  We let the client subscribe
// to everything and the keys are just the local_name.
//
// Clients subscribe via 'enable(:subway|:bus|:commuter)?' and
// unsubscribe via 'disable(:subway|:bus|:commuter)?' socket.io
// messages.
//
// On enable, the state is flushed.  there is a setInterval above
// that polls every g_interval millisecnds the MBTA feed.
//
sockio.on('connection', function(socket) { 

  if (g_verbose) { console.log("connection!"); }

  g_total_connections++;
  var local_name = g_total_connections;
  global_connect[ local_name ] = socket;

  for ( var i=0; i<g_mbta_type.length; i++) {
    var tt = ( (g_mbta_type[i].length > 0) ? (":" + g_mbta_type[i]) : "" );
    var pp = ( (g_mbta_type[i].length > 0) ? (g_mbta_type[i]) : undefined );

    global_status[ local_name + tt ] = { enable : false };

    socket.on("enable" + tt,
      (function( feed_mod, feed_type ) {
        return function(msg) {
          if (g_verbose) { console.log("enable" + feed_mod, local_name, feed_mod, feed_type); }
          global_status[ local_name + feed_mod ].enable = true;
          flushSingleClientData( local_name, feed_type );
          };
      })( tt, pp )
    );

    socket.on("disable" + tt,
      (function( feed_mod, feed_type) {
        return function(msg) {
          if (g_verbose) { console.log("disable" + feed_mod, local_name, feed_mod, feed_type ); }
          global_status[ local_name + feed_mod ].enable = false;
        };
      })( tt, pp )
    );

  }

  socket.on("disconnect", function() { 
    if (g_verbose) { console.log("disconnecting client ", local_name); }

    delete global_connect[ local_name ];

    for ( var i=0; i<g_mbta_type.length; i++) {
      var tt = ( (g_mbta_type[i].length > 0) ? (":" + g_mbta_type[i]) : "" );
      delete global_status[ local_name + tt];
    }

  });

});

sockio.listen(8181);

