export function clearAttr(obj: any) {
  for (let key in obj) {
    delete obj[key];
  }
}
/**
 * 快速拷贝两个对象的属性值
 * @param {*} source
 * @param {*} target
 */
export function copyAttr(source: any, target: any) {
  Object.keys(target).forEach((key) => {
    target[key] = source[key];
  });
}

export function isNull(ele) {
  if (typeof ele === "undefined") {
    return true;
  } else if (ele === null) {
    return true;
  } else if (ele === "") {
    return true;
  }
  return false;
}
export function renamePropertyAndKeepKeyPrecedence(obj: any, [oldKey, newKey]: any) {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  if (Object.prototype.hasOwnProperty.call(descriptors, oldKey)) {
    Object.entries(descriptors).reduce((target, [key, descriptor]) => {
      Reflect.deleteProperty(target, key);
      if (key === oldKey) {
        key = newKey;
      }
      Reflect.defineProperty(target, key, descriptor);
      return target;
    }, obj);
  }
  return obj;
}

export function _debounce(callback: any, delay = 1000) {
  let timer: any = null;
  return function () {
    let self = this;
    let args = arguments;
    timer && clearTimeout(timer);
    timer = setTimeout(function () {
      callback.apply(self, args);
    }, delay);
  };
}
