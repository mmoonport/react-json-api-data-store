import React from 'react';

const Headers = Headers;
const fetch = fetch;
const esc = encodeURIComponent;

function _queryParamsForDict(keyName, obj) {
    let entries = Object.entries(obj);
    entries.map(([k, value]) => {
        return `${keyName}[${esc(k)}]=${esc(value)}`
    }).join('&');
}

function _makeQueryString(query) {
    if (Object.keys(query).length === 0) {
        return '';
    }
    let qs = Object.entries(query).map(([k, value]) => {
        if (value instanceof Date) {
            return `${esc(k)}=${esc(value.toISOString())}`
        } else if (value.constructor === Array) {
            return `${esc(k)}=${esc(value.join(','))}`;
        } else if (value.constructor === Object) {
            return _queryParamsForDict(k, value);
        }
        return `${esc(k)}=${esc(value)}`
    }).join('&');
    return `?${qs}`;
}

export default class Adapter {
    static FETCH_RESOURCE = 'GET';
    static FETCH_RESOURCES = 'GET';
    static CREATE_RESOURCE = 'POST';
    static UPDATE_RESOURCE = 'PUT';
    static DELETE_RESOURCE = 'DELETE';
    contentType;
    accept;
    host;
    prefix;
    getHeaders;
    
    constructor({
                    host,
                    prefix = '/',
                    contentType = 'application/json+vnd.jsonapi',
                    accept = 'application/json+vnd.jsonapi',
                    headers = () => {
                        return {};
                    },
                }) {
        this.host = host;
        this.prefix = prefix;
        this.contentType = contentType;
        this.accept = accept;
        this.getHeaders = headers;
    }
    
    find(collection, query) {
        let requestType = Adapter.FETCH_RESOURCES;
        return this._make_request({
            requestType,
            collection,
            query
        });
    }
    
    findOne(collection, id, query) {
        let requestType = Adapter.FETCH_RESOURCE;
        return this._make_request({
            requestType,
            collection,
            id,
            query
        });
    }
    
    save(internalModel) {
        let {id, type} = internalModel;
        let requestType = id ? Adapter.UPDATE_RESOURCE : Adapter.CREATE_RESOURCE;
        return this._make_request({
            requestType,
            collection: type,
            data: internalModel
        });
    }
    
    destroy(internalModel) {
        let {id, type} = internalModel;
        let requestType = Adapter.DELETE_RESOURCE;
        return this._make_request({
            requestType,
            collection: type,
            id,
            data: internalModel
        });
    }
    
    _buildURL({collection, id, query = {}}) {
        let url = `${this.host}${this.prefix}${collection}`;
        if (id) {
            url += '/' + id
        }
        let qs = _makeQueryString(query);
        if (qs) {
            url += qs;
        }
        return url;
    }
    
    _make_request({requestType, collection, id, query, data = null}) {
        let {contentType, accept} = this;
        let headers = new Headers({
            ...this.getHeaders(),
            'Content-Type': contentType,
            'Accept': accept
        });
        let url = this._buildURL({collection, id, query});
        let requestOptions = {
            method: requestType,
            headers,
        };
        
        if ([Adapter.DELETE_RESOURCE, Adapter.CREATE_RESOURCE, Adapter.UPDATE_RESOURCE].includes(requestType)) {
            data = {data};
            requestOptions['body'] = JSON.stringify(data);
        }
        return fetch(url, requestOptions).then(r => r.json());
    }
}