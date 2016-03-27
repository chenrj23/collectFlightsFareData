const later = require('later');
const moment = require('moment');
const exec = require('child_process').exec;

const oneSearchSpace = later.parse.text('every 1 sec');
// const eachSearchSpace = later.parse.text('every 1 day');
const collectedDays = 10;
const startTime = Date.now();

function oneSearch() {
  let timeParams = [];
  let count = 0;
  // let searchTime = moment().format('YYYY-MM-DD HH:MM');

  for (let i = 0; i < collectedDays; i++) {
    let timeParam = moment().add(i, 'days').format('YYYY-MM-DD');
    timeParams.push(timeParam)
  }

  let timer = later.setInterval(function() {
    // exec(`node ${__dirname}\\HO.js -d ${timeParams[count]} -s SHA -a SYX -o ..\\data\\${startTime}`, (err, stdout, stderr) => {
    exec(`node ${__dirname}\\9C.js -d ${timeParams[count]} -s 上海 -a 三亚 -o ..\\data\\${startTime}`, (err, stdout, stderr) => {
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
