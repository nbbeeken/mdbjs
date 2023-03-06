import { EventEmitter } from "../event_emitter";

export class Readable extends EventEmitter<any> {
    constructor() {
        super();
    }

    pipe() {

    }
}
export class Writable extends EventEmitter<any> {
    constructor() {
        super();
    }
}
export class Duplex extends EventEmitter<any> {
    destroyed: boolean = false;
    writableEnded: boolean = false;
    stream: any;
    constructor() {
        super();
    }

    pipe(stream) {
        this.stream = stream
    }

    destroy() {
        this.destroyed = true;
        this.writableEnded = true;
    }

    push(outgoingDataBuffer) {
        this.stream.push(outgoingDataBuffer);
    }
}
