type ListNode<T> = {
    value: T;
    next: ListNode<T> | HeadNode<T>;
    prev: ListNode<T> | HeadNode<T>;
};

type HeadNode<T> = {
    value: null;
    next: ListNode<T>;
    prev: ListNode<T>;
};

/**
 * When a list is empty the head is a reference with pointers to itself
 * So this type represents that self referential state
 */
type EmptyNode = {
    value: null;
    next: EmptyNode;
    prev: EmptyNode;
};

/**
 * A sequential list of items in a circularly linked list
 * @remarks
 * The head node is special, it is always defined and has a value of null.
 * It is never "included" in the list, in that, it is not returned by pop/shift or yielded by the iterator.
 * The circular linkage and always defined head node are to reduce checks for null next/prev references to zero.
 * New nodes are declared as object literals with keys always in the same order: next, prev, value.
 * @internal
 */
export class List<T = unknown> {
    private readonly head: HeadNode<T> | EmptyNode;
    private count: number;

    get length() {
        return this.count;
    }

    get [Symbol.toStringTag]() {
        return 'List' as const;
    }

    constructor() {
        this.count = 0;

        // this is carefully crafted:
        // declaring a complete and consistently key ordered
        // object is beneficial to the runtime optimizations
        this.head = {
            next: null,
            prev: null,
            value: null
        } as unknown as EmptyNode;
        this.head.next = this.head;
        this.head.prev = this.head;
    }

    toArray() {
        return Array.from(this);
    }

    toString() {
        return `head <=> ${this.toArray().join(' <=> ')} <=> head`;
    }

    *[Symbol.iterator](): Generator<T, void, void> {
        for (const node of this.nodes()) {
            yield node.value;
        }
    }

    private *nodes(): Generator<ListNode<T>, void, void> {
        let ptr: HeadNode<T> | ListNode<T> | EmptyNode = this.head.next;
        while (ptr !== this.head) {
            // Save next before yielding so that we make removing within iteration safe
            const { next } = ptr as ListNode<T>;
            yield ptr as ListNode<T>;
            ptr = next;
        }
    }

    /** Insert at end of list */
    push(value: T) {
        this.count += 1;
        const newNode: ListNode<T> = {
            next: this.head as HeadNode<T>,
            prev: this.head.prev as ListNode<T>,
            value
        };
        this.head.prev.next = newNode;
        this.head.prev = newNode;
    }

    /** Inserts every item inside an iterable instead of the iterable itself */
    pushMany(iterable: Iterable<T>) {
        for (const value of iterable) {
            this.push(value);
        }
    }

    /** Insert at front of list */
    unshift(value: T) {
        this.count += 1;
        const newNode: ListNode<T> = {
            next: this.head.next as ListNode<T>,
            prev: this.head as HeadNode<T>,
            value
        };
        this.head.next.prev = newNode;
        this.head.next = newNode;
    }

    private remove(node: ListNode<T> | EmptyNode): T | null {
        if (node === this.head || this.length === 0) {
            return null;
        }

        this.count -= 1;

        const prevNode = node.prev;
        const nextNode = node.next;
        prevNode.next = nextNode;
        nextNode.prev = prevNode;

        return node.value;
    }

    /** Removes the first node at the front of the list */
    shift(): T | null {
        return this.remove(this.head.next);
    }

    /** Removes the last node at the end of the list */
    pop(): T | null {
        return this.remove(this.head.prev);
    }

    /** Iterates through the list and removes nodes where filter returns true */
    prune(filter: (value: T) => boolean) {
        for (const node of this.nodes()) {
            if (filter(node.value)) {
                this.remove(node);
            }
        }
    }

    clear() {
        this.count = 0;
        this.head.next = this.head as EmptyNode;
        this.head.prev = this.head as EmptyNode;
    }

    /** Returns the first item in the list, does not remove */
    first(): T | null {
        // If the list is empty, value will be the head's null
        return this.head.next.value;
    }

    /** Returns the last item in the list, does not remove */
    last(): T | null {
        // If the list is empty, value will be the head's null
        return this.head.prev.value;
    }
}
