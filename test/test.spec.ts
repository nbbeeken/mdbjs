import "mocha";
import { expect } from "chai";
import chai from "chai";
import { MongoClient } from "../dist/mongodb.cjs";
import { MONGO_CLIENT_EVENTS } from 'mongodb/lib/constants.js'
import { SocketWrapper } from '../src/ws';
import { URL } from 'whatwg-url';
import { constructMessage, parseMessage } from "./wire_message_utils";
import { createConnection } from "../src/modules/net";
import { myHello } from "./test_socket_instance";

chai.config.truncateThreshold = 0;

describe("All Tests:",() => {
  describe("Unit Tests:", () => {
    describe('Url sanity check', () => {
      const url = new URL("iLoveJS://127.0.0.1:9080");
      const options = { port: 9080, host: '127.0.0.1' }; //web socket connection

      it('The url port and host should be parsed correctly', () => {
        expect(parseInt(url.port)).to.equal(options.port);
        expect(url.hostname).to.equal(options.host);
      });
    });

    describe('Verify that the simulated hello message is properly filled and formatted', () => {
      it('Check that the message constructor and parser from bson to binary works as expected', () => {
        expect(parseMessage(constructMessage(0,myHello())).doc.helloOk).to.equal(myHello().helloOk);
      });
    });

    describe('Verify that the pre hello message has the desired information', () => {
      it('Check that the message constructor and parser works as expected for the prehello message', () => {
        const options = { port: 9080, host: '127.0.0.1' };
        let test_socket_instance = createConnection(options);
        let message = parseMessage(constructMessage(0,test_socket_instance.preHelloInfo())).doc;
        expect(message).to.have.property('host','127.0.0.1');
        expect(message).to.have.property('port',9080);
      })
    })

    describe('Socket sanity check', () => {
      const ws = new SocketWrapper();
      it('The socket wrapper should use laurels_socket for testing instead of a real web socket', () => {
        expect(ws.socketMode).to.equal('test');
      });
    });

    describe('Client related tests:', () => {
      let client;
      let events;

      beforeEach(() => {
        client = new MongoClient('mongodb://127.0.0.1:9080', { maxPoolSize: 2, serverSelectionTimeoutMS: 35000 });
        events = {};
        for (const eventName of MONGO_CLIENT_EVENTS) {
          client.on(eventName, event => {
            events[eventName] = events[eventName]?  events[eventName] + 1 : 1;
          })
        }
      })

      afterEach(async () => {
        await client?.close()
      })

      it('Client should not throw error when connecting', async () => {
          expect(await client.connect()).to.not.equal(null);
      });

      describe('Browser successfully sends and receives message from backend', () => {
        it('The hello handshake is exchanged between node and simulated web socket using server heartbeat as an indicator', async() => {
          await client.db().command({ping:1});
          expect(events).to.have.property('serverHeartbeatSucceeded', 1);
        });

        it('The hello handshake is exchanged between node and simulated web socket using connection created as an indicator', async() => {
          await client.db().command({ping:1});
          expect(events).to.have.property('connectionCreated', 1);
        });
      });
    });
  })
})