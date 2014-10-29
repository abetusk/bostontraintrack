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

var g_VERSION = "2.0";

var g_stop_layer ;

var g_verbose=0;
var g_map;

// The g_(subway|bus|commuter)_filter_state variable
// can be (active|default_disable|default_enable).
// default_disable - don't subscribe to feed, don't display icons
// default_enable - subscribe to feed, show everything
// active - subscribe to feed, show only routes in fitler
//
//   default_disable ----(filter)----> active
//    |        ^   ^------(filter)-----/  ^
//    |        |                          /
//  (but.)   (but.)                 /-----
//    |        |                   /
//    |        |     ----(filter)--
//    v        |    /
//    default_enable
//
//  Where (but.) is the side button press, (filter) is
//  toggling of a filter element 
//  active->default_disable if all toggle elements disabled
//  default_disable->active if any toggle element enabled
//  default_enable->active if any toggle element toggled
//

/*
var g_subway_filter = {
  "state":"active",

  "group" : { "red-route":1, "blue-route":1, "orange-route":1,
              "green-b-route":1,"green-c-route":1,"green-d-route":1,"green-e-route":1 },

  "route_group_map" : {
    "red-route" : { "931_":1, "933_":1 },
    "orange-route" : { "903_":1, "913_":1 },
    "blue-route" : { "946_":1, "948_":1 },
    "green-b-route":  { "810_":1, "813_":1, "823_":1 },
    "green-c-route": { "830_":1, "831_":1 },
    "green-d-route" : { "840_":1, "842_":1, "851_":1, "852_":1 },
    "green-e-route" : { "880_":1, "882_":1 }
  },

  "route":{
    //green
    // b        b         b
    //
    "810_":1, "813_":1, "823_":1,
   
    //green
    //  c         c
    "830_":1, "831_":1,

    //green
    //  d          d      d         d
    "840_":1, "842_":1, "851_":1, "852_":1,
   
    //green
    // e        e
    "880_":1, "882_":1,

    //orange
    //
    "946_":1, "948_":1,

    //blue
    //
    "903_":1, "913_":1,

    //red
    //
    "931_":1, "933_":1,

    //trolly
    //
    "899_":1
 }
};
*/

var g_subway_filter = {
  "state":"default_disable",

  "group" : { "red-route":0, "blue-route":0, "orange-route":0,
              "green-b-route":0,"green-c-route":0,"green-d-route":0,"green-e-route":0 },

  "route_group_map" : {
    "red-route" : { "931_":1, "933_":1 },
    "orange-route" : { "903_":1, "913_":1 },
    "blue-route" : { "946_":1, "948_":1 },
    "green-b-route":  { "810_":1, "813_":1, "823_":1 },
    "green-c-route": { "830_":1, "831_":1 },
    "green-d-route" : { "840_":1, "842_":1, "851_":1, "852_":1 },
    "green-e-route" : { "880_":1, "882_":1 }
  },

  "route":{
    //green
    // b        b         b
    //
    "810_":0, "813_":0, "823_":0,
   
    //green
    //  c         c
    "830_":0, "831_":0,

    //green
    //  d          d      d         d
    "840_":0, "842_":0, "851_":0, "852_":0,
   
    //green
    // e        e
    "880_":0, "882_":0,

    //orange
    //
    "946_":0, "948_":0,

    //blue
    //
    "903_":0, "913_":0,

    //red
    //
    "931_":0, "933_":0,

    //trolly
    //
    "899_":0
 }
};

var g_subway_marker = {};
var g_subway_marker_popup = {};
var g_subway_marker_layer ;

var g_bus_filter= {
  "state":"default_disable",
  "group":{ "01":0, "1":0, "02":0, "2":0, "03":0, "3":0, "04":0, "4":0, "05":0, "5":0,
            "06":0, "6":0, "07":0, "7":0, "08":0, "8":0, "09":0, "9":0
  },
  "route_group_map":{
    "1" : { "01":0, "1":0 }, "01" : {"01":0, "1":0 },
    "2" : { "02":0, "2":0 }, "02" : {"02":0, "2":0 },
    "3" : { "03":0, "3":0 }, "03" : {"03":0, "3":0 },
    "4" : { "04":0, "4":0 }, "04" : {"04":0, "4":0 },
    "5" : { "05":0, "5":0 }, "05" : {"05":0, "5":0 },
    "6" : { "06":0, "6":0 }, "06" : {"06":0, "6":0 },
    "7" : { "07":0, "7":0 }, "07" : {"07":0, "7":0 },
    "8" : { "08":0, "8":0 }, "08" : {"08":0, "8":0 },
    "9" : { "09":0, "9":0 }, "09" : {"09":0, "9":0 }
  },
  "route":{ "01":0, "1":0, "02":0, "2":0, "03":0, "3":0, "04":0, "4":0, "05":0, "5":0,
            "06":0, "6":0, "07":0, "7":0, "08":0, "8":0, "09":0, "9":0
  }
};
var g_bus_marker = {};
var g_bus_marker_layer;

var g_commuter_filter= { "state":"default_disable", "route":{}, "group":{}, "route_group_map":{} };
var g_commuter_marker = {};
var g_commuter_marker_layer;

var g_subway_toggle_input = 0;
var g_bus_toggle_input = 0;
var g_gps_toggle_input = 0;
var g_commuter_toggle_input = 0;

var g_geolocate;

var g_selection_layer;

var g_dirty = 0;

var g_zoom = 14;

var g_subway_socket;
var g_bus_socket;
var g_commuter_socket;


var g_param = {
  bus_w : 36,
  bus_h : 45,
  stop_w : 15,
  stop_h : 18
};


