var spawn = require('child_process').spawn;

var fs = require('fs');

var point = process.argv[2];

console.log('point ', point);

var redis = require('redis');
var clientRedis = redis.createClient(6379, 'redis');
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



  var data = JSON.stringify({
    num: num,
    mac: mac,
    name: legend[mac],
    db: db,
    time: time,
    point: point,
  });

  clientRedis.set(point+'_' + mac, data);

  clientRedis.expire(point+'_' + mac, 30);

  console.log(time, mac, db, num, legend[mac] || '');

});

cmd.stderr.on('data', function(data) {
  console.log('err', data.toString());
});
