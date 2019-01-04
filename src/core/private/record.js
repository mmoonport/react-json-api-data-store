export class Record {
    constructor({promise, store, snapshot}) {
        this._promise = promise;
        this._store = store;
        this._snapshot = snapshot;
    }
}

export class RecordArray {
    constructor({promise, store, snapshots}) {
        this._promise = promise;
        this._store = store;
        this._snapshots = snapshots;
    }
}