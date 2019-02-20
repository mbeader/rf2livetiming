# rFactor 2 Live Timing

Receives data from the [included rF2 plugin](https://github.com/mbeader/rf2livetiming-plugin) by UDP, ideally over loopback.
Serves current session information to client and updates in real time using socket.io. 
Tracks best sector and lap times by the combination of track, driver name, vehicle name, and vehicle class.
Displays a track map, generated via vehicle position over a good, fast lap, with current vehicle locations marked.

## Setup

* Place rf2livetiming.dll in the 64-bit rF2 plugins folder
* Place rf2livetiming.ini in the rF2 root folder
* Configure rf2livetiming.ini
* Install [node (including npm)](https://nodejs.org)
* Run `npm install`
* Configure files in `config/`
* Run `npm start` or run `npm test` to run directly in cmd
* Start the rF2 dedicated server
* To shut down the node server run `npm stop`

## Notes

* Only tested with 64-bit rFactor 2
* rF2 is Windows only, this program is currently Windows only

## TODO

* View hotlap db for any track
* Move from JSON to a database, likely sqlite3
* Handle multiple servers
* Rethink use of objects
* View race results files
* Driver ranking