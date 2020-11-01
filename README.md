# loginservice-client-nodejs

This package provides a few useful functions for use in a NodeJS backend, working in conjunction with Tooltwist's [Loginservice](https://loginservice.io) service. For a client-side interface see [@tooltwist/vue-loginservice](https://www.npmjs.com/package/@tooltwist/vue-loginservice).



### Installation
    npm install @tooltwist/loginservice-client --save

or

    yarn add @tooltwist/loginservice-client
    
### Usage

#### Validating user credentials

The Jason Web Token (JWT) from loginservice is usually passed to the backend as an HTTP header. For example:

    const JWT = this.$loginservice.jwt // e.g. if using vue-loginservice
    const reply = await axios(url, {
      headers: {
        Authorization: `Bearer ${JWT}`
      },
      ...
    }
    
On the server, usually in the middleware there are usually two steps:

1. Get the JWT from the HTTP request:

       import loginserviceClient from '@tooltwist/loginservice-client'
    
       const jwt = loginserviceClient.getJWTFromAuthorization(req.headers['Authorization']

2. Verify that the token is valid. This step requires that you have a [Juice configuration](https://www.npmjs.com/package/@tooltwist/juice-client) that defines `services.auth.secret`, which is the private credentials provided by authservice. This function throw an exception if the token is invalid.

_Note: It is essential that you never pass the secret to the browser, or try to run this package in the client-side part of your application_.


       await loginserviceClient.validateJWT(jwt)

3. If you wish to use the credentials contained within the JWT it can be decoded:

       const credentials = loginserviceClient.decodeJWT(jwt)
    

#### Sending Emails

Emails can be sent through the Loginservice API. The advantage of this approach is that Loginservice logs requests and can detect email sending problems.

This API call requires you Juice configuration to define `services.auth.url` and `services.auth.apikey`.

    const result = await loginserviceClient.sendEmail(params, subject, fromEmail, fromName, toEmail, templateName)


#### Registering users

Most applications allow users to sign up from their browser, but in some cases the application wants to take responsibility for signing up users. A typical case is an invitation-only business application where the administrator signs up users. In this case, the server-side of your application can use an API to add new users.

    const user = {
      email: ...,
      firstName: ...,
      lastName: ...
    }
    const success = await loginserviceClient.registerUser(user)
    
This API requires you Juice configuration to define `services.auth.url`, `services.auth.apikey` and `services.auth.returnURL`.


