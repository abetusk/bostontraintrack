#!/bin/bash

t=`date +'%Y-%m-%d %H:%M:%S'`
s=`cnvrtime "$t"`

wget -q 'http://developer.mbta.com/lib/GTRTFS/Alerts/VehiclePositions.pb' -O data/VehiclePositions_$s.pb
rm -f VehiclePositions.pb
ln -s data/VehiclePositions_$s.pb VehiclePositions.pb

echo "data/VehicelPositions_$s.pb"
