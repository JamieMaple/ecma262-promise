import {
  IPromise,
  STATE,
  PromiseCability,
  PromiseReaction,
} from './type'
import {
  isCallable,
  isConstructor,
  isObject,
  isPropertyKey,
  getObjectProp,
  enqueueJob,
  sameValue,
} from './helpers'

export default class TPromise implements IPromise {
  public state: string = STATE.PENDING
  public value: any = undefined
  fulfillReactions: Array<PromiseReaction> = []
  rejctReactions: Array<PromiseReaction> = []
  promiseIsHandlerd: boolean = false
  constructor(executor: Function) {
    if (!new.target) {
      throw new TypeError()
    }
    if (!isCallable(executor)) {
      throw new TypeError()
    }
    let promise = this
    let resolvingFunctions = createResolvingFunctions(promise)

    try {
      executor.call(undefined, resolvingFunctions.resolve, resolvingFunctions.reject)
    } catch (reason) {
      resolvingFunctions.reject.call(undefined, reason)
    }
  }
  public then(onFulfilled: Function, onRejected?: Function): IPromise {
    let promise = this
    if (!isPromise(promise)) {
      throw new TypeError()
    }
    let speciesConstructor: Function = TPromise
    let resultCapability = newPromiseCapability(speciesConstructor)
    return performPromiseThen(promise, onFulfilled, onRejected, resultCapability)
  }
  public catch(onRejected: Function): IPromise {
    return this.then(undefined, onRejected)
  }
  public finally(onFinally: Function): IPromise {
    let promise = this
    if (!isObject(promise)) {
      throw new TypeError()
    }
    let C = promise.constructor

    if (!isConstructor(C)) {
      throw new TypeError()
    }

    let thenFinally, catchFinally

    if (!isCallable(onFinally)) {
      thenFinally = onFinally
      catchFinally = catchFinally
    } else {
      // A ThenFinally function is an anonymous built-in function that has a [[Constructor]] and an [[OnFinally]] internal slot.
      thenFinally = function(value) {
        let onFinally = thenFinally.onFinally
        if (!isCallable(onFinally)) {
          throw new TypeError()
        }
        let result = onFinally.call(undefined)
        let C = thenFinally.constructor
        if (!isConstructor(C)) {
          throw new TypeError()
        }
        let promise = promiseResolve(C, result)
        let valueThunk = function() {return value}
        return promise.then(valueThunk)
      }
      // A CatchFinally function is an anonymous built-in function that has a [[Constructor]] and an [[OnFinally]] internal slot.
      catchFinally = function(reason) {
        let onFinally = catchFinally.onFinally
        if (!isCallable(onFinally)) {
          throw new TypeError()
        }
        let result = onFinally.call(undefined)
        let C = catchFinally.constructor
        if (!isConstructor(C)) {
          throw new TypeError()
        }
        let promise = promiseResolve(C, reason)
        let thrower = function() {throw reason}
        return promise.then(thrower)
      }
      thenFinally.constructor = catchFinally.constructor = C
      thenFinally.onFinally = catchFinally.onFinally = onFinally
    }

    return promise.then(thenFinally, catchFinally)
  }

  public static resolve(x: any): IPromise {
    let C = this
    if (!isObject(C)) {
      throw new TypeError()
    }

    if (isPromise(x)) {
      let xConstructor = getObjectProp(x, 'constructor')
      if (sameValue(xConstructor, C)) {
        return x
      }
    }

    let promiseCapability = newPromiseCapability(C)

    promiseCapability.resolve.call(undefined, x)

    return promiseCapability.promise
  }

  public static reject(r: any): IPromise {
    let C = this
    if (!isObject(C)) {
      throw new TypeError()
    }

    let promiseCapability = newPromiseCapability(C)

    promiseCapability.reject.call(undefined, r)

    return promiseCapability.promise
  }

  // TODO static
  static get ['@@species'] (): IPromise {
    return <any>this
  }
  public static all() {
    let C = this
    if (!isObject(C)) {
      throw new TypeError()
    }
    let S = getObjectProp(C, '@@species')
    if (S != undefined) {
      C = S
    }
  }
  public static race() {}
}
/*
 * some Promise Abstract Operations
 */

/*
 * CreateResolvingFunctions
 * param {promise} promise
 * return {TRecord}
 */
function createResolvingFunctions(promise: TPromise): {resolve: Function, reject: Function} {
  let alreadyResolved: {value: boolean} = {value: false}

  /* Build-in
   * Promise Reject Functions
   */
  let reject: any = function(reason: any) {
    if (!isObject(reject.promise)) {
      throw new TypeError()
    }

    reject.promise = promise
    reject.alreadyResolved = alreadyResolved

    if (alreadyResolved.value) {
      return undefined
    }

    alreadyResolved.value = true

    return rejectPromise(promise, reason)
  }
  reject.promise = promise
  reject.alreadyResolved = alreadyResolved

  /* Build-in
   * Promise Resolve Functions
   */
  let resolve: any = function(resolution: any) {
    if (!isObject(reject.promise)) {
      throw new TypeError()
    }

    resolve.promise = promise
    resolve.alreadyResolved = alreadyResolved

    if (alreadyResolved.value) {
      return
    }
    
    alreadyResolved.value = true

    if (sameValue(resolution, promise)) {
      let selfResolutionError = new TypeError('self resolution error')
      return rejectPromise(promise, selfResolutionError)
    }

    if (!isObject(resolution)) {
      return fulfillPromise(promise, resolution)
    }

    let then = getObjectProp(resolution, 'then')

    let thenAction = then
    if (!isCallable(thenAction)) {
      return fulfillPromise(promise, resolution)
    }

    enqueueJob("PromiseJobs", promiseResolveThanableJob, promise, resolution, thenAction)
  }
  resolve.promise = promise
  resolve.alreadyResolved = alreadyResolved

  return {
    resolve,
    reject,
  }
}

