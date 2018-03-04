# Promise

### A+ 

> https://promisesaplus.com/

### ES6

PS：从 LearningNotes 的造轮子分支中单独分离出来的仓库。。。

网上 A+ 栗子非常多，但为了尝试学院派的风格，故遵守标准造造轮子

promise 读规范有感

顺便也非常感谢组长麦冬学长分享的 [repo](https://github.com/MondoGao/ES2015-promise-implement) 启发

读完 Promise 的标准觉得实现非常严谨
感觉类型系统可能更有助于理解 Promise 也更有助于编译检测，所以想用 ts 造 Promise 的轮子

``` javascript
// constructor
Promise

// methods
Promise.prototype.then
Promise.prototype.catch
// finally - stage4
Promise.prototype.finally

// static methods
Promise.resolve
Promise.reject

// TODO
// all, race
```

> http://www.ecma-international.org/ecma-262/6.0/ECMA-262.pdf

> https://tc39.github.io/proposal-promise-finally/

PS：果然我的代码水平依然很烂

### MIT