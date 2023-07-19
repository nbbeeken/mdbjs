export function hrtime() {
    const currDate = new Date().getTime();
    return [currDate / 1000, currDate % 1000];
}

export function nextTick(fn) {
    queueMicrotask(fn);
}
