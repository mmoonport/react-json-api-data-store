import React from 'react';
import {assert} from "react-native";

import {autobind} from "core-decorators";
import {Map, List, fromJS} from "immutable"

import API from "./API.service";
import Meta from "./Meta";
import Model from "./Model";
import Query from "./Query";
import {Observable, uuid4} from "../utils/core";

export default class DataStore extends Observable {
    static instance = null;
    _api = null;
    
    _internalStore = Map({
        models: Map({}),
        queries: Map({}),
        meta: Map({}),
        pendingCreate: Map({}),
        subscribers: Map({
            meta: Map(),
            query: Map(),
        })
    });
    
    static getInstance() {
        if (DataStore.instance === null) {
            DataStore.instance = new DataStore();
        }
        return DataStore.instance;
    }
    
    constructor() {
        super();
        this._api = new API();
    }
    
    set host(host) {
        this._api.host = host;
    }
    
    set headers(headers) {
        this._api.headers = headers;
    }
    
    getModel(storeKey, collection, id) {
        let store = this._internalStore;
        let m = store.getIn([storeKey, collection, id], undefined);
        if (m) {
            return new Model({
                storeKey,
                store: this,
                collectionType: m.getIn(['currentSnapshot', 'type']),
                id: m.getIn(['currentSnapshot', 'id']),
                clientID: m.getIn(['currentSnapshot', 'client_id'])
            });
        }
        
    }
    
    getCollection(storeKey, collection) {
        let store = this._internalStore;
        Object.values(store.getIn([collection], undefined)).map(m => {
            return new Model({
                storeKey,
                store: this,
                collectionType: m.type,
                id: m.id,
                clientID: m.client_id
            });
        });
        
    }
    
    resolveSnapshotRelationships(snapshot, relationshipName) {
        let relationship = snapshot.getIn(['relationships', relationshipName, 'data']);
        if (relationship) {
            if (relationship instanceof Array || relationship instanceof List) {
                return relationship.map(r => {
                    r = r.toObject();
                    let storeKey = r.id ? 'models' : 'pendingCreate';
                    let id = r.id || r.client_id;
                    return this.peekOne(r.type, id, storeKey);
                });
            } else {
                relationship = relationship.toObject();
                let storeKey = relationship.id ? 'models' : 'pendingCreate';
                let id = relationship.id || relationship.clientID;
                return this.peekOne(relationship.type, id, storeKey);
            }
        }
    }
    
    resolveResourceIdentifiers(resourceIdentifiers) {
        if (!resourceIdentifiers ||
            !resourceIdentifiers.data ||
            resourceIdentifiers.data === null
        ) {
            return null;
        }
        if (resourceIdentifiers.data instanceof Array) {
            return resourceIdentifiers.data.map(ri => {
                return this.peekOne(ri.type, ri.id) || ri;
                
            });
        } else {
            let ri = resourceIdentifiers.data;
            return this.peekOne(ri.type, ri.id) || ri;
        }
    }
    
    updateSnapshot(snapshot, key) {
        let id = snapshot.get('id', snapshot.get('client_id'));
        this._internalStore = this._internalStore.mergeDeepIn([key, snapshot.get('type'), id, 'currentSnapshot'], snapshot);
        
    }
    
    _updateStore(key, resources) {
        // assert(resources instanceof Array, 'resources must be an Array');
        let store = this._internalStore;
        resources.forEach(model => {
            let id = model.id || model.client_id;
            if (!store.getIn([key, model.type])) {
                store = store.setIn([key, model.type], Map({}));
            }
            let found = store.getIn([key, model.type, id]);
            if (found) {
                if (model.attributes.removed === true || model.attributes.active === false) {
                    store = store.deleteIn([key, model.type, id]);
                } else {
                    let {currentSnapshot} = store.getIn([key, model.type, id]);
                    store = store.mergeDeepIn([key, model.type, id, 'data'], fromJS(model));
                    store = store.mergeDeepIn([key, model.type, id, 'currentSnapshot'], {...currentSnapshot, ...fromJS(model)});
                }
            } else {
                let data = fromJS(model);
                store = store.setIn([key, model.type, id], Map({
                    currentSnapshot: data,
                    data: data
                }));
            }
        });
        this._internalStore = store;
    }
    
    @autobind
    parseModels(response) {
        let {data = [], meta, included = []} = response;
        let models = data;
        let storeKey = 'models';
        let includedModels = included;
        if (!data instanceof Array) {
            models = [data];
        }
        this._updateStore(storeKey, [...models, ...includedModels]);
        models = models.map(m => new Model({
            storeKey,
            store: this,
            collectionType: m.type,
            id: m.id,
            clientID: m.client_id
        }));
        return {meta, models};
    }
    
    getState() {
        return this._modelMap;
    }
    
    @autobind
    returnModels({meta, models}) {
        return {meta, models}
    }
    
    createRecord(collection_type, data = {}) {
        let storeKey = 'pendingCreate';
        let record = {
            type: collection_type,
            client_id: uuid4(),
            attributes: {},
            relationships: {},
        };
        record = {...record, ...data};
        this._updateStore(storeKey, [record]);
        return Promise.resolve(new Model({
            store: this,
            storeKey: storeKey,
            collectionType: record.type,
            clientID: record.client_id
        }));
    }
    
    query(collection, options = {}, queryName) {
        let query = this._internalStore.getIn(['queries', queryName]);
        let {reload = false, reset = false} = options;
        delete options['reload'];
        delete options['reset'];
        if (!query || reset) {
            reload = true;
            this._internalStore = this._internalStore.setIn(['queries', queryName], fromJS({
                isLoading: true,
                collection,
                options,
                reload
            }));
        }
        return new Query(this, queryName);
    }
    
    meta(collection, options = {}, name) {
        let meta = this._internalStore.getIn(['meta', name]);
        let {reload = false} = options;
        if (!meta) {
            this._internalStore = this._internalStore.setIn(['meta', name], Map({
                collection,
                reload: true
            }));
        } else if (reload) {
            this._internalStore = this._internalStore.setIn(['meta', name, 'reload'], reload);
        }
        return new Meta(this, name);
    }
    
    head(collection_name) {
        let options = {
            sort: '-updated_at',
            limit: 1,
        };
        let find = this._api.find(collection_name, options);
        return find.then((response) => {
            let {meta} = response;
            return {meta: fromJS(meta)};
        });
    }
    
    find(collection_name, options = {}) {
        let find = this._api.find(collection_name, options);
        return find.then(this.parseModels).then(this.returnModels);
    }
    
    findOne(collection_name, id, options = {}) {
        let model = this.peekOne(collection_name, id);
        if (model) {
            return Promise.resolve({model});
        }
        return this._api.findOne(collection_name, id, options).then(this.parseModels)
            .then(this.returnModels).then(({models}) => {
                model = models.length !== 0 ? models[0] : null;
                return {model};
            });
    }
    
    save(model, options) {
        return this._api.save(model.resource, options).then(this.parseModels).then(this.returnModels);
    }
    
    update(model, options) {
        return this._api.update(model.resource, options).then(this.parseModels).then(this.returnModels);
    }
    
    remove(model, options) {
        return this._api.remove(model.resourceIdentifier, options).then(this.parseModels).then(this.returnModels);
    }
    
    peek(collection_name, storeKey = 'models') {
        return this.getCollection(storeKey, collection_name);
    }
    
    peekOne(collection_name, id, storeKey = 'models') {
        return this.getModel(storeKey, collection_name, id);
    }
    
    
}