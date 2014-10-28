#!/bin/bash

#http://realtime.mbta.com/developer/api/v2/routes?api_key= &format=json&<parameter>=<required/optional parameters>

wget 'http://realtime.mbta.com/developer/api/v2/routes?api_key=wX9NwuHnZU2ToO7GmGR9uw&format=json' -O rt.json
