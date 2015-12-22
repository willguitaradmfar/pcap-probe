var spawn = require('child_process').spawn;

var fs = require('fs');

var redis = require('redis');
var clientRedis = redis.createClient(6379, 'localhost');
clientRedis.on('connect', function() {
  console.log('Redis connected');
});

var cmd = spawn('tcpdump', ['-l', '-e', '-i', 'mon0', '-s', '256', 'type', 'mgt', 'subtype', 'probe-req']);

var minusDb = {};

var bufferLegend = fs.readFileSync('.legend');
var legend = JSON.parse(bufferLegend);

cmd.stdout.on('data', function(data) {
  var s = data.toString();

  var regex = /^(\d{2}:\d{2}:\d{2}.\d{6}) (\d*)us .* ([-,+]\d{2,3})dB .* SA:(\w{2}:\w{2}:\w{2}:\w{2}:\w{2}:\w{2}) .*\n$/;

  if (!regex.test(s)) return;

  var time = s.replace(regex, '$1');
  var num = s.replace(regex, '$2');
  var db = s.replace(regex, '$3');
  var mac = s.replace(regex, '$4');

  if (!minusDb[mac]) {
    minusDb[mac] = {}
    minusDb[mac].db = db;
    minusDb[mac].num = num;
    minusDb[mac].time = time;
  }

  // if (minusDb[mac].db > db) minusDb[mac].db = db;

  var data = JSON.stringify({
    num: minusDb[mac].num,
    mac: mac,
    name: legend[mac],
    db: db,
    time: time,
    point: '1',
  });

  clientRedis.set('1_' + mac, data);

  clientRedis.expire('1_' + mac, 30);

  console.log(time, mac, db, minusDb[mac].num, legend[mac] || '');

});

cmd.stderr.on('data', function(data) {
  console.log('err', data.toString());
});
