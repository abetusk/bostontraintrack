fs = require("fs");

var routes = JSON.parse( fs.readFileSync("./routes.json").toString() );

//console.log(routes);

for (var ind in routes.mode) {
  var route = routes.mode[ind].route;
  for (var route_ind in route) {
    console.log(routes.mode[ind].mode_name.toString() + "," + routes.mode[ind].route_type.toString() + "," + 
                route[route_ind].route_id.toString() + "," +  route[route_ind].route_name.toString() );
  }
}


