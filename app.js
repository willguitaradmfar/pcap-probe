var spawn = require('child_process').spawn;

var cmd = spawn('tcpdump', ['-l', '-e', '-i', 'mon0', '-s', '256', 'type', 'mgt', 'subtype', 'probe-req']);

var minusDb = {

};

var legend = {
  '14:30:c6:fd:82:9a': 'william'
};

setInterval(function() {
  console.log('=================================');
  for (var mac in minusDb) {
    console.log(minusDb[mac].num, minusDb[mac].db, legend[mac] || mac);
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