var g_stops =  {

//Boston College (Green)
  "place-lake" : { "id" : "place-lake", "name" : "Boston College Station", "lat" : "42.340081", "lon" : "-71.166769", "code" : "g" } ,
  "place-alsgr" : { "id" : "place-alsgr", "name" : "Allston St. Station", "lat" : "42.348701", "lon" : "-71.137955", "code" : "g" } ,
  "place-babck" : { "id" : "place-babck", "name" : "Babcock St. Station", "lat" : "42.35182", "lon" : "-71.12165", "code" : "g" } ,
  "place-brico" : { "id" : "place-brico", "name" : "Packards Corner Station", "lat" : "42.351967", "lon" : "-71.125031", "code" : "g" } ,
  "place-wrnst" : { "id" : "place-wrnst", "name" : "Warren St. Station", "lat" : "42.348343", "lon" : "-71.140457", "code" : "g" } ,
  "place-bucen" : { "id" : "place-bucen", "name" : "Boston Univ. Central Station", "lat" : "42.350082", "lon" : "-71.106865", "code" : "g" } ,
  "place-buest" : { "id" : "place-buest", "name" : "Boston Univ. East Station", "lat" : "42.349735", "lon" : "-71.103889", "code" : "g" } ,
  "place-buwst" : { "id" : "place-buwst", "name" : "Boston Univ. West Station", "lat" : "42.350941", "lon" : "-71.113876", "code" : "g" } ,
  "place-chill" : { "id" : "place-chill", "name" : "Chestnut Hill Ave. Station", "lat" : "42.338169", "lon" : "-71.15316", "code" : "g" } ,
  "place-chswk" : { "id" : "place-chswk", "name" : "Chiswick Rd. Station", "lat" : "42.340805", "lon" : "-71.150711", "code" : "g" } ,
  "place-grigg" : { "id" : "place-grigg", "name" : "Griggs St. Station", "lat" : "42.348545", "lon" : "-71.134949", "code" : "g" } ,
  "place-harvd" : { "id" : "place-harvd", "name" : "Harvard Ave. Station", "lat" : "42.350243", "lon" : "-71.131355", "code" : "g" } ,
  "place-wascm" : { "id" : "place-wascm", "name" : "Washington St. Station", "lat" : "42.343864", "lon" : "-71.142853", "code" : "g" } ,
  "place-sthld" : { "id" : "place-sthld", "name" : "Sutherland Rd. Station", "lat" : "42.341614", "lon" : "-71.146202", "code" : "g" } ,
  "place-stplb" : { "id" : "place-stplb", "name" : "Saint Paul St. Station", "lat" : "42.3512", "lon" : "-71.116104", "code" : "g" } ,
  "place-plsgr" : { "id" : "place-plsgr", "name" : "Pleasant St. Station", "lat" : "42.351521", "lon" : "-71.118889", "code" : "g" } ,
  "place-sougr" : { "id" : "place-sougr", "name" : "South St. Station", "lat" : "42.3396", "lon" : "-71.157661", "code" : "g" } ,

//Cleveland Circle (Green)
  "place-clmnl" : { "id" : "place-clmnl", "name" : "Cleveland Circle Station", "lat" : "42.336142", "lon" : "-71.149326", "code" : "g" } ,
  "place-engav" : { "id" : "place-engav", "name" : "Englewood Ave. Station", "lat" : "42.336971", "lon" : "-71.14566", "code" : "g" } ,
  "place-denrd" : { "id" : "place-denrd", "name" : "Dean Rd. Station", "lat" : "42.337807", "lon" : "-71.141853", "code" : "g" } ,
  "place-tapst" : { "id" : "place-tapst", "name" : "Tappan St. Station", "lat" : "42.338459", "lon" : "-71.138702", "code" : "g" } ,
  "place-bcnwa" : { "id" : "place-bcnwa", "name" : "Washington Sq. Station", "lat" : "42.339394", "lon" : "-71.13533", "code" : "g" } ,
  "place-fbkst" : { "id" : "place-fbkst", "name" : "Fairbanks St. Station", "lat" : "42.339725", "lon" : "-71.131073", "code" : "g" } ,
  "place-bndhl" : { "id" : "place-bndhl", "name" : "Brandon Hall Station", "lat" : "42.340023", "lon" : "-71.129082", "code" : "g" } ,
  "place-sumav" : { "id" : "place-sumav", "name" : "Summit Ave. Station", "lat" : "42.34111", "lon" : "-71.12561", "code" : "g" } ,
  "place-cool" : { "id" : "place-cool", "name" : "Coolidge Corner Station", "lat" : "42.342213", "lon" : "-71.121201", "code" : "g" } ,
  "place-stpul" : { "id" : "place-stpul", "name" : "Saint Paul St. Station", "lat" : "42.343327", "lon" : "-71.116997", "code" : "g" } ,
  "place-kntst" : { "id" : "place-kntst", "name" : "Kent St. Station", "lat" : "42.344074", "lon" : "-71.114197", "code" : "g" } ,
  "place-hwsst" : { "id" : "place-hwsst", "name" : "Hawes St. Station", "lat" : "42.344906", "lon" : "-71.111145", "code" : "g" } ,
  "place-smary" : { "id" : "place-smary", "name" : "Saint Mary St. Station", "lat" : "42.345974", "lon" : "-71.107353", "code" : "g" } ,

//Riverside  (Green)
  "place-river" : { "id" : "place-river", "name" : "Riverside Station", "lat" : "42.337059", "lon" : "-71.251742", "code" : "g" } ,
  "place-woodl" : { "id" : "place-woodl", "name" : "Woodland Station", "lat" : "42.333374", "lon" : "-71.244301", "code" : "g" } ,
  "place-waban" : { "id" : "place-waban", "name" : "Waban Station", "lat" : "42.325943", "lon" : "-71.230728", "code" : "g" } ,
  "place-eliot" : { "id" : "place-eliot", "name" : "Eliot Station", "lat" : "42.319023", "lon" : "-71.216713", "code" : "g" } ,
  "place-newtn" : { "id" : "place-newtn", "name" : "Newton Highlands Station", "lat" : "42.321735", "lon" : "-71.206116", "code" : "g" } ,
  "place-chhil" : { "id" : "place-chhil", "name" : "Chestnut Hill Station", "lat" : "42.326653", "lon" : "-71.165314", "code" : "g" } ,
  "place-rsmnl" : { "id" : "place-rsmnl", "name" : "Reservoir Station", "lat" : "42.335027", "lon" : "-71.148952", "code" : "g" } ,
  "place-bcnfd" : { "id" : "place-bcnfd", "name" : "Beaconsfield Station", "lat" : "42.335846", "lon" : "-71.140823", "code" : "g" } ,
  "place-bvmnl" : { "id" : "place-bvmnl", "name" : "Brookline Village Station", "lat" : "42.332774", "lon" : "-71.116296", "code" : "g" } ,
  "place-brkhl" : { "id" : "place-brkhl", "name" : "Brookline Hills Station", "lat" : "42.331333", "lon" : "-71.126999", "code" : "g" } ,
  "place-longw" : { "id" : "place-longw", "name" : "Longwood Station", "lat" : "42.341145", "lon" : "-71.110451", "code" : "g" } ,
  "place-fenwy" : { "id" : "place-fenwy", "name" : "Fenway Station", "lat" : "42.345394", "lon" : "-71.104187", "code" : "g" } ,
  "place-kencl" : { "id" : "place-kencl", "name" : "Kenmore Station", "lat" : "42.348949", "lon" : "-71.095169", "code" : "g" } ,
  "place-newto" : { "id" : "place-newto", "name" : "Newton Centre Station", "lat" : "42.329391", "lon" : "-71.192429", "code" : "g" } ,

//Heath (Green)
  "place-bckhl" : { "id" : "place-bckhl", "name" : "Back of the Hill Station", "lat" : "42.330139", "lon" : "-71.111313", "code" : "g" } ,
  "place-rvrwy" : { "id" : "place-rvrwy", "name" : "Riverway Station", "lat" : "42.331684", "lon" : "-71.111931", "code" : "g" } ,
  "place-mispk" : { "id" : "place-mispk", "name" : "Mission Park Station", "lat" : "42.333195", "lon" : "-71.109756", "code" : "g" } ,
  "place-fenwd" : { "id" : "place-fenwd", "name" : "Fenwood Rd. Station", "lat" : "42.333706", "lon" : "-71.105728", "code" : "g" } ,
  "place-brmnl" : { "id" : "place-brmnl", "name" : "Brigham Circle Station", "lat" : "42.334229", "lon" : "-71.104609", "code" : "g" } ,
  "place-lngmd" : { "id" : "place-lngmd", "name" : "Longwood Medical Area Station", "lat" : "42.33596", "lon" : "-71.100052", "code" : "g" } ,
  "place-mfa" : { "id" : "place-mfa", "name" : "Museum of Fine Arts Station", "lat" : "42.337711", "lon" : "-71.095512", "code" : "g" } ,
  "place-nuniv" : { "id" : "place-nuniv", "name" : "Northeastern University Station", "lat" : "42.340401", "lon" : "-71.088806", "code" : "g" } ,
  "place-symcl" : { "id" : "place-symcl", "name" : "Symphony Station", "lat" : "42.342687", "lon" : "-71.085056", "code" : "g" } ,
  "place-prmnl" : { "id" : "place-prmnl", "name" : "Prudential Station", "lat" : "42.34557", "lon" : "-71.081696", "code" : "g" } ,

//(Green)
  "place-bland" : { "id" : "place-bland", "name" : "Blandford St. Station", "lat" : "42.349293", "lon" : "-71.100258", "code" : "g" } ,
  "place-hymnl" : { "id" : "place-hymnl", "name" : "Hynes Convention Center Station", "lat" : "42.347888", "lon" : "-71.087903", "code" : "g" } ,
  "place-coecl" : { "id" : "place-coecl", "name" : "Copley Station", "lat" : "42.349974", "lon" : "-71.077447", "code" : "g" } ,
  "place-armnl" : { "id" : "place-armnl", "name" : "Arlington Station", "lat" : "42.351902", "lon" : "-71.070893", "code" : "g" } ,
  "place-boyls" : { "id" : "place-boyls", "name" : "Boylston Station", "lat" : "42.35302", "lon" : "-71.06459", "code" : "g" } ,
  "place-lech" : { "id" : "place-lech", "name" : "Lechmere Station", "lat" : "42.370772", "lon" : "-71.076536", "code" : "g" } ,
  "place-spmnl" : { "id" : "place-spmnl", "name" : "Science Park Station", "lat" : "42.366664", "lon" : "-71.067666", "code" : "g" } ,
  "place-hsmnl" : { "id" : "place-hsmnl", "name" : "Heath St. Station", "lat" : "42.328681", "lon" : "-71.110559", "code" : "g" } ,

//(Red)
  "place-alfcl" : { "id" : "place-alfcl", "name" : "Alewife Station", "lat" : "42.395428", "lon" : "-71.142483", "code" : "r" } ,
  "place-davis" : { "id" : "place-davis", "name" : "Davis Station", "lat" : "42.39674", "lon" : "-71.121815", "code" : "r" } ,
  "place-portr" : { "id" : "place-portr", "name" : "Porter Square Station", "lat" : "42.3884", "lon" : "-71.119149", "code" : "r" } ,
  "place-harsq" : { "id" : "place-harsq", "name" : "Harvard Square Station", "lat" : "42.373362", "lon" : "-71.118956", "code" : "r" } ,
  "place-cntsq" : { "id" : "place-cntsq", "name" : "Central Square Station", "lat" : "42.365486", "lon" : "-71.103802", "code" : "r" } ,
  "place-knncl" : { "id" : "place-knncl", "name" : "Kendall/MIT Station", "lat" : "42.36249079", "lon" : "-71.08617653", "code" : "r" } ,
  "place-chmnl" : { "id" : "place-chmnl", "name" : "Charles/MGH Station", "lat" : "42.361166", "lon" : "-71.070628", "code" : "r" } ,
  "place-pktrm" : { "id" : "place-pktrm", "name" : "Park St. Station", "lat" : "42.35639457", "lon" : "-71.0624242", "code" : "rg" } ,
  "place-dwnxg" : { "id" : "place-dwnxg", "name" : "Downtown Crossing Station", "lat" : "42.355518", "lon" : "-71.060225", "code" : "ros" } ,
  "place-sstat" : { "id" : "place-sstat", "name" : "South Station", "lat" : "42.352271", "lon" : "-71.055242", "code" : "rs" } ,
  "place-brdwy" : { "id" : "place-brdwy", "name" : "Broadway Station", "lat" : "42.342622", "lon" : "-71.056967", "code" : "r" } ,
  "place-andrw" : { "id" : "place-andrw", "name" : "Andrew Station", "lat" : "42.330154", "lon" : "-71.057655", "code" : "r" } ,
  "place-jfk" : { "id" : "place-jfk", "name" : "JFK/UMass Station", "lat" : "42.320685", "lon" : "-71.052391", "code" : "r" } ,

//Ashmont (Red)
  "place-shmnl" : { "id" : "place-shmnl", "name" : "Savin Hill Station", "lat" : "42.31129", "lon" : "-71.053331", "code" : "r" } ,
  "place-fldcr" : { "id" : "place-fldcr", "name" : "Fields Corner Station", "lat" : "42.300093", "lon" : "-71.061667", "code" : "r" } ,
  "place-smmnl" : { "id" : "place-smmnl", "name" : "Shawmut Station", "lat" : "42.29312583", "lon" : "-71.06573796", "code" : "r" } ,
  "place-asmnl" : { "id" : "place-asmnl", "name" : "Ashmont Station", "lat" : "42.284652", "lon" : "-71.064489", "code" : "r" } ,

//Mattapan (Red)
  "place-cedgr" : { "id" : "place-cedgr", "name" : "Cedar Grove Station", "lat" : "42.279682", "lon" : "-71.060432", "code" : "r" } ,
  "place-butlr" : { "id" : "place-butlr", "name" : "Butler Station", "lat" : "42.272343", "lon" : "-71.062584", "code" : "r" } ,
  "place-miltt" : { "id" : "place-miltt", "name" : "Milton Station", "lat" : "42.270306", "lon" : "-71.067673", "code" : "r" } ,
  "place-cenav" : { "id" : "place-cenav", "name" : "Central Ave. Station", "lat" : "42.270027", "lon" : "-71.073334", "code" : "r" } ,
  "place-valrd" : { "id" : "place-valrd", "name" : "Valley Rd. Station", "lat" : "42.268322", "lon" : "-71.081566", "code" : "r" } ,
  "place-capst" : { "id" : "place-capst", "name" : "Capen St. Station", "lat" : "42.267712", "lon" : "-71.087753", "code" : "r" } ,
  "place-matt" : { "id" : "place-matt", "name" : "Mattapan Station", "lat" : "42.267762", "lon" : "-71.092241", "code" : "r" } ,

//Braintree (Red)
  "place-nqncy" : { "id" : "place-nqncy", "name" : "North Quincy Station", "lat" : "42.275275", "lon" : "-71.029583", "code" : "r" } ,
  "place-wlsta" : { "id" : "place-wlsta", "name" : "Wollaston Station", "lat" : "42.2665139", "lon" : "-71.0203369", "code" : "r" } ,
  "place-qnctr" : { "id" : "place-qnctr", "name" : "Quincy Center Station", "lat" : "42.251809", "lon" : "-71.005409", "code" : "r" } ,
  "place-qamnl" : { "id" : "place-qamnl", "name" : "Quincy Adams Station", "lat" : "42.233391", "lon" : "-71.007153", "code" : "r" } ,
  "place-brntn" : { "id" : "place-brntn", "name" : "Braintree Station", "lat" : "42.2078543", "lon" : "-71.0011385", "code" : "r" } ,

//(Orange)
  "place-ogmnl" : { "id" : "place-ogmnl", "name" : "Oak Grove Station", "lat" : "42.43668", "lon" : "-71.071097", "code" : "o" } ,
  "place-mlmnl" : { "id" : "place-mlmnl", "name" : "Malden Center Station", "lat" : "42.426632", "lon" : "-71.07411", "code" : "o" } ,
  "place-welln" : { "id" : "place-welln", "name" : "Wellington Station", "lat" : "42.40237", "lon" : "-71.077082", "code" : "o" } ,
  "place-sull" : { "id" : "place-sull", "name" : "Sullivan Station", "lat" : "42.383975", "lon" : "-71.076994", "code" : "o" } ,
  "place-ccmnl" : { "id" : "place-ccmnl", "name" : "Community College Station", "lat" : "42.373622", "lon" : "-71.069533", "code" : "o" } ,
  "place-north" : { "id" : "place-north", "name" : "North Station", "lat" : "42.365577", "lon" : "-71.06129", "code" : "og" } ,
  "place-haecl" : { "id" : "place-haecl", "name" : "Haymarket Station", "lat" : "42.363021", "lon" : "-71.05829", "code" : "og" } ,
  "place-state" : { "id" : "place-state", "name" : "State St. Station", "lat" : "42.358978", "lon" : "-71.057598", "code" : "ob" } ,
  "place-chncl" : { "id" : "place-chncl", "name" : "Chinatown Station", "lat" : "42.352547", "lon" : "-71.062752", "code" : "os" } ,
  "place-tumnl" : { "id" : "place-tumnl", "name" : "Tufts Medical Center Station", "lat" : "42.349662", "lon" : "-71.063917", "code" : "os" } ,
  "place-bbsta" : { "id" : "place-bbsta", "name" : "Back Bay Station", "lat" : "42.34735", "lon" : "-71.075727", "code" : "o" } ,
  "place-masta" : { "id" : "place-masta", "name" : "Massachusetts Ave. Station", "lat" : "42.341512", "lon" : "-71.083423", "code" : "o" } ,
  "place-rugg" : { "id" : "place-rugg", "name" : "Ruggles Station", "lat" : "42.336377", "lon" : "-71.088961", "code" : "o" } ,
  "place-rcmnl" : { "id" : "place-rcmnl", "name" : "Roxbury Crossing Station", "lat" : "42.331397", "lon" : "-71.095451", "code" : "o" } ,
  "place-jaksn" : { "id" : "place-jaksn", "name" : "Jackson Square Station", "lat" : "42.323132", "lon" : "-71.099592", "code" : "o" } ,
  "place-sbmnl" : { "id" : "place-sbmnl", "name" : "Stony Brook Station", "lat" : "42.317062", "lon" : "-71.104248", "code" : "o" } ,
  "place-grnst" : { "id" : "place-grnst", "name" : "Green St. Station", "lat" : "42.310525", "lon" : "-71.107414", "code" : "o" } ,
  "place-forhl" : { "id" : "place-forhl", "name" : "Forest Hills Station", "lat" : "42.300523", "lon" : "-71.113686", "code" : "o" } ,

  //Blue
  "place-aport" : { "id" : "place-aport", "name" : "Airport Station", "lat" : "42.374262", "lon" : "-71.030395", "code" : "b" } ,
  "place-aqucl" : { "id" : "place-aqucl", "name" : "Aquarium Station", "lat" : "42.359784", "lon" : "-71.051652", "code" : "b" } ,
  "place-bmmnl" : { "id" : "place-bmmnl", "name" : "Beachmont Station", "lat" : "42.39754234", "lon" : "-70.99231944", "code" : "b" } ,
  "place-bomnl" : { "id" : "place-bomnl", "name" : "Bowdoin Station", "lat" : "42.361365", "lon" : "-71.062037", "code" : "b" } ,
  "place-crtst" : { "id" : "place-crtst", "name" : "Court House Station", "lat" : "42.35245", "lon" : "-71.04685", "code" : "b" } ,
  "place-gover" : { "id" : "place-gover", "name" : "Government Center Station", "lat" : "42.359705", "lon" : "-71.059215", "code" : "b" } ,
  "place-mvbcl" : { "id" : "place-mvbcl", "name" : "Maverick Station", "lat" : "42.36911856", "lon" : "-71.03952958", "code" : "b" } ,
  "place-orhte" : { "id" : "place-orhte", "name" : "Orient Heights Station", "lat" : "42.386867", "lon" : "-71.004736", "code" : "b" } ,
  "place-rbmnl" : { "id" : "place-rbmnl", "name" : "Revere Beach Station", "lat" : "42.40784254", "lon" : "-70.99253321", "code" : "b" } ,
  "place-sdmnl" : { "id" : "place-sdmnl", "name" : "Suffolk Downs Station", "lat" : "42.39050067", "lon" : "-70.99712259", "code" : "b" } ,
  "place-wimnl" : { "id" : "place-wimnl", "name" : "Wood Island Station", "lat" : "42.3796403", "lon" : "-71.02286539", "code" : "b" } ,
  "place-wondl" : { "id" : "place-wondl", "name" : "Wonderland Station", "lat" : "42.41342", "lon" : "-70.991648", "code" : "b" } ,
  "place-wtcst" : { "id" : "place-wtcst", "name" : "World Trade Center Station", "lat" : "42.34863", "lon" : "-71.04246", "code" : "b" }
};

