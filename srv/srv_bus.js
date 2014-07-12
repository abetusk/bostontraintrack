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


var http = require("http");
var sockio = require('socket.io')();
var xmlparse = require("xml2js").parseString;

var g_verbose = 0;

var global_connect = { };
var global_status = { };

var g_bus_data = {};

var global_data = { n: 0,
                    interval : 10000,
                    port : 80,
                    url : "webservices.nextbus.com",
                    path : "/service/publicXMLFeed?command=vehicleLocations&a=mbta&t=0"
                  };


function flushSingleClientData( cli_id )
{

  console.log(">>>>> flushing", cli_id );

  for (var bus_id in g_bus_data)
  {

    //console.log("  ", bus_id, ">>");

    var bus_data = g_bus_data[bus_id];
    var s = JSON.stringify( bus_data );

    try 
    {
      global_connect[ cli_id ].emit( "update", bus_data );
    } catch (ee) {
      console.log("ERROR: flushing to client", cli_id, "(bus_id ", bus_id , ") failed");
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

  //console.log( dts +  " connected clients:", conn_count + ", (" +  global_data.n + "), (enabled: " +  enable_count +  "), vehicle_id:", vehicle_data.id );


}


function updateBus( body ) 
{

  console.log("updateBus:");
  //console.log( body );

  if (!("body" in body)) { return; }
  if (!("vehicle" in body["body"])) { return; }

  var vehicle = body["body"]["vehicle"];

  for ( var vehicle_id in g_bus_data)
  {
    g_bus_data[vehicle_id].status = "delete";
  }


  var dt  = Date.now();


  for (var ind in vehicle){
    //console.log( ind, vehicle[ind] );

    if (!("$" in vehicle[ind])) { continue; }
    var dat = vehicle[ind]["$"];

    if (!("routeTag" in dat)) { continue; }
    if (!("lat" in dat)) { continue; }
    if (!("lon" in dat)) { continue; }
    if (!("id" in dat)) { continue; }

    var bus_id = dat.id;
    var route = dat.routeTag;
    var latstr = dat.lat;
    var lonstr = dat.lon;
    var heading = dat["heading"];
    var secstr = dat["secsSinceReport"];

    if (secstr == "") { secstr = "0"; }

    var sec = parseInt(secstr);
    var ts = dt - sec;

    if ( (latstr == "") || (lonstr == "") ) 
    { 
      console.log("  " + bus_id + ">>> DEL");
      g_bus_data[bus_id] = { id : bus_id, route : route, status : "delete" }; 
      continue;
    }

    var lat = parseFloat(latstr);
    var lon = parseFloat(lonstr);


    if (bus_id in g_bus_data)
    {
      if ( (Math.abs(lat - g_bus_data[bus_id].lat) > 0.001) ||
           (Math.abs(lon - g_bus_data[bus_id].lon) > 0.001) )
      {

        var dlat = Math.abs(lat - g_bus_data[bus_id].lat);
        var dlon = Math.abs(lon - g_bus_data[bus_id].lon);

        console.log("  update>>", bus_id, lat, lon, dlat, dlon, heading); 

        g_bus_data[bus_id].timestamp = ts;
        g_bus_data[bus_id].lat = lat;
        g_bus_data[bus_id].lon = lon;
        g_bus_data[bus_id].status = "update";
        g_bus_data[bus_id].heading = heading;
        g_bus_data[bus_id].id = bus_id;
        g_bus_data[bus_id].route = route;
      } else  {
        if (g_bus_data[bus_id].status == "delete") {
          g_bus_data[bus_id].status = "idle";
        }
      }

    } else {

      g_bus_data[bus_id] = { 
        id : bus_id, 
        timestamp : ts,
        route: route, 
        lat : lat, 
        lon : lon, 
        status : "new", 
        heading : heading
      };

      console.log("  new>>", bus_id, lat, lon, heading);
    }

  }

  var remove_list = [];

  for ( var bus_id in g_bus_data )
  {

    if ( g_bus_data[bus_id].status != "idle" ) {
      pushData( g_bus_data[bus_id] );
    }
    if (g_bus_data[bus_id].status == "delete") { remove_list.push(bus_id); }
  }

  for (var ind=0; ind<remove_list.length; ind++)
  {
    console.log("  delete>>", remove_list[ind] );
    delete g_bus_data[ remove_list[ind] ];
  }




  return;

  var json_data;
  try  { json_data = JSON.parse(body); } 
  catch (ee) { console.log("json parse error:", ee ); return; }

  var data = g_bus_data[bus_id];

  for ( var vehicle_id in data )
  {
    data[vehicle_id].status = "delete";
  }

  // Save it in case we want it
  //
  global_data[bus_id] = json_data;

  for (var ind in json_data["Messages"])
  {
    var entry = json_data.Messages[ind];
    var vid = entry["Vehicle"];

    //if (vid != "" ){ console.log("GOT VID:", vid); }

    latstr = entry["Latitude"];
    lonstr = entry["Longitude"];

    if (vid == "") 
    {
      //console.log("empty vid, skipping");
      continue;
    }

    if ( (latstr == "") || (lonstr == "") ) 
    { 

      console.log("  " + bus_id + ">>> " + vid + " DEL");

      data[vid] = { id : vid, route : linename, status : "delete" }; 
      continue;
    }

    var lat = parseFloat(entry["Latitude"]);
    var lon = parseFloat(entry["Longitude"]);

    console.log("   " + linename + ">>>>" + vid + ", (" + lat + ", " + lon + ") [" + latstr + " " + lonstr + "] " + entry["Heading"]  );

    //console.log("vid in data?", (vid in data) );

    if (vid in data)
    {
      if ( (Math.abs(lat - data[vid].lat) > 0.001) ||
           (Math.abs(lon - data[vid].lon) > 0.001) )
      {

        var dlat = Math.abs(lat - data[vid].lat);
        var dlon = Math.abs(lon - data[vid].lon);

        console.log("  update>>", vid, lat, lon, dlat, dlon, entry["Heading"]);

        data[vid].timestamp = entry["TimeStamp"];
        data[vid].lat = lat;
        data[vid].lon = lon;
        data[vid].status = "update";
        data[vid].heading = entry["Heading"];
        data[vid].id = vid;
        data[vid].route = linename;
      } else  {

        if (data[vid].status == "delete") {
          data[vid].status = "idle";
        }

      }


    } else {

      data[vid] = { id : vid, timestamp : entry["TimeStamp"], route: linename, lat : lat, lon : lon, status : "new", heading : entry["Heading"] };

      console.log("  new>>", vid, lat, lon, entry["Heading"] );
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

function fetchBus() {

  var opt = { host: global_data.url, port:global_data.port, path: global_data.path };

  console.log("opt:", opt);

  try {
    var req = http.request( opt, function(res) {
      res.setEncoding('utf8');
      var body = '';
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() { 
        //console.log(body);
        try {
          xmlparse( body, function(err, result) {
            if (err) { console.log("got err:", err); return; }
            updateBus(result);
          });
        } catch (ee) {
          console.log("xml parse error:", ee );
        }
      });
    });
    req.on('error', function(err) { console.log("got http erro:", err); });
    req.end();
  } catch (err2) {
    console.log("http request error? " + err2);
  }

  var conn_count   = countconn();
  var enable_count = countenable();

  var dt  = Date.now();
  var dts = dt.toString();

  console.log( dts +  " connected clients:", conn_count, ", (", global_data.n, "), (enabled: ", enable_count, ")" );

}

// Do an initial burst to setup all commuter lines
//
fetchBus();

setInterval( fetchBus, global_data.interval );

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

sockio.listen(8182);

