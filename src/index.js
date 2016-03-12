const later = require('later');
const moment = require('moment');
const exec = require('child_process').exec;

const oneSearchSpace = later.parse.text('every 5 sec');
const eachSearchSpace = later.parse.text('every 1 day');
const collectedDays = 10;


function oneSearch() {
  let timeParams = [];
  let count = 0;
  // let searchTime = moment().format('YYYY-MM-DD HH:MM');

  for (let i = 0; i < collectedDays; i++) {
    let timeParam = moment().add(i, 'days').format('YYYY-MM-DD');
    timeParams.push(timeParam)
  }

  let timer = later.setInterval(function() {
    //还没想好怎么用相对路径 = =
    exec(`node E:\\code\\collectFlightsData\\collectFlightsFareData\\HO.js -d ${timeParams[count]} -s SHA -a SYX `, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(stdout);
    });

    count++;
    if (count === timeParams.length) {
      timer.clear();
      count = 0;
    }
  }, oneSearchSpace)
}
oneSearch()


exec('node E:\\code\\collectFlightsData\\collectFlightsFareData\\HO.js -d 2016-03-13 -s SHA -a SYX ', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});
