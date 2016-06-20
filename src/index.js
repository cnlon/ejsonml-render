export default function render (ejml, scope) {
  return $render(ejml, scope, {})
}

render.eval = function evaluate (func, scope, subScope) {
  try {
    return func(scope, subScope)
  } catch (err) {
    return undefined
  }
}

function $render (ejml, scope, subScope) {
  let res
  if (!ejml) {
    res = ''
  } else if (Array.isArray(ejml)) {
    let [node, attributes, ...children] = ejml
    if (node === '*') {
      node = createFragment(node)
      computedAttributes(attributes, scope, subScope, (sub) => {
        appendChildren(node, children, scope, sub)
      })
    } else {
      node = createNode(node)
      setAttributes(node, attributes, scope, subScope)
      appendChildren(node, children, scope, subScope)
    }
    return node
  } else if (typeof ejml === 'function') {
    res = render.eval(ejml, scope, subScope)
  } else {
    res = ejml
  }
  return createTextNode(res)
}

function appendChildren (node, children, scope, subScope) {
  children.forEach(child => {
    node.appendChild($render(child, scope, subScope))
  })
}

function setAttributes (node, attributes, scope, subScope) {
  let attr, val
  Object.keys(attributes).forEach(key => {
    if (key[0] === '@') { // event
      subScope = subScope || {}
      node.addEventListener(key.slice(1), (event) => {
        subScope.$event = event
        render.eval(attributes[key], scope, subScope)
      })
    } else {
      attr = createAttribute(key)
      val = attributes[key]
      if (typeof val === 'function') {
        val = render.eval(val, scope, subScope)
      }
      attr.nodeValue = val
      node.setAttributeNode(attr)
    }
  })
}

function computedAttributes (attributes, scope, subScope, callback) {
  let $if = attributes['*if']
  if ($if) {
    $if = render.eval($if, scope, subScope)
    if (!$if) return
  }
  let $items = attributes['*for']
  if ($items) {
    $items = render.eval($items, scope, subScope)
    if ($items && $items.length) {
      let sub = subScope
              ? Object.assign({}, subScope)
              : {}
      let subKey = attributes['_forKey']
      $items.forEach((v, k) => {
        sub[subKey] = v
        sub.$index = k
        callback(sub)
      })
    }
  } else {
    callback(scope, subScope)
  }
}

const doc = window.document

function createNode (tagName) {
  return doc.createElement(tagName)
}

function createTextNode (text) {
  return doc.createTextNode(text)
}

function createFragment () {
  return doc.createDocumentFragment()
}

function createAttribute (attribute) {
  return doc.createAttribute(attribute)
}
