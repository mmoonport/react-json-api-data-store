class Snapshotable {
    __snapshot = true;
    
    static isSnapshot(object) {
        return object.__snapshot === true;
    }
    
    resourceIdentifier() {
        return null;
    }
    
    resource() {
        return null;
    }
}

export class SnapshotArray extends Snapshotable {
    constructor(snapshots = []) {
        super();
        this._snapshots = snapshots;
    }
    
    resourceIdentifier() {
        return this._snapshots.map(s => s.resourceIdentifier());
    }
    
    resource() {
        return this._snapshots.map(s => s.resource());
    }
    
    hasSnapshot(snapshot) {
        return !!this._snapshots.find(s => s === snapshot);
    }
    
    indexOfSnapshot(snapshot) {
        if (this.hasSnapshot(snapshot)) {
            let found = this._snapshots.find(s => s === snapshot);
            return this._snapshots.indexOf(found);
        }
        return -1;
    }
    
    addSnapshot(snapshot) {
        if (!this.hasSnapshot(snapshot)) {
            this._snapshots.push(snapshot);
            return true;
        }
        return false;
    }
    
    removeSnapshot(snapshot) {
        if (this.hasSnapshot(snapshot)) {
            this._snapshots = this._snapshots.slice(this.indexOfSnapshot(snapshot), 1);
            return true;
        }
        return false;
    }
}

export default class Snapshot extends Snapshotable {
    constructor(type, id, resource) {
        super();
        this.type = type;
        this.id = id;
        this.attributes = resource.attributes || {};
        this.relationships = resource.relationships || {};
    }
    
    
    resourceIdentifier() {
        return {id, type} = this;
    }
    
    resource() {
        return {id, type, attributes, relationships} = this;
    }
    
    setAttribute(key, value) {
        this.attributes[key] = value;
    }
    
    setRelationship(key, value) {
        if (Snapshot.isSnapshot(value)) {
            this.relationships[key] = value.resourceIdentifier();
        }
    }
}