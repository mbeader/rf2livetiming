# rFactor 2 Live Timing

Receives data from the [companion rF2 plugin](https://github.com/mbeader/rf2livetiming-plugin) by UDP, ideally over loopback.
Serves current session information to client and updates in real time using socket.io. 
Tracks best sector and lap times by the combination of track, driver name, vehicle name, and vehicle class.
Displays a track map, generated via vehicle position over a good, fast lap, with current vehicle locations marked.

## Setup

* Download latest release and referenced plugin release
* Install [node (including npm)](https://nodejs.org) (tested with v18 LTS)
* Run `npm install`
* Configure files in `config/`
* Setup game based on sections below

### rFactor 2

* Place the compiled `rf2livetiming.dll` in the 64-bit rF2 plugins folder
* Place `rf2livetiming.ini` in the rF2 root folder
* Configure `rf2livetiming.ini`
* Logs to `UserData\Log\rf2livetiming.log`

## rFactor/Automobilista

* Place the compiled `rf1livetiming.dll` in the plugins folder
* Place `rf1livetiming.ini` in the rF1/AMS root folder
* Configure `rf1livetiming.ini`
* Logs to `UserData\Log\rf1livetiming.log`

## Usage

* Run `npm start`
* Start the dedicated server
* To shut down the node server run `npm stop`

## Notes

* rf2livetiming.dll supports 64-bit rFactor 2
* rf1livetiming.dll supports last versions of rFactor and Automobilista
* Tested on Windows 10 and Windows Server 2012 R2

## TODO

* View hotlap db for any track
* Move from JSON to a database, likely sqlite3
* Handle multiple servers
* Rethink use of objects
* View race results files
* Driver ranking