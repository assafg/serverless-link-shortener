### 1. Setup Serverless
```bash
$ npm i -g serverless
```

### 2. create SLS service
```bash
$ sls create --template aws-nodejs
```

### 3. Deploy your function
```bash
$ sls deploy
```

### 4. Connect the function to an `http event`

```yaml
functions:
  hello:
    handler: handler.create
    events:
      - http:
          path: link
          method: post
          cors: true
```

### 5. Add DynamoDB resource

```yaml
resources:
  Resources:
    urlShortener:
      Type: 'AWS::DynamoDB::Table'
      DeletionPolicy: Retain
      Properties:
        AttributeDefinitions:
          -
            AttributeName: shortUrl
            AttributeType: S
        KeySchema:
          -
            AttributeName: shortUrl
            KeyType: HASH
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1
        TableName: url_shortener__long_urls
```

### 6. Add `create` function

```javascript
module.exports.getLink = (event, context, callback) => {
    console.log('event', event);
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
```

### 7. Add `getUrl` function
```javascript
module.exports.getUrl = (event, context, callback) => {
    const { url } = event.pathParameters;
    load(url)
        .then(url => {
            const response = {
                statusCode: 301,
                headers: {
                    Location : url,
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
```

### 8. Add Authentication
```javascript
const jwt = require('jsonwebtoken');

// Set in `enviroment` of serverless.yml
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;

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
    // decode base64 secret. ref: http://bit.ly/2hA6CrO
    const secret = new Buffer.from(AUTH0_CLIENT_SECRET, 'base64');
    try {
        jwt.verify(tokenValue, secret, options, (verifyError, decoded) => {
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
```

and update the `serverless.yml`
```yaml
functions:
  auth:
    handler: handler.auth
    cors: true

  getLink:
    handler: handler.getLink
    events:
      - http:
          path: link
          method: post
          authorizer: auth

```
