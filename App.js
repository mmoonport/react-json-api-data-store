/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import {Adapter, Store, Serializer} from "./src";

const instructions = Platform.select({
    ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
    android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

type Props = {};

const store = new Store({
    adapter: new Adapter({}),
    serializer: new Serializer({}),
    models: []
});

export default class App extends Component<Props> {
    render() {
        return (
            <DataStoreProvider store={store} foo={"bar"}>
                <View style={styles.container}>
                    <Text style={styles.welcome}>Welcome to React Native!</Text>
                    <Text style={styles.instructions}>To get started, edit App.js</Text>
                    <DataStoreConsumer render={(store)=>{
                        {store.find()}
                    }}/>
                    <Text style={styles.instructions}>{instructions}</Text>
                </View>
            </DataStoreProvider>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    instructions: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5,
    },
});
