import { Duplex } from "stream";
import { SocketWrapper } from '../ws';

//<k,v> -> <SocketInstance.streamIdentifier,SocketInstance>
const streams = new Map<number,SocketInstance>;
export default streams;

export class SocketInstance extends Duplex {
    options: { port: number; host: string };
    isKeptAlive: boolean;
    keepAliveDelay: number;
    timeoutMS: number;
    noDelay: boolean;
    ws: SocketWrapper;
    wsReader: AsyncGenerator<Uint8Array, any, unknown>;
    remoteAddress: string;
    remotePort: number;
    streamIdentifier: number;
    isReady: boolean; //for prehello message
    whenReady: Promise<boolean>; //for prehello message

    constructor(options: { port: number; host: string; streamIdentifier: number }) {
        super();
        this.options = options;
        this.remoteAddress = options.host;
        this.remotePort = options.port;
        this.streamIdentifier = options.streamIdentifier;
        this.ws = new SocketWrapper();
        this.wsReader = this.ws[Symbol.asyncIterator]();
        this.isReady = false;
        this.whenReady = new Promise((resolve, reject) => {});
    }

    _write(chunk, encoding, callback) {
        this.ws.send(chunk);
        callback();
    }

    _read(size) {
        (async () => {
            for await (const message of this.wsReader) {
                this.push(message);
            }
        })().then(()=>{}, (error)=>{this.emit('error',error)});
    }

    // TCP specific
    setKeepAlive(enable: boolean, initialDelayMS: number) {
        this.isKeptAlive = enable;
        this.keepAliveDelay = initialDelayMS;
    }

    setTimeout(timeoutMS: number) {
        this.timeoutMS = timeoutMS;
    }

    setNoDelay(noDelay: boolean) {
        this.noDelay = noDelay;
    }

    override once(eventName: any, listener: any): this {
        super.once(eventName, listener);
        if (eventName === 'connect') {
            setTimeout(() => {
                listener('connect');
            }, 1)
        }
        return this;
    }

    preHelloInfo() {
        return {
            port: this.options.port,
            host: this.options.host,
            ok: 1
        }
    }
}

function* incrementalNumberGenerator() {
    let id = 1;
    while (true) {
        yield id++;
    }
}

let generateIdentifier = incrementalNumberGenerator();

export function createConnection(options) {
    const identifier = generateIdentifier.next().value;
    options.streamIdentifier = identifier;
    const socket = new SocketInstance(options);
    if (identifier) {
        streams.set(identifier, socket);
    }
    return socket;
}
