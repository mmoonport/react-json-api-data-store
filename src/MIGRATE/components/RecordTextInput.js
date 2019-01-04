import React, {Component} from "react";
import {TextInput} from "react-native";

export default class RecordTextInput extends Component {
    onChangeText(value) {
        let {
            record, field, onValueChange = () => {
            }
        } = this.props;
        record.attributes[field] = value;
        onValueChange(value);
    }
    
    valueForField() {
        let {record, field} = this.props;
        return record.attributes[field];
    }
    
    render() {
        return <TextInput style={this.props.style}
                          placeholder={this.props.placeholder}
                          onChangeText={this.onChangeText.bind(this)}
                          value={this.valueForField()}/>
    }
}
    