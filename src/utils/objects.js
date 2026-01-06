export const getNestedProperty = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

export const setNestedProperty = (obj, path, value) => {
    const keys = path.split('.');
    const newObj = { ...obj };
    let current = newObj;

    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
            current[keys[i]] = {};
        } else {
            current[keys[i]] = { ...current[keys[i]] };
        }
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    return newObj;
};