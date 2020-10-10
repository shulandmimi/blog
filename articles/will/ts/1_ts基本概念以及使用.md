## Typescript

> TypeScript 通过添加类型来扩展 JavaScript。

一句话可以涵盖 ts 在 js 之上做了些什么，接下来我们可以讲讲 js

## Javascript

js 大家都用到了现在，对于 js 弱类型的这个特点也深有体会

```js
var a = 10;
a = '10';
a = false;
```

js 不会用声明时值的类型去约束在之后赋值的变量

可以说 `类型是由变量保存的值来判断的`，而不是 `根据变量来判断的`

由于类型根据值来判断，我们在阅读一段刚接受的代码时，往往需要通过 `console、typeof、instanceof、Object.prototype.toString` 来判断这个变量到这里，它并不符合我们使用时的要求。

```js
let a = 10;
if (Math.random() > 0.5) {
    a = 20;
} else {
    a = [];
}
// a 的类型 ???
a.slice(0, 20);
```

如上，a.slice 在`a = 20`时，就可能会抛出错误

> emmm，好像这也好像表达不出类型到底有什么作用

<br/><br/>

> 上面这组代码就很诡异，大家可能平时写不出这样的代码 ( 0 ^ 0 )


```js
let a = 10;

// ...... 这有100 - 200 行代码

// a 的类型 ???
a.slice(0, 20);
```

但我们从另外一个角度看，在`a`声明和`a.slice`之间有`100-200`行代码，经过了团队的修修改改后，我们还是否能这样轻易的知道在运行`a.slice`时，`a`的类型是什么吗（正常情况下也不会只有这一个变量）？

<br/>

无论在开发还是再次修改的角度上，我们都需要去记忆变量在什么时候改了，改了之后，是否会涉及到后面的使用等问题。

<br/>

js 没有语言层面的类型检测，所以无论是`错误检测工具`还是`IDE`，都很难在 js 的基础上直接去对非运行时的变量类型做出判断，更是无法在某个变量被负值后，提示后面变量在某种情况下无法使用

<br/>

Ts 通过另外一种方式在开发时给代码添加类型以及类型推断等功能，在编译时则将源码转换为 js，达到增强开发，但不涉及功能的目的。

另外，Ts 的类型系统也是可选的，现在 npm 很多软件包都添加了类型声明，在 `现代编辑器` 的帮助下，即便不使用 ts 也可以享受到 ts 的类型推断。

## 回到 Typescript

我们得先知道 ts 是怎么赋予 js 类型的

复习以下 js 的类型

```js
number
string
boolean
symbol
bigint
undefine
null
object
array
function
```

以上这些就是 js 的所有类型，那么，接下来在写出它们在 ts 中的对应的类型

```ts
number -> number
string -> string
boolean -> boolean
symbol -> symbol
bigint -> bigint
undefined -> undefined
null -> null
object -> Object | {}
array -> Array<T> | []
function -> Function | () => void

// 还有多出来的
never
unknown
any
```

以上这些大家知道有就行了，不用死记，用着用着就熟悉了

## 类型的使用

#### 数字 number

```ts
// 覆盖全部数字的方式
const status: number = 1;

// 指定某个数字
const status: 101 | 200 | 201 = 101;
```

### 字符串 string

```ts
// 覆盖全部字符串的方式
let name: string = 'shange';
name = 'liu';
name = 'wang';
name = 123; // ❌

// 指定变量只能是某个字符串
let name: 'shange' | 'liu' | 'wang' = 'shang';
name = 'liu';
name = 'wang';
name = 's'; // ❌
```

### 布尔 boolean

```ts
// boolean 只包含 true 和 false
const isLoading: boolean = true;

// 指定布尔值
const isLoading: false = false;
```

### 对象 Object | {} <索引器>

```ts
// interface 声明一个接口
interface Person {
    name: string;
    statu: number;
}

const person: Person = {
    name: 'shange',
    statu: 200,
};

// 空的对象类型
const person: {} = {
    name: 'shange', // ❌
};

const person: {} = {};
person.name = 'shange'; // ❌
```

#### 索引器

**作用**：

1. 用于生成单一 key 和 value
2. 索引器只有 number | string | symbol 这三种，其实这三种就已经涵盖了所有的 key

```ts
// 不确定key的对象 -> 又名，索引器
const person: { [key: string]: any } = {};

const person: { [key: number]: any } = {};

const person: { [key: symbol]: any } = {};

// 多种类型不确定key类型的对象
const person: { [key: string]: any; [key: number]: any } = {};
```

### 数组 Array<any> | any[] <元组>

```ts
// 只是number 的数组
const numList: number[] = [];
numList.push(Date.now());
numList.push(1);
numList.push(2);
numList.push('1'); // ❌
numList.push(false); // ❌

// 多种类型的数组
const list: (number | string)[] = [];
list.push(1);
list.push('2');

list.push(false); // ❌
```

#### 元组

**作用**：

1. 声明限定长度的数组
2. 明确每一位元素的类型

```ts
type Person = [name: string, age: number];
const person: Person = ['shange', 19];

const person: Person = ['shange']; // ❌
const person: Person = ['shange', 19, msg => console.log(msg)]; // ❌
```

### function

```ts
// 参数
function show(show: boolean, delay: number) {
    if (show) {
        // xxx
    }
    if (delay) {
        // xxx
    }
}

// 可选的参数
// 可选的参数只能放在最后一个必选参数的后面
function show(show?: boolean, delay: number) {} // ❌
function show(show?: boolean, delay?: number) {} // success

// 另外一种可选的参数
// xxx | undefined 和 ?: 是一样的作用
function show(show?: boolean, delay: number | undefined) {}

// 限制返回类型的函数
function show(show, delay): number {
    return 1;
}

// 变量接受匿名函数
const show = (show: boolean, delay: number) => void 0;

// 带有类型声明的
const show: (show: boolean, delay: number) => void = (show, delay) => void 0;

// 限制返回类型的函数
const show: (show: boolean, delay: number) => number = (show, delay) => 1;
```

### undefined & null

```ts
// 声明为空，后续赋值
let name: string | undefined;
name = 'shange';

// null 作为声明时占位
let name: string | null = null;
```

### unknown & any & never

#### unknown

**作用**：

1. 不确定是啥类型的值，等推断
2. 任意类型都可以赋给 unknown 类型，unknown 类型不能赋值给除 any 之外的类型

```ts
let a: unknown;
const b = a;

const c: string | number | boolean | symbol = a; // ❌
const d: any = a;
```

#### any

**作用**：

1. 取值范围为全集（全部就代表啥都不是）
2. 关闭类型推断（啥都是，啥都不是，索性不推断）

```ts
// 类型 let person: any
let person: any = {
    name: 'shange',
    age: 19,
};
person = 123;
person = true;
person = Symbol(1);
```

#### never

**作用**： (空 | 空集)类型

1. 不会被采用的 never
2. [避免业务漏洞 [知乎-尤雨溪的回答]](https://www.zhihu.com/question/354601204)

```ts
// 特点
let a: never;
// never 不能赋值给任何变量不为never的变量
let a: never;
a = 0; // ❌
a = false; // ❌
a = '1'; // ❌

// 不会被采用的never
interface Person {
    name: string;
    age: number;
    death: never;
}

// type PersonVal = string | number
type PersonVal = Person[keyof Person];
```
