var http = require('http');

var opt =  {
  host: 'developer.mbta.com',
  port: 80,
  path: '/lib/rthr/red.json'
};

http.get(opt, function(res) {
  res.setEncoding('utf8');

  var body = '';
  res.on('data', function(chunk) {
    body += chunk;
  });

  res.on('end', function() {
    json_resp = JSON.parse(body);

    var X = json_resp.TripList.Trips;
    var count=0;
    for (var x in X) {

      var tripid = X[x]["TripID"];

      if ("Position" in X[x]) {
        var lat = X[x]["Position"]["Lat"];
        var lon = X[x]["Position"]["Long"];
        var heading = X[x]["Position"]["Heading"];
        var ts = X[x]["Position"]["Timestamp"];
        var train = X[x]["Position"]["Train"];

        if ((lat == "") || (lon == "")) { continue; }

        console.log( count, tripid, lat, lon, heading, ts, train );
        count++;
      }
      //console.log(x);
      //console.log(X[x]);
    }

  });

}).on('error', function(e) {
  console.log("error: " + e.message);
});

/*
var req = http.request(opt, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  console.log(res);

  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });

});

req.
*/

/*
xmlhttp = new XMLHttpRequest();
xmlhttp.open("GET","http://google.com", true);
xmlhttp.onreadystatechange=function(){
  if (xmlhttp.readyState==4 && xmlhttp.status==200){
    s = xmlhttp.responseText;

    console.log(s);
  }
}
xmlhttp.send();
*/
