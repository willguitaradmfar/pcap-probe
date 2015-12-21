var spawn = require('child_process').spawn;

var fs = require('fs');

var redis = require('redis');
var clientRedis = redis.createClient(6379, '172.16.84.53');
clientRedis.on('connect', function() {
  console.log('Redis connected');
});

var cmd = spawn('tcpdump', ['-l', '-e', '-i', 'mon0', '-s', '256', 'type', 'mgt', 'subtype', 'probe-req']);

var minusDb = {};

var bufferLegend = fs.readFileSync('.legend');
var legend = JSON.parse(bufferLegend);

setInterval(function() {
  for (var mac in minusDb) {
    var data = JSON.stringify({
      num: minusDb[mac].num,
      mac: mac,
      name: legend[mac],
      db: minusDb[mac].db,
      point: '1',
    });

    clientRedis.set('1_'+mac, data);

    clientRedis.expire('1_'+mac, 30);

    delete minusDb[mac];
  }
}, 1000);

cmd.stdout.on('data', function(data) {
  var s = data.toString();

  var regex = /^.* (\d*)us .* ([-,+]\d{2,3})dB .* SA:(\w{2}:\w{2}:\w{2}:\w{2}:\w{2}:\w{2}) .*\n$/;

  if (!regex.test(s)) return;

  var num = s.replace(regex, '$1');
  var db = s.replace(regex, '$2');
  var mac = s.replace(regex, '$3');

  if (!minusDb[mac]) {
    minusDb[mac] = {}
    minusDb[mac].db = db;
    minusDb[mac].num = num;
  }

  if (minusDb[mac].db > db) minusDb[mac].db = db;

});

cmd.stderr.on('data', function(data) {
  console.log('err', data.toString());
});
