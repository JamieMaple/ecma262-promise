export function isCallable(argument: any) {
  return typeof argument === 'function'
}

export function isObject(o: any): boolean {
  const type = typeof o
  return o !== null && type === 'object' || type === 'function'
}

export function isConstructor(C: any): boolean {
  return typeof C === 'function'
}

export function sameValue(x: any, y: any): boolean {
  const typeX = typeof x

  if (typeX !== typeof y) {
    return false
  }

  if (typeX === 'number') {
    // NaN, -/+ 0
    return Object.is(x, y)
  }

  return sameValueNonNumber(x, y)
}

export function sameValueNonNumber(x: any, y: any): boolean {
  const typeX = typeof x
  if (typeX === 'number') {
    throw new TypeError('type of arguments[1] is number')
  } else if (typeX !== typeof y) {
    throw new TypeError('two arguments types not equal')
  }

  if (typeX == undefined) {
    return true
  }

  // string, boolean, symbol, object
  return x === y
}

export function isPropertyKey(argument: string) {
  const type = typeof argument
  return type === 'string' || type === 'symbol'
}

export function getObjectProp(O: Object, P: string): any {
  if (!isObject(O)) {
    throw new TypeError()
  }

  if (!isPropertyKey(P)) {
    throw new TypeError()
  }
  return O[P]
}


export function enqueueJob(queueName: string, job: Function, ...argument) {
  if (typeof queueName !== 'string') {
    throw TypeError('queueName')
  }
  let setenqueueJob
  setTimeout(job, 0, ...argument)
}