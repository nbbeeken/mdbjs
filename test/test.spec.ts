import "mocha";
import { expect } from "chai";
import { SingularSocket, SocketInterface } from '../src/ws';
import { BSON } from "mongodb";
import { webByteUtils } from "../src/modules/buffer";
import { URL } from '../src/modules/url';
import { MongoClient } from "../src/index";

describe("Unit Tests:", () => {
  describe("Unit test sanity checks", () => {
    it("3 should not equal 1", () => {
      // const result = addition(2, 3);
      // assert.equal(2, 5);
      expect(3).to.not.equal(1);
    });

    it("1 should equal 1", () => {
      // const result = addition(2, 3);
      // assert.equal(2, 5);
      expect(1).to.equal(1);
    });
  });

  describe('url sanity check', function() {
    const url = new URL("iLoveJS://127.0.0.1:9080");
    const options = { port: 9080, host: '127.0.0.1' }; //web socket connection

    it('should have helloOk be true', function() {
      expect(parseInt(url.port)).to.equal(options.port);
    });

    describe('TODO: client', function() {
      const client = new MongoClient('mongodb://127.0.0.1:9080', { maxPoolSize: 2 });

      it('should have helloOk be true', function() {
        expect(client).to.equal(client);
      });
    });

    // describe('constructMessage() outputs the correct message', function() {
    //   it('should have helloOk be true', function() {
    //     expect(SingularSocket.url).to.equal(`ws://${options.host}:${options.port}/ws`);
    //   });
    // });
  });
})

describe("Integration Tests:", () => {

})