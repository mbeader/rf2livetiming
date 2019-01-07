# rFactor 2 Live Timing

Receives data from the included rF2 plugin by UDP on loopback.
Tracks best sector and lap times by the combination of track, driver name, vehicle name, and vehicle class.
Serves best laps and current drivers to client and updates in real time using socket.io. 

## Setup

* Place rf2livetiming.dll in the 64-bit rF2 plugins folder
* Place rf2livetiming.ini in the rF2 root folder
* Configure rf2livetiming.ini
* Install node and npm
* Run `npm install`
* Configure config.js
* Run `npm start` or run `npm test` to run directly in cmd
* Start the rF2 dedicated server
* To shut down the node server run `npm stop`

## Notes

* Currently only tested with 64-bit rFactor 2
* rF2 is Windows only, this program is currently Windows only

## TODO

* Display data such as best sectors and timestamp
* Rethink use of objects
* Identify drivers as AI
* Display session time
* Display live lap information
* View hotlap db for other tracks not currently on server
* View race results files
* Driver ranking