/*
        "place-davis" :
          { stop_id : "place-davis", name : "Davis Station", latitude : 42.39674, longitude: -71.121815 },
        "place-portr" :
          { stop_id : "place-portr", name : "Porter Square Station", latitude : 42.3884, longitude: -71.119149 }
      };
*/

//----------------------------------
//
// Cookie save state management
//
//----------------------------------

function trashState() {
  clearCookieState();

  var filter = [ g_subway_filter, g_commuter_filter, g_bus_filter ];
  for (var i=0; i<3; i++) {
    var routes = filter[i].route;
    for (var route in routes) {
      var img_id = "img_" + route.toString() ;
      var ele = document.getElementById( img_id );
      if (!ele) { continue; }
      ele.style.opacity = "0.3";
    }
  }

  clearFilter( g_subway_filter );
  clearFilter( g_commuter_filter );
  clearFilter( g_bus_filter );

  restoreCookieState();
}

function clearCookieState() {
  $.removeCookie("version", { path: '/' });
  $.removeCookie("active", { path: '/' });
  $.removeCookie("subway_group", { path: '/' });
  $.removeCookie("commuter_group", { path: '/' });
  $.removeCookie("bus_group", { path: '/' });
}

function cookie_state() {
  console.log("version", $.cookie("version"))
  console.log("active", $.cookie("active"))
  console.log("subway_group", $.cookie("subway_group"))
  console.log("commuter_group", $.cookie("commuter_group"))
  console.log("bus_group", $.cookie("bus_group"))
}

