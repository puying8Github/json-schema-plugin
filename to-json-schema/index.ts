import { helpers } from "./helper";
import { merge, isEqual } from "lodash";

const defaultOptions = {
  required: false,
  postProcessFnc: null,

  strings: {
    detectFormat: true,
    preProcessFnc: null,
  },
  arrays: {
    mode: "all",
  },
  objects: {
    preProcessFnc: null,
    postProcessFnc: null,
    additionalProperties: true,
  },
};

const skipReverseFind = ["hostname", "host-name", "alpha", "alphanumeric", "regex", "regexp", "pattern"];
const filteredFormats = helpers.stringFormats.filter((item) => skipReverseFind.indexOf(item) < 0);

function getCommonTypeFromArrayOfTypes(arrOfTypes: any[]) {
  let lastVal;
  for (let i = 0, { length } = arrOfTypes; i < length; i++) {
    let currentType = arrOfTypes[i];
    if (i > 0) {
      if (currentType === "integer" && lastVal === "number") {
        currentType = "number";
      } else if (currentType === "number" && lastVal === "integer") {
        lastVal = "number";
      }
      if (lastVal !== currentType) return null;
    }
    lastVal = currentType;
  }
  return lastVal;
}

function getCommonArrayItemsType(arr: any[]) {
  return getCommonTypeFromArrayOfTypes(arr.map((item: any) => helpers.getType(item)));
}

class ToJsonSchema {
  public options: any;
  constructor(options: any = {}) {
    this.options = merge({}, defaultOptions, options);

    this.getObjectSchemaDefault = this.getObjectSchemaDefault.bind(this);
    this.getStringSchemaDefault = this.getStringSchemaDefault.bind(this);
    this.objectPostProcessDefault = this.objectPostProcessDefault.bind(this);
    this.commmonPostProcessDefault = this.commmonPostProcessDefault.bind(this);
    this.objectPostProcessDefault = this.objectPostProcessDefault.bind(this);
  }

  /**
   * Tries to find the least common schema that would validate all items in the array. More details
   * helpers.mergeSchemaObjs description
   * @param {array} arr
   * @returns {object|null}
   */
  getCommonArrayItemSchema(arr: any[]) {
    const schemas = arr.map((item: any) => this.getSchema(item));
    // schemas.forEach(schema => console.log(JSON.stringify(schema, '\t')))
    return schemas.reduce((acc: any, current: any) => helpers.mergeSchemaObjs(acc, current), schemas.pop());
  }

  getObjectSchemaDefault(obj: { [x: string]: any }) {
    const schema: any = { type: "object" };
    const objKeys = Object.keys(obj);
    if (objKeys.length > 0) {
      schema.properties = objKeys.reduce((acc: any, propertyName) => {
        acc[propertyName] = this.getSchema(obj[propertyName]); // eslint-disable-line no-param-reassign
        return acc;
      }, {});
    }
    return schema;
  }

  getObjectSchema(obj: any) {
    if (this.options.objects.preProcessFnc) {
      return this.options.objects.preProcessFnc(obj, this.getObjectSchemaDefault);
    }
    return this.getObjectSchemaDefault(obj);
  }

  getArraySchemaMerging(arr: any) {
    const schema: any = { type: "array" };
    const commonType = getCommonArrayItemsType(arr);
    if (commonType) {
      schema.items = { type: commonType };
      if (commonType !== "integer" && commonType !== "number") {
        const itemSchema = this.getCommonArrayItemSchema(arr);
        if (itemSchema) {
          schema.items = itemSchema;
        }
      } else if (this.options.required) {
        schema.items.required = true;
      }
    }
    return schema;
  }

  getArraySchemaNoMerging(arr: string | any[]) {
    const schema: any = { type: "array" };
    if (arr.length > 0) {
      schema.items = this.getSchema(arr[0]);
    }
    return schema;
  }
  // 取数组中，最长的对象
  getArraySchemaLongest(arr: string | any[]) {
    const schema: any = { type: "array" };
    if (arr.length > 0) {
      let longSchema = null;
      let longCount = 0;
      for (let i = 0; i < arr.length; i++) {
        let item = arr[i];
        let keys = Object.keys(item);
        if (keys.length > longCount) {
          longCount = keys.length;
          longSchema = item;
        }
      }
      if (!longSchema) return schema;
      schema.items = this.getSchema(longSchema);
    }
    return schema;
  }
  getArraySchemaTuple(arr: any[]) {
    const schema: any = { type: "array" };
    if (arr.length > 0) {
      schema.items = arr.map((item: any) => this.getSchema(item));
    }
    return schema;
  }

  getArraySchemaUniform(arr: string | any[]) {
    const schema = this.getArraySchemaNoMerging(arr);

    if (arr.length > 1) {
      for (let i = 1; i < arr.length; i++) {
        if (!isEqual(schema.items, this.getSchema(arr[i]))) {
          throw new Error("Invalid schema, incompatible array items");
        }
      }
    }
    return schema;
  }

  getArraySchema(arr: any[]) {
    if (arr.length === 0) {
      return { type: "array" };
    }
    switch (this.options.arrays.mode) {
      case "all":
        return this.getArraySchemaMerging(arr);
      case "first":
        return this.getArraySchemaNoMerging(arr);
      case "uniform":
        return this.getArraySchemaUniform(arr);
      case "tuple":
        return this.getArraySchemaTuple(arr);
      case "longest":
        return this.getArraySchemaLongest(arr);
      default:
        throw new Error(`Unknown array mode option '${this.options.arrays.mode}'`);
    }
  }

  getStringSchemaDefault(value: any) {
    const schema: any = { type: "string" };

    if (!this.options.strings.detectFormat) {
      return schema;
    }

    const index = filteredFormats.findIndex((item) => helpers.isFormat(value, item));
    if (index >= 0) {
      schema.format = filteredFormats[index];
    }

    return schema;
  }

  getStringSchema(value: any) {
    if (this.options.strings.preProcessFnc) {
      return this.options.strings.preProcessFnc(value, this.getStringSchemaDefault);
    }
    return this.getStringSchemaDefault(value);
  }

  commmonPostProcessDefault(type: string, schema: any, value: any) {
    // eslint-disable-line no-unused-vars
    if (this.options.required) {
      return merge({}, schema, { required: true });
    }
    return schema;
  }

  objectPostProcessDefault(schema: any, obj: any) {
    if (this.options.objects.additionalProperties === false && Object.getOwnPropertyNames(obj).length > 0) {
      return merge({}, schema, { additionalProperties: false });
    }
    return schema;
  }

  /**
   * Gets JSON schema for provided value
   * @param value
   * @returns {object}
   */
  getSchema(value: any) {
    const type = helpers.getType(value);
    if (!type) {
      throw new Error("Type of value couldn't be determined");
    }

    let schema;
    switch (type) {
      case "object":
        schema = this.getObjectSchema(value);
        break;
      case "array":
        schema = this.getArraySchema(value);
        break;
      case "string":
        schema = this.getStringSchema(value);
        break;
      default:
        schema = { type };
    }

    if (this.options.postProcessFnc) {
      schema = this.options.postProcessFnc(type, schema, value, this.commmonPostProcessDefault);
    } else {
      schema = this.commmonPostProcessDefault(type, schema, value);
    }

    if (type === "object") {
      if (this.options.objects.postProcessFnc) {
        schema = this.options.objects.postProcessFnc(schema, value, this.objectPostProcessDefault);
      } else {
        schema = this.objectPostProcessDefault(schema, value);
      }
    }

    return schema;
  }
}

function toJsonSchema(value: any, options?: any) {
  const tjs = new ToJsonSchema(options);
  return tjs.getSchema(value);
}
export { toJsonSchema };
