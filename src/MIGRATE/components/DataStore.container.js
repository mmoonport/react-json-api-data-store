import React, {PureComponent} from 'react';
import {defaultMapper} from "./index";
import DataStore from "../DataStore.service";
import {findPromises} from "../../components/DataStore/utils";

function createDataStoreContainer(mappedProperties = defaultMapper, Component) {
    return class DataStoreContainer extends PureComponent {
        constructor(props) {
            super(props);
            this.store = DataStore.getInstance();
            this.subscriptions = [];
            this.state = {};
        }
        
        componentWillMount() {
            this.setupQuery();
        }
        
        componentWillUpdate(props) {
            if (this.props !== props) {
                this.setupQuery();
            }
        }
        
        setupQuery() {
            let _props = {...this.props};
            let props = mappedProperties(this.store, _props);
            this.setState({...props});
            let promises = findPromises(props);
            this.unsubscribe();
            this.subscriptions = promises.map(p => p.subscribe(this.promiseUpdated.bind(this)));
            Promise.all(promises.map(p => {
                return p.fetch ? p.fetch() : p
            }))
        }
        
        promiseUpdated() {
            let _props = {...this.props};
            let props = mappedProperties(this.store, _props);
            this.setState({...props});
        }
        
        unsubscribe() {
            this.subscriptions.forEach(s => s.unsubscribe());
            this.subscriptions = [];
        }
        
        componentWillUnmount() {
            this.unsubscribe();
        }
        
        render() {
            return (
                <Component {...this.state} {...this.props}/>
            )
        }
    }
}

export default createDataStoreContainer;