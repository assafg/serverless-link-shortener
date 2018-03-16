const { encode, decode } = require('./shortener');
const { getNewIndex } = require('./get-new-index');
const { save } = require('./save-to-db');
const { load } = require('./load-from-db');

const DOMAIN = 'tiny.tikal.io';

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
