export function promisify<T>(fn: Function): Function {
    return (...args) => {
        return new Promise<any>((resolve, reject) => {
            fn(...args, (error, ...results) => {
                if (error) return reject(error);
                // @ts-ignore
                return resolve(...results);
            })
        })
    }
}
