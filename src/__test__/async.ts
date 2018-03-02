import { expect } from 'chai'
import 'mocha'
import Promise from '../promise'

describe('Promise async', function() {
  it('Promise should perform async correctly: timeout', function(done) {
    const testData = 'seconde inside'
    new Promise((resolve, reject) => {
      setTimeout(resolve, 100, 'inside')
    })
    .then(data => data)
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

describe('Promise error', function() {
  it('promise should get error', function(done) {
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
})
