export default class Serializer {
    _store;
    
    set store(store) {
        this._store = store;
    }
    
    serialize(response) {
        let {data, meta, included = []} = response;
        let single = false;
        if (!data) {
            return
        }
        if (!Array.isArray(data)) {
            single = true;
            data = [data];
        }
        included.forEach(resource => {
            this.processResource(resource);
        });
        let snapshots = data.map(resource => {
            return this.processResource(resource);
        });
        let resources = single ? snapshots[0] : snapshots;
        return {resources, meta};
    }
    
    processResource(resource) {
        return this._store.recordMap.addResource(resource);
    }
}