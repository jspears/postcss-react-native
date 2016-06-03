export default function () {

    const listeners = new Set();

    const listen = (...args) => {
        for (const listen of listeners) {
            listen(...args);
        }
    };
    //add subscriptions
    const subscribe = listen.subscribe = (...cbs) => {
        listeners.add(...cbs);
        //unsubscribes
        return () => {
            for (const cb of cbs) {
                listeners.delete(cb);
            }
        }
    };
    //listen to a property.  update it when the listen is fired.
    listen.property = (obj, key, cb) => subscribe((...args) => obj[key] = cb(...args));

    //clear all listeners.
    listen.clear = (_listeners = listeners) => listeners.clear();

    //After the value is triggered once, it stops listening.
    listen.once = (cb)=> {
        const _unlisten = listeners.subscribe((...args)=> {
            const ret = cb(...args);
            _listen();
            return ret;
        });
        return _unlisten;
    };
    return listen;
}
