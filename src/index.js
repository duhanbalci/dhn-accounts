const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const nanoid = require('nanoid')
const { MongoClient, ObjectId } = require('mongodb')
const Accounts = {}

module.exports = class {
constructor() {
  this.connectionFail = false
  this.connection = false
  this.secret = 'aADaDASdasfASFaFQWEQASDA'
  this.jwtExpires = 604800
  this.emailVerificationEmail = {}
  this.passwordRecoveryEmail = {}
  this.emailVerificationEmail.template  =  '<a href="http://example.com/verifyEmail/{verificationCode}" >Click here</a> for validte your email adress.'
  this.emailVerificationEmail.subject  =  'Email Verification Mail'
  this.passwordRecoveryEmail.template  =  '<a href="{passwordRecoveryCode}">Click here</a> for recover your password.'
  this.passwordRecoveryEmail.subject  =  'Password Recovery Mail'
  this.lang = 'en'
  this.i18n = {
    en: {
      passwordCantBeEmpty: 'password can not be empty',
      usernameAndEmailCantBeEmpty: 'username and email adress cannot be empty at the same time',
      usernameAlreadyUsing: 'username already using',
      emailAdressAlreadyUsing: 'email adress already using',
      wrongUsername: 'wrong username',
      wrongEmailAdress: 'wrong email adress',
      wrongPassword: 'wrong password',
      userNotFound: 'user not found',
      emailAdressNotFound: 'email adress not found',
      loginError: 'login error',
      wrongToken: 'wrong token',
      verificationEmailFail: 'failed to send verification email',
      recoveryEmailFail: 'failed to send password recovery email',
    }
  }
}

checkConn() {
  return new Promise(resolve => {
    if(this.connection) return resolve(false)
    if(this.connectionFail) return resolve(true)
    const self = this
    const interval = setInterval(() => {
      if(self.connection) {
        clearInterval(interval)
        return resolve(false)
      }
    }, 100)
  })
}

connect(url, database, collection = 'users') {
  return new Promise((resolve, reject) => {
    const self = this
    MongoClient.connect(url, { useNewUrlParser: true }).then(db => {
      self.connection = true
      self.db = db.db(database).collection(collection)
      resolve()
    }).catch(err => {
      self.connectionFail = true
      reject(self.err(err))
    })
  })
}

smtpSetup({ host, port, secure = false, user, pass, from }) {
  this.mailFrom = from
  this.transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    }
  })
}

err(message) {
  return { message }
}

uniqueControl(username, email) {
  return new Promise(async (resolve, reject) => {
    if(await this.checkConn()) reject('HATAA')
    if(!username) username = false
    if(!email) email = false
    const self = this
    this.db.findOne({username: new RegExp('^' + username + '$', 'i')}, (err, res) => {
      if(err) return reject(self.err(err))
      if(res) return reject(self.i18n[self.lang].usernameAlreadyUsing)
      self.db.findOne({ 'emails.adress': new RegExp('^' + email + '$', 'i') }, (err, res) => {
        if(err) return reject(self.err(err))
        if(res) return reject(self.i18n[self.lang].emailAdressAlreadyUsing)
        return resolve()
      })
    })
  })
}

emailRegex(email) {
  const rexp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return rexp.test(String(email).toLowerCase())
}

schema(par) {
  return new Promise((resolve, reject) => {
    const schema = {}
    if(par.email) par.emails = [{adress: par.email}]
    if(!par.password) reject(this.i18n[this.lang].passwordCantBeEmpty);
    if(!par.username && !par.emails) reject(this.i18n[this.lang].usernameAndEmailCantBeEmpty)
    
    if(par.username) schema.username = par.username
    if(par.resetToken) schema.resetToken = par.resetToken
    if(par.profile) schema.profile = par.profile
    if(par.emails){
      if(!this.emailRegex(par.email)) return reject(this.err(self.i18n[self.lang].wrongEmailAdress))
      for(let i = 0; i < par.emails.length; i++) {
        if(!par.emails[i].hasOwnProperty('verified')) par.emails[i].verified = false
        par.emails[i].token = this.randomToken()
      }
      if(par.email) delete par.email
      schema.emails = par.emails
    }
    
    schema.password = bcrypt.hashSync(par.password, 8)
    schema.createdAt = par.createdAt || new Date()

    resolve(schema)
  })    
}

