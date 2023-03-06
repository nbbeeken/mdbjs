export { MongoClient, BSON } from 'mongodb';

import { socket } from './modules/net';

/** @public */
export type Hooks = {
    fromDriver: (this: { toDriver: Hooks['toDriver'] }, b: Uint8Array, parsed: any) => Promise<void>;
    toDriver: (reqId: number, m: any) => Promise<void>;
}

/** @internal */
export const hooks: Hooks = {
    fromDriver: async () => { },
    toDriver: toDriver,
}

async function toDriver(reqId: number, m: any): Promise<void> {
    socket.sendMessageToDriver(reqId, m);
    return;
}

/** @public */
export async function setupHook(userHooks: Hooks) {
    hooks.fromDriver = userHooks.fromDriver.bind({ toDriver })
    return hooks;
}
