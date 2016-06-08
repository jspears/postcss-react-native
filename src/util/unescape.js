export default function (str) {
    if (!str) return str;
    str = str.trim();
    const e = str.length - 1;
    const f = str[0];
    if (f === '"' || f === '\'' && str[e] === f)
        return str.substring(1, e);
    return str;
}