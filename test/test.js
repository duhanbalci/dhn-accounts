const assert = require('assert')
const dhnAccounts = require('../src')
const accounts = new dhnAccounts

const data = {}

describe('dhn-accounts', () => {
  describe('connection', () => {
    it('should connect', (done) => {
      accounts.connect('mongodb://127.0.0.1:27017', 'database')
        .then(() => {
          accounts.db.remove({ 'emails.adress': 'mail@example.com' })
          .then(() => done())
          .catch(err => done(err))
        })
        .catch(err => done(err.message))
    })

    it('should reject because non database entry', (done) => {
      accounts.connect('mongodb://127.0.0.1:27017')
        .then(() => done('err'))
        .catch(() => done())
    })
  })
  describe('createAccount', () => {
    it('should create account', (done) => {
      accounts.createUser({
        email:  'mail@example.com',
        password:  'p@ssw0rd'
        }).then(() => done())
        .catch(err => done(err.message))
    })

    it('shouldn\'t create account wrong email regex', (done) => {
      accounts.createUser({
        email:  'mail@example.c',
        password:  'p@ssw0rd'
        }).then(() => done('err'))
        .catch(() => done())
    })

    it('shouldn\'t create account non password', (done) => {
      accounts.createUser({
        email:  'mail@example.com',
        }).then(() => done('err'))
        .catch(() => done())
    })

    it('shouldn\'t create account non login', (done) => {
      accounts.createUser({
        password:  'p@ssw0rd'
        }).then(() => done('err'))
        .catch(() => done())
    })
  })

  describe('login', () => {
    it('should login', (done) => {
      accounts.login('mail@example.com', 'p@ssw0rd')
        .then(res => { data.jwtToken = res; done() })
        .catch(err => done(err.message))
    })

    it('shouldn\'t login wrong email', (done) => {
      accounts.login('duhanbalci@msn.com', 'p@ssw0rd')
        .then(() => done('err'))
        .catch(() => done())
    })

    it('shouldn\'t login empty login', (done) => {
      accounts.login('', 'p@ssw0rd')
        .then(() => done('err'))
        .catch(() => done())
    })

    it('shouldn\'t login empty password', (done) => {
      accounts.login('mail@example.com', '')
        .then(() => done('err'))
        .catch(() => done())
    })
  })

  describe('verifyToken', () => {
    it('should be correct', (done) => {
      accounts.verifyToken(data.jwtToken)
        .then(res => { data.userId = res.id; done() })
        .catch(err => done(err.message))
    })

    it('shouldn\'t be correct', (done) => {
      accounts.verifyToken('ASDASDASDASDASD')
        .then(() => done('err'))
        .catch(() => done())
    })
  })

  describe('changePassword', () => {
    it('should change password', (done) => {
      accounts.changePassword(data.userId, '123123')
      .then(() => done())
      .catch(err => done(err.message))
    })
  })

  describe('changePasswordByUser', () => {
    it('shouldn\'t change password wrong password', (done) => {
      accounts.changePasswordByUser(data.userId, '123', 'p@ssw0rd')
      .then(() => done('err'))
      .catch(() => done())
    })

    it('shouldn\'t change password wrong id', (done) => {
      accounts.changePasswordByUser('asdasdasdasd', '123123', 'p@ssw0rd')
      .then(() => done('err'))
      .catch(() => done())
    })

    it('should change password', (done) => {
      accounts.changePasswordByUser(data.userId, '123123', 'p@ssw0rd')
      .then(() => done())
      .catch(err => done(err.message))
    })
  })
  
})