function saveCookieState( ) {

  $.cookie("version", g_VERSION, { expires: 365, path: '/' });

  if (g_verbose) {
    console.log("saving 'version' cookie:", g_VERSION );
  }

  /*
  // State to code map
  var scm = { "active":"a", "default_disable":"dd", "default_enable":"de" };
  var active_str = scm[ g_subway_filter.state ] + "," +
                   scm[ g_commuter_filter.state ] + "," +
                   scm[ g_bus_filter.state ];
                   */

  var active_str = g_subway_toggle_input.toString() + "," +
                   g_commuter_toggle_input.toString() + "," +
                   g_bus_toggle_input.toString();

  if (g_verbose) {
    console.log("saving 'active' cookie:", active_str );
  }

  $.cookie("active", active_str, { expires: 365, path: '/' });

  var s = "", c = "", b = "";

  if (g_subway_filter.state == "active") {
    for (var group_name in g_subway_filter.group) {
      if (g_subway_filter.group[group_name]) {
        if (s.length>0) { s += ","; }
        s += group_name;
      }
    }
  }

  if (g_commuter_filter.state == "active") {
    for (var group_name in g_commuter_filter.group) {
      if (g_commuter_filter.group[group_name]) {
        if (c.length>0) { c += ","; }
        c += group_name;
      }
    }
  }

  if (g_bus_filter.state == "active") {
    for (var group_name in g_bus_filter.group) {
      if (g_bus_filter.group[group_name]) {
        if (b.length>0) { b += ","; }
        b += group_name;
      }
    }
  }

  if (g_verbose) {
    console.log("saving cookie:", s, c, b );
  }

  $.cookie("subway_group", s , { expires: 365, path: '/' });
  $.cookie("commuter_group", c , { expires: 365, path: '/' });
  $.cookie("bus_group", b , { expires: 365, path: '/' });

}

function setupDefaultCookieState( ) {
  $.cookie("version", g_VERSION, { expires: 365, path: '/' });

  //var active_str = "a,dd,dd";
  var active_str = "1,0,0";
  $.cookie("active", active_str, { expires: 365, path: '/' });

  var flist_str = "red-route,orange-route,blue-route,green-b-route,green-c-route,green-d-route,green-e-route";
  //var flist_str = "red-route";
  $.cookie("subway_group", flist_str, { expires: 365, path: '/' });

  //var clist_str = "CR-Worcester,CR-Providence"
  $.cookie("commuter_group", "", { expires: 365, path: '/' });
  $.cookie("bus_group", "", { expires: 365, path: '/' });
}

function clearFilter( filter ) {
  filter.state = "default_disable";
  for (var g in filter.group) { filter.group[g] = 0; }
  for (var r in filter.route) { filter.route[r] = 0; }
}

function restoreCookieState( ) {
  var version = $.cookie('version');
  if (version != g_VERSION) {

    console.log(">>>default");

    setupDefaultCookieState();
  }

  var active = $.cookie('active');
  var sgroup = $.cookie('subway_group');
  var cgroup = $.cookie('commuter_group');
  var bgroup = $.cookie('bus_group');

  if (g_verbose) {
    console.log(version, active, sgroup, cgroup, bgroup);
  }

  // disable everything to begin with
  //
  clearFilter( g_subway_filter );
  clearFilter( g_commuter_filter );
  clearFilter( g_bus_filter );

  var btog = active.split(',');

  var filt = [ g_subway_filter, g_commuter_filter, g_bus_filter ];
  var strgroup = [ sgroup, cgroup, bgroup ];
  var togf = [ toggleSubwayGroup, toggleCommuterGroup, toggleBusGroup ];
  var togfeedf = [ toggleSubwayFeed, toggleCommuterFeed, toggleBusFeed ];

  for (var i=0; i<3; i++) {
    var toggle_count=0;
    var feed_func = togfeedf[i];

    if (strgroup[i].length == 0) {
      continue;
    }

    var glist = strgroup[i].split(',');
    if (glist.length==0) { continue; }

    var tog_f = togf[i];

    for (var j=0; j<glist.length; j++) {
      toggle_count++;
      tog_f( glist[j] );
    }

  }

  // The above 'toggle.*Group will toggle the feed if necessary, so we need
  // to make sure the feed state is in line with the restored state.
  //
  var button_toggle = [ g_subway_toggle_input, g_commuter_toggle_input, g_bus_toggle_input ];

  for (var i=0; i<3; i++) {
    if (button_toggle[i].toString() != btog[i]) {
      var feed_func = togfeedf[i];
      feed_func();
    }
  }

  saveCookieState();

}


//----------------------------------
//
// Cookie save state management
//
//----------------------------------


var g_bus_route_hash = {
  "01":"1", "04":"4", "05":"5", "07":"7", "08":"8", "09":"9",
  "1":"1", "4":"4", "5":"5", "7":"7", "8":"8", "9":"9",
  "10":"10", "11":"11", "14":"14", "15":"15", "16":"16", "17":"17", "18":"18", "19":"19",
  "21":"21", "22":"22", "23":"23", "24":"24", "26":"26", "27":"27", "28":"28", "29":"29",
  "2427":"2427",
  "30":"30", "31":"31", "32":"32", "33":"33", "34":"34", "35":"35", "36":"36", "37":"37", "38":"38", "39":"39",
  "34E":"34E",
  "3233":"3233",
  "3738":"3738",
  "40":"40", "41":"41", "42":"42", "43":"43", "44":"44", "45":"45", "47":"47",
  "4050":"4050",
  "50":"50", "51":"51", "52":"52", "55":"55", "57":"57", "59":"59",
  "57A":"57A",
  "60":"60", "62":"62", "64":"64", "65":"65", "66":"66", "67":"67", "68":"68", "69":"69",
  "627":"627",
  "70":"70", "70A":"70A", "71":"71", "72":"72", "725":"725", "73":"73", "74":"74", "75":"75", "76":"76", "77":"77", "78":"78", "79":"79",
  "80":"80", "83":"83", "84":"84", "85":"85", "86":"86", "87":"87", "88":"88", "89":"89",
  "8993":"8993",
  "90":"90", "91":"91", "92":"92", "93":"93", "94":"94", "95":"95", "96":"96", "97":"97", "99":"99",
  "100":"100", "101":"101", "104":"104", "105":"105", "106":"106", "108":"108", "109":"109",
  "110":"110", "111":"111", "112":"112", "114":"114", "116":"116", "117":"117", "119":"119",
  "116117":"116117",
  "120":"120", "121":"121", "131":"131", "132":"132",
  "134":"134", "136":"136", "137":"137",
  "170":"170", "171":"171",
  "201":"201", "202":"202",
  "210":"210", "211":"211", "212":"212", "214":"214", "215":"215", "216":"216", "217":"217",
  "214216":"214216",
  "220":"220", "221":"221", "222":"222", "225":"225",
  "230":"230", "236":"236", "238":"238",
  "240":"240", "245":"245",
  "274":"274", "275":"275", "276":"276", "277":"277",
  "325":"325", "326":"326",
  "350":"350", "351":"351", "352":"352", "354":"354",
  "411":"411",
  "424":"424", "426":"426", "428":"428", "429":"429",
  "430":"430", "431":"431", "434":"434", "435":"435", "436":"436", "439":"439",
  "441":"441", "442":"442", "448":"448", "449":"449",
  "441442":"441442",
  "450":"450", "451":"451", "455":"455", "456":"456", "459":"459",
  "465":"465",
  "501":"501", "502":"502", "503":"503", "504":"504", "505":"505",
  "553":"553", "554":"554", "556":"556", "558":"558",
  "608":"608",
  "701":"701",
  "710":"710", "712":"712", "713":"713", "714":"714", "716":"716",
  "747":"747", "708":"708", "746":"746", "741":"741", "742":"742", "751":"751", "749":"749",
  "9701":"9701", "9702":"9702", "9703":"9703"
}

