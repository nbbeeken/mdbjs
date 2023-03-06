import { List } from './list'

/** @public */
export type GenericListener = (...args: any[]) => void;

/**
 * Event description type
 * @public
 */
export type EventsDescription = Record<string, GenericListener>;

/** @public */
export type CommonEvents = 'newListener' | 'removeListener';

export class EventEmitter<Events extends EventsDescription> {
    private _events: Map<string, List<GenericListener>>;
    maxListeners: number;
    constructor() {
        this._events = new Map();
    }

    addListener<EventKey extends keyof Events>(event: EventKey, listener: Events[EventKey]): this;
    addListener(
        event: CommonEvents,
        listener: (eventName: string | symbol, listener: GenericListener) => void
    ): this;
    addListener(event: string | symbol, listener: GenericListener): this;
    addListener(event: any, listener: any): this {
        if (!this._events.has(event)) {
            this._events.set(event, new List());
        }
        this._events.get(event)?.push(listener)
        return this;
    }

    on<EventKey extends keyof Events>(event: EventKey, listener: Events[EventKey]): this;
    on(
        event: CommonEvents,
        listener: (eventName: string | symbol, listener: GenericListener) => void
    ): this;
    on(event: string | symbol, listener: GenericListener): this;
    on(event: any, listener: any): this {
        this.addListener(event, listener);
        return this;
    }

    once<EventKey extends keyof Events>(event: EventKey, listener: Events[EventKey]): this;
    once(
        event: CommonEvents,
        listener: (eventName: string | symbol, listener: GenericListener) => void
    ): this;
    once(event: string | symbol, listener: GenericListener): this;
    once(event: any, listener: any): this {
        const selfRemovingListener = () => {
            try {
                listener();
            } finally {
                this.removeListener(event, selfRemovingListener);
            }
        }
        this.addListener(event, selfRemovingListener)
        return this;
    }

    removeListener<EventKey extends keyof Events>(event: EventKey, listener: Events[EventKey]): this;
    removeListener(
        event: CommonEvents,
        listener: (eventName: string | symbol, listener: GenericListener) => void
    ): this;
    removeListener(event: string | symbol, listener: GenericListener): this;
    removeListener(event: any, listener: any): this {
        this._events.get(event)?.prune(l => l === listener);
        return this;
    }


    off<EventKey extends keyof Events>(event: EventKey, listener: Events[EventKey]): this;
    off(
        event: CommonEvents,
        listener: (eventName: string | symbol, listener: GenericListener) => void
    ): this;
    off(event: string | symbol, listener: GenericListener): this;
    off(event: any, listener: any): this {
        this.removeListener(event, listener);
        return this;
    }

    removeAllListeners<EventKey extends keyof Events>(
        event?: EventKey | CommonEvents | symbol | string
    ): this;
    removeAllListeners(event: any): this {
        this._events.delete(event)
        return this;
    }

    listeners<EventKey extends keyof Events>(
        event: EventKey | CommonEvents | symbol | string
    ): Events[EventKey][];
    listeners(event: any) {
        return this._events.get(event)?.toArray() ?? [];
    }

    rawListeners<EventKey extends keyof Events>(
        event: EventKey | CommonEvents | symbol | string
    ): Events[EventKey][];
    rawListeners(event: any) {
        return this.listeners(event);
    }


    emit<EventKey extends keyof Events>(
        event: EventKey | symbol,
        ...args: Parameters<Events[EventKey]>
    ): boolean;
    emit(event, ...args) {
        for (const eventFn of this._events.get(event) ?? []) {
            eventFn(...args);
        }
        return true;
    }

    listenerCount<EventKey extends keyof Events>(
        type: EventKey | CommonEvents | symbol | string
    ): number;
    listenerCount(type) {
        return this._events.get(type)?.length
    }

    setMaxListeners(n: number): this{
        this.maxListeners = n;
        return this;
    };
}
