const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();

function getNewIndex() {
    const params = {
        TableName: 'url_shortener__long_urls',
        Key: {
            shortUrl: '__index', // Special key for the index
        },
        UpdateExpression: 'add #counter :n',
        ExpressionAttributeNames: {
            '#counter': 'counter',
        },
        ExpressionAttributeValues: {
            ':n': 1,
        },
        ReturnValues: 'UPDATED_NEW',
    };

    return new Promise((resolve, reject) => {
        dynamoDb.update(params, (err, res) => {
            if (err) {
                return reject(err);
            }
            return resolve(res.Attributes.counter);
        });
    });
}

module.exports = {
    getNewIndex,
};
