import {Map} from "immutable";

export default class Model {
    _storeKey;
    _store;
    _collectionType;
    _clientID;
    _currentState;
    
    constructor({store, storeKey, collectionType, id = null, clientID = null}) {
        this._store = store;
        this._storeKey = storeKey;
        this._clientID = clientID;
        this._collectionType = collectionType;
        this._id = id;
        let _snapshot = this.snapshot();
        this._snapshot = _snapshot.get('data');
        this._currentState = _snapshot.get('currentSnapshot');
        this.key = this.id || this.clientID;
    }
    
    get eventName() {
        return `${this._storeKey}:${this._collectionType}:${this._id || this._clientID}`;
    }
    
    subscribe(callback) {
        this._store.on(this.eventName, callback);
        return {
            unsubscribe: () => {
                this._store.off(this.eventName, callback);
            }
        }
    }
    
    updateCurrentState() {
        let state = this._currentState;
        this._store._internalStore = this._store._internalStore.setIn([...this.resourceKey(), 'currentSnapshot'], state);
        this.dispatch(this);
    }
    
    dispatch() {
        this._store.dispatch(this.eventName, ...arguments);
    }
    
    modelIsEqual(model) {
        return model instanceof Model && this._currentState === model._currentState;
    }
    
    get isDirty() {
        return this._currentState !== this._snapshot;
    }
    
    get isNew() {
        return !this._id;
    }
    
    save(options) {
        return this._store.save(this, options).then((m) => {
            this._id = m.id;
            this._storeKey = m._storeKey;
            this._snapshot = this.snapshot();
            this.dispatch(this);
            return this;
        })
    }
    
    get id() {
        return this._id;
    }
    
    get clientID() {
        return this._clientID;
    }
    
    get type() {
        return this._collectionType;
    }
    
    get resourceIdentifier() {
        let {id, type, clientID} = this;
        return Map({id, type, client_id: clientID});
    }
    
    resourceKey() {
        return [this._storeKey, this._collectionType, this._id || this._clientID];
    }
    
    snapshot() {
        return this._store._internalStore.getIn(this.resourceKey());
    }
    
    get resource() {
        let data = this.snapshot();
        return Map({data});
    }
    
    get attributes() {
        return new Proxy({obj: this}, {
            get(ref, prop) {
                let {obj} = ref;
                let snapshot = obj._currentState;
                return snapshot.getIn(['attributes', prop]);
            },
            set(ref, prop, value) {
                let {obj} = ref;
                let snapshot = obj._currentState;
                snapshot = snapshot.setIn(['attributes', prop], value);
                obj._store.updateSnapshot(snapshot, obj._storeKey);
                let _snapshot = obj.snapshot();
                obj._snapshot = _snapshot.get('data');
                obj._currentState = _snapshot.get('currentSnapshot');
                obj.dispatch();
            }
        })
    }
    
    
    get relationships() {
        return new Proxy({obj: this}, {
            get(ref, prop) {
                let {obj} = ref;
                let snapshot = obj._currentState;
                return obj._store.resolveSnapshotRelationships(snapshot, prop);
            },
            set(ref, prop, value) {
                let {obj} = ref;
                if (value === null) {
                    value = {data: value};
                } else if (value instanceof Array) {
                    value = value.map(m => {
                        assert(m instanceof Model, "Must pass models");
                        return m.resourceIdentifier;
                    });
                } else {
                    assert(value instanceof Model, "Must pass models");
                    value = value.resourceIdentifier;
                }
                let snapshot = obj._currentState;
                snapshot = snapshot.setIn(['relationships', prop], value);
                obj._store.updateSnapshot(snapshot, obj._storeKey);
                let _snapshot = obj.snapshot();
                obj._snapshot = _snapshot.get('data');
                obj._currentState = _snapshot.get('currentSnapshot');
                obj.dispatch();
            }
        });
    }
}