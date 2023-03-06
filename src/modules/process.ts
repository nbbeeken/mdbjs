export function hrtime() {
    return [0, 0]
}

export function nextTick(fn, ...args) {
    setTimeout(fn, 1, ...args);
}