//--------------------------
//
// Toggle filter functions
//
//--------------------------

function toggleGroupIcon( id_str, val ) {
  var ele = document.getElementById( "img_" + id_str );

  if (val == 0) {
    ele.style.opacity = "0.3";
  } else {
    ele.style.opacity = "1.0";
  }

}


function _updateFilterGroup( id_str, filter ) {
  if (id_str in filter.group) {
    filter.group[id_str] = 1-filter.group[id_str];
    var v = filter.group[id_str];
    for (var ind in filter.route_group_map[id_str]) {
      filter.route[ ind ] = v;
    }
  }
}

function toggleSubwayGroup( id_str ) {
  //toggleGroup( id_str, g_subway_filter.group );

  var filter = g_subway_filter;

  if (filter["state"] == "active")
  {

    _updateFilterGroup( id_str, filter );
    toggleGroupIcon( id_str, g_subway_filter.group[id_str] );

    for (var subway_id in g_subway_marker) {
      drawSubwayMarker( subway_id );
    }

    var count=0;
    for (var ind in filter.group) { count+=filter.group[ind]; }

    if (count==0) {
      filter["state"] = "default_disable";
      toggleSubwayFeed();
    }

  }
  else if ( filter["state"] == "default_disable" )
  {

    _updateFilterGroup( id_str, filter );
    toggleGroupIcon( id_str, g_subway_filter.group[id_str] );

    filter["state"] = "active";
    toggleSubwayFeed();
  }
  else if ( filter["state"] == "default_enable" )
  {
    _updateFilterGroup( id_str, filter );
    toggleGroupIcon( id_str, g_subway_filter.group[id_str] );

    filter["state"] = "active";
    for (var subway_id in g_subway_marker) {
      drawSubwayMarker( subway_id );
    }
  }

  saveCookieState();

}

function toggleCommuterGroup( id_str ) {

  if ( !(id_str in g_commuter_filter.group) ) {
    g_commuter_filter.group[id_str] = 0;
    g_commuter_filter.route_group_map[id_str] = { };
    g_commuter_filter.route_group_map[id_str][id_str] = 1;
    g_commuter_filter.route[id_str]=0;
  }

  var filter = g_commuter_filter;

  if (filter["state"] == "active")
  {
    _updateFilterGroup( id_str, filter );
    toggleGroupIcon( id_str, g_commuter_filter.group[id_str] );

    for (var commuter_id in g_commuter_marker) {
      drawCommuterMarker( commuter_id );
    }

    var count=0;
    for (var ind in filter.group) { count+=filter.group[ind]; }

    if (count==0) {
      filter["state"] = "default_disable";
      toggleCommuterFeed();
    }

  }
  else if ( filter["state"] == "default_disable" )
  {
    _updateFilterGroup( id_str, filter );
    toggleGroupIcon( id_str, g_commuter_filter.group[id_str] );

    filter["state"] = "active";
    toggleCommuterFeed();
  }
  else if ( filter["state"] == "default_enable" )
  {
    _updateFilterGroup( id_str, filter );
    toggleGroupIcon( id_str, g_commuter_filter.group[id_str] );

    filter["state"] = "active";
    for (var commuter_id in g_commuter_marker) {
      drawCommuterMarker( commuter_id );
    }
  }

  saveCookieState();

}

function toggleBusGroup( id_str ) {
  if ( !(id_str in g_bus_filter.group) ) {
    g_bus_filter.group[id_str] = 0;
    g_bus_filter.route_group_map[id_str] = {};
    g_bus_filter.route_group_map[id_str][id_str] = 1;
    g_bus_filter.route[id_str]=0;
  }


  var filter = g_bus_filter;

  if (filter["state"] == "active")
  {
    _updateFilterGroup( id_str, filter );
    toggleGroupIcon( id_str, g_bus_filter.group[id_str] );

    for (var bus_id in g_bus_marker) {
      drawBusMarker( bus_id );
    }

    var count=0;
    for (var ind in filter.group) { count+=filter.group[ind]; }

    if (count==0) {
      filter["state"] = "default_disable";
      toggleBusFeed();
    }

  }
  else if ( filter["state"] == "default_disable" )
  {
    _updateFilterGroup( id_str, filter );
    toggleGroupIcon( id_str, g_bus_filter.group[id_str] );

    filter["state"] = "active";
    toggleBusFeed();
  }
  else if ( filter["state"] == "default_enable" )
  {
    _updateFilterGroup( id_str, filter );
    toggleGroupIcon( id_str, g_bus_filter.group[id_str] );

    filter["state"] = "active";
    for (var bus_id in g_bus_marker) {
      drawBusMarker( bus_id );
    }
  }

  saveCookieState();

}

//--------------------------
//
// Toggle filter functions
//
//--------------------------


//--------------------------
// client socket maintenance

function printdata(data, color) {
  var trips = data[color].TripList.Trips;

  for (x in trips) {
    //console.log(trips[x]);
    if ("Position" in trips[x]) {
      console.log("TripID: " + trips[x].TripID + " ");
      //process.stdout.write("TripID: " + trips[x].TripID + " ");
      console.log("Position (" +
          trips[x].Position.Timestamp + ") " +
          "lat: " + trips[x].Position.Lat + ", long: " + trips[x].Position.Long +
          ", heading: " + trips[x].Position.Heading );
    } else { }
  }
}

function handlePopup(tripid) {
  console.log("handlePopup>>", tripid);
}

function drawBusMarker(busid) {
  var headingLookup = [ "0", "45", "90", "135", "180", "225", "270", "315" ];

  var dat = g_bus_marker[busid];

  // Remove it
  //
  if ( "osm_marker" in dat ) {
    var m = dat["osm_marker"];
    g_bus_marker_layer.removeMarker(m);
    delete g_bus_marker[busid].osm_marker;
    delete g_bus_marker[busid].icon;
    delete g_bus_marker[busid].size;
    delete g_bus_marker[busid].offset;
  }

  if (!g_bus_toggle_input) { return; }

  var route = dat.RouteId;
  if ( g_bus_filter.state == "active" ) {
    if ((route in g_bus_filter.route) &&
        (g_bus_filter.route[route]==0))
    {
      return;
    }
  }


  var lonlat =  new OpenLayers.LonLat( dat.Long, dat.Lat )
      .transform(
        new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
        g_map.getProjectionObject() // to Spherical Mercator Projection
      );

  if ( g_map.zoom < 8 ) { return; }

  // Compensate for the extra width added by
  // extending the width of the icon for the
  // route number bubble.
  //
  var fudge_w = 0;

  if ( dat.Route in g_bus_route_hash ) {
    var l  = dat.Route.length;
    var bub_width = (l*4) + 2 + 2;
    var bw2 = bub_width/2;
    var left_overflow = bw2 - 6;
    if (left_overflow < 0) {
      left_overflow = 0;
    }
    fudge_w = 2*left_overflow;
    fudge_w = Math.floor( fudge_w / 0.8 );
  }

  var scale_factor = 1.0;
  var bus_w = g_param.bus_w + fudge_w;
  var bus_h = g_param.bus_h;

  if ( ( g_map.zoom <= 13 ) && ( g_map.zoom >= 8) )
  {
    scale_factor = Math.exp( Math.log(2) * (g_map.zoom-14) );
    bus_w *= scale_factor;
    bus_h *= scale_factor;
  }

  var size = new OpenLayers.Size(bus_w, bus_h);
  var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);


  var bus_opacity = 0.5;

  var icon ;
  if ( dat.Heading !== "" ) {
    var iheading = Math.floor( (parseInt( dat.Heading ) + 23) / 45 );
    if (iheading > 7) { iheading = 0; }

    if ( dat.RouteId in g_bus_route_hash ) {
      //icon = new OpenLayers.Icon("img/bus_route_icon/bus_gw_r" + dat.Route + "_"  + headingLookup[iheading] + ".png", size, offset);

      var rt = g_bus_route_hash[ dat.RouteId ];
      icon = new OpenLayers.Icon("img/bus_route_icon/bus_gw_r" + rt + "_"  + headingLookup[iheading] + ".png", size, offset);

      icon.setOpacity( bus_opacity );
    } else {
      icon = new OpenLayers.Icon("img/bus_gw_"  + headingLookup[iheading] + ".png", size, offset);
      icon.setOpacity( bus_opacity );
    }
  } else {
    icon = new OpenLayers.Icon("img/bus_gw.png", size, offset);
    icon.setOpacity( bus_opacity );
  }
  dat["osm_marker"] = new OpenLayers.Marker( lonlat, icon );
  dat["osm_marker"].events.register('mousedown',
                                    dat["osm_marker"],
                                    (function(xx) { return function() { handlePopup(xx); }; })(busid) );
  dat["icon"] = icon;
  dat["size"] = size;
  dat["offset"] = offset;

  g_bus_marker_layer.addMarker( dat["osm_marker"] );

}

