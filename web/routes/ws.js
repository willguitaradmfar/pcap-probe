var express = require('express');
var router = express.Router();

var net = require('net');


module.exports = function(io) {

  var mqtt = require('mqtt');

  var redis = require('redis');

  var clientRedis = redis.createClient(6379, '172.16.84.53');

  var multi = clientRedis.multi();

  clientRedis.on('connect', function() {
    console.log('Redis connected');
  });

  io.on('connection', function(socket) {

    var recursive = function() {
      clientRedis.keys('*', function(err, keys) {
        var list = [];

        for (var i in keys) {
          var key = keys[i];
          multi.get(key);
          // clientRedis.get(key, function(err, sData) {
          //     list.push(JSON.parse(sData))
          // });
        }

        multi.exec(function (err, replies) {
          for(var i in replies){
            replies[i] = JSON.parse(replies[i])
          }
          socket.emit('list', replies);
          setTimeout(recursive, 1000);
        });

      });
    };
    recursive();

    console.log(['mqtt://', process.env.MQTT].join(''));
    var client = mqtt.connect(['mqtt://', process.env.MQTT].join(''));

    client.on('connect', function() {
      client.subscribe('test');
    });

    client.on('message', function(topic, message) {
      socket.emit('test', JSON.parse(message));
    });

    socket.on('disconnect', function() {
      client.end();
    });

  });
  return router;
};
