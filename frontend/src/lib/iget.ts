import toLower from "lodash/toLower";
// @ts-ignore
import castPath from "lodash/_castPath";
// @ts-ignore
import toKey from "lodash/_toKey";



export default function iget<T>(object: any, path: string, defaultValue: T | undefined | null): T | null | undefined {
    if (!object) return defaultValue === undefined ? null : defaultValue;

    const paths = castPath(path, object);
    const {length} = paths;
    let index = 0;

    let iterator = object;
    while (iterator !== undefined && index < length) {
        const key = (toKey(paths[index])).toLowerCase();
        iterator = findLowercaseKey(iterator, key);
        index += 1;
    }
    return (index && index === length && iterator !== undefined) ? iterator : defaultValue;
}

const findLowercaseKey = (value: any, key: string) => {
    return Object.keys(value).reduce((a, k) => {
        if (a !== undefined) {
            return a;
        }
        if (toLower(k) === key) {
            return value[k];
        }
    }, undefined);
}