function drawSubwayMarker(subwayid) {
  var headingLookup = [ "0", "45", "90", "135", "180", "225", "270", "315" ];

  var dat = g_subway_marker[subwayid];

  // Remove it
  //
  if ( ("osm_marker" in dat) && dat["osm_marker"]) {
    var m = dat["osm_marker"];
    g_subway_marker_layer.removeMarker(m);
    delete g_subway_marker[subwayid].osm_marker;
    delete g_subway_marker[subwayid].icon;
    delete g_subway_marker[subwayid].size;
    delete g_subway_marker[subwayid].offset;
  }


  if (!g_subway_toggle_input) { return; }

  var route = dat.RouteId;
  if ( g_subway_filter.state == "active" ) {
    if ((route in g_subway_filter.route) &&
        (g_subway_filter.route[route]==0))
    {
      return;
    }
  }

  var lonlat =  new OpenLayers.LonLat( dat.Long, dat.Lat )
      .transform(
        new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
        g_map.getProjectionObject() // to Spherical Mercator Projection
      );

  var scale_factor = 1.0;
  var bus_w = g_param.bus_w;
  var bus_h = g_param.bus_h;

  if ( g_map.zoom < 8 ) { return; }

  if ( ( g_map.zoom <= 13 ) && ( g_map.zoom >= 8) )
  {
    scale_factor = Math.exp( Math.log(2) * (g_map.zoom-14) );
    bus_w *= scale_factor;
    bus_h *= scale_factor;
  }

  var size = new OpenLayers.Size(bus_w,bus_h);
  var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);


  var icon ;
  if (( dat.Heading != "" ) && ( dat.Route != "" )) {
    var iheading = Math.floor( (parseInt( dat.Heading ) + 23) / 45 );
    var route = dat.Route;
    if (iheading > 7) { iheading = 0; }

    if ( (g_subway_filter.state != "active") || g_subway_filter.route[dat.RouteId]) {
      var route = dat.RouteInfo;

      var dummy_ind = route.indexOf("green");
      if (dummy_ind != 0) {
        icon = new OpenLayers.Icon("img/metro_" + route + "_" + headingLookup[iheading] + ".png", size, offset);
      } else {
        route = "green";
        var rgm = g_subway_filter.route_group_map;
        if ( dat.RouteId in rgm["green-b-route"] ) {
          icon = new OpenLayers.Icon("img/metro_" + route + "_rB_" + headingLookup[iheading] + ".png", size, offset);
        } else if ( dat.RouteId in rgm["green-c-route"] ) {
          icon = new OpenLayers.Icon("img/metro_" + route + "_rC_" + headingLookup[iheading] + ".png", size, offset);
        } else if ( dat.RouteId in rgm["green-d-route"] ) {
          icon = new OpenLayers.Icon("img/metro_" + route + "_rD_" + headingLookup[iheading] + ".png", size, offset);
        } else if ( dat.RouteId in rgm["green-e-route"] ) {
          icon = new OpenLayers.Icon("img/metro_" + route + "_rE_" + headingLookup[iheading] + ".png", size, offset);
        } else {
          icon = new OpenLayers.Icon("img/metro_" + route + "_" + headingLookup[iheading] + ".png", size, offset);
        }
      }
      //else {
      //  icon = new OpenLayers.Icon("img/underground_simple.png", size, offset);
      //}
      icon.setOpacity(0.75);
    }

  } else {
    var route = dat.RouteInfo;
    //if ((dat.Route == "red") || (dat.Route == "orange") || (dat.Route == "blue") || (dat.Route == "green")) {
    if ((route == "red") || (route == "orange") || (route == "blue") || (route == "green")) {
      icon = new OpenLayers.Icon("img/metro_" + route + ".png", size, offset);
    } else {
      icon = new OpenLayers.Icon("img/underground_simple.png", size, offset);
    }

    icon.setOpacity(0.75);
  }
  dat["osm_marker"] = new OpenLayers.Marker( lonlat, icon );
  dat["osm_marker"].events.register('mousedown',
                                    dat["osm_marker"],
                                    (function(xx) { return function() { handlePopup(xx); }; })(subwayid) );
  dat["icon"] = icon;
  dat["size"] = size;
  dat["offset"] = offset;

  g_subway_marker_layer.addMarker( dat["osm_marker"] );

}



function drawCommuterMarker(commuterid) {
  var headingLookup = [ "0", "45", "90", "135", "180", "225", "270", "315" ];

  var dat = g_commuter_marker[commuterid];

  // Remove it
  //
  if ( "osm_marker" in dat ) {
    var m = dat["osm_marker"];
    g_commuter_marker_layer.removeMarker(m);
    delete g_commuter_marker[commuterid].osm_marker;
    delete g_commuter_marker[commuterid].icon;
    delete g_commuter_marker[commuterid].size;
    delete g_commuter_marker[commuterid].offset;
  }


  if (!g_commuter_toggle_input) { return; }

  var route = dat.RouteId;
  if ( g_commuter_filter.state == "active" ) {
    if ((route in g_commuter_filter.route) &&
        (g_commuter_filter.route[route]==0))
    {
      return;
    }
  }


  var lonlat =  new OpenLayers.LonLat( dat.Long, dat.Lat )
      .transform(
        new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
        g_map.getProjectionObject() // to Spherical Mercator Projection
      );

  var scale_factor = 1.0;
  var bus_w = g_param.bus_w;
  var bus_h = g_param.bus_h;

  if ( g_map.zoom < 8 ) { return; }

  if ( ( g_map.zoom <= 13 ) && ( g_map.zoom >= 8) )
  {
    scale_factor = Math.exp( Math.log(2) * (g_map.zoom-14) );
    bus_w *= scale_factor;
    bus_h *= scale_factor;
  }

  var size = new OpenLayers.Size(bus_w,bus_h);
  var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);

  var icon ;
  if ( ( dat.Heading != "" ) && (dat.Heading !== null) )  {
    var iheading = Math.floor( (parseInt( dat.Heading ) + 23) / 45 );
    if (iheading > 7) { iheading = 0; }
    icon = new OpenLayers.Icon("img/commuter_"  + headingLookup[iheading] + ".png", size, offset);
    icon.setOpacity(0.75);
  } else {
    icon = new OpenLayers.Icon("img/train.png", size, offset);
    icon.setOpacity(0.75);
  }
  dat["osm_marker"] = new OpenLayers.Marker( lonlat, icon );
  dat["osm_marker"].events.register('mousedown',
                                    dat["osm_marker"],
                                    (function(xx) { return function() { handlePopup(xx); }; })(commuterid) );
  dat["icon"] = icon;
  dat["size"] = size;
  dat["offset"] = offset;

  g_commuter_marker_layer.addMarker( dat["osm_marker"] );

}



function RTBusUpdate(data) {
  if (g_verbose) { console.log("RTBusUpdate:", data ); }

  var id = data.id;
  var timestamp = data.timestamp;
  var route = data.route;
  var route_id = data.route_id;
  var route_info = data.route_info;
  var route_group = data.route_group;
  var lat = data.lat;
  var lon = data.lon;
  var heading = data.heading;
  var status = data.status;
  var trip_name = data.trip_name;

  // I'm lazy, fill in default bus routes here.
  //
  if (!(route_id in g_bus_filter.group)) {
    g_bus_filter.group[route_id] = 0;
  }

  if (!(route_id in g_bus_filter.route_group_map)) {
    g_bus_filter.route_group_map[route_id] = {};
    g_bus_filter.route_group_map[route_id][route_id] = 1;
  }

  if (!(route_id in g_bus_filter.route)) {
    g_bus_filter.route[route_id] = 0;
  }

  if ( status == "delete" )
  {
    if (g_verbose) { console.log("DELETE Bus", id ); }
    if (id in g_bus_marker) {

      if (("osm_marker" in g_bus_marker[id]) &&
           g_bus_marker[id]["osm_marker"])
      {
        g_bus_marker_layer.removeMarker( g_bus_marker[id]["osm_marker"] );
      }
      delete g_bus_marker[ id ];
    }
  } else {

    if (g_verbose) { console.log( "UPDATE Bus", id ); }
    if ( !(id in g_bus_marker) ) {
      g_bus_marker[ id ] = {};
    }

    g_bus_marker[ id ].id = id;
    g_bus_marker[ id ].Timestamp = timestamp;
    g_bus_marker[ id ].Heading = heading;
    g_bus_marker[ id ].Route = route;
    g_bus_marker[ id ].RouteId = route_id;
    g_bus_marker[ id ].RouteInfo= route_info;
    g_bus_marker[ id ].RouteGroup= route_group;
    g_bus_marker[ id ].TripName = trip_name;
    g_bus_marker[ id ].Lat = lat;
    g_bus_marker[ id ].Long = lon;

    drawBusMarker( data.id );

  }

}


