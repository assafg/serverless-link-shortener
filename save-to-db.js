const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { v1 } = require('uuid');

function save({ url, shortUrl }) {
    const params = {
        TableName: 'url_shortener__long_urls',
        Item: {
            url,
            shortUrl,
        },
        ReturnValues: 'NONE',
    };
    return new Promise((resolve, reject) => {
        dynamoDb.put(params, (err, res) => {
            if (err) {
                return reject(err);
            }
            return resolve(shortUrl);
        });
    });
}

module.exports = {
    save,
};
