import Snapshot from "./snapshot";

export default class RecordMap {
    constructor(data = {}) {
        this._records = data;
    }
    
    addResource(resource) {
        let {type, id, attributes, relationships} = resource;
        if (!this._records[type]) {
            this._records[type] = {}
        }
        this._records[type][id] = {attributes, relationships};
        return this.snapshotFor(type, id);
    }
    
    hasResource(collection, id) {
        return this._records[collection] && this._records[collection][id]
    }
    
    resourceFor(collection, id) {
        if (!this.hasResource(collection, id)) {
            return null;
        }
        return this._records[collection][id];
    }
    
    snapshotFor(collection, id) {
        if (!this.hasResource(collection, id)) {
            return null;
        }
        return new Snapshot(collection, id, this.resourceFor(collection, id));
    }
    
    snapshotsFor(collection) {
        let resources = this._records[collection];
        if (resources && Object.keys(resources).length) {
            return Object.keys(resources).map(id => this.snapshotFor(collection, id));
        }
    }
    
    removeResource(collection, id) {
        if (!this.hasResource(collection, id)) {
            return false;
        }
        delete this._records[collection][id];
    }
}