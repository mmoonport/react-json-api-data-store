import RecordMap from "./record-map";
import DS from './DS';
import {Record, RecordArray} from "./record";
/*
 *  Data Store Class
 *  Someone help me fill this out
 */
export default class Store {
    adapter;
    serializer;
    models;
    recordMap;
    
    /*
     *  Create a Data Store
     *  @param {object} data - The resource ID
     *  @param {Adapter} adapter - Adapter instance for your server
     *  @param {Serializer} serializer - Serializer instance for your json api data
     *  @param {Array<DS.Model>} models - An array of model schemas to use
     */
    constructor({
                    data = null,
                    adapter = null,
                    serializer = null,
                    models = null
                }) {
        this.adapter = adapter;
        this.serializer = serializer;
        this.models = models;
        this.serializer.store = this;
        this._initialize(data);
    }
    
    /*
     *  Sets up the store an preloads any data that you may have passed
     *  @param {object} data - Used when you would like to persist your store.
     */
    _initialize(data) {
        this.recordMap = new RecordMap(data);
    }
    
    /*
     *  Creates a new Record instance that is bound to the store.
     *  This record is not saved to the server until you call `record.save()`
     *  @param {string} collection - The collection name
     *  @param {object} data - Any data to set on the record
     *  @return {Record} A new Record instance
     */
    createRecord(collection, data) {
        let model = this.models.find(DS.modelForCollection(collection));
        let internalRecord = this._createInternalRecord(collection, data);
        return new Record(this, internalRecord, model);
    }
    
    /*
     *  Performs a find query on the collection route
     *  @param {string} collection - The collection name
     *  @param {object} query - Any query options you would like to pass
     *  @param {object} options - Store options
     *  @return {RecordArray} A RecordArray object from the store first if params are not stale or present
     */
    find(collection, query, options) {
        let promise = this.adapter.find(collection, query).then(this.serializer.serialize);
        let store = this;
        return new RecordArray({promise, store, options});
    }
    
    /*
     *  Performs a find query on the collection route by ID
     *  @param {string} collection - The collection name
     *  @param {string} id = The record id
     *  @param {object} query - Any query options you would like to pass
     *  @param {object} options - Store options
     *  @return {Record} A Record object from the store first if params are not stale or present
     */
    findOne(collection, id, query, options) {
        let found = this.peekOne(collection, id);
        if (found) {
            return found;
        }
        let promise = this.adapter.findOne(collection, id, query).then(this.serializer.serialize);
        let store = this;
        return new Record({promise, store, options});
    }
    
    /*
     *  Looks in the store only for all records by collection
     *  @param {string} collection - The collection name
     *  @param {object} options - Store options
     *  @return {RecordArray} A RecordArray object from the store
     */
    peek(collection, options) {
        let snapshots = this.recordMap.snapshotsFor(collection);
        return new RecordArray({store, snapshots});
    }
    
    /*
     *  Looks in the store only for a single record by collection and id
     *  @param {string} collection - The collection name
     *  @param {string} id - The record id
     *  @param {object} options - Store options
     *  @return {Record} A Record object from the store
     */
    peekOne(collection, id, options) {
        let store = this;
        let snapshot = this.recordMap.snapshotFor(collection, id);
        return new Record({store, snapshot});
    }
    
    /*
     *  Adds a record from the store by passing a JSON API Resource dictionary.
     *  @param {string} resource - The JSON API Resource dictionary
     *  @return {Record} the record that was added to the store
     */
    pushResource(resource) {
        return this.recordMap.addResource(resource);
    }
    
    /*
     *  Removes a record from the store by passing a JSON API Resource Identifier dictionary.
     *  @param {string} id - The resource ID
     *  @param {string} type - The resource Type
     *  @return {boolean} true if remove was successful
     */
    removeResource({id, type}) {
        this.recordMap.removeResource(type, id);
        return true;
    }
}