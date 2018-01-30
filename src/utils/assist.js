import Vue from 'vue';

const isServer = Vue.prototype.$isServer;

// 判断参数是否是其中之一
export function oneOf(value, validList) {
  for (let i = 0; i < validList.length; i++) {
    if (value === validList[ i ]) {
      return true;
    }
  }
  return false;
}

export function camelcaseToHyphen(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// For Modal scrollBar hidden
let cached;

export function getScrollBarSize(fresh) {
  if (isServer) return 0;
  if (fresh || cached === undefined) {
    const inner = document.createElement('div');
    inner.style.width = '100%';
    inner.style.height = '200px';

    const outer = document.createElement('div');
    const outerStyle = outer.style;

    outerStyle.position = 'absolute';
    outerStyle.top = 0;
    outerStyle.left = 0;
    outerStyle.pointerEvents = 'none';
    outerStyle.visibility = 'hidden';
    outerStyle.width = '200px';
    outerStyle.height = '150px';
    outerStyle.overflow = 'hidden';

    outer.appendChild(inner);

    document.body.appendChild(outer);

    const widthContained = inner.offsetWidth;
    outer.style.overflow = 'scroll';
    let widthScroll = inner.offsetWidth;

    if (widthContained === widthScroll) {
      widthScroll = outer.clientWidth;
    }

    document.body.removeChild(outer);

    cached = widthContained - widthScroll;
  }
  return cached;
}

// watch DOM change
export const MutationObserver = isServer ? false : window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || false;

const SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
const MOZ_HACK_REGEXP = /^moz([A-Z])/;

function camelCase(name) {
  return name.replace(SPECIAL_CHARS_REGEXP, function (_, separator, letter, offset) {
    return offset ? letter.toUpperCase() : letter;
  }).replace(MOZ_HACK_REGEXP, 'Moz$1');
}

// getStyle
export function getStyle(element, styleName) {
  if (!element || !styleName) return null;
  styleName = camelCase(styleName);
  if (styleName === 'float') {
    styleName = 'cssFloat';
  }
  try {
    const computed = document.defaultView.getComputedStyle(element, '');
    return element.style[ styleName ] || computed ? computed[ styleName ] : null;
  } catch (e) {
    return element.style[ styleName ];
  }
}

// firstUpperCase
function firstUpperCase(str) {
  return str.toString()[ 0 ].toUpperCase() + str.toString().slice(1);
}

export { firstUpperCase };

// Warn
export function warnProp(component, prop, correctType, wrongType) {
  correctType = firstUpperCase(correctType);
  wrongType = firstUpperCase(wrongType);
  console.error(`[iView warn]: Invalid prop: type check failed for prop ${prop}. Expected ${correctType}, got ${wrongType}. (found in component: ${component})`);    // eslint-disable-line
}

function typeOf(obj) {
  const toString = Object.prototype.toString;
  const map = {
    '[object Boolean]': 'boolean',
    '[object Number]': 'number',
    '[object String]': 'string',
    '[object Function]': 'function',
    '[object Array]': 'array',
    '[object Date]': 'date',
    '[object RegExp]': 'regExp',
    '[object Undefined]': 'undefined',
    '[object Null]': 'null',
    '[object Object]': 'object'
  };
  return map[ toString.call(obj) ];
}

// deepCopy
function deepCopy(data) {
  const t = typeOf(data);
  let o;

  if (t === 'array') {
    o = [];
  } else if (t === 'object') {
    o = {};
  } else {
    return data;
  }

  if (t === 'array') {
    for (let i = 0; i < data.length; i++) {
      o.push(deepCopy(data[ i ]));
    }
  } else if (t === 'object') {
    for (let i in data) {
      o[ i ] = deepCopy(data[ i ]);
    }
  }
  return o;
}

export { deepCopy };

// scrollTop animation
export function scrollTop(el, from = 0, to, duration = 500) {
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback) {
        return window.setTimeout(callback, 1000 / 60);
      }
    );
  }
  const difference = Math.abs(from - to);
  const step = Math.ceil(difference / duration * 50);

  function scroll(start, end, step) {
    if (start === end) return;

    let d = (start + step > end) ? end : start + step;
    if (start > end) {
      d = (start - step < end) ? end : start - step;
    }

    if (el === window) {
      window.scrollTo(d, d);
    } else {
      el.scrollTop = d;
    }
    window.requestAnimationFrame(() => scroll(d, end, step));
  }

  scroll(from, to, step);
}

