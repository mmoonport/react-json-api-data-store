import {Observable} from "../utils/core";

export default class Meta extends Observable {
    constructor(store, name) {
        super();
        this.store = store;
        this.name = name;
        this._state = this.snapshot();
        if (this._state.get('reload')) {
            // Replace this with a head call
            this._promise = this.store.head(this._state.get('collection'));
            this.store._internalStore = this.store._internalStore.setIn(['meta', name, 'reload'], false);
        }
        
    }
    
    subscribe(callback) {
        this.store.on(`meta:${this.name}`, callback);
        return {
            unsubscribe: () => {
                this.store.off(`meta:${this.name}`, callback);
            }
        }
    }
    
    fetch() {
        let promise = Promise.resolve(this);
        if (this._promise) {
            promise = this._promise.then(({meta}) => {
                this.store._internalStore = this.store._internalStore.mergeDeepIn(['meta', this.name], meta);
                this._state = this.snapshot();
                this.store.dispatch(`meta:${this.name}`, this._state);
                this._promise = null;
                return this;
            })
        }
        return promise;
        
    }
    
    snapshot() {
        return this._state = this.store._internalStore.getIn(['meta', this.name]);
    }
    
    get() {
        return this._state.get(...arguments);
    }
    
    getIn() {
        return this._state.getIn(...arguments);
    }
    
    set(key, value) {
        this.store._internalStore.setIn(['meta', this.name, key], value);
        this._state = this.snapshot();
    }
    
    setIn(keys, value) {
        this.store._internalStore.setIn(['meta', this.name, ...keys], value);
        this._state = this.snapshot();
    }
}