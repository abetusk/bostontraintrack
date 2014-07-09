/*

    Copyright (C) 2013 Abram Connelly, Zachary Friss

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
// VERSION 0.0.2
var g_stop_layer;

var g_verbose = 1;
var g_map;

var g_marker = {};
var g_marker_popup = {};
var g_marker_layer;

var g_bus_marker = {};
var g_bus_marker_layer;

var g_bus_toggle_input = 0;
var g_gps_toggle_input = 0;
var g_commuter_toggle_input = 0;

var g_geolocate;

var g_selection_layer;

var g_dirty = 0;

var g_zoom = 14;

var g_socket;
var g_bus_socket;

var g_param = {
  bus_w: 36,
  bus_h: 45,
  stop_w: 15,
  stop_h: 18
};

var g_projection = new OpenLayers.Projection("EPSG:4326");

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
        ", heading: " + trips[x].Position.Heading);
    } else {}
  }
}

function createPopUp(feature) {
  var text;
  if (feature.data.color !== "bus") {
    text = "<div style='font-size:.8em'>Line: " + feature.data.color + "<br>Route: " + feature.data.route + "<br>Next Stop: " + feature.data.predictionStop + "<br>Arriving In: " + feature.data.predictionTime + "</div>";
  } else {
    text = "<div style='font-size:.8em'>Line: " + feature.data.color + "<br>Route: " + feature.data.route + "</div>"
  }
  var popup = new OpenLayers.Popup.FramedCloud("popup",
    OpenLayers.LonLat.fromString(feature.geometry.toShortString()),
    null,
    text,
    null,
    true
  );
  return popup;
}

function destoryPopUp(feature) {
  g_map.removePopup(feature.popup);
  feature.popup.destroy();
  feature.popup = null;
}

function drawMarker(tripid, color) {
  var trip;
  if (color === "bus") {
    trip = g_bus_marker[tripid];
  } else {
    trip = g_marker[tripid];
  }

  // If it exists update it!
  if (trip.hasOwnProperty('osm_marker')) {
    var newLoc = new OpenLayers.LonLat(trip.Long, trip.Lat)
      .transform(
        g_projection,
        g_map.getProjectionObject()
      );
    trip.osm_marker.data.predictionStop = trip.nextStop;
    trip.osm_marker.data.predictionTime = trip.predTime;
    trip.osm_marker.style.externalGraphic = iconURL(trip);
    trip.osm_marker.move(newLoc);
    if (trip.osm_marker.hasOwnProperty('popup') && trip.osm_marker.popup !== null) {
      destoryPopUp(trip.osm_marker);
      var popup = createPopUp(trip.osm_marker);
      trip.osm_marker.popup = popup;
      g_map.addPopup(popup);
    }
    return
  } else {

    var scale_factor = 1.0;
    var bus_w = g_param.bus_w;
    var bus_h = g_param.bus_h;

    if ((g_map.zoom <= 13) && (g_map.zoom >= 8)) {
      scale_factor = Math.exp(Math.log(2) * (g_map.zoom - 14));
      bus_w *= scale_factor;
      bus_h *= scale_factor;
    }

    var icon = iconURL(trip);

    var opacity;
    if (color === "bus") {
      opacity = .75;
    } else {
      opacity = 1;
    }

    trip.osm_marker = new OpenLayers.Feature.Vector(
      new OpenLayers.Geometry.Point(trip.Long, trip.Lat).transform(g_projection, g_map.getProjectionObject()), {
        predictionStop: trip.nextStop,
        predictionTime: trip.predTime,
        route: trip.route,
        color: trip.Color,
      }, {
        externalGraphic: icon,
        graphicOpacity: opacity,
        graphicHeight: bus_h,
        graphicWidth: bus_w,
        graphicXOffset: -(bus_w / 2),
        graphicYOffset: -bus_h
      }
    );

    if (color === "bus") {
      g_bus_marker_layer.addFeatures(trip.osm_marker);
    } else {
      g_marker_layer.addFeatures(trip.osm_marker);
    }

    return
  }
}

function iconURL(trip) {
  var headingLookup = ["0", "45", "90", "135", "180", "225", "270", "315"];
  var icon;
  var color = trip.Color;
  var iheading = Math.floor((parseInt(trip.Heading, 10) + 23) / 45);
  if (iheading > 7) {
    iheading = 0;
  }
  if ((color === "red") || (color === "blue") || (color === "orange")) {
    icon = "img/metro_" + color + "_" + headingLookup[iheading] + "_fade.png";
  } else {
    if (trip.route in g_bus_route_hash) {
      icon = "img/bus_route_icon/bus_gw_r" + trip.route + "_" + headingLookup[iheading] + ".png";
    } else {
      icon = "img/bus_gw_" + headingLookup[iheading] + ".png";
    }
  }
  return icon;
}

function updateBusMarker(data, bus) {
  var vehicle = data[bus].body.vehicle;

  for (var v in vehicle) {
    var id = vehicle[v].$.id;
    if (!(id in g_bus_marker)) {
      g_bus_marker[id] = {
        Lat: 0,
        Long: 0,
        Color: "bus",
        Dirty: 0
      };
    }
    g_bus_marker[id].Dirty = 0;
  }

  // Draw new entries and unmark them for deletion if we're drawing
  // them.
  //
  for (var v in vehicle) {

    var id = vehicle[v].$.id;
    var lat = vehicle[v].$.lat;
    var lon = vehicle[v].$.lon;
    var head = vehicle[v].$.heading;
    var secSince = vehicle[v].$.secsSinceReport;
    var route = vehicle[v].$.routeTag;

    var s = Math.floor(new Date().getTime() / 1000.0) - parseInt(secSince);

    g_bus_marker[id].Timestamp = s;
    g_bus_marker[id].Heading = head;
    g_bus_marker[id].Dirty = 1;
    g_bus_marker[id].route = route;
    g_bus_marker[id].nextStop = "Coming Soon";
    g_bus_marker[id].predTime = "Coming Soon";

    oldlat = g_bus_marker[id].Lat;
    oldlon = g_bus_marker[id].Long;

    if ((Math.abs(oldlat - lat) > 0.001) ||
      (Math.abs(oldlon - lon) > 0.001)) {

      g_bus_marker[id].Lat = lat;
      g_bus_marker[id].Long = lon;

      drawMarker(id, "bus");
    }
  }

  // Delete stale entries
  //
  for (var v in vehicle) {
    var id = vehicle[v].$.id;
    if (g_bus_marker[id].Dirty == 0) {
      console.log("REMOVING", id)
      g_bus_marker_layer.removeMarker(g_bus_marker[id]["osm_marker"]);
      delete g_bus_marker[id];
    }
  }

  g_bus_marker_layer.redraw();
}

function updateMarker(data, color) {
  var tripid, x;
  var trips = data[color].TripList.Trips;

  // Mark all entries for deletion
  //
  for (tripid in g_marker) {
    if ((g_marker[tripid].hasOwnProperty("Color")) && (g_marker[tripid].Color === color)) {
      g_marker[tripid].Dirty = 0;
    }
  }

  // Create new entries if they don't exist
  //
  for (x in trips) {
    if (trips[x].hasOwnProperty("Position")) {
      tripid = trips[x].TripID;
      if (!(g_marker[tripid])) {
        g_marker[tripid] = {
          Lat: 0,
          Long: 0,
          Color: color
        };
      }
    }
  }

  // Draw new entries and unmark them for deletion if we're drawing
  // them.
  //
  var lat, lon;
  for (x in trips) {
    if (trips[x].hasOwnProperty("Position")) {

      tripid = trips[x].TripID;

      g_marker[tripid].Timestamp = trips[x].Position.Timestamp;
      g_marker[tripid].Heading = trips[x].Position.Heading;
      g_marker[tripid].Dirty = 1;
      g_marker[tripid].nextStop = trips[x].Predictions[0].Stop;
      if (trips[x].Predictions[0].Seconds > 60) {

        g_marker[tripid].predTime = (trips[x].Predictions[0].Seconds / 60).toFixed(2) + " minutes";
      } else {
        g_marker[tripid].predTime = trips[x].Predictions[0].Seconds + " seconds";
      }

      g_marker[tripid].route = trips[x].Destination;

      lat = trips[x].Position.Lat;
      lon = trips[x].Position.Long;

      if ((Math.abs(lat - g_marker[tripid].Lat) > 0.001) ||
        (Math.abs(lon - g_marker[tripid].Long) > 0.001)) {

        g_marker[tripid].Lat = trips[x].Position.Lat;
        g_marker[tripid].Long = trips[x].Position.Long;

        drawMarker(tripid, color);
      }
    }
  }

  // Delete stale entries
  //
  for (tripid in g_marker) {
    if ((g_marker[tripid].hasOwnProperty("Color")) && (g_marker[tripid].Color === color)) {
      if (g_marker[tripid].Dirty === 0) {
        g_marker_layer.removeFeatures(g_marker[tripid].osm_marker);
        delete g_marker[tripid];
      }
    }
  }
  g_marker_layer.redraw();
}

function rtupdate(data) {
  if ("red" in data) {
    updateMarker(data, "red");
  }
  if ("blue" in data) {
    updateMarker(data, "blue");
  }
  if ("orange" in data) {
    updateMarker(data, "orange");
  }
}

function rtbusupdate(data) {
  if ("bus" in data) {
    updateBusMarker(data, "bus");
  }
}

var g_SERVER_ADDR = "bostontraintrack.com";

function setupRTStreams() {
  //g_socket = io('http://localhost:8181');
  g_socket = io('http://' + g_SERVER_ADDR + ':8181');
  g_socket.on('connect', function () {
    if (g_verbose) {
      console.log("Connected Metro Server.");
    }
    g_socket.on('update', rtupdate);
    g_socket.on('disconnect', function () {
      console.log("Disconnected Metro Server.");
    });
  });
}

function setupRTBStreams() {
  g_bus_socket = io('http://' + g_SERVER_ADDR + ':8182');
  g_bus_socket.on('connect', function () {
    if (g_verbose) {
      console.log("Connected Bus Server.");
    }
    g_bus_socket.on('update', rtbusupdate);
    g_bus_socket.on('disconnect', function () {
      console.log("Disconnected Bus Server.");
    });
  });
}

function teardownRTBStreams() {
  if (g_bus_socket) {
    console.log("Disconnecting Bus.");
    g_bus_socket.disconnect();
  }
}

//
//--------------------------

function mapEvent(ev) {
  if (ev.type == "zoomend") {

    if (g_map.zoom <= 12) {

      for (var metro_id in g_marker) {
        drawMarker(metro_id, g_marker[metro_id].Color);
      }

      for (var bus_id in g_bus_marker) {
        drawMarker(bus_id, "bus");
      }

      drawStops();

    } else {

      for (var metro_id in g_marker) {
        drawMarker(metro_id, g_marker[metro_id].Color);
      }

      for (var bus_id in g_bus_marker) {
        drawMarker(bus_id, "bus");
      }
      drawStops();
    }
  } else if (ev.type == "move") {
    //console.log("move!");
  } else if (ev.type == "moveend") {
    //console.log("moveend!");
  } else if (ev.type == "movestart") {
    //console.log("movestart!");
  }

}

function drawStops(force) {

  if (!force) {
    if (g_map.zoom < 8) {
      return;
    }
  }

  for (var ind in g_stops) {
    var st = g_stops[ind];
    //var lonlat =  new OpenLayers.LonLat( st.longitude, st.latitude )
    var lonlat = new OpenLayers.LonLat(st.lon, st.lat)
      .transform(
        new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
        g_map.getProjectionObject() // to Spherical Mercator Projection
      );

    var scale_factor = 1.0;
    var stop_w = g_param.stop_w;
    var stop_h = g_param.stop_h;

    if ((g_map.zoom <= 13) && (g_map.zoom >= 8)) {
      scale_factor = Math.exp(Math.log(2) * (g_map.zoom - 14));
      stop_w *= scale_factor;
      stop_h *= scale_factor;
    }

    var size = new OpenLayers.Size(stop_w, stop_h);
    var offset = new OpenLayers.Pixel(-(size.w / 2), -(size.h / 2));

    code = st.code;
    var icon = new OpenLayers.Icon("img/metro_T_fade.png", size, offset);
    if (/r/.test(code)) {
      icon = new OpenLayers.Icon("img/metro_T_red_fade.png", size, offset);
    } else if (/o/.test(code)) {
      icon = new OpenLayers.Icon("img/metro_T_orange_fade.png", size, offset);
    } else if (/b/.test(code)) {
      icon = new OpenLayers.Icon("img/metro_T_blue_fade.png", size, offset);
    }

    var stopMarker = new OpenLayers.Marker(lonlat, icon);

    if ("marker" in g_stops[ind]) {
      g_stop_layer.removeMarker(g_stops[ind].marker);
    }

    g_stops[ind].marker = stopMarker;
    g_stop_layer.addMarker(stopMarker);

  }
}

function initMap() {
  g_map = new OpenLayers.Map("mapdiv");

  g_map.events.register("zoomend", g_map, mapEvent);
  g_map.events.register("movestart", g_map, mapEvent);
  g_map.events.register("move", g_map, mapEvent);
  g_map.events.register("moveend", g_map, mapEvent);

  var transportattrib = 'Maps © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> <br/> Data © <a href="http://www.thunderforest.com">Thunderforest</a> ';

  var transport = new OpenLayers.Layer.OSM("Transport", ["http://a.tile.thunderforest.com/transport/${z}/${x}/${y}.png",
    "http://b.tile.thunderforest.com/transport/${z}/${x}/${y}.png",
    "http://c.tile.thunderforest.com/transport/${z}/${x}/${y}.png"
  ], {
    displayOutsideMaxExtent: true,
    transitionEffect: 'resize',
    attribution: transportattrib
  });

  g_map.addLayer(transport);

  g_bus_marker_layer = new OpenLayers.Layer.Vector("Bus", {
    eventListeners: {
      'featureselected': function (evt) {
        var feature = evt.feature;
        var popup = createPopUp(feature);
        feature.popup = popup;
        g_map.addPopup(popup);
      },
      'featureunselected': function (evt) {
        var feature = evt.feature;
        destoryPopUp(feature);
      }
    }
  });
  g_map.addLayer(g_bus_marker_layer);
  g_map.setLayerIndex(g_bus_marker_layer, 98);

  g_marker_layer = new OpenLayers.Layer.Vector("Metro", {
    eventListeners: {
      'featureselected': function (evt) {
        var feature = evt.feature;
        var popup = createPopUp(feature);
        feature.popup = popup;
        g_map.addPopup(popup);
      },
      'featureunselected': function (evt) {
        var feature = evt.feature;
        destoryPopUp(feature);
      }
    }
  });

  g_map.addLayer(g_marker_layer);
  g_map.setLayerIndex(g_marker_layer, 99);

  var selector = new OpenLayers.Control.SelectFeature([g_marker_layer, g_bus_marker_layer], {
    clickout: true,
    toggle: false,
    multiple: false,
    hover: false,
    toggleKey: "ctrlKey", // ctrl key removes from selection
    multipleKey: "shiftKey", // shift key adds to selection
    autoActivate: true
  });
  g_map.addControl(selector);

  g_stop_layer = new OpenLayers.Layer.Markers("Stops");

  drawStops(true);
  g_map.addLayer(g_stop_layer);
  g_map.setLayerIndex(g_stop_layer, 0)

  g_geolocate = new OpenLayers.Control.Geolocate({
    bind: false,
    geolocationOptions: {
      enableHighAccuracy: false,
      maximumAge: 0,
      timeout: 7000
    }
  });

  g_map.addControl(g_geolocate);

  g_geolocate.events.register("locationupdated", g_geolocate, function (e) {
    lonLat = new OpenLayers.LonLat(e.position.coords.longitude, e.position.coords.latitude).transform(
      new OpenLayers.Projection("EPSG:4326"),
      g_map.getProjectionObject()
    );
    g_map.setCenter(lonLat, g_zoom);
  });

  var lat = 42.3583183;
  var lon = -71.0584536;
  var lonLat = new OpenLayers.LonLat(lon, lat).transform(
    new OpenLayers.Projection("EPSG:4326"),
    g_map.getProjectionObject()
  );
  g_map.setCenter(lonLat, g_zoom);

}

function toggleBus() {

  var b = document.getElementById('busToggleInput');

  if (g_bus_toggle_input == 0) {
    g_bus_socket.emit("enable");
    b.src = "img/bus_gw_sq_inv.png";
    g_bus_toggle_input = 1;
  } else if (g_bus_toggle_input == 1) {

    g_bus_socket.emit("disable");
    b.src = "img/bus_gw_sq.png";
    g_bus_toggle_input = 0;

    // Delete stale entries
    //
    for (var id in g_bus_marker) {
      g_bus_marker_layer.removeMarker(g_bus_marker[id]["osm_marker"]);
      delete g_bus_marker[id];
    }
    g_bus_marker_layer.redraw();

  }

  $("#busToggleInput").blur();

}

function toggleCommuter() {

  var b = document.getElementById('commuterToggleInput');

  if (g_commuter_toggle_input == 0) {
    b.src = "img/train_sq_inv.png";
    g_commuter_toggle_input = 1;
  } else if (g_commuter_toggle_input == 1) {

    b.src = "img/train_sq.png";
    g_commuter_toggle_input = 0;

  }

  $("#commuterToggleInput").blur();

}

function toggleGPS() {

  var b = document.getElementById('gpsToggleInput');

  if (g_gps_toggle_input == 0) {
    g_geolocate.activate();
    b.src = "img/locator_sq_inv.png";
    g_gps_toggle_input = 1;
  } else if (g_gps_toggle_input == 1) {
    b.src = "img/locator_sq.png";
    g_gps_toggle_input = 0;
  }

  $("#gpsToggleInput").blur();

}

$(document).ready(function () {
  OpenLayers.ImgPath = "img/";
  initMap();
  setupRTStreams();
  setupRTBStreams();

  var b = document.getElementById('busToggle');
  b.style.top = '100px';
  b.style.left = '5px';

  var b = document.getElementById('commuterToggle');
  b.style.top = '200px';
  b.style.left = '5px';

  var b = document.getElementById('gpsToggle');
  b.style.top = '300px';
  b.style.left = '5px';

});
