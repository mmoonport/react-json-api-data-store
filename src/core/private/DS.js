import {StringField, IntegerField} from "./fields";
import {Attribute, BelongsTo, HasMany, Computed, EmbeddedModel} from "./proxies";

const DS = {
    modelForCollection: (collection) => {
        return model => model.collectionType === collection;
    },
    Model: class {
    },
    //Proxy Types
    attr: Attribute,
    computed: Computed,
    HasMany: HasMany,
    BelongsTo: BelongsTo,
    EmbeddedModel: EmbeddedModel,
    //Field Types
    String: StringField,
    Integer: IntegerField,
    Float: {},
    Date: {},
    DateTime: {},
    Bool: {},
    List: {},
    Dict: {}
    
};
export default DS;