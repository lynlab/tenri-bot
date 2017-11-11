'use strict';

const BigNumber = require('bignumber.js');
const Twitter = require('twitter');

const lynapi = require('./lib/lynlab-api');
const tenri = require('./lib/tenri');

// 연합뉴스 유저 ID
const NEWS_USER_ID = 147451838;

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
});

module.exports.handle = (event, context, callback) => {
  lynapi.keyValue.getValue('TENRI_NEWS_LAST_ID').then(data => {
    let options = {
      user_id: NEWS_USER_ID,
      since_id: new BigNumber(data.value).plus(1).toString(),
    };

    client.get('statuses/user_timeline', options, (err, tweets, res) => {
      if (tweets.length === 0) {
        return callback();
      }

      // 속보를 찾아 Telegram 발송
      tweets
        .filter(tweet => tweet.text.includes('속보'))
        .forEach(tweet => {
          console.log(`${tweet.id} - ${tweet.text}`);
          tenri.sendMessage(tweet.text);
        });

      // LAST_ID 갱신
      let lastId = new BigNumber(tweets[0].id_str);
      lynapi.keyValue.setValue('TENRI_NEWS_LAST_ID', lastId.toString())
        .then(data => callback())
        .catch(err => callback(err));
    });
  });
};
