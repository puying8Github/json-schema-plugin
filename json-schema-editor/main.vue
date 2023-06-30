<template>
  <div class="json-schema-editor">
    <el-row class="row" :gutter="10">
      <el-col :span="8" class="my-col-name">
        <div :style="{ marginLeft: `${10 * deep}px` }" class="my-col-name-c">
          <el-link size="small" v-if="pickValue.type === 'object'" style="color: rgba(0, 0, 0, 0.65)" @click="hidden = !hidden">
            <template #default>
              <el-icon v-if="hidden"><CaretRight /></el-icon>
              <el-icon v-else><CaretBottom /></el-icon>
            </template>
          </el-link>
          <span v-else style="width: 20px; display: inline-block"> </span>
          <el-input size="small" :disabled="disabled || root" v-model="pickKey" class="myu-col-name-input" @change="onInputName"></el-input>
        </div>
        <el-tooltip v-if="root" :content="local['checked_all']">
          <el-checkbox size="small" :disabled="!isObject && !isArray" class="my-col-name-required" @change="onRootCheck"></el-checkbox>
        </el-tooltip>
        <el-tooltip v-else :content="local['required']">
          <el-checkbox size="small" :disabled="isItem" :checked="checked" class="my-col-name-required" @change="onCheck"></el-checkbox>
        </el-tooltip>
      </el-col>
      <el-col :span="6">
        <el-select size="small" v-model="pickValue.type" :disabled="disabledType || root" class="my-col-type" @change="onChangeType">
          <el-option v-for="t in TYPE_NAME" :key="t" :label="t" :value="t"></el-option>
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-input size="small" v-model="pickValue.title" :disabled="root" class="my-col-title" :placeholder="local['title']"></el-input>
      </el-col>
      <el-col :span="4" class="my-col-setting">
        <el-tooltip :content="local['adv_setting']">
          <el-link size="small" v-if="!root" class="setting-icon" @click="onSetting" :icon="Setting"> </el-link>
        </el-tooltip>
        <el-tooltip v-if="isObject" :content="local['add_child_node']">
          <el-link size="small" class="plus-icon" @click="addChild" :icon="Plus"> </el-link>
        </el-tooltip>
        <el-tooltip v-if="!root && !isItem" :content="local['remove_node']">
          <el-link class="close-icon my-btn-icon-only" @click="removeNode" :icon="Close"> </el-link>
        </el-tooltip>
      </el-col>
    </el-row>
    <template v-if="!hidden && pickValue.properties && !isArray">
      <json-schema-editor
        v-for="(item, key, index) in pickValue.properties"
        :model-value="{ [key]: item }"
        v-model:parent="pickValue"
        :key="index"
        :deep="deep + 1"
        :root="false"
        class="children"
        :lang="lang"
        :custom="custom"
      />
    </template>
    <template v-if="isArray">
      <json-schema-editor :model-value="{ items: pickValue.items }" :deep="deep + 1" disabled isItem :root="false" class="children" :lang="lang" :custom="custom" />
    </template>
    <!-- modal -->
    <el-dialog
      v-model="modalVisiable"
      :title="local['adv_setting']"
      :destroy-on-close="true"
      :close-on-click-modal="false"
      :draggable="true"
      width="800px"
      class="json-schema-editor-advanced-modal"
    >
      <template #default>
        <div class="my-advanced-form-container">
          <h3>{{ local["base_setting"] }}</h3>
          <el-form :model="advancedValue" size="small" class="my-advanced-search-form" label-position="top">
            <el-row :gutter="6">
              <el-col :span="8" v-for="(item, key) in advancedValue" :key="key">
                <el-form-item :label="local[key]">
                  <template v-if="advancedAttr[key].type === 'integer' || advancedAttr[key].type === 'number'">
                    <el-input-number v-model="advancedValue[key]" :placeholder="String(key)" controls-position="right"></el-input-number>
                  </template>
                  <template v-else-if="advancedAttr[key].type === 'boolean'">
                    <el-switch v-model="advancedValue[key]"></el-switch>
                  </template>
                  <template v-else-if="key === 'enum'">
                    <el-input type="textarea" v-model="enumText" @blur="changeEnumValue" :rows="2" :placeholder="local['enum_msg']"></el-input>
                  </template>
                  <template v-else-if="advancedAttr[key].type === 'array'">
                    <el-select v-model="advancedValue[key]" :placeholder="local[key]">
                      <el-option value="" :label="local['nothing']"></el-option>
                      <el-option v-for="t in advancedAttr[key].enums" :label="t" :value="t" :key="t"></el-option>
                    </el-select>
                  </template>
                  <template v-else>
                    <el-input v-model="advancedValue[key]" :placeholder="String(key)"></el-input>
                  </template>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <h3 v-show="custom">{{ local["add_custom"] }}</h3>
          <el-form class="my-advanced-search-form" v-show="custom">
            <el-row :gutter="6">
              <el-col :span="8" v-for="item in customProps" :key="item.key">
                <el-form-item :label="item.key">
                  <el-input v-model="item.value" style="width: calc(100% - 30px)"></el-input>
                  <el-link @click="removeCustomNode(item.key)" style="width: 30px" :icon="Close"></el-link>
                </el-form-item>
              </el-col>
              <el-col :span="8" v-show="addProp.key != undefined">
                <el-form-item>
                  <template #label>
                    <el-input v-model="addProp.key" style="width: 100px"></el-input>
                    <el-input v-model="addProp.value" style="width: 100%"></el-input>
                  </template>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item>
                  <el-link @click="confirmAddCustomNode(null)" v-if="customing" :icon="Check"></el-link>
                  <el-tooltip :content="local['add_custom']" v-else>
                    <el-link @click="addCustomNode" :icon="Plus"></el-link>
                  </el-tooltip>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <h3>{{ local["preview"] }}</h3>
          <pre style="width: 100%">{{ completeNodeValue }}</pre>
        </div>
      </template>
      <template #footer>
        <el-button @click="handleOk" type="primary">{{ local["ok"] }}</el-button>
        <el-button @click="modalVisiable = false" plain>{{ local["cancel"] }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import { isNull, renamePropertyAndKeepKeyPrecedence } from "./util";
import { TYPE_NAME, TYPE } from "./type/type";
import JsonSchemaEditor, { jsonSchemaType } from ".";
import { CaretRight, CaretBottom, Setting, Plus, Close, Check } from "@element-plus/icons-vue";
import { isEqual } from "xe-utils";
import LocalProvider from "./LocalProvider";

// ---------------------------------------- props begin
const props = defineProps({
  modelValue: {
    type: Object as PropType<{ [key: string]: any }>,
    default: () => {},
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  disabledType: {
    type: Boolean,
    default: false,
  },
  isItem: {
    // 是否数组元素
    type: Boolean,
    default: false,
  },
  deep: {
    // 节点深度，根节点deep=0
    type: Number,
    default: 0,
  },
  root: {
    // 是否root节点
    type: Boolean,
    default: true,
  },
  parent: {
    type: Object,
    default: null,
  },
  custom: {
    type: Boolean,
    default: false,
  },
  lang: {
    type: String,
    default: "zh_CN",
  },
});
const emits = defineEmits(["update:modelValue", "update:parent"]);
// --------------------------------------- props end
// --------------------------------------- computed begin
const pickOldKey = computed(() => {
  let key = Object.keys(props.modelValue)[0];
  // console.log(key);
  return key;
});
const pickOldValue = computed(() => {
  let key = Object.values(props.modelValue)[0];
  // console.log(key);
  return key;
});
const isObject = computed(() => {
  return pickValue.value.type === "object";
});
const isArray = computed(() => {
  return pickValue.value.type === "array";
});
const checked = computed(() => {
  return parentValue.value && parentValue.value.required && parentValue.value.required.indexOf(pickKey.value) >= 0;
});
const advanced = computed(() => {
  return TYPE[pickValue.value.type];
});
const advancedAttr = computed(() => {
  return TYPE[pickValue.value.type].attr;
});
const ownProps = computed(() => {
  return ["type", "title", "properties", "items", "required", ...Object.keys(advancedAttr.value)];
});
const advancedNotEmptyValue = computed(() => {
  const jsonNode = Object.assign({}, advancedValue.value);
  for (let key in jsonNode) {
    isNull(jsonNode[key]) && delete jsonNode[key];
  }
  return jsonNode;
});
const completeNodeValue = computed(() => {
  const t: any = {};
  const basicValue = { ...pickValue.value };
  for (const item of customProps.value) {
    t[item.key] = item.value;
  }
  _pickDiffKey().forEach((key) => delete basicValue[key]);
  return Object.assign({}, basicValue, t, advancedNotEmptyValue.value);
});
// const enumText = computed(() => {
//   const t = advancedValue.value["enum"];
//   if (!t) return "";
//   if (!t.length) return "";
//   return t.join("\n");
// });
// --------------------------------------- computed end
// --------------------------------------- data begin
let hidden = ref<boolean>(false);
let countAdd = ref<number>(1);
let modalVisiable = ref<boolean>(false);
let advancedValue = ref<{ [key: string]: any }>({});
let addProp = ref<{ [key: string]: any }>({});
let customProps = ref<any[]>([]);
let customing = ref<boolean>(false);
let local = reactive(LocalProvider(props.lang));
let pickValue = ref<{ [key: string]: any }>({});
let parentValue = ref<{ [key: string]: any }>({});
const pickKey = ref<string>("");
const enumText = ref<string>("");
// --------------------------------------- data end

const inputValue = () => {
  let value = JSON.parse(JSON.stringify(pickValue.value));
  let key = JSON.parse(JSON.stringify(pickKey.value));
  let obj = { [key]: value };

  emits("update:modelValue", obj);
};
watch(
  () => pickValue.value,
  (newVal) => {
    if (!isEqual(pickOldValue.value, newVal)) {
      inputValue();
    }
  },
  { deep: true }
);
const inputParentValue = () => {
  let value = JSON.parse(JSON.stringify(parentValue.value));
  if (!isEqual(props.parent, value)) {
    emits("update:parent", value);
  }
};
watch(
  () => parentValue.value,
  (newVal) => {
    inputParentValue();
  },
  { deep: true }
);
// --------------------------------------- methods begin
const onInputName = () => {
  const oldKey = pickOldKey.value;
  const newKey: string = pickKey.value;
  if (oldKey === newKey) return;

  renamePropertyAndKeepKeyPrecedence(parentValue.value.properties, [oldKey, newKey]);
  // required重新设置
  let requireds: string[] = parentValue.value.required || [];
  const oldIndex = requireds.indexOf(oldKey);
  if (requireds.length > 0 && oldIndex > -1) {
    requireds.splice(oldIndex, 1);
    requireds.push(newKey);
    parentValue.value["required"] = [...new Set(requireds)];
  }
};
const onChangeType = () => {
  parseCustomProps();
  customProps.value.forEach((item) => {
    delete pickValue.value[item.key];
  });
  customProps.value = [];

  delete pickValue.value["properties"];
  delete pickValue.value["items"];
  delete pickValue.value["required"];
  delete pickValue.value["format"];
  delete pickValue.value["enum"];

  if (isArray.value) {
    pickValue.value["items"] = { type: "string" };
  }
};
const onCheck = (_data: any, e: { target: { checked: any } }) => {
  _checked(e.target.checked, pickValue.value);
};
const onRootCheck = (_data: any, e: { target: { checked: any } }) => {
  _deepCheck(e.target.checked, pickValue.value);
};
const changeEnumValue = (e: FocusEvent) => {
  const pickType = pickValue.value.type;
  const value = e.target?.value;
  let arr = value.split("\n");

  if (pickType === "string") {
    advancedValue.value.enum = arr.map((item) => item);
  } else {
    if (arr.length === 0 || (arr.length === 1 && arr[0] == "")) {
      advancedValue.value.enum = null;
    } else {
      advancedValue.value.enum = arr.map((item) => +item);
    }
  }
};
const _deepCheck = (checked: any, node: { [x: string]: any; type?: any; properties?: any; items?: any }) => {
  if (node.type === "object" && node.properties) {
    checked ? (node["required"] = Object.keys(node.properties)) : delete node["required"];
    Object.keys(node.properties).forEach((key) => _deepCheck(checked, node.properties[key]));
  } else if (node.type === "array" && node.items.type === "object") {
    checked ? (node.items["required"] = Object.keys(node.items.properties)) : delete node.items["required"];
    Object.keys(node.items.properties).forEach((key) => _deepCheck(checked, node.items.properties[key]));
  }
};
const _checked = (checked, parent) => {
  let required = parent.required;
  if (checked) {
    // eslint-disable-next-line vue/no-mutating-props
    required || (parentValue.value["required"] = []);

    required = parentValue.value.required;
    required.indexOf(pickKey.value) === -1 && required.push(pickKey.value);
  } else {
    const pos = required.indexOf(pickKey.value);
    pos >= 0 && required.splice(pos, 1);
  }
  required.length === 0 && delete parent["required"];
};
const addChild = () => {
  const name: string = _joinName();

  const type = "string";
  const node = JSON.parse(JSON.stringify(pickValue.value));
  if (!node.properties) {
    node.properties = {};
  }
  node.properties[name] = { type: type };

  pickValue.value = node;
};
const parseCustomProps = () => {
  const ownPropsV = ownProps.value;
  Object.keys(pickValue.value).forEach((key) => {
    if (ownPropsV.indexOf(key) == -1) {
      confirmAddCustomNode({ key, value: pickValue.value[key] });
    }
  });
};
const addCustomNode = () => {
  addProp.value["key"] = _joinName();
  addProp.value["value"] = "";
  customing.value = true;
};
const removeCustomNode = (key: string) => {
  customProps.value.forEach((item, index) => {
    if (item.key === key) {
      customProps.value.splice(index, 1);
      return;
    }
  });
};
const confirmAddCustomNode = (prop: any) => {
  const p = prop || addProp.value;
  let existKey = false;
  customProps.value.forEach((item) => {
    if (item.key === p.key) {
      existKey = true;
    }
  });
  if (existKey) return;
  customProps.value.push(p);
  addProp.value = {};
  customing.value = false;
};
const removeNode = () => {
  const { properties, required } = parentValue.value;
  delete properties[pickKey.value];
  if (required) {
    const pos = required.indexOf(pickKey.value);
    pos >= 0 && required.splice(pos, 1);
    required.length === 0 && delete parentValue.value["rquired"];
  }
};
const _joinName = () => {
  return `field_${props.deep}_${countAdd.value++}`;
};
const onSetting = () => {
  modalVisiable.value = true;
  advancedValue.value = { ...advanced.value.value };
  for (const k in advancedValue.value) {
    if (pickValue.value[k]) {
      advancedValue.value[k] = pickValue.value[k];
    }
  }
  let t = advancedValue.value["enum"];
  if (!t) return "";
  if (!t.length) return "";
  enumText.value = t;

  parseCustomProps();
};
const handleOk = () => {
  modalVisiable.value = false;
  for (const key in advancedValue.value) {
    if (isNull(advancedValue.value[key])) {
      delete pickValue.value[key];
    } else {
      pickValue.value[key] = advancedValue.value[key];
    }
  }
  const diffKey = _pickDiffKey();
  diffKey.forEach((key) => delete pickValue.value[key]);
  for (const item of customProps.value) {
    pickValue.value[item.key] = item.value;
  }
  // ----??
};
const _pickDiffKey = () => {
  const keys = Object.keys(pickValue.value);
  return keys.filter((item) => ownProps.value.indexOf(item) === -1);
};
// --------------------------------------- methods end

//
const setValue = () => {
  let val = Object.values(props.modelValue)[0];
  let key = Object.keys(props.modelValue)[0];

  if (typeof val == "undefined") {
    return;
  }
  if (typeof key == "undefined") {
    return;
  }
  // console.log(val, key);
  pickKey.value = key;
  pickValue.value = val;
};
const setParent = () => {
  let val = JSON.parse(JSON.stringify(props.parent));
  parentValue.value = val;
};
let oldValue = {};
watch(
  () => props.modelValue,
  (newVal) => {
    if (!isEqual(props.modelValue, oldValue)) {
      setValue();
    }
  },
  { immediate: true, deep: true }
);

let oldParent = {};
watch(
  () => props.parent,
  () => {
    if (!isEqual(props.parent, oldParent)) {
      setParent();
    }
  },
  { immediate: true, deep: true }
);
</script>
<style lang="scss" scoped>
.json-schema-editor {
  width: 100%;
  // height: 100%;
  position: relative;
  .row {
    display: flex;
    margin: 12px;
    .my-col-name {
      display: flex;
      align-items: center;
      .my-col-name-c {
        display: flex;
        align-items: center;
      }
      .my-col-name-required {
        flex: 0 0 24px;
        text-align: center;
        padding-left: 5px;
      }
    }
    .my-col-type {
      width: 100%;
    }
    .my-col-setting {
      display: inline-block;
      & > a {
        margin-right: 5px;
      }
    }
    .setting-icon {
      color: rgba(0, 0, 0, 0.45);
      border: none;
    }
    .plus-icon {
      border: none;
    }
    .close-icon {
      color: #888;
      border: none;
    }
  }
}
</style>
<style lang="scss">
.json-schema-editor-advanced-modal {
  --el-dialog-padding-primary: 10px;
  --el-dialog-border-radius: 4px;
  color: rgba(0, 0, 0, 0.65);
  min-width: 600px;
  .el-dialog__header {
    height: 43px;
    border-bottom: 1px solid #ebeef5;
    background-color: #f8f8f8;
    margin-right: 0;
    .el-dialog__headerbtn {
      width: 43px;
      height: 43px;
      top: 3px;
    }
  }
  .el-dialog__body {
    padding: 10px 15px;
    .el-input-number,
    .el-select {
      width: 100%;
    }
  }
  .el-dialog__footer {
  }
  pre {
    font-family: monospace;
    height: 100%;
    overflow-y: auto;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    padding: 12px;
    width: 50%;
    font-size: 12px;
  }
  h3 {
    display: block;
    border-left: 3px solid #1890ff;
    padding: 0 8px;
    margin-bottom: 10px;
  }
}
</style>
