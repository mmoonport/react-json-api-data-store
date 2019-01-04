import {Observable} from "../utils/core";
import {Map} from "immutable";
import {fromJS} from "../../node_modules/immutable/dist/immutable";

export default class Query extends Observable {
    _state;
    
    constructor(store, queryName) {
        super();
        this.store = store;
        this._queryName = queryName;
        this._state = this.snapshot();
    }
    
    subscribe(callback) {
        this.store.on(`queries:${this._queryName}`, callback);
        return {
            unsubscribe: () => {
                this.store.off(`queries:${this._queryName}`, callback);
            }
        }
    }
    
    handlePromise() {
        this._state = this.snapshot();
        let reload = this._state.get('reload', false);
        let collection = this._state.get('collection');
        let options = this._state.get('options', Map({})).toObject();
        if (reload) {
            // Replace this with a head call
            this._promise = this.store.find(collection, options);
            this.store._internalStore = this.store._internalStore.setIn(['queries', this._queryName, 'reload'], false);
            this._state = this.snapshot();
        }
    }
    
    get state() {
        return Map({
            ...this._state.toObject(),
            data: this.data
        })
    }
    
    get data() {
        let {data = []} = this._state.toObject();
        return data.map(modelString => {
            //models|createdRecords^contacts^mongoid||clientid
            return this.store.getModel(...modelString.split('^'))
        });
    }
    
    loadMore(style) {
        let state = this._state;
        if (!state) {
            return;
        }
        let {options, meta, isLoading} = this._state.toObject();
        if (!meta) {
            return;
        }
        let {current_page, total_pages, next} = meta.toObject();
        if (!isLoading && current_page < total_pages) {
            isLoading = true;
            options = options.set('skip', next);
            state = state.merge(fromJS({
                isLoading,
                options,
                reload: true
            }));
            this.store._internalStore = this.store._internalStore.setIn(['queries', this._queryName], state);
            this._state = this.snapshot();
            this.store.dispatch(`queries:${this._queryName}`, this);
            this.fetch();
        }
    }
    
    fetch() {
        this.handlePromise();
        let promise = Promise.resolve(this);
        let state = this.snapshot();
        state = state.set('isLoading', true);
        this.store._internalStore = this.store._internalStore.setIn(['queries', this._queryName], state);
        this._state = this.snapshot();
        this.store.dispatch(`queries:${this._queryName}`, this);
        if (this._promise) {
            promise = this._promise.then(({meta, models}) => {
                let {data = []} = state.toObject();
                data = [...data, ...models.map(model => `${model._storeKey}^${model.type}^${model.id}`)];
                state = state.set('isLoading', false);
                state = state.set('data', data);
                state = state.mergeDeepIn(['meta'], fromJS(meta));
                this.store._internalStore = this.store._internalStore.setIn(['queries', this._queryName], state);
                this._state = this.snapshot();
                this.store.dispatch(`queries:${this._queryName}`, this);
                this._promise = null;
                return this;
            })
        }
        state = state.set('isLoading', false);
        this.store._internalStore = this.store._internalStore.setIn(['queries', this._queryName], state);
        this._state = this.snapshot();
        this.store.dispatch(`queries:${this._queryName}`, this);
        return promise;
        
    }
    
    snapshot() {
        return this._state = this.store._internalStore.getIn(['queries', this._queryName]);
    }
}