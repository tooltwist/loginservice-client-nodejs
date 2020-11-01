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

/**
 * @param {*} user
 * @returns String LoginServiceId
 */
async function registerUser(user) {
  const url = await juice.getString('services.auth.url')
  const apikey = await juice.getString('services.auth.apikey')
  const returnURL = await juice.getString('services.auth.returnURL')

  let isSuccess = false;
  await axios({
    method: 'put',
    url: `${url}/v2/${apikey}/email/register`,
    data: {
      email: user.email,
      username: user.email,
      first_name: user.firstname,
      last_name: user.lastname,
      resume: returnURL,
    },
  })
    .then((response) => {
      if (response.status === 200) {
        isSuccess = true;
      } else {
        isSuccess = false;
        throw new errors.InternalServerError(`(LoginService.io) Failed to register ${user.email}.`);
      }
      return isSuccess;
    })
    .catch((error) => {
      console.log(error);
      // logger.error(error);
      throw new errors.InternalServerError(`(LoginService.io) Failed to register ${user.email}.`);
    });
}

/**
 * Validate whether the JWT from login service is invalid or expired.
 * If invalid or expired, corresponding error status will be thrown.
 * @param {*} token is the authentication provided by the login service
 */
async function validateJWT(token) {
  // console.log(`validateJWT()`)

  try {
    const secret = await juice.string('services.auth.secret', juice.MANDATORY)
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
  const url = await juice.getString('services.auth.url')
  const apikey = await juice.getString('services.auth.apikey')

  let isSuccess = true;
  await axios({
    method: 'post',
    url: `${url}/v2/${apikey}/sendmail`,
    data: {
      template: templateName,
      params: params,
      to_email: toEmail,
      from_email: fromEmail,
      from_name: fromName,
      subject: subject
    },
  })
    .then((response) => {
      if (response.status === 200) {
        isSuccess = true;
      } else {
        isSuccess = false;
        throw new errors.InternalServerError(`(LoginService.io) Failed to sendEmail ${toEmail}.`);
      }
      return isSuccess;
    })
    .catch((error) => {
      console.log(error)
      // logger.error(error);
      throw new errors.InternalServerError(`(LoginService.io) Failed to sendEmail ${toEmail}.`);
    });
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
