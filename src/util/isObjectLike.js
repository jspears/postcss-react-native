export default function isObjectLike(value) {
    if (!value) return false;
    const tofv = typeof value;
    switch (tofv) {
        case 'string':
        case 'boolean':
        case 'number':
            return false;
    }
    if (value instanceof Date || value instanceof RegExp)return false;
    return true;
};
