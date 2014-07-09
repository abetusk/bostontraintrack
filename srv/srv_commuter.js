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

var global_data = { n: 0, 
                    interval : 10000,
                    port : 80,

                    url : "developer.mbta.com",

                    cur_line : 0,
                    n_line : 12,
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

function fetchCommuterLine() {
  var linename = global_data.name[ global_data.cur_line ]

  console.log("line:" , linename);
  console.log("cur_line:", global_data.cur_line, ", n_line:", global_data.n_line);

  global_data.cur_line += 1;
  global_data.cur_line %= global_data.n_line;

  if (g_verbose) { console.log("udpating " , linename ); }
  var opt = { host: global_data.url, port:global_data.port, path: global_data.path[linename] };

  console.log("opt:", opt);

  try {

    var req = http.request( opt, function(res) {
      res.setEncoding('utf8');
      var body = '';
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() {

        console.log(body);

        try  {
          jr = JSON.parse(body);
          global_data[linename] = jr;
        } catch (ee) {
          console.log("json parse error:", ee );
        }

      });
    });

    req.on('error', function(err) { console.log("got http erro:", err); });
    req.end();

  } catch (err2) {
    console.log("http request error? " + err2);
  }

}

// Do an initial burst to setup all commuter lines
for (var line in global_data.path) {
  fetchCommuterLine();
}

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
    pushSingleUpdate( local_name );
  });

  socket.on("disable", function(msg) {
    console.log("disable:", local_name);
    global_status[ local_name ].enable = false;
  });


  socket.on("myevent", function(msg) {
    console.log("got myevent!");
    console.log(msg);

    socket.emit("update", { n: global_data.n } );
  });

  socket.on("disconnect", function() { 
    console.log("disconnecting client ", local_name); 
    delete global_connect[ local_name ];
    delete global_status [ local_name ];

  });

});

sockio.listen(8183);

function pushSingleUpdate( cli_id ) {

  for (var i=0; i<global_data.n_line; i++) {
    linename = global_data.name[i];

    console.log("checking linename:", linename);

    if (linename in global_data) {
      var dat = {}
      dat[ linename ] = global_data[ linename ];

      try {
        if (global_status[ cli_id ].enable) {
          global_connect[ cli_id ].emit("update", dat );
        }
      } catch (ee) {
        console.log("when trying to emit to cli_id: ", cli_id, " got error:", ee );
      }

    }
  }

}

function pushUpdate() {

  var conn_count = 0;
  for (var cli_id in global_connect) {
    conn_count++;
    pushSingleUpdate( cli_id );
  }

  var dt = Date.now();
  var dts = dt.toString();

  var enable_count=0;
  for (var i in global_status) {
    if (global_status[i].enable) { enable_count++; }
  }

  console.log( dts +  " connected clients:", conn_count, ", (", global_data.n, "), (enabled: ", enable_count, ")" );
}

setInterval( pushUpdate, 10000 );



