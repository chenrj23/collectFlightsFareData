const request = require('superagent');
const program = require('commander');
const jsonfile = require('jsonfile');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

program
  .version('0.0.1')
  .option('-d, --date <time>', 'seaching date like 2016-03-28')
  .option('-s, --sendCode <code>', 'sendCode like SHA')
  .option('-a, --arrCode <code>', 'arrCode like SYX')
  .option('-o, --outPath <path>', 'outpath like ../data/fool')
  .parse(process.argv);

var date = program.date,
  sendCode = program.sendCode,
  arrCode = program.arrCode,
  outPath = program.outPath || `../data`;

if (!(date || senCode || arrCode)) {
  console.log('need  -d -s -a');
  console.error(`[${new Date()}]: err arguments\n`);
  process.exit(9);
}

var now = moment().format('YYYY-MM-DD-HH-mm');
var file = `${path.dirname(process.argv[1])}/${outPath}/HO_${now}_${date}_${sendCode}_${arrCode}.json`
fs.mkdir(`${path.dirname(process.argv[1])}/${outPath}`, error => {
  if (error && error.code != 'EEXIST') {
    console.error(`[${Date()}]: ${error}`);
  }else {
    reqHO(date, sendCode, arrCode)
  }
})

function setSearchParam(date, sendCode, arrCode, flightType = 'OW', tripType = 'D', directType = 'D', returnDate = 'undefined') {
  let searchParam = `flightType=${flightType}&tripType=${tripType}&directType=${directType}&departureDate=${date}&sendCode=${sendCode}&arrCode=${arrCode}&returnDate=${returnDate}&_=1454901318488`;

  return searchParam

}

function reqHO(date, sendCode, arrCode) {
  let searchParam = setSearchParam(date, sendCode, arrCode);
  request
    .get('http://www.juneyaoair.com/UnitOrderWebAPI/Book/QueryFlightFareNew')
    .query(searchParam)
    .end(function(err, res) {
      if (err || !res.ok) {
        console.error(`[${Date()}]: ${err}\n`);
      } else {
        console.log('HO req success!');
        let resJson = JSON.parse(res.text);
        HOfliter(resJson)
      }
    });
}

function HOfliter(data) {
  let DepAirport,
    ArrAirport,
    CarrierNo,
    FType,
    DepDateTime,
    CabinFareList,
    Price,
    FlightMap = new Map();

  if (data.ErrorInfo !== "成功") {
    console.error(`[${Date()}]: ${data.ErrorInfo}`);
    jsonfile.writeFile(file, {
      'respond ErrorInfo': data.ErrorInfo
    }, {
      spaces: 2
    }, function(err) {
      if (err) {
        console.error(`[${Date()}]: ${err}`);
      } else {
        console.log("save ok");
      }
      process.exit(129); //  129"查询出错"
    })
  }

  let FlightInfoList = data.FlightInfoList;

  for (let flightInfo of FlightInfoList) {
    DepAirport = flightInfo.DepAirport;
    ArrAirport = flightInfo.ArrAirport;
    CarrierNo = flightInfo.CarrierNo;
    FType = flightInfo.FType;
    DepDateTime = flightInfo.DepDateTime;

    if (flightInfo.CabinFareList && flightInfo.CabinFareList.length === 0) {
      console.error(`[${Date()}]: ${CarrierNo}已售完`);
      SaleOver = true;
      Price = 0;
    } else {
      CabinFareList = flightInfo.CabinFareList;
      for (let cabinFare of CabinFareList) {
        if (cabinFare.PriceShowType === "EconomicMin") {
          Price = cabinFare.PriceValue
        }
      }
    }

    let Flight = {
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
      console.log(`HO_${now}_${date}_${sendCode}_${arrCode} save ok`);
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