function RTSubwayUpdate(data) {
  if (g_verbose) { console.log("RTSubwayUpdate:", data ); }

  var id = data.id;
  var timestamp = data.timestamp;
  var route = data.route;
  var route_id = data.route_id;
  var lat = data.lat;
  var lon = data.lon;
  var heading = data.heading;
  var status = data.status;
  var trip_name = data.trip_name;
  var route_info = data.route_info;
  var route_group = data.route_group;

  if ( status == "delete" )
  {
    if (g_verbose) { console.log("DELETE Subway", id ); }
    if (id in g_subway_marker) {

      if (("osm_marker" in g_subway_marker[id]) &&
           g_subway_marker[id]["osm_marker"])
      {
        g_subway_marker_layer.removeMarker( g_subway_marker[id]["osm_marker"] );
      }
      delete g_subway_marker[ id ];
    }
  } else {

    if ( !(id in g_subway_marker) ) {
      g_subway_marker[ id ] = {};
    }

    g_subway_marker[ id ].id = id;
    g_subway_marker[ id ].Timestamp = timestamp;
    g_subway_marker[ id ].Heading = heading;
    g_subway_marker[ id ].Route = route;
    g_subway_marker[ id ].RouteId = route_id;
    g_subway_marker[ id ].RouteGroup = route_group;
    g_subway_marker[ id ].RouteInfo = route_info;
    g_subway_marker[ id ].TripName = trip_name;
    g_subway_marker[ id ].Lat = lat;
    g_subway_marker[ id ].Long = lon;

    drawSubwayMarker( data.id );

  }

}

function RTCommuterUpdate(data) {
  if (g_verbose) { console.log("RTCommuterUpdate:", data ); }

  var id = data.id;
  var timestamp = data.timestamp;
  var route = data.route;
  var route_id = data.route_id;
  var route_info = data.route_info;
  var route_group = data.route_group;
  var lat = data.lat;
  var lon = data.lon;
  var heading = data.heading;
  var status = data.status;

  // I'm lazy, fill in default commuter routes here.
  //
  if (!(route_id in g_commuter_filter.group)) {
    g_commuter_filter.group[route_id] = 0;
  }

  if (!(route_id in g_commuter_filter.route_group_map)) {
    g_commuter_filter.route_group_map[route_id] = { };
    g_commuter_filter.route_group_map[route_id][route_id] = 1;
  }

  if (!(route_id in g_commuter_filter.route)) {
    g_commuter_filter.route[route_id] = 0;
  }

  if ( status == "delete" )
  {

    if (g_verbose) { console.log("DELETE commuter", id ); }

    if (id in g_commuter_marker) {

      if (("osm_marker" in g_commuter_marker[id]) &&
           g_commuter_marker[id]["osm_marker"])
      {
        g_commuter_marker_layer.removeMarker( g_commuter_marker[id]["osm_marker"] );
      }
      delete g_commuter_marker[ id ];
    }
  } else {

    if ( !(id in g_commuter_marker) ) {
      g_commuter_marker[ id ] = {};
    }

    g_commuter_marker[ id ].id = id;
    g_commuter_marker[ id ].Timestamp = timestamp;
    g_commuter_marker[ id ].Heading = heading;
    g_commuter_marker[ id ].Route = route;
    g_commuter_marker[ id ].RouteId = route_id;
    g_commuter_marker[ id ].RouteGroup = route_group;
    g_commuter_marker[ id ].RouteInfo = route_info;
    g_commuter_marker[ id ].Lat = lat;
    g_commuter_marker[ id ].Long = lon;

    drawCommuterMarker( data.id );

  }

}

var g_SERVER_ADDR = "bostontraintrack.com";
//var g_SERVER_ADDR = "localhost";

// New subway stream
//
function setupRTMStreams() {
  g_subway_socket = io('http://' + g_SERVER_ADDR + ':8181');
  g_subway_socket.on('connect', function() {
    if (g_verbose) { console.log("connected!"); }
    g_subway_socket.on('update:subway', RTSubwayUpdate );
    g_subway_socket.on('disconnect', function() { console.log("disconnected"); });

    //g_subway_socket.emit( "enable:subway" );
  });
}

// Real Time Bus Stream
//
function setupRTBStreams() {
  //MBTA bus feeds don't have proper heading.  Using next bus instead
  //g_bus_socket = io('http://' + g_SERVER_ADDR + ':8181');
  g_bus_socket = io('http://' + g_SERVER_ADDR + ':8182');
  g_bus_socket.on('connect', function() {
    if (g_verbose) { console.log("connected!"); }
    g_bus_socket.on('update:bus', RTBusUpdate );
    g_bus_socket.on('disconnect', function() { console.log("disconnected"); });
  });
}

// Real Time Commuter Stream
//
function setupRTCStreams() {
  g_commuter_socket = io('http://' + g_SERVER_ADDR + ':8181');
  g_commuter_socket.on('connect', function() {
    if (g_verbose) { console.log("connected!"); }
    g_commuter_socket.on('update:commuter', RTCommuterUpdate );
    g_commuter_socket.on('disconnect', function() { console.log("disconnected"); });
  });
}

//--------------------------

// Resizes, etc.
//
function mapEvent(ev) {
  if (ev.type == "zoomend") {

    if ( g_map.zoom <= 12 ) {

      for (var subway_id in g_subway_marker) {
        drawSubwayMarker( subway_id );
      }

      for (var bus_id in g_bus_marker) {
        drawBusMarker( bus_id );
      }

      for (var commuter_id in g_commuter_marker) {
        drawCommuterMarker( commuter_id );
      }

      drawStops();

    }
    else
    {

      for (var subway_id in g_subway_marker) {
        drawSubwayMarker( subway_id );
      }

      for (var bus_id in g_bus_marker) {
        drawBusMarker( bus_id );
      }

      for (var commuter_id in g_commuter_marker) {
        drawCommuterMarker( commuter_id );
      }

      drawStops();

    }

  }
  else if (ev.type == "move" ) {
    //console.log("move!");
  }
  else if (ev.type == "moveend" ) {
    //console.log("moveend!");
  }
  else if (ev.type == "movestart" ) {
    //console.log("movestart!");
  }

}

function drawStops( force ) {

  if (!force) {
    if ( g_map.zoom < 8 ) { return; }
  }


  for (var ind in g_stops) {
    var st = g_stops[ind];
    var lonlat =  new OpenLayers.LonLat( st.lon, st.lat)
      .transform(
        new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
        g_map.getProjectionObject() // to Spherical Mercator Projection
      );

    var scale_factor = 1.0;
    var stop_w = g_param.stop_w;
    var stop_h = g_param.stop_h;

    if ( ( g_map.zoom <= 13 ) && ( g_map.zoom >= 8) )
    {
      scale_factor = Math.exp( Math.log(2) * (g_map.zoom-14) );
      stop_w *= scale_factor;
      stop_h *= scale_factor;
    }

    var size = new OpenLayers.Size(stop_w, stop_h);
    var offset = new OpenLayers.Pixel( -(size.w/2), -(size.h/2) );

    code = st.code;
    var icon = new OpenLayers.Icon("img/metro_T_fade.png", size, offset);
    if (/r/.test( code )) {
      icon = new OpenLayers.Icon("img/metro_T_red_fade.png", size, offset);
    } else if (/o/.test(code)) {
      icon = new OpenLayers.Icon("img/metro_T_orange_fade.png", size, offset);
    } else if (/b/.test(code)) {
      icon = new OpenLayers.Icon("img/metro_T_blue_fade.png", size, offset);
    } else if (/g/.test(code)) {
      icon = new OpenLayers.Icon("img/metro_T_green_fade.png", size, offset);
    }

    var stopMarker = new OpenLayers.Marker( lonlat, icon );

    if ("marker" in g_stops[ind]) {
      g_stop_layer.removeMarker( g_stops[ind].marker );
    }

    g_stops[ind].marker = stopMarker;
    g_stop_layer.addMarker( stopMarker );

  }

}

