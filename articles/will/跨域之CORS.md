<h1 style='text-align:center;'>跨域之CORS</h1>

# 一、需要了解的知识

-   HTTP 请求头\响应头
-   HTTP 基础知识
-   浏览器对跨域的处理
-   为什么需要跨域

# 二、前言

-   本文只对 CORS 有讲解，跨域等其他知识还需要自行了解

# 三、正文

-   目录
    -   为什么会有 CORS？
    -   CORS 怎么用？
    -   CORS 有那些知识点？

## 为什么会有 CORS

-   浏览器需要对服务器中的资源进行保护，防止服务器外的其他地方 HTTP 请求随意获取资源
-   跨域发生的条件：端口（`8080 \ 80`）、域名（`baidu.com \ taobao.com`）、协议(`http \ https`) 其中任意一项不同
-   当发生跨域后，浏览器将会抛弃服务器返回的资源（数据返回了，但不给你，气不气），然后在给你抛一个显眼的错误
-   同源策略（跨域）只发生在浏览器，这是浏览器的一种限制，在服务器不会有这种限制（所以有了代理）（`GET`的`url`长度也是浏览器限制的，不同的浏览器长度各有不同）
-   在 CORS 出现之前，没有一个跨域获取资源的标准，而 CORS 就是这个标准，使用简单而强大

## CORS 怎么用？

`CORS`需要通过服务器设置响应头来完成，简单来说这是浏览器与服务器之间的交流，`CORS`返回响应头后，浏览器会校验字段是否匹配，如果不匹配将会发生跨域错误。

```js
const express = require('express');
const app = express();
app.use((req, res, next) => {
    res.set({
        // 跨域时同意的请求方法
        'Access-Control-Allow-Methods': 'GET,POST,HEAD,PUT,DELETE',
        // 跨域时同意的请求头字段
        'Access-Control-Allow-Headers': 'X-Name,X-Proxy',
        // * 代表域名都可以，也可以指定一个域名, 设置*有风险，任何地方发起的http请求浏览器都认为是合法的
        'Access-Control-Allow-Origin': '*',
    });
});
```

---

## CORS 有那些知识点？

-   跨域时浏览器默认不发送 cookie
-   跨域时服务器默认不接受 cookie
-   跨域时服务器应答后只能从 xhr 对象中获取少量响应头字段
-   跨域时请求会分为简单请求和非简单请求

#### 跨域时浏览器无法发送 cookie

在跨域时，浏览器默认都是不发送 cookie 的（浏览器间可能有差异）
这里就还需要一些字段了
发送跨域请求时，如果要发送 cookie，那么需要将 xhr 对象的`withCredentials: true`。

```js
const xhr = new XMLHTTPRequest();
xhr.withCredentials = true;
// xhr ...
```

#### 跨域时服务器默认不接受 cookie

上面的设置只是浏览器可以发送 cookie 了，但服务器没说要呀。那服务器怎么同意接受
cookie 呢？

```js
app.use((req, res, next) => {
    res.set({
        'Access-Control-Allow-Credentials': true, // true or false, 表示是否接受cookie
    });
});
```

服务器`Access-Control-Allow-Credentials` 为 `true`时，`Access-Control-Allow-Origin`就不能设置为 `*` 了，否则，你将会在浏览器控制台看见一个长长的错误提示，并且，还不给你数据

#### 跨域时服务器应答后只能从 xhr 对象中获取少量响应头字段

当请求跨域后，服务器返回的响应字段将不能被全部获取，如果服务器想让请求者获取某些字段，可以设置 `Access-Control-Expose-Headers: X-Name,XXX`，请求者通过`xhr.getResponseHeader`来获取某些服务器设置的字段

-   默认跨域时可以获取的字段
    -   `Cache-Control`
    -   `Content-Langeage`
    -   `Content-Type`
    -   `Expires`
    -   `Last-Modified`
    -   `Pragma`

#### 跨域时，请求会分为简单请求和非简单请求

跨域后，请求会分为简单请求和非简单请求，简单请求有很多限制条件，突破限制就会变成非简单请求，以下是条件与区别

-   区别

    -   简单请求不用发送校验请求，而非简单请求需要

        -   可以理解为，对服务器资源有影响的在正式请求前会发出一条校验请求

    -   校验的条件有些不同

-   简单请求的条件
    -   请求方法只能是`GET、POST、HEAD`
    -   头部信息不能超过以下几个字段（我觉得这里不必记住，因为要改这些请求头事，还管啥简单请求）
        -   `Accept`
        -   `Accept-Langaage`
        -   `Content-Langgaage`
        -   `Last-Event-ID`
        -   `Content-Type`属性必须是
            -   `application/x-WWW-form-urlencoded`
            -   `multipart/form-data`
            -   `text-plain`

##### 简单请求

简单请求的请求头在请求时会添加 Origin（`http://127.0.0.1:8080`），其中携带了协议，端口，域名。

简单请求服务器会认为它是一个正常的请求，那怕跨域，都会正常的返回数据、进行操作，请求完成后，由浏览器判断是否跨域

##### 非简单请求

非简单请求会分为两次请求，一次校验请求，一次是正式请求，正式请求需要等校验请求完成后在由浏览器判断是否要发起正式请求

校验请求会携带这次请求的关键信息，关键信息就是 `Origin`，`Access-Control-Request-Method: PUT,Access-Control-Request-Headers: X-Name`，`Method`是每次校验请求时必须有的，而`Headers`是在请求前加上了一些不是简单请求字段的字段时自动加上的，如果字段在`Access-Control-Expose-Headers`没有的话，校验也会失败。

当校验请求被浏览器判断为失败时，正式请求不会发出

校验请求也是可以设置有效时长的，否则服务器压力将会进一步加大
这字段也是服务器来返回的，具体如下
`Access-Control-Max-Age: new Date() + 1000 * 60 * 60 * 24`