createUser(options) {
  return new Promise((resolve, reject) => {
    const self = this
    self.schema(options).then((schema) => {
      this.uniqueControl(schema.username, schema.email).then(() => {
        self.db.insertOne(schema)
          .then(res => resolve())
          .catch(err => reject(self.err(err)))
      }).catch((err) => {
        reject(this.err(err))
      })
    }).catch(err => reject(self.err(err)))
  })
  
}

jwtSign(user) {
  return new Promise((resolve, reject) => {
    const payload = {}
    if(user._id) payload.id = user._id
    if(user.username) payload.username = user.username
    if(user.profile) payload.profile = user.profile
    if(user.emails.length > 0) payload.emails = user.emails
    payload.exp = (Date.now() / 1000) + this.jwtExpires
    const token = jwt.sign(payload, this.secret)
    resolve(token)
  })
}

login(login, password) {
  return new Promise(async (resolve, reject) => {
    if(await this.checkConn()) reject('HATAA')
    const self = this
    this.db.findOne({ $or: [ { username: login }, { 'emails.adress': login } ] }).then((res) => {
      if(!res) reject(self.err(self.i18n[self.lang].userNotFound))
      if(bcrypt.compareSync(password, res.password)) {
        self.jwtSign(res).then(res => resolve(res))
      } else {
        reject(self.err(self.i18n[self.lang].wrongPassword))
      }
    }).catch(err => {
      reject(self.err(self.i18n[self.lang].loginError))
    })
  })
}

verifyToken(token) {
  return new Promise((resolve, reject) => {
    const self = this
    jwt.verify(token, this.secret, (err, decoded) => {
      if(err) reject(self.err(err.message))
      resolve(decoded)
    })
  })
}

passwordControlById(id, password) {
  return new Promise(async (resolve, reject) => {
    if(await this.checkConn()) reject('HATAA')
    const self = this
    this.db.findOne({ _id: ObjectId(id) }).then((res) => {
      if(!res) reject(self.err(self.i18n[self.lang].userNotFound))
      if(bcrypt.compareSync(password, res.password)){
        resolve()
      } else {
        reject(self.err(self.i18n[self.lang].wrongPassword))
      }
    }).catch(err => reject(self.err(err)))
  })
}

changePassword(id, password) {
  return new Promise(async (resolve, reject) => {
    if(await this.checkConn()) reject('HATAA')
    const self = this
    this.db.updateOne({ _id: ObjectId(id) }, { $set: { password: bcrypt.hashSync(password, 8) } })
      .then(res => {
        if(!res.matchedCount) reject(self.err(self.i18n[self.lang].userNotFound))
        resolve()
      }).catch(err => reject(self.err(err)))
  })
}

changePasswordByUser(id, oldPass, newPass) {
  return new Promise(async (resolve, reject) => {
    if(await this.checkConn()) reject('HATAA')
    const self = this
    this.passwordControlById(id, oldPass).then(() => {
      self.changePassword(id, newPass).then(() => resolve()).catch(err => reject(self.err(err.message)))
    }).catch(err => reject(self.err(err.message)))
  })
}

templateEngine(template, data) {
  return template.replace(/{(\w*)}/g, (m, key) => data.hasOwnProperty(key) ? data[key] : "");
}

randomToken() { return nanoid(32) }

sendMail(subject, content) {
  return new Promise((resolve, reject) => {
    const self = this
    const mailOptions = {
      from: this.mailFrom,
      to: 'duhanbalci@msn.com',
      subject,
      html: content
    }
    this.transporter.sendMail(mailOptions).then(res => resolve()).catch(err => reject(self.err(err)))
  })
}

