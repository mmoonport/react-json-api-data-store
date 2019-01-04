import React, {Component} from "react";
import DataStore from "../DataStore.service";

export default function createDataStoreRecordContainer({
                                                           collection,
                                                           recordIDProp,
                                                           recordProp = "record",
                                                           create = false,
                                                           queryOptions = {}
                                                       }, WrappedComponent,) {
    if (!collection) {
        console.error('You must set collection.')
    }
    if (!recordIDProp && !create) {
        console.error("You must set `recordIDProp` if create is false");
    }
    
    return class DataStoreRecordContainer extends Component {
        subscription;
        record;
        
        constructor(props) {
            super(props);
            this.store = DataStore.getInstance();
            this.state = {i: -1, isLoading: false};
        }
        
        componentWillMount() {
            this.setup();
        }
        
        componentWillUpdate(props) {
            let currentID = this.props[recordIDProp];
            let nextID = props[recordIDProp];
            
            if (nextID !== currentID) {
                this.setup();
            }
        }
        
        componentWillUnmount() {
            if (this.subscription) {
                this.subscription.unsubscribe();
            }
        }
        
        update(data) {
            this.setState(data);
        }
        
        setup() {
            if (this.subscription) {
                this.subscription.unsubscribe();
            }
            let currentID = this.props[recordIDProp];
            let promise = Promise.resolve({meta: {}, model: null});
            if (currentID) {
                promise = this.store.findOne(collection, currentID, queryOptions);
            } else if (create) {
                promise = this.store.createRecord(collection);
            }
            this.update({isLoading: true});
            promise.then(({model}) => {
                if (!model) {
                    if (currentID) {
                        this.update({'error': `Could not find ${collection}:${currentID}`, isLoading: false})
                    } else {
                        this.update({'error': `Failed to create record for ${collection}`, isLoading: false})
                    }
                } else {
                    this.subscription = model.subscribe(this.handleModelUpdate.bind(this));
                    this.record = model;
                    let {i, error} = this.state;
                    error = null;
                    i = ++i;
                    this.update({error: null, i, isLoading: false})
                }
            }).catch(e => {
                this.update({error: e, isLoading: false});
            });
        }
        
        handleModelUpdate() {
            let {i, error} = this.state;
            error = null;
            i = ++i;
            this.update({error: null, i});
        }
        
        render() {
            let {error, isLoading} = this.state;
            let state = {
                ...this.props,
                error,
                isLoading,
            };
            state[recordProp] = this.record;
            return <WrappedComponent {...state}/>
        }
    }
}