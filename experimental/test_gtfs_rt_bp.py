#!/usr/bin/python

import gtfs_realtime_pb2
import sys

fm = gtfs_realtime_pb2.FeedMessage()
f = open(sys.argv[1], "rb")
fm.ParseFromString(f.read())
f.close()
print fm


