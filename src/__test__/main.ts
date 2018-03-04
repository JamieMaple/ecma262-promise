import { expect } from 'chai'
import 'mocha'
import Promise from '../promise'

describe('Promise async', function() {
  it('#timeout', function(done) {
    const testData = 'seconde inside'
    new Promise((resolve, reject) => {
      setTimeout(resolve, 100, 'inside')
    })
    .then(data => data)
    .then(() => {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, 100, testData)
      })
    }).then(data => {
      expect(data).to.equal(testData)
      done()
    }).catch(err => {
      done(err)
    })
  })
})

describe('Promise prototype methd:', function() {
  describe('#then', function() {
    it('#then object', function(done) {
      const object = {
        then: 'then'
      }
      new Promise(function(res) {
        res(object)
      }).then(val => {
        expect(val).property('then', object.then)
        done()
      })
    })
    it('#thenable object', function(done) {
      const data = 100
      const thenable = {
        then(res, rej) {
          res(data)
        }
      }
      new Promise(res => {
        res(thenable)
      }).then(val => {
        expect(val).to.equal(data)
        done()
      })
    })
  })
  it('#catch', function(done) {
    const reason = 'throw'
    new Promise(function(res, rej) {
      rej(reason)
    }).catch(reason => {
      expect(reason).to.equal(reason)
      done()
    })
  })
  it('#get error', function(done) {
    const errorMessage = 'error!'
    new Promise((res, rej) => {
      res(1)
    }).then(data => {
      throw new Error(errorMessage)
    }).catch(error => {
      expect(error.message).to.equal(errorMessage)
      done()
    }).catch(err => {
      done(err)
    })
  })
  describe('#finally', function() {
    const testData = 'testFinally'
    it('#case1: then', function(done) {
      new Promise((res) => {
        res(testData)
      }).finally(() => {
        expect(testData).equal(testData)
        return 1
      }).then(val => {
        expect(val).equal(testData)
        done()
      }).catch(err => done(err))
    })
    it('#case2: catch', function(done) {
      new Promise((res, rej) => {rej(testData)}).finally(v => {
        throw new Error(testData)
      }).catch(reason => {
        expect(reason.message).equal(testData)
        done()
      })
    })
  })
})

describe('Promise static methods', function() {
  it('#reject', function(done) {
    const testData = 'rejected'
    Promise.reject(testData).catch(r => {
      expect(r).to.equal(testData)
      done()
    })
  })
  it('#resolve: string', function(done) {
    const testData = 'resolved'
    Promise.resolve(testData).then(data => {
      expect(data).equal(testData)
      done()
    }).catch(r => {
      done(r)
    })
  })
  it('#resolve: promise', function(done) {
    const testData = 100
    const p = Promise.resolve(testData)
    Promise.resolve(p).then(data => {
      expect(data).equal(testData)
      done()
    })
  })
})
