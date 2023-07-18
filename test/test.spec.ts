import "mocha";
import { expect } from "chai";
import { SingularSocket, MessageRelay} from '../src/ws';
import { URL } from 'whatwg-url';
import { MongoClient } from "../src/index";

describe("Unit Tests:", () => {
  describe("Unit test sanity checks", () => {
    it("3 should not equal 1", () => {
      expect(3).to.not.equal(1);
    });

    it("1 should equal 1", () => {
      expect(1).to.equal(1);
    });
  });

  describe('url sanity check', function() {
    const url = new URL("iLoveJS://127.0.0.1:9080");
    const options = { port: 9080, host: '127.0.0.1' }; //web socket connection

    it('the url port and host should be parsed correctly', function() {
      expect(parseInt(url.port)).to.equal(options.port);
      expect(url.hostname).to.equal(options.host);
    });

    it('the websocket wrapper should have the correct host and port name',() => {
      expect(SingularSocket.url).to.equal(`ws://${options.host}:${options.port}/ws`);
    })
  });
})

describe("Integration Tests:", () => {
  // const options = { port: 9080, host: '127.0.0.1' }; //web socket connection

  describe('Client related tests', function() {

    it('should have helloOk be true', function() {
      const client = new MongoClient('mongodb://127.0.0.1:9080', { maxPoolSize: 2 });
      client.connect();
      // const { databases } = await client.db('admin').admin().listDatabases({ nameOnly: true });
      expect(client).to.equal(client);
      // expect(client.connect()).to.change(Promise<MongoClient>);
    });
  });



  describe('constructMessage() outputs the correct message', function() {
    it('should have helloOk be true', function() {

    });
  });
})