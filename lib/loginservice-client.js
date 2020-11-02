import axios from 'axios';
import jwt from 'jsonwebtoken';
import errors from 'restify-errors';
import juice from '@tooltwist/juice-client';


/**
 * Get the access token from the authorization header value
 * The format of the Authorization should be:
 * Bearer xxxxxxxxxxxx
 * @param {*} authorization can be provied by the request header
 */
async function getJWTFromAuthorization(authorization) {
  const parts = authorization.split(' ');
  if (parts.length === 2) {
    const scheme = parts[0];
    const credentials = parts[1];
    const pattern = new RegExp('^Bearer$', 'i');
    // Test if the supplied header token type is valid
    // If valid, return the access token
    if (pattern.test(scheme)) {
      return credentials;
    }
  }
  return '';
}

async function endpoint() {
  let protocol = await juice.string('loginservice.protocol', juice.OPTIONAL)
  if (!protocol) {
    protocol = await juice.string('tooltwist.protocol', juice.MANDATORY)
  }
  let host = await juice.string('loginservice.host', juice.OPTIONAL)
  if (!host) {
    host = await juice.string('tooltwist.host', juice.MANDATORY)
  }
  let port = await juice.integer('loginservice.port', juice.OPTIONAL)
  if (!port) {
    port = await juice.integer('tooltwist.port', juice.MANDATORY)
  }
  let version = await juice.string('loginservice.version', juice.OPTIONAL)
  if (!version) {
    version = "2.0"
  }
  let apikey = await juice.string('loginservice.apikey', juice.OPTIONAL)
  if (!apikey) {
    apikey = await juice.string('tooltwist.apikey', juice.MANDATORY)
  }
  return `${protocol}://${host}:${port}/${version}/${apikey}`
}

/**
 * @param {*} user
 * @returns String LoginServiceId
 */
async function registerUser(user) {
  const url = `${await endpoint()}/email/register`
  const returnURL = await juice.getString('loginservice.returnURL', juice.MANDATORY)

  try {
    const response = await axios({
      method: 'put',
      url,
      data: {
        email: user.email,
        username: user.email,
        first_name: user.firstname,
        last_name: user.lastname,
        resume: returnURL,
      },
    })
    if (response.status !== 200) {
      throw new errors.InternalServerError(`(LoginService.io) Failed to register ${user.email}.`);
    }
    // All is well.
  } catch (error) {
    console.log(error);
    // logger.error(error);
    throw new errors.InternalServerError(`(LoginService.io) Failed to register ${user.email}.`);
  }
}

/**
 * Validate whether the JWT from login service is invalid or expired.
 * If invalid or expired, corresponding error status will be thrown.
 * @param {*} token is the authentication provided by the login service
 */
async function validateJWT(token) {
  // console.log(`validateJWT()`)

  try {
    let secret = await juice.string('loginservice.secret', juice.MANDATORY)
    if (!secret) {
      secret = await juice.string('tooltwist.secret', juice.MANDATORY)
    }
    jwt.verify(token, secret);
  } catch (err) {
    let msg
    console.log(`err.name=`, err.name);
    if (err.name === 'TokenExpiredError') {
      msg = 'Authorization token has expired'
    } else if (err.name === 'JsonWebTokenError') {
      msg = 'Invalid JWT'
    } else {
      msg = 'Authorization token is invalid'
    }
    console.log(`Invalid token: ${msg}`)
    throw new errors.UnauthorizedError(msg);
  }
}

/**
 *  Send email via loginService
 * @param {*} token
 */
async function sendEmail(params, subject, fromEmail, fromName, toEmail, templateName) {
  const url = `${await endpoint()}/sendmail`
  try {
    // let isSuccess = true;
    const response = await axios({
      method: 'post',
      url,
      data: {
        template: templateName,
        params: params,
        to_email: toEmail,
        from_email: fromEmail,
        from_name: fromName,
        subject: subject
      },
    })
    if (response.status !== 200) {
      throw new errors.InternalServerError(`(LoginService.io) Failed to sendEmail ${toEmail}.`);
    }
    // All is well.
  } catch (error) {
    console.log(error)
    // logger.error(error);
    throw new errors.InternalServerError(`(LoginService.io) Failed to sendEmail ${toEmail}.`);
  }
}

/**
 * Decode the jwt token
 * @param {*} token is the authentication provided by the login service
 */
const decodeJWT = token => jwt.decode(token);

export default {
  registerUser,
  sendEmail,
  getJWTFromAuthorization,
  validateJWT,
  decodeJWT,
};
