var http = require("http");
var sockio = require('socket.io')();

var g_verbose = 1;

var global_connect = { };

var global_data = { n: 0, 
                    interval : { red:10000, blue:13000, orange:17000 },
                    //interval : { red:1000, blue:1000, orange:1000 },
                    port : 80,
                    url : "developer.mbta.com",
                    path : { red : "/lib/rthr/red.json",
                             blue: "/lib/rthr/blue.json",
                             orange: "/lib/rthr/orange.json" }
                  };

for (var rbo in global_data.path) {

  console.log("setting up " + rbo );

  setInterval( 
    (function(RBO) {

      return function()  {
        if (g_verbose) { console.log("upating " + RBO + " -->>>>"); }
        var opt = { host: global_data.url, port:global_data.port, path: global_data.path[RBO] };

        try {


          console.log("cp0");

          var req = http.request( opt, function(res) {
            res.setEncoding('utf8');
            var body = '';
            res.on('data', function(chunk) { body += chunk; });
            res.on('end', function() {

              console.log(body);

              try  {
                jr = JSON.parse(body);
                global_data[RBO] = jr;
              } catch (ee) {
                console.log("json parse error:", ee );
              }

            });
          });

          req.on('error', function(err) { console.log("got http erro:", err); });
          req.end();

          /*
          http.get(opt, function(res) {
            res.setEncoding('utf8');
            var body = '';
            res.on('data', function(chunk) { body += chunk; });
            res.on('end', function() {

              console.log(body);

              jr = JSON.parse(body);
              global_data[RBO] = jr;

            });
          });
          */

          console.log("cp1");
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


  socket.on("myevent", function(msg) {
    console.log("got myevent!");
    console.log(msg);

    socket.emit("update", { n: global_data.n } );
  });

  socket.on("disconnect", function() { 
    console.log("disconnecting client ", local_name); 
    delete global_connect[ local_name ];

  });

});

//sockio.on('disconnect', function(socket) { console.log("disconnect"); } );
//sockio.on('myevent', function(socket) { console.log("myevent!"); } );

sockio.listen(8181);

setInterval( function() { 
  console.log(global_data.n);  

  var conn_count = 0;
  for (var cli_id in global_connect) {
    conn_count++;
    var colors = [ "red", "orange", "blue" ];

    for (var i in colors) {
      if (colors[i] in global_data) {
        var dat = {}
        dat[ colors[i] ] = global_data[ colors[i] ];
	
        try {
          global_connect[ cli_id ].emit("update", dat );
        } catch (ee) {
          console.log("when trying to emit to cli_id: ", cli_id, " got error:", ee );
        }

      }
    }

  }

  var dt = Date.now();
  var dts = dt.toString();
  console.log( dts +  " connected clients:", conn_count);
}, 1000 );




