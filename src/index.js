import Adapter from "./core/private/adapter";
import DS from './core/private/DS';
import Serializer from "./core/private/serializer";
import Store from './core/private/store-new';

const s = Store;
const a = Adapter;
const ser = Serializer;
const d = DS;

export default {
    'Adapter': a,
    'DS': d,
    'Serializer': ser,
    'Store': s
}