/*
 * NewPromiseCapability
 */
function newPromiseCapability(C: any): PromiseCability {
  if (!isConstructor(C)) {
    throw TypeError()
  }

  let promiseCapability: PromiseCability = {
    promise: undefined,
    resolve: undefined,
    reject: undefined,
  }

  let executor: any = function(resolve, reject) {
    let promiseCapability = executor.capability

    if (promiseCapability.resolve !== undefined || promiseCapability.reject !== undefined) {
      throw new TypeError()
    }

    promiseCapability.resolve = resolve
    promiseCapability.reject = reject
  }
  executor.capability = promiseCapability

  let promise = new C(executor)

  if (!isCallable(promiseCapability.resolve) || !isCallable(promiseCapability.reject)) {
    throw new TypeError()
  }
  promiseCapability.promise = promise

  return promiseCapability
}

/*
 * reject functions
 */
function rejectPromise(promise: TPromise, reason: any) {
  if (promise.state === STATE.PENDING) {
    let reactions = promise.rejctReactions
    promise.value = reason
    promise.fulfillReactions = promise.rejctReactions = undefined
    promise.state = STATE.REJECTED
    return triggerPromiseReactions(reactions, reason)
  }
}

/*
 * resovle functions
 */
function fulfillPromise(promise: TPromise, value: any) {
  if (promise.state === STATE.PENDING) {
    let reactions: Array<PromiseReaction> = promise.fulfillReactions
    promise.value = value
    promise.fulfillReactions = promise.rejctReactions = undefined
    promise.state = STATE.FULFILLED
    return triggerPromiseReactions(reactions, value)
  }
}

function triggerPromiseReactions(reactions: Array<PromiseReaction>, ...argument) {
  reactions.forEach(reaction => enqueueJob('promiseJobs', promiseReactionJob, reaction, ...argument))    
}

function isPromise(x: any): boolean {
  if (!isObject(x)) {
    return false
  }

  if (x.state === STATE.PENDING || x.state === STATE.FULFILLED || x.state === STATE.REJECTED) {
    return true
  } else {
    return false
  }
}

// promise job
function promiseReactionJob(reaction: PromiseReaction, argument) {
  let promiseCapability = reaction.capability
  let handler = reaction.handler
  let handlerResult

  try {
    if (<any>handler === 'Identity') {
      handlerResult = argument
    } else if (<any>handler === 'Thrower') {
      handlerResult = argument
      throw handlerResult
    } else {
      handlerResult = handler.call(undefined, argument)
    }
  } catch (reason) {
    return promiseCapability.reject.call(undefined, reason)
  }

  return promiseCapability.resolve.call(undefined, handlerResult)
}
// thenable
function promiseResolveThanableJob(promiseToResolve: TPromise, thenable: any, then: Function) {
  let resolvingFunctions = createResolvingFunctions(promiseToResolve)
  try {
    then.call(thenable, resolvingFunctions.resolve, resolvingFunctions.reject)
  } catch (reason) {
    resolvingFunctions.reject.call(undefined, reason)
  }
}
// promise then
function performPromiseThen(promise: TPromise, onFulfilled: Function, onRejected: Function, resultCapability: PromiseCability): IPromise {
  // params not function
  if (!isCallable(onFulfilled)) {
    (<any>onFulfilled) = 'Identity'
  }
  if (!isCallable(onRejected)) {
    (<any>onRejected) = 'Thrower'
  }

  let fulfillReaction: PromiseReaction = {
    handler: onFulfilled,
    capability: resultCapability,
  }
  let rejctReaction: PromiseReaction = {
    handler: onRejected,
    capability: resultCapability,
  }

  if (promise.state === STATE.PENDING) {
    promise.fulfillReactions.push(fulfillReaction)
    promise.rejctReactions.push(rejctReaction)
  } else if (promise.state === STATE.FULFILLED) {
    enqueueJob('promiseJobs', promiseReactionJob, fulfillReaction, promise.value)
  } else if (promise.state === STATE.REJECTED) {
    enqueueJob('promiseJobs', promiseReactionJob, rejctReaction, promise.value)
  }

  return resultCapability.promise

}
// promise resolve
function promiseResolve(C: Function, x: any): IPromise {
  if (!isObject(C)) {
    throw new TypeError()
  }
  if (isPromise(x)) {
    let xConstructor = getObjectProp(x, 'constructor')
    if (sameValue(xConstructor, C)) {
      return x
    }
  }
  let promiseCapability = newPromiseCapability(C)
  promiseCapability.resolve.call(undefined, x)
  return promiseCapability.promise
}
