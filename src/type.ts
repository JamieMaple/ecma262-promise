 /*
  * The List type is used to explain the evaluation of argument lists in new expressions, 
  * in function calls, and in other algorithms where a simple ordered list of values is needed. 
  */
 export type List = Array<any>

 /*
 * The Record type is used to describe data aggregations within the algorithms of this specification. 
 * A Record type value consists of one or more named fields. 
 * The value of each field is either an ECMAScript value or an abstract value represented by a name associated 
 * with the Record type. Field names are always enclosed in double brackets, for example [[Value]].
 * 
 * While there is a `Record` type exist in TS, using TRecord
 */
 export type TRecord = Object

 /*
  * The Completion type is a Record used to explain the runtime propagation of values and control flow 
  * such as the behaviour of statements (break, continue, return and throw) that perform nonlocal transfers of control.
  */
 export type completionRecord = {
   // type: typeOfCRecord,
   type: 'normal'|'break'|'continue'|'return'|'throw',
   value: any,
   target: string|null,
 }

 /*
 * A Promise is an object that is used as a placeholder 
 * for the eventual results of a deferred (and possibly asynchronous) 
 * computation.
 */
 export interface IPromise {
   state: string,
   value: any,
   fulfillReactions: Array<PromiseReaction>,
   rejctReactions: Array<PromiseReaction>,
   promiseIsHandlerd: boolean,
   then(onFulfilled: Function, onRejected?: Function): IPromise,
   catch(onRejected: Function): IPromise,
 }

 /*
 * Any Promise object is in one of three mutually exclusive states: 
 * fulfilled, 
 * rejected, 
 * and pending
 */
 export const STATE = {
   PENDING: 'PENDING',
   FULFILLED: 'FULFILLED',
   REJECTED: 'REJECTED',
 }

 /*
 * A PromiseCapability is a Record value used to encapsulate a promise object 
 * along with the functions that are capable of resolving or rejecting that promise object. 
 * PromiseCapability Records are produced by the `NewPromiseCapability` abstract operation.
 */
 export type PromiseCability = {
   promise: IPromise,
   resolve: Function,
   reject: Function,
 }

 /*
 * The PromiseReaction is a Record value used to store information about how a promise should react 
 * when it becomes resolved or rejected with a given value. 
 * PromiseReaction records are created by the `PerformPromiseThen abstract` operation, and are used by a `PromiseReactionJob`.
 */
 export type PromiseReaction = {
   capability: PromiseCability,
   type?: string,
   handler: Function | undefined
 }