sendVerificationEmail(email) {
  return new Promise(async (resolve, reject) => {
    if(await this.checkConn()) reject('HATAA')
    const self = this
    this.db.findOne({'emails.adress': email}).then(res => {
      if(!res) reject(self.err(self.i18n[self.lang].emailAdressNotFound))
      let token
      for(let i = 0; i < res.emails.length; i++) if(res.emails[i].adress == email) token = res.emails[i].token
      self.sendMail(this.emailVerificationEmail.subject, this.templateEngine(this.emailVerificationEmail.template, { verificationCode: token }))
        .then(() => resolve())
        .catch(err => reject(self.err(self.i18n[self.lang].verificationEmailFail)))
    }).catch(err => reject(self.err(err)))
  })
}

verifyEmail(token) {
  return new Promise(async (resolve, reject) => {
    if(await this.checkConn()) reject('HATAA')
    const self = this
    Accounts.findOne({'emails.token': token}).then(res => {
      if(!res) reject(self.err(self.i18n[self.lang].wrongToken))
      for(let i = 0; i < res.emails.length; i++) if(res.emails[i].token == token) res.emails[i].verified = true
      res.markModified('emails')
      res.save(err => err ? reject(self.err(err.message)): resolve())
    }).catch(err => reject(self.err(err.message)))
  })
}

sendPasswordRecoveryEmail(login) {
  return new Promise(async (resolve, reject) => {
    if(await this.checkConn()) reject('HATAA')
    const self = this
    this.db.findOne({ $or: [ { username: login }, { 'emails.adress': login } ] })
      .then(res => {
        if(!res) reject(self.err(self.i18n[self.lang].userNotFound))
        self.sendMail(self.passwordRecoveryEmail.subject, self.templateEngine(self.passwordRecoveryEmail.template, { passwordRecoveryCode: res.token }))
          .then(() => resolve())
          .catch(err => reject(self.err(self.i18n[self.lang].recoveryEmailFail)))
      }).catch(err => reject(self.err(err)))
  })
}

passwordRecovery(token, newPass) {
  return new Promise(async (resolve, reject) => {
    if(await this.checkConn()) reject('HATAA')
    const self = this
    this.db.updateOne({token}, { $set: { password: res.password = bcrypt.hashSync(newPass, 8) } })
      .then(res => !res.matchedCount ? reject(self.err(self.i18n[self.lang].wrongToken)): resolve())
      .catch(err => reject(self.err(err)))
  })
}

setUsername(id, newUsername) {
  return new Promise(async (resolve, reject) => {
    if(await this.checkConn()) reject('HATAA')
    const self = this
    this.db.updateOne({_id: ObjectId(id)}, { $set: { username: newUsername } })
      .then(res => !res.matchedCount ? reject(self.err(self.i18n[self.lang].userNotFound)): resolve())
      .catch(err => reject(self.err(err)))
  })
}

addEmail(id, email) {
  return new Promise(async (resolve, reject) => {
    if(await this.checkConn()) reject('HATAA')
    const self = this
    this.db.updateOne({_id: ObjectId(id)},{ $push: { emails: { adress: email, verified: false, token: self.randomToken()}}})
    .then(res => !res.matchedCount ? reject(self.err(self.i18n[self.lang].userNotFound)): resolve())
    .catch(err => reject(self.err(err.message)))
  })
}

removeEmail(email) {
  return new Promise(async (resolve, reject) => {
    if(await this.checkConn()) reject('HATAA')
    const self = this
    this.db.updateOne({'emails.adress': email}, { $pull: { emails: { adress: email } } })
      .then(res => !res.matchedCount ? reject(self.err(self.i18n[self.lang].emailAdressNotFound)): resolve())
      .catch(err => reject(self.err(err)))
  })
}

update(userId, query) {
  return new Promise(async (resolve, reject) => {
    if(await this.checkConn()) reject('HATAA')
    const self = this
    this.db.updateOne({_id: ObjectId(userId)}, query)
      .then(res => !res.matchedCount ? reject(self.err(self.i18n[self.lang].userNotFound)): resolve())
      .catch(err => reject(self.err(err)))
  })
}
}
