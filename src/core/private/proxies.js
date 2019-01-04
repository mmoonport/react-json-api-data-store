class Proxyable {
    proxy(record) {
        return new Proxy(record, this.proxyHandler());
    }
    
    proxyHandler() {
        return {
            get(ref, prop) {
                return ref[prop];
            },
            
            set(ref, prop, value) {
            
            }
        }
    }
}

const Attribute = class Attribute extends Proxyable {
    constructor(field) {
        super();
        this.field = field;
    }
    
    proxyHandler() {
        return {
            get(ref, prop) {
                return this.field.toJS(ref.attributes[prop]);
                
            },
            set(ref, prop, value) {
                if (this.field.validate(value)) {
                    ref.attributes[prop] = this.field.toJSON(value);
                }
            }
        }
    }
};

const Computed = class Computed extends Proxyable {
    constructor(props, handler) {
        super();
        this.props = props;
        this.handler = handler;
    }
    
    proxyHandler() {
        return this.handler;
    }
};

class Relationship extends Proxyable {
    constructor() {
        super();
    }
    
    proxyHandler() {
        return {
            get(ref, prop) {
            
            },
            set(ref, prop) {
            
            }
        }
    }
}

const HasMany = class HasMany extends Relationship {

};

const BelongsTo = class BelongsTo extends Relationship {

};

const EmbeddedModel = class EmbeddedModel extends Proxyable {

};

export default {
    Attribute,
    Computed,
    HasMany,
    BelongsTo,
    EmbeddedModel
}