
export function hrtime() {
    const currDate = new Date().getTime();
    return [currDate / 1000, currDate % 1000];
}

export function nextTick(fn, ...args) {
    queueMicrotask(fn.bind(null, ...args));
}

export const platform = 'MongoDB_OS';
export const arch = 'leg';
export const env = Object.create(null);
