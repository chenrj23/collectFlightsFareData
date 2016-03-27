const request = require('superagent');
const program = require('commander');
const jsonfile = require('jsonfile');
const moment = require('moment');
const path = require('path');
const fs = require('fs')

program
  .version('0.0.1')
  .option('-d, --date [time]', 'seaching date like 2016-03-28')
  .option('-s, --sendCode [code]', 'sendCode like 上海')
  .option('-a, --arrCode [code]', 'arrCode like 三亚')
  .option('-o, --outPath <path>', 'outpath like ../data/fool')
  .parse(process.argv);

var date = program.date,
  sendCode = program.sendCode,
  arrCode = program.arrCode,
  outPath = program.outPath || `../data`;

if (!(date || senCode || arrCode)) {
  console.log('need  -d -s -a');
  console.error(`[${new Date()}]: err arguments`);
  process.exit(9);
}


var now = moment().format('YYYY-MM-DD-HH-mm');
var file = `${path.dirname(process.argv[1])}/${outPath}/9C_${now}_${date}_${sendCode}_${arrCode}.json`;
fs.mkdir(`${path.dirname(process.argv[1])}/${outPath}`, error => {
  if (error) {
    console.error(error);
  }
  req9C(date, sendCode, arrCode, nineCfliter)
})


function setSearchParam(date, OriCity, DestCity) {
  let rawURL = `SType=0&IfRet=false&OriCity=${OriCity}&DestCity=${DestCity}&MType=0&FDate=${date}&ANum=1&CNum=0&INum=0&PostType=0`
  let searchParam = encodeURI(rawURL);
  return searchParam
}


function req9C(date, sendCode, arrCode, ck) {
  let searchParam = setSearchParam(date, sendCode, arrCode);
  request
    .post('http://flights.ch.com/default/SearchByTime')
    .send(searchParam)
    .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
    // .set('Accept', 'application/json')
    .end(function(err, res) {
      if (err || !res.ok) {
        console.log('Oh no! error');
      } else {
        console.log('9C req success!');
        // console.log(res.body);
        ck(res.body)
      }
    });
}


function nineCfliter(data) {
  let DepAirport,
    ArrAirport,
    CarrierNo,
    FType,
    DepDateTime,
    CabinFareList,
    Price,
    FlightMap = new Map();

  // if (data.ErrorInfo !== "成功") {
  //   console.log(data.ErrorInfo);
  // }

  let Packages = data.Packages;
  if (!Packages) {
    console.log("该航线不存在");
  }

  for (let thepackage of Packages) {
    DepAirport = thepackage[0].ArrivalStation;
    ArrAirport = thepackage[0].DepartureStation;
    CarrierNo = thepackage[0].No;
    FType = thepackage[0].Type;
    DepDateTime = thepackage[0].DepartureTimeBJ;
    if (thepackage[0].CabinInfos[2].Cabins.length === 0) {
      Price = 0
    } else {
      Price = thepackage[0].CabinInfos[2].Cabins[0].CabinPrice
    }
    let Flight = {
      CarrierNo: CarrierNo,
      FType: FType,
      DepAirport: DepAirport,
      ArrAirport: ArrAirport,
      DepDateTime: DepDateTime,
      Price: Price,
      // SaleOver: SaleOver
    };
    FlightMap.set(CarrierNo, Flight);
  }
  var obj = strMapToObj(FlightMap);
  jsonfile.writeFile(file, obj, {
    spaces: 2
  }, function(err) {
    if (err) {
      console.error(`[${new Date()}]: ${err}`);
    } else {
      console.log(`9C_${now}_${date}_${sendCode}_${arrCode} save ok`);
    }
  })
}

function strMapToObj(strMap) {
  let obj = Object.create(null);
  for (let [k, v] of strMap) {
    // We don’t escape the key '__proto__'
    // which can cause problems on older engines
    obj[k] = v;
  }
  return obj;
}
