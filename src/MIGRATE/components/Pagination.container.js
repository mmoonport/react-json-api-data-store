import React, {PureComponent} from "react";

import DataStore from "../DataStore.service";
import {Map} from "immutable";


export function createDataStorePaginationContainer(Component, query) {
    return class DataStorePaginationContainer extends React.Component {
        store;
        query;
        subscription;
        
        constructor(props) {
            super(props);
            this.store = DataStore.getInstance();
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
            this.queryParams = Map(this.props);
            if (this.subscription) {
                this.subscription.unsubscribe();
            }
            
            let params = this.queryParams.toObject();
            this.query = query(this.store, params);
            this.query.subscribe(this.queryUpdated.bind(this));
            let state = this.query.state;
            this.setState({...state.toObject()});
            this.query.fetch();
            let nextState = this.query.state;
            if (nextState !== state) {
                this.setState({...state.toObject()});
            }
            
        }
        
        queryUpdated() {
            let state = this.query.state;
            this.setState({...state.toObject()});
            
        }
        
        componentWillUnmount() {
            if (this.subscription) {
                this.subscription.unsubscribe();
            }
        }
        
        loadMore() {
            this.query.loadMore();
        }
        
        reset() {
        }
        
        render() {
            let state = this.query.state;
            let pagination = {
                ...state.toObject(),
                setQueryParams: (data) => {
                    this.queryParams = this.queryParams.merge(Map(data));
                    this.setupQuery();
                },
                loadMore: this.loadMore.bind(this),
                reset: this.reset.bind(this)
            };
            return <Component pagination={pagination} {...this.props}/>
        }
    }
}