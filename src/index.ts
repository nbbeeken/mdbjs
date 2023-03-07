export { MongoClient, BSON } from 'mongodb';

import { socket } from './modules/net';

/** @public */
export type Hooks = {
    fromDriver: (sendToDriver: (reqId: number | Uint8Array, m: any) => Promise<void>, b: Uint8Array, parsed: any) => Promise<void>;
}

/** @internal */
export const hooks: Hooks = {
    fromDriver: async () => { },
}


/** @public */
export async function setupHook(userHooks: Hooks) {
    hooks.fromDriver = userHooks.fromDriver
    return hooks;
}
