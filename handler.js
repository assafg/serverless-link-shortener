const jwt = require('jsonwebtoken');

const { encode } = require('./lib/shortener');
const { getNewIndex } = require('./lib/get-new-index');
const { save } = require('./lib/save-to-db');
const { load } = require('./lib/load-from-db');

const DOMAIN = 'tiny.tikal.io';

// Set in `enviroment` of serverless.yml
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_PUBLIC_KEY = process.env.AUTH0_CLIENT_PUBLIC_KEY

// Policy helper function
const generatePolicy = (principalId, effect, resource) => {
    const authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        const policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        const statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    return authResponse;
};

// Reusable Authorizer function, set on `authorizer` field in serverless.yml
module.exports.auth = (event, context, callback) => {
    console.log('event', event);
    if (!event.authorizationToken) {
        return callback('Unauthorized');
    }

    const tokenParts = event.authorizationToken.split(' ');
    const tokenValue = tokenParts[1];

    if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
        // no auth token!
        return callback('Unauthorized');
    }
    const options = {
        audience: AUTH0_CLIENT_ID,
    };
    try {
        jwt.verify(tokenValue, AUTH0_CLIENT_PUBLIC_KEY, options, (verifyError, decoded) => {
            if (verifyError) {
                console.log('verifyError', verifyError);
                // 401 Unauthorized
                console.log(`Token invalid. ${verifyError}`);
                return callback('Unauthorized');
            }
            return callback(null, generatePolicy(decoded.sub, 'Allow', event.methodArn));
        });
    } catch (err) {
        console.log('catch error. Invalid token', err);
        return callback('Unauthorized');
    }
};

module.exports.getLink = (event, context, callback) => {
    if (!event.body) {
        return callback(null, {
            statusCode: 400,
        });
    }
    const url = JSON.parse(event.body).url;

    if (!url) {
        return callback(null, {
            statusCode: 400,
        });
    }

    getNewIndex()
        .then(index => encode(index))
        .then(shortUrl => save({ url, shortUrl }))
        .then(shortUrl => {
            const response = {
                statusCode: 201,
                headers: {
                    /* Required for CORS support to work */
                    "Access-Control-Allow-Origin": "*",
                    /* Required for cookies, authorization headers with HTTPS */
                    "Access-Control-Allow-Credentials": true
                },
                body: JSON.stringify({
                    shortUrl: `${DOMAIN}/${shortUrl}`,
                }),
            };

            callback(null, response);
        })
        .catch(err => {
            console.log(err);
            callback(null, err);
        });
};

module.exports.getUrl = (event, context, callback) => {
    const { url } = event.pathParameters;
    load(url)
        .then(url => {
            const response = {
                statusCode: 301,
                headers: {
                    Location: url,
                    /* Required for CORS support to work */
                    "Access-Control-Allow-Origin": "*",
                    /* Required for cookies, authorization headers with HTTPS */
                    "Access-Control-Allow-Credentials": true
                },

                body: null,
            };
            callback(null, response);
        })
        .catch(err => {
            console.log(err);
            callback(null, err);
        });
};
