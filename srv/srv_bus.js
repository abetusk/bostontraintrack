var http = require("http");
var sockio = require('socket.io')();
var xmlparse = require("xml2js").parseString;

var g_verbose = 0;

var global_connect = { };
var global_status = { };

var global_data = { n: 0, 
                    interval : { bus:13000 },
                    //interval : { bus:3000 },
                    port : 80,
                    url : "webservices.nextbus.com",
                    path : { bus : "/service/publicXMLFeed?command=vehicleLocations&a=mbta&t=0" }
                  };

for (var rbo in global_data.path) {

  console.log("setting up " + rbo );

  setInterval( 
    (function(RBO) {

      return function()  {
        if (g_verbose) { console.log("upating " + RBO + " -->>>>"); }
        var opt = { host: global_data.url, port:global_data.port, path: global_data.path[RBO] };

        try {

          var req = http.request( opt, function(res) {
            res.setEncoding('utf8');
            var body = '';
            res.on('data', function(chunk) { body += chunk; });
            res.on('end', function() {
              try  {
                xmlparse( body, 
                  function(err, result) {
                    global_data[RBO] = result;
                    console.log("Buses: " + result.body.vehicle.length);
                  });
              } catch (ee) {
                console.log("xml parse error:", ee );
              }

            });
          });

          req.on('error', function(err) { console.log("got http erro:", err); });
          req.end();

        } catch (e) {
          console.log("http: got e:", e);
        }

      };

    })(rbo), global_data.interval[rbo] );
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

sockio.listen(8182);

function pushSingleUpdate( cli_id ) {
  var colors = [ "bus" ];

  for (var i in colors) {
    if (colors[i] in global_data) {
      var dat = {}
      dat[ colors[i] ] = global_data[ colors[i] ];
	
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
  //console.log(global_data.n);  

  var conn_count = 0;
  for (var cli_id in global_connect) {
    conn_count++;
    var colors = [ "bus" ];

    pushSingleUpdate( cli_id );

/*
    for (var i in colors) {
      if (colors[i] in global_data) {
        var dat = {}
        dat[ colors[i] ] = global_data[ colors[i] ];
	
	try {
          if (global_status[ cli_id ].enable) {
            global_connect[ cli_id ].emit("update", dat );
          }
	} catch (ee) {
          console.log("when trying to emit to cli_id: ", cli_id, " got error:", ee );
	}

      }
    }
*/

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

/*
setInterval( function() { 
  //console.log(global_data.n);  

  var conn_count = 0;
  for (var cli_id in global_connect) {
    conn_count++;
    var colors = [ "bus" ];

    for (var i in colors) {
      if (colors[i] in global_data) {
        var dat = {}
        dat[ colors[i] ] = global_data[ colors[i] ];
	
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

  var dt = Date.now();
  var dts = dt.toString();

  var enable_count=0;
  for (var i in global_status) {
    if (global_status[i].enable) { enable_count++; }
  }

  console.log( dts +  " connected clients:", conn_count, ", (", global_data.n, "), (enabled: ", enable_count, ")" );
}, 5000 );
*/