// Find components upward
function findComponentUpward(context, componentName, componentNames) {
  if (typeof componentName === 'string') {
    componentNames = [ componentName ];
  } else {
    componentNames = componentName;
  }

  let parent = context.$parent;
  let name = parent.$options.name;
  while (parent && (!name || componentNames.indexOf(name) < 0)) {
    parent = parent.$parent;
    if (parent) name = parent.$options.name;
  }
  return parent;
}

export { findComponentUpward };

// Find component downward
export function findComponentDownward(context, componentName) {
  const childrens = context.$children;
  let children = null;

  if (childrens.length) {
    for (const child of childrens) {
      const name = child.$options.name;
      if (name === componentName) {
        children = child;
        break;
      } else {
        children = findComponentDownward(child, componentName);
        if (children) break;
      }
    }
  }
  return children;
}

// Find components downward
export function findComponentsDownward(context, componentName) {
  return context.$children.reduce((components, child) => {
    if (child.$options.name === componentName) components.push(child);
    const foundChilds = findComponentsDownward(child, componentName);
    return components.concat(foundChilds);
  }, []);
}

/* istanbul ignore next */
const trim = function (string) {
  return (string || '').replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, '');
};

/* istanbul ignore next */
export function hasClass(el, cls) {
  if (!el || !cls) return false;
  if (cls.indexOf(' ') !== -1) throw new Error('className should not contain space.');
  if (el.classList) {
    return el.classList.contains(cls);
  } else {
    return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
  }
}

/* istanbul ignore next */
export function addClass(el, cls) {
  if (!el) return;
  let curClass = el.className;
  const classes = (cls || '').split(' ');

  for (let i = 0, j = classes.length; i < j; i++) {
    const clsName = classes[ i ];
    if (!clsName) continue;

    if (el.classList) {
      el.classList.add(clsName);
    } else {
      if (!hasClass(el, clsName)) {
        curClass += ' ' + clsName;
      }
    }
  }
  if (!el.classList) {
    el.className = curClass;
  }
}

/* istanbul ignore next */
export function removeClass(el, cls) {
  if (!el || !cls) return;
  const classes = cls.split(' ');
  let curClass = ' ' + el.className + ' ';

  for (let i = 0, j = classes.length; i < j; i++) {
    const clsName = classes[ i ];
    if (!clsName) continue;

    if (el.classList) {
      el.classList.remove(clsName);
    } else {
      if (hasClass(el, clsName)) {
        curClass = curClass.replace(' ' + clsName + ' ', ' ');
      }
    }
  }
  if (!el.classList) {
    el.className = trim(curClass);
  }
}

/**
 * 将【树组件选中的结果】转化为【级联组件选中的结果】
 * elementUI中同样表示单个选中项，级联组件使用【路径的数组】表示；后者使用【选中项】表示（即路径数组的最后一项）；
 * @param treeOptions
 * @param val
 * @param attr
 * @returns {Array}
 */
export function treeRes2cascaderRes(treeOptions, val, attr = 'id') {
  let r = [];
  if (!val) return r;

  let find = false;
  walk(treeOptions);
  return r;

  function walk(list) {
    for (let item of list) {
      findOut(item);

      if (find) break;
    }
  }

  // 查找单个节点
  function findOut(one) {
    // 1. 判断是不是自己
    if (one[attr] === val) {
      r.unshift(one);
      find = true;
      return;
    }

    // 2. 子节点列表
    if (one.children && one.children.length > 0) {
      walk(one.children);

      if (find) r.unshift(one);
    }
  }
}

/**
 * 遍历tree所有节点，删除attr的值等于val的节点
 * @param treeData
 * @param val
 * @param attr
 */
export function treeRemoveItem(treeData, val, attr = 'id') {
  if (!val) return;

  let find = false;
  walk(treeData);

  function walk(list) {
    for (let index = 0; index < list.length; index++) {
      if (findOut(list[index])) {
        list.splice(index, 1);
        return;
      }
    }
  }

  // 查找单个节点
  function findOut(one) {
    // 1. 判断是不是自己
    if (one[attr] === val) return true;

    // 2. 子节点列表
    if (one.children && one.children.length > 0) {
      walk(one.children);
    }
  }
}

/**
 * 判断两个数组内容是否相等
 * @param arrA
 * @param arrB
 * @param order
 * @returns {boolean}
 */
export function isEqualArray(arrA, arrB, order = false) {
  if (arrA.length !== arrB.length)
    return false;

  if (!order) {
    for (let a of arrA) {
      if (!arrB.includes(a)) {
        return false;
      }
    }
  }
  else {
    for (let index = 0; index < arrA.length; index++) {
      if (arrA[ index ] !== arrB[ index ]) {
        return false;
      }
    }
  }

  return true;
}
