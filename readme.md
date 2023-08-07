# MongoDB Driver in the browser
Node driver with polyfills for compatibility in browser

How to run locally using mms and go backend:  
* Start the backend  
* Add package to mms/client (2 ways):  
  * (1) npm package  (wip: package is not built)
    * Run "npm i git+ssh://git@github.com:laurelxiang/mdbjs.git --save" in mms/client  
    * Make changes to backend such that this package is called instead of native node driver
(depending on the way your github is configured the path may be different)  
    * Replace instances of "import { MongoClient } from 'mongodb'" to "import { MongoClient } from 'mdbjs'"
(for now only in mms/client/js/project/metrics/services/dataExplorerService.ts)  
  * (2) npm link  
    * Fork and clone this repo on your local device
    * Run "npm link" at the root of mdbjs
    * Run "npm link mdbjs" at mms/client
    * Run "npm run build" at the root of mdbjs  
* Start mms (click [here](https://wiki.corp.mongodb.com/display/MMS/Cloud+Developer+Setup#CloudDeveloperSetup-BuildandruntheMMSapplication) for instructions)

How to run tests locally:  
* Fork and clone this repo on your local device
* Run "npm run test" at the root of mdbjs  
* Add "-- --inspect-brk" to package.json\[scripts]\[test] to use chrome debugger for tests

Running npm run test will also build the package as well  

Notes:
In test, the mongo client is imported from dist, so any updates to the repo will require a build before testing.