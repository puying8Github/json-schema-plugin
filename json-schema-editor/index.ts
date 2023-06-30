import main from "./main.vue";
export default main;

// export const typeArray = ["string", "number", "integer", "object", "array", "boolean"];
// export const formatArray = ["null", "date", "date-time", "email", "hostname", "ip4", "ip6", "uri"];
export enum typeEnum {
  "string",
  "",
}
export type jsonSchemaType = {
  // 类型， string,number,integer,object,array,boolean
  type: string;
  title?: string;
  description?: string;
  //type: string 最大长度
  maxLength?: number;
  //type: string 最小长度
  minLength?: number;
  //type: string, 正则表达式约束字符串
  pattern?: string;
  //type: string 格式化, 无,date, date-time, email, hostname, ipv4,ipv6,uri
  format?: string;

  //type: number,integer 最大值
  maximum?: number;
  //type: number,integer 最小值
  minimum?: number;
  //type: number,integer 开启后，数据必须小于最大值
  exclusiveMaximum?: boolean;
  //type: number,integer  开启后，数据必须大于最小值
  exclusiveMinimum?: boolean;

  //type: object, 最大元素个数
  maxProperties?: number;
  //type: object 最小元素个数
  minProperties?: number;

  //type: array 最小元素个数
  minItems?: number;
  //type: array; 最大元素个数
  maxItems?: number;
  //type: array; 开启后每个元素都不相同
  uniqueItems?: boolean;

  //type:string,number,integer 枚举
  enum: string[];
  // 属性
  properties: {
    [key: string]: jsonSchemaType;
  };
  // 必填
  required: string[];
};
