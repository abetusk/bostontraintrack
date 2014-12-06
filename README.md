[BostonTrainTrack](http://bostontraintrack.com)
================

![Real Time Tracking](/misc/bostontraintrackScreenshot.png)

Simple real time tracking of Boston metros, buses and commuter rails using Open Street Map (via OpenLayers) and MBTA's real time tracking.

See it live at [bostontraintrack.com](http://bostontraintrack.com).

USAGE
-----

There is the possibility of viewing real-time data for the subway, the commuter rails and the buses.
Each of these three can be selected for using the buttons on the right.

Session state is stored in a persistent cookie so selected routes will be enabled on subsequent visits.

### Subway

![Subway button](/misc/button_metro.png)

This will enable all the subway filtering.  By default, all subway lines are displayed, which includes the red, blue and orange lines.
The green lines are split out by their routes: B, C, D and E.  Each green line route can be toggled individually in the 'filter' selection.

NOTE: As of 2014-12-06, real-time green line data is only available for the above ground green lines.

### Bus

![Bus button](/misc/button_bus.png)

This will enable all the bus filtering.  To filter by individual bus route, use the filtering option.

### Commuter

![Commuter button](/misc/button_commuter.png)

This will enable all the commuter filtering.  There are 12 lines in all.  To filter by specific route, use the filtering option.

### Route Filtering

![Filter button](/misc/button_star.png)

Hitting the 'star' button on the right will bring a 'modal':

![modal](/misc/modal.png)

The list of all available routes for the subway, commuter rails and buses are displayed in the modal that
pops up.   Individual routes and lines can be toggled.  Choices are saved so subsequent visits don't
need to be chosen again.


### GPS Locator

![Locator button](/misc/button_locator.png)

Hitting this button will center the map on your current GPS location.


### Feedback

![Filter button](/misc/button_feedback.png)

This will direct you to a feedback page.  Feedback is always welcome!  Please tell me what's on your mind!  I can't
promise to incorporate every feature but I can promise to try my best to read every message that's sent to me!



LICENSE
-------

All source code is under GPL compatible licenses.
See the headers of the source for the details of what each is under.
The main `bostontraintrack.js` client JavaScript and metro, bus and commuter rail JavaScript servers (`srv_v2.js` and `srv_bus_v2.js`) are under AGPL 3.0.

All artwork is under CC-BY-SA 3.0.


CREDITS
-------
  Parts of BostonTrainTrack developed by [Zachary Friss](http://friss.me).

  - [Open Street Map](http://www.openstreetmap.org)
  - [Thunderforest](http://www.thunderforest.com)
  - [Map Icons Collection](http://mapicons.nicolasmollet.com)
  - [JQuery](http://jquery.com)
  - [Socket.io](http://socket.io)
  - [Socket.io-client](https://github.com/Automattic/socket.io-client)
  - [MBTA Real Time Data](http://www.mbta.com/rider_tools/developers)
  - [Node.js](http://nodejs.org)
  - [Bootstrap](http://getbootstrap.com)
  - [ProtoBuf.js](https://github.com/dcodeIO/ProtoBuf.js)
  - [Font Awesome](http://fortawesome.github.io/Font-Awesome/)
  - And many more!
