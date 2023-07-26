// import process from 'node:process'
// import util from 'node:util'
// import { MongoClient } from '../src/index.js';
// import { MONGO_CLIENT_EVENTS } from 'mongodb/lib/constants.js'
//
// const client = new MongoClient(process.env.MONGODB_URI, { monitorCommands: true });
//
// for (const eventName of MONGO_CLIENT_EVENTS) {
//   client.on(eventName, event => {
//     console.log(new Date(), eventName, util.inspect(event, { colors: true, compact: true, breakLength: Infinity, depth: Infinity }))
//   })
// }
//
// await client.connect()
//
// await client.close()
//
// console.log('done.')