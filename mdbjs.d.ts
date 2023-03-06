import { BSON } from 'mongodb';
import { MongoClient } from 'mongodb';

export { BSON }

/** @public */
export declare type Hooks = {
    fromDriver: (this: {
        toDriver: Hooks['toDriver'];
    }, b: Uint8Array, parsed: any) => Promise<void>;
    toDriver: (reqId: number, m: any) => Promise<void>;
};

/* Excluded from this release type: hooks */
export { MongoClient }

/** @public */
export declare function setupHook(userHooks: Hooks): Promise<Hooks>;

export { }
