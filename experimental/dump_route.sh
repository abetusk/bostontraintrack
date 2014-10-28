#!/bin/bash

rt=$1



wget 'http://realtime.mbta.com/developer/api/v2/vehiclesbyroute?api_key=pcJE02QSo0eKhhgIUnnqoA&format=json&route='$rt -O -
#wget 'http://realtime.mbta.com/developer/api/v2/vehiclesbyroute?api_key=wX9NwuHnZU2ToO7GmGR9uw&format=json&route='$rt 

