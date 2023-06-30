<template>
  <div class="json-editor-container">
    <div class="json-editor-vue" :id="jsonEditorId"></div>
    <slot name="button"></slot>
  </div>
</template>
<script lang="ts" setup>
import JsonEditor from "jsoneditor";
import "jsoneditor/dist/jsoneditor.min.css";
import { isEqual, uniqueId } from "xe-utils";

const props = defineProps({
  modelValue: Object,
  options: Object,
  currentMode: {
    type: String,
    default: "code",
  },
  modeList: {
    type: Array,
    default: () => ["tree", "code", "form", "text", "view"],
  },
  // en, es zh-CN, pt-BR, tr, ja, fr-FR, de, ru, ko
  language: {
    type: String,
    default: "zh-CN",
  },
});
const emits = defineEmits(["update:modelValue", "change", "textSelectionChange", "selectionChange", "colorPicker", "focus", "blur"]);
const jsonEditorId = ref<string>(uniqueId("json-editor"));
const jsonValue = ref<{ [key: string]: any }>({});
const expandedModes = ref<string[]>(["tree", "view", "form"]);
const editor = ref();

onMounted(() => {
  init();
});
const init = () => {
  let dom = document.getElementById(jsonEditorId.value);
  if (!dom) return;
  const { currentMode, modeList, options } = props;
  const finalOptions = {
    ...options,
    indentation: 2,
    language: props.language,
    mode: currentMode,
    modes: modeList,
    onChange,
    onModeChange,
    onTextSelectionChange,
    onSelectionChange,
    onColorPicker,
    onFocus,
    onBlur,
  };
  editor.value = new JsonEditor(dom, finalOptions, jsonValue.value);
};
const setJson = (json: any) => {
  jsonValue.value = json;
  emits("update:modelValue", json);
  emits("change", json);
};
const onChange = () => {
  const text = editor.value?.getText();
  if (!text) {
    setJson({});
    return;
  }
  try {
    const json = editor.value?.get();
    setJson(json);
  } catch (error) {
    // console.log(error);
  }
};
const onModeChange = () => {
  expandAll();
};
const onTextSelectionChange = (start: any, end: any, text: string) => {
  emits("textSelectionChange", editor.value, start, end, text);
};
const onSelectionChange = (start: any, end: any) => {
  emits("selectionChange", editor.value, start, end);
};
const onColorPicker = (parent: any, color: any, onChange: any) => {
  emits("colorPicker", editor.value, parent, color, onChange);
};
const onFocus = ({ target }: { target: any }) => {
  emits("focus", editor.value, target);
};
const onBlur = async ({ target }: { target: any }) => {
  emits("blur", editor.value, target);
};
const expandAll = () => {
  if (expandedModes.value.includes(editor.value?.getMode())) {
    editor.value?.expandAll();
  }
};
const setEditorContent = (val: any) => {
  editor.value?.set(val);
};
onUnmounted(() => {
  editor.value?.destroy();
  editor.value = null;
});

watch(
  () => props.modelValue,
  (val) => {
    if (!isEqual(val, jsonValue.value)) {
      setEditorContent(val);
      nextTick(() => {
        expandAll();
      });
    }
  },
  { immediate: true, deep: true }
);
</script>
<style lang="scss" scoped>
.json-editor-container {
  position: relative;
  width: 100%;
  height: 100%;
  .json-editor-vue {
    width: 100%;
    height: 100%;
  }
  :deep(.jsoneditor) {
    .jsoneditor-modes {
      display: none;
    }
    .jsoneditor-poweredBy {
      display: none;
    }
  }
}
code {
  background-color: #f5f5f5;
}
</style>
