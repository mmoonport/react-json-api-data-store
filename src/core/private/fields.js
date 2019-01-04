const Field = class {
    constructor({defaultValue, required = false, ...props}) {
        this.defaultValue = defaultValue;
        this.required = required;
    }
    
    validate(value) {
        return this.required ? value !== null || value !== undefined : true;
    }
    
    toJS(value) {
        return value || defaultValue;
    }
    
    toJSON(value) {
        return value || defaultValue;
    }
};

const StringField = class extends Field {
    minLength;
    maxLength;
    
    constructor({minLength = 0, maxLength = null}) {
        super(arguments);
        this.minLength = minLength;
        this.maxLength = maxLength;
    }
    
    validate(value) {
        let valid = typeof(value) === 'string';
        if (valid && this.minLength) {
            valid = value.length >= this.minLength;
        }
        if (valid && this.maxLength) {
            valid = value.length <= this.maxLength;
        }
        return super.validate(value);
        
    }
    
    toJSON(value) {
        if (value.hasOwnProperty('toString')) {
            value = value.toString();
        }
        return super.toJSON(value);
    }
    
    toJS(value) {
        if (value.hasOwnProperty('toString')) {
            value = value.toString();
        }
        return super.toJS(value);
    }
    
};

const IntegerField = class extends Field {

};

export default {
    StringField,
    IntegerField
}