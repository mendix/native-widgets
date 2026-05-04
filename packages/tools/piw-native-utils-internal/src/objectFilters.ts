export function exclude<A extends B, B extends object>(source: A, exclusionKeys: Array<keyof B>): A {
    const keys = Object.keys(source) as Array<keyof A>;
    return keys
        .filter(key => exclusionKeys.findIndex(k => k === key) === -1)
        .reduce((result, key) => ({ ...result, ...{ [key]: source[key] } }), {}) as A;
}

export function only<A extends B, B extends object>(source: A, selectionKeys: Array<keyof B>): B {
    return selectionKeys
        .filter(key => source[key] !== undefined)
        .reduce((result, key) => ({ ...result, ...{ [key]: source[key] } }), {}) as B;
}
