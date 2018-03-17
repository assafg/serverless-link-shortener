const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();

function load(shortUrl) {
    const params = {
        TableName: 'url_shortener__long_urls',
        Key: {
            shortUrl,
        },
    };
    return new Promise((resolve, reject) => {
        dynamoDb.get(params, (err, res) => {
            if (err) {
                return reject(err);
            }
            return resolve(res.Item.url);
        });
    });
}

module.exports = {
    load,
};
