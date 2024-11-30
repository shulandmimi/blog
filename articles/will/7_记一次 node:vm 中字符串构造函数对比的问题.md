# 记一次 node:vm 遇见的问题

## 排查与对比

起始源于使用 `farmup` 执行 `yjs`, 在 `yjs` `Text.insert` 执行后，发现 `toString` 返回了 `''`

```ts
import * as Y from "yjs";

const ydoc = new Y.Doc();
const ytext = ydoc.getText("my text type");

ytext.insert(0, "abc");

console.log(ytext.toString()); // expect: `"abc"`, but got `""`
```

根据路径寻找源码，先瞅瞅 `YText.insert` 的执行路径

```ts
class YText {
  insert(index, text, attributes) {
    if (text.length <= 0) {
      return;
    }
    const y = this.doc;
    // doc 一定存在，text 没有被更改，会进入到 inserText 逻辑中
    if (y !== null) {
      transact(y, (transaction) => {
        // ...
        insertText(transaction, this, pos, text, attributes);
      });
    } else {
      /** @type {Array<function>} */ this._pending.push(() =>
        this.insert(index, text, attributes)
      );
    }
  }
}
```

查看源码发现下面一段代码

```ts
const insertText = (transaction, parent, currPos, text, attributes) => {
  // ...
  const content =
    text.constructor === String
      ? new ContentString(/** @type {string} */ text)
      : text instanceof AbstractType
      ? new ContentType(text)
      : new ContentEmbed(text);
  // ...
};
```

初见我以为必然返回的 `ContentString` 没想到在之后打印 `content` 发现是 `ContentEmbed`

## 对比为何失败

```ts
"text".constructor === String; // true
```

这段代码在任何 JS 运行环境中预期是为 `true`

但是它返回了 `false`，在 `vm.runInNewContext` 中（啊，node 坏了?

farmup 支持输出 esm 和 cjs 格式的内容，发现这种情况只出现在 cjs 中，这时因为两种格式的执行方案是不一样的

- esm: 使用的是 node `module.register` 方式注册的 esm 模式的模块加载

- cjs: 使用的是 `vm.runInNewContext` 模拟 `commonjs` 运行

---

原因就在这里

`vm.runInNewContext(code, context)` 中会有一个独立的运行环境，我们传入进去的 `context` 会作为 `globalThis`，而在对比时，我们使用了 `String` 构造函数，它首先会从 `globalThis` 中获取，没找到则会从隐含的作用域中寻找

而字面量 `'text'.constructor` 则一定使用的是内部的 `String` 函数

```ts
const vm = require("node:vm");

const result = vm.runInNewContext(
  // 使用的外部 String
  "String === 'text'.constructor",
  vm.createContext({
    String,
  })
); // false

const result = vm.runInNewContext(
  // 使用的内部 String
  "String === 'text'.constructor",
  vm.createContext({})
); // true

console.log({ result });

console.log(Object.getOwnPropertyNames(this));
```

而在 farmup 中，为了能在一个独立的容器中模拟 `commonjs` 的运行使用了 `vm` 来执行，并且使用了 `Proxy(context)` 来尝试转发 `runInNewContext` 中找不到的变量，所以就找到了父级 context 环境中的 `String`，两个环境不同的 `String` 对比，自然就是错误的
