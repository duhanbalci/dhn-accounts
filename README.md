# dhn-accounts

A promise based account management library for Node.js and MongoDB

### [Usage](#usage)
- [Basic Configurations](#basic-configurations)
- [Functions](#functions)
- [Email Templates](#email-templates)

### [Api](#api)
### [Internationalization](##internationalization)

# Usage

#### Basic Configurations
```javascript
const  dhnAccounts  =  require('dhn-accounts')
const  accounts  =  new  dhnAccounts

accounts.connect('mongodb://127.0.0.1:27017/', 'database', 'collection')
  .then(() =>  console.time('connected'))
  .catch(err  =>  console.error(err.message))

accounts.secret = 'secretKey' // Secret key for JWT

//smtp setup | optional
accounts.smtpSetup({
from:  '"Duhan BALCI" <mail@duhanbalci.com>',
host:  '',
port:  465,
secure:  true,
user:  '',
pass:  '',
})
```
#### Functions
```javascript
accounts.createUser({
  email:  'mail@example.com',
  password:  'p@ssw0rd'
  }).then(() => console.log('user created'))
  .catch(err  =>  console.error(err.message))

accounts.login('duhanbalci@msn.com', '123123')
  .then(res => console.log(res)) // returns jwt
  .catch(err => console.error(err.message))
  
accounts.verifyToken(`${jwtToken}`)
  .then(res => console.log(res)) // returns payload
  .catch(err => console.error(err.message))

accounts.changePassword(`${userId}`, `${newPassword}`)
  .then(() => console.log('changed'))
  .catch(err => console.log(err.message))

accounts.changePasswordByUser(`${userId}`, `${oldPass}`, `${newPass}`)
  .then(() => console.log('changed'))
  .catch(err => console.log(err.message))

accounts.sendVerificationEmail(`${emailAdress}`)
  .then(() => console.log('sent'))
  .catch(err => console.error(err.message))

accounts.verifyEmail(`${verificationCode}`)
  .then(() => console.log('verified'))
  .catch(err => console.error(err.message))

accounts.sendPasswordRecoveryEmail(`${emailAdress}`)
  .then(() => console.log('sent'))
  .catch(err => console.error(err.message))

accounts.passwordRecovery(`${recoveryCode}`, `${newPassword}`)
  .then(() => console.log('changed'))
  .catch(err => console.error(err.message))

accounts.setUsername(`${userId}`, `${newUsername}`)
  .then(() => console.log('change'))
  .catch(err => console.error(err.message))

accounts.addEmail(`${userId}`, `${newEmail}`)
  .then(() => console.log('added'))
  .catch(err => console.error(err.message))

accounts.removeEmail(`${emailAdress}`)
  .then(() => console.log('deleted'))
  .catch(err => console.error(err.message))
```
#### Email Templates
```javascript
//defaults
accounts.emailVerificationEmail.template  =  '<a href="http://example.com/verifyEmail/{verificationCode}" >Click here</a> for validte your email adress.'
accounts.emailVerificationEmail.subject  =  'Email Verification Mail'

accounts.passwordRecoveryEmail.template  =  '<a href="{passwordRecoveryCode}">Click here</a> for recover your password.'
accounts.passwordRecoveryEmail.subject  =  'Password Recovery Mail'
```


# Api

### accounts.createUser(options)
**options** <sup>_Object_</sup>
- username <sup>_string_</sup>: optional if email entered
- email <sup>_string_</sup>: _optional if username entered_
- password <sup>_string_</sup>: password
- profile <sup>_object_</sup>: optional. You can access it from jwt payload

---
### accounts.login(login, password)
**login** <sup>_string_</sup>: username or email adress
**password** <sup>_string_</sup>: password

---
### accounts.verifyToken(jwtToken)
**jwtToken**  <sup>_string_</sup>:  json web token

---
### accounts.changePassword(userId, newPassword)
**userId** <sup>_string_</sup>: user id
**newPassword** <sup>_string_</sup>: new password

---
### accounts.changePasswordByUser(userId, oldPass, newPass)
**userId** <sup>_string_</sup>: user id
**oldPass** <sup>_string_</sup>: old password
**newPass** <sup>_string_</sup>: new password

---
### accounts.sendVerificationEmail(emailAdress)
**emailAdress** <sup>_string_</sup>: email adress

---
### accounts.verifyEmail(verificationCode)
**verificationCode** <sup>_string_</sup>: verificationCode from email

---
### accounts.sendPasswordRecoveryEmail(emailAdress)
**emailAdress** <sup>_string_</sup>: email adress

---
### accounts.passwordRecovery(recoveryCode, newPassword)
**recoveryCode** <sup>_string_</sup>: recovery code from email
**newPassword** <sup>_string_</sup>: email adress

---
### accounts.setUsername(userId, newUsername)
**userId** <sup>_string_</sup>: user id
**newUsername** <sup>_string_</sup>: new username

---
### accounts.addEmail(userId, newEmail)
**userId** <sup>_string_</sup>: user id
**newEmail** <sup>_string_</sup>: email adress

---
### accounts.removeEmail(emailAdress)
**emailAdress** <sup>_string_</sup>: email adress


# Internationalization

```javascript
//Defaults
accounts.lang = 'en'
accounts.i18n.en = {
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
```