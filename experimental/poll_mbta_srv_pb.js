var http = require("http");
var ProtoBuf = require("protobufjs");
var builder = ProtoBuf.loadProtoFile("gtfs-realtime.proto");
var feedmessage = builder.build("transit_realtime.FeedMessage");
var transit_realtime = builder.build("transit_realtime");
var opt = { host: "developer.mbta.com", port:80, path: "/lib/GTRTFS/Alerts/VehiclePositions.pb" };

var fs = require("fs");

function dumpit( buf ) {

  /*
  console.log("dumpit");

  fs.open( "test.pb", 'w', function(err, fd) {
    if (err) { console.log("err:", err); return; }

    fs.write(fd, buf, 0, buf.length, null, function(ee) {
      if (ee) { console.log("ee:", ee); return; }
      fs.close(fd, function() { console.log("done"); });
    });
  });
  return;
  */

  //console.log(buf);

  var m = feedmessage.decode(buf);
  var ent = m.entity;
  var n = m.entity.length;

  for (var i=0; i<n; i++) {
    console.log( i, ent[i].vehicle );
  }

}

try {
  var req = http.request( opt, function(res) {
    //res.setEncoding('utf8');
    var body = new Buffer([]);

    res.on('data', function(chunk) {
      var c = new Buffer( chunk );
      var b = Buffer.concat([ body, c ]);
      body = b;
    });

    res.on('end', function() {
      dumpit( body );
    });

  });
  req.on('error', function(err) { console.log("got http error for", route_id, ":", err); });
  req.end();
} catch (err2) {
  console.log("http request error? " + err2);
}