function initMap() {
  g_map = new OpenLayers.Map("mapdiv");

  g_map.events.register( "zoomend", g_map, mapEvent );
  g_map.events.register( "movestart", g_map, mapEvent );
  g_map.events.register( "move", g_map, mapEvent );
  g_map.events.register( "moveend", g_map, mapEvent );

  var transportattrib =
    'Maps © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' +
    ' <br/> Data © <a href="http://www.thunderforest.com">Thunderforest</a> ';


  var transport = new OpenLayers.Layer.OSM("Transport",
                                           ["http://a.tile.thunderforest.com/transport/${z}/${x}/${y}.png",
                                            "http://b.tile.thunderforest.com/transport/${z}/${x}/${y}.png",
                                            "http://c.tile.thunderforest.com/transport/${z}/${x}/${y}.png"],
                                           { displayOutsideMaxExtent: true,
                                             transitionEffect: 'resize',
                                             attribution : transportattrib });

  g_map.addLayer(transport);


  g_subway_marker_layer = new OpenLayers.Layer.Markers( "Subway" );
  g_map.addLayer(g_subway_marker_layer);
  g_map.setLayerIndex(g_subway_marker_layer, 97);


  g_bus_marker_layer = new OpenLayers.Layer.Markers( "Bus" );
  g_map.addLayer(g_bus_marker_layer);
  g_map.setLayerIndex(g_bus_marker_layer, 98);


  g_commuter_marker_layer = new OpenLayers.Layer.Markers( "Commuter" );
  g_map.addLayer(g_commuter_marker_layer);
  g_map.setLayerIndex(g_commuter_marker_layer, 97);


  g_stop_layer = new OpenLayers.Layer.Markers( "Stops" );

  drawStops( true );
  g_map.addLayer(g_stop_layer);
  g_map.setLayerIndex( g_stop_layer, 0 )

  g_geolocate = new OpenLayers.Control.Geolocate({
    bind: false,
    geolocationOptions: {
        enableHighAccuracy: false,
        maximumAge: 0,
        timeout: 7000
    }
  });

  g_map.addControl(g_geolocate);

  g_geolocate.events.register("locationupdated",g_geolocate,function(e) {
    lonLat = new OpenLayers.LonLat(e.position.coords.longitude, e.position.coords.latitude).transform(
        new OpenLayers.Projection("EPSG:4326"),
        g_map.getProjectionObject()
      );
    g_map.setCenter(lonLat, g_zoom);
  });

  // Somewhere in Central Boston(ish)
  //
  var lat = 42.3583183;
  var lon = -71.0584536;
  var lonLat;

  lonLat = new OpenLayers.LonLat(lon, lat).transform(
        new OpenLayers.Projection("EPSG:4326"),
        g_map.getProjectionObject()
      );
  g_map.setCenter(lonLat, g_zoom);

}


function toggleSubwayFeed() {
  var b = document.getElementById('subwayToggleInput');

  if (g_subway_toggle_input == 0) {
    g_subway_socket.emit("enable:subway");
    b.src = "img/metro_gw_sq_inv.png";
    g_subway_toggle_input = 1;

    if ( g_subway_filter.state == "default_disable" ) {
      g_subway_filter.state = "default_enable";
    }

  } else if (g_subway_toggle_input == 1 ) {

    if ( g_subway_filter.state == "default_enable" ) {
      g_subway_filter.state = "default_disable";
    }

    g_subway_socket.emit("disable:subway");
    b.src = "img/metro_gw_sq.png";
    g_subway_toggle_input = 0;

    // Delete stale entries
    //
    for (var id in g_subway_marker) {

      if (("osm_marker" in g_subway_marker[id]) &&
           g_subway_marker[id]["osm_marker"] )
      {
        g_subway_marker_layer.removeMarker( g_subway_marker[id]["osm_marker"] );
      }
      delete g_subway_marker[ id ];
    }
    g_subway_marker_layer.redraw();

  }

  $("#subwayToggleInput").blur();

  saveCookieState();

}

function toggleBusFeed() {

  var b = document.getElementById('busToggleInput');

  if (g_bus_toggle_input == 0) {
    g_bus_socket.emit("enable:bus");
    b.src = "img/bus_gw_sq_inv.png";
    g_bus_toggle_input = 1;

    if ( g_bus_filter.state == "default_disable" ) {
      g_bus_filter.state = "default_enable";
    }


  } else if (g_bus_toggle_input == 1 ) {

    if ( g_bus_filter.state == "default_enable" ) {
      g_bus_filter.state = "default_disable";
    }

    g_bus_socket.emit("disable:bus");
    b.src = "img/bus_gw_sq.png";
    g_bus_toggle_input = 0;

    // Delete stale entries
    //
    for (var id in g_bus_marker) {
      if (("osm_marker" in g_bus_marker[id]) &&
           g_bus_marker[id]["osm_marker"] )
      {
        g_bus_marker_layer.removeMarker( g_bus_marker[id]["osm_marker"] );
      }
      delete g_bus_marker[ id ];
    }
    g_bus_marker_layer.redraw();

  }

  $("#busToggleInput").blur();
  saveCookieState();

}

function toggleCommuterFeed() {


  var b = document.getElementById('commuterToggleInput');

  if (g_commuter_toggle_input == 0) {
    g_commuter_socket.emit("enable:commuter");
    b.src = "img/train_sq_inv.png";
    g_commuter_toggle_input = 1;

    if ( g_commuter_filter.state == "default_disable" ) {
      g_commuter_filter.state = "default_enable";
    }


  } else if (g_commuter_toggle_input == 1 ) {

    if ( g_commuter_filter.state == "default_enable" ) {
      g_commuter_filter.state = "default_disable";
    }

    g_commuter_socket.emit("disable:commuter");
    b.src = "img/train_sq.png";
    g_commuter_toggle_input = 0;

    for (var id in g_commuter_marker) {
      if (("osm_marker" in g_commuter_marker[id]) &&
           g_commuter_marker[id]["osm_marker"] )
      {
        g_commuter_marker_layer.removeMarker( g_commuter_marker[id]["osm_marker"] );
      }
      delete g_commuter_marker[ id ];
    }
    g_commuter_marker_layer.redraw();

  }

  $("#commuterToggleInput").blur();
  saveCookieState();

}

function toggleGPS() {

  var b = document.getElementById('gpsToggleInput');

  if (g_gps_toggle_input == 0) {
    g_geolocate.activate();
    b.src = "img/locator_sq_inv.png";
    g_gps_toggle_input = 1;
  } else if (g_gps_toggle_input == 1 ) {
    b.src = "img/locator_sq.png";
    g_gps_toggle_input = 0;
  }

  $("#gpsToggleInput").blur();

}


$(document).ready( function() {
  initMap();
  //setupRTStreams();
  setupRTMStreams();
  setupRTBStreams();
  setupRTCStreams();

  var b = document.getElementById('subwayToggle');
  b.style.top = '100px';
  b.style.left = '5px';

  var b = document.getElementById('busToggle');
  b.style.top = '200px';
  b.style.left = '5px';

  var b = document.getElementById('commuterToggle');
  b.style.top = '300px';
  b.style.left = '5px';

  var b = document.getElementById('gpsToggle');
  b.style.top = '400px';
  b.style.left = '5px';

  var h = $(window).height();
  var w = $(window).width();

  var b = document.getElementById('starIcon');
  b.style.top = '250px';
  b.style.left = (w-50) + 'px';

  var b = document.getElementById('gitlink');
  //b.style.top = (h-50) + "px";
  //b.style.left = '5px';
  b.style.top = "5px";
  b.style.left = (w-50) + 'px';


  if (h > 550) {
    /*
    var b = document.getElementById('gitlink');
    b.style.top = (h-50) + "px";
    b.style.left = '5px';
    */

  
    var b = document.getElementById('feedbacklink');
    //b.style.top = (h-50) + "px";
    //b.style.left = (w-50) + "px";
    b.style.top = (h-50) + "px";
    b.style.left = '5px';

  } else {
    //$("#gitlink").hide();
    $("#feedbacklink").hide();
  }

  $("#feedbacklink")
    .mouseenter( function() { $(this).animate({opacity: 1.0}, 150); })
    .mouseleave( function() { $(this).animate({opacity: 0.55}, 150);  } );

  $( document ).tooltip();
  $( "#feedbacklink" ).tooltip({ position: { my: "left+15 center", at: "right center" } });

  $( window ).resize( function() {
    var h = $(window).height();
    var w = $(window).width();

    if (h > 550) { $("#feedbacklink").show(); }
    else         { $("#feedbacklink").hide(); }

    var b = document.getElementById('gitlink');
    b.style.top = "5px";
    b.style.left = (w-50) + 'px';

    var b = document.getElementById('starIcon');
    b.style.top = '250px';
    b.style.left = (w-50) + 'px';

    var b = document.getElementById('feedbacklink');
    b.style.top = (h-50) + "px";
    b.style.left = '5px';

  });

  restoreCookieState();

});

