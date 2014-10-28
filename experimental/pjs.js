var ProtoBuf = require("protobufjs");
var builder = ProtoBuf.loadProtoFile("gtfs-realtime.proto");
var feedmessage = builder.build("transit_realtime.FeedMessage");

//console.log(builder);
//console.log(feedmessage);

var fs = require("fs");
var buf = fs.readFileSync( "VehiclePositions.pb" );
var m = feedmessage.decode(buf);

//console.log(m);

var ent = m.entity;
var n = m.entity.length;

for (var i=0; i<n; i++) {
  console.log( i, ent[i].vehicle );
}
