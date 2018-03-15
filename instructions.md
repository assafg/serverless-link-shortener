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
