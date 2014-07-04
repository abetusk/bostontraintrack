var http = require('http');

var opt =  {
  host: 'developer.mbta.com',
  port: 80,
  path: '/lib/rthr/red.json'
};

http.get(opt, function(res) {
  console.log(res);
  res.setEncoding('utf8');

  var body = '';
  res.on('data', function(chunk) {
    //console.log("BODY:\n" + chunk );
    body += chunk;
  });

  res.on('end', function() {
    console.log("BODY:\n"  +  body);

    json_resp = JSON.parse(body);

    console.log("JSONIFIED!\n");
    console.log(json_resp);

    var X = json_resp.TripList.Trips;
    for (var x in X) {
      console.log(x);
      console.log(X[x]);
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
