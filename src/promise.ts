import {
  IPromise,
  STATE,
  PromiseCability,
  PromiseReaction,
  completionRecord,
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
  public finally(): IPromise {
    // TODO
    return new TPromise(() => {})
  }

  // TODO static 
  public static all() {}

  public static race() {}

  public static resolve() {}

  public static reject() {}
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
  let handlerResult: completionRecord = {
    type: 'normal',
    value: undefined,
    target: null
  }

  try {
    if (<any>handler === 'Identity') {
      handlerResult = {
        type: 'normal',
        value: argument,
        target: null,
      }
    } else if (<any>handler === 'Thrower') {
      handlerResult = {
        type: 'throw',
        value: argument,
        target: null,
      }
      throw handlerResult
    } else {
      handlerResult.value = handler.call(undefined, argument)
    }
  } catch (reason) {
    return promiseCapability.reject.call(undefined, reason)
  }

  return promiseCapability.resolve.call(undefined, handlerResult.value)
}

function promiseResolveThanableJob(promiseToResolve: TPromise, thenable: any, then: Function) {
  let resolvingFunctions = createResolvingFunctions(promiseToResolve)
  try {
    then.call(thenable, resolvingFunctions.resolve, resolvingFunctions.reject)
  } catch (reason) {
    resolvingFunctions.reject.call(undefined, reason)
  }
}
// promise
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