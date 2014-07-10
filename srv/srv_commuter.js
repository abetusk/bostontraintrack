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

var g_verbose = 0;

var global_connect = { };
var global_status = { };

var g_line_vehicle_data = { 
  "Greenbush Line" : {},
  "Kingston/Plymouth Line" : {},
  "Middleborough/Lakeville Line" : {},
  "Fairmount Line" : {},
  "Providence/Stoughton Line" : {},
  "Franklin Line" : {},
  "Needham Line" : {},
  "Framingham/Worcester Line" : {},
  "Fitchburg Line" : {},
  "Lowell Line" : {},
  "Haverhill Line" : {},
  "Newburyport/Rockport Line" : {}
};

var global_data = { n: 0, 
                    interval : 10000,
                    port : 80,

                    url : "developer.mbta.com",

                    cur_line : 0,

                    n_line : 12,
                    //DEBUG
                    //n_line : 1,

                    name : [
                      "Greenbush Line",
                      "Kingston/Plymouth Line",
                      "Middleborough/Lakeville Line",
                      "Fairmount Line",
                      "Providence/Stoughton Line",
                      "Franklin Line",
                      "Needham Line",
                      "Framingham/Worcester Line",
                      "Fitchburg Line",
                      "Lowell Line",
                      "Haverhill Line",
                      "Newburyport/Rockport Line"
                     ],

                    path : {
                      "Greenbush Line" : "/lib/RTCR/RailLine_1.json",
                      "Kingston/Plymouth Line" : "/lib/RTCR/RailLine_2.json",
                      "Middleborough/Lakeville Line" : "/lib/RTCR/RailLine_3.json",
                      "Fairmount Line" : "/lib/RTCR/RailLine_4.json",
                      "Providence/Stoughton Line" : "/lib/RTCR/RailLine_5.json",
                      "Franklin Line" : "/lib/RTCR/RailLine_6.json",
                      "Needham Line" : "/lib/RTCR/RailLine_7.json",
                      "Framingham/Worcester Line" : "/lib/RTCR/RailLine_8.json",
                      "Fitchburg Line" : "/lib/RTCR/RailLine_9.json",
                      "Lowell Line" : "/lib/RTCR/RailLine_10.json",
                      "Haverhill Line" : "/lib/RTCR/RailLine_11.json",
                      "Newburyport/Rockport Line" : "/lib/RTCR/RailLine_12.json"
                    }

                  };

console.log("setting up lines...");


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

        console.log("  pushing " + cli_id + ">>>" + vehicle_data.id );

        global_connect[ cli_id ].emit( "update", vehicle_data );
      }
    } catch (ee) {
      console.log("ERROR: pushing to client", cli_id, "(vehicle_id", vehicle_id, ") failed");
    }

  }

  console.log( dts +  " connected clients:", conn_count, ", (", global_data.n, "), (enabled: ", enable_count, "), vehicle_id:", vehicle_data.id );


}


function updateCommuterRail( linename, body ) 
{

  console.log("updating line:", linename);
  //console.log(body);

  var json_data;
  try  { json_data = JSON.parse(body); } 
  catch (ee) { console.log("json parse error:", ee ); return; }

  var data = g_line_vehicle_data[linename];

  for ( var vehicle_id in data )
  {
    data[vehicle_id].status = "delete";
  }

  // Save it in case we want it
  //
  global_data[linename] = json_data;

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

      console.log("  " + linename + ">>> " + vid + " DEL");

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

function fetchCommuterLine() {
  var linename = global_data.name[ global_data.cur_line ]

  console.log("line:" , linename);
  console.log("cur_line:", global_data.cur_line, ", n_line:", global_data.n_line);

  global_data.cur_line++ ;
  global_data.cur_line %= global_data.n_line;

  if (g_verbose) { console.log("updating " , linename ); }
  var opt = { host: global_data.url, port:global_data.port, path: global_data.path[linename] };

  console.log("opt:", opt);

  try {
    var req = http.request( opt, function(res) {
      res.setEncoding('utf8');
      var body = '';
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() { 
        updateCommuterRail( linename, body ); 

        //debugPrint();
      });
    });
    req.on('error', function(err) { console.log("got http erro:", err); });
    req.end();
  } catch (err2) {
    console.log("http request error? " + err2);
  }

}

// Do an initial burst to setup all commuter lines
//
for (var line in global_data.path) {
  fetchCommuterLine();
}
//fetchCommuterLine();

setInterval( fetchCommuterLine, global_data.interval );


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

sockio.listen(8183);

