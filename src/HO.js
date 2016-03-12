const request = require('superagent');
const program = require('commander');
const jsonfile = require('jsonfile');
const moment = require('moment');
const path = require('path');

console.log(path.dirname(process.argv[1]))

program
  .version('0.0.1')
  .option('-d, --date [time]', 'seaching date like 2016-03-28')
  .option('-s, --sendCode [code]', 'sendCode like SHA')
  .option('-a, --arrCode [code]', 'arrCode like SYX')
  .parse(process.argv);

var date = program.date,
    sendCode = program.sendCode,
    arrCode = program.arrCode;

if (!(date || senCode || arrCode)) {
  console.log('need  -d -s -a');
  process.exit(9);
}

var now = moment().format('YYYY-MM-DD-HH-mm');
var file = `${path.dirname(process.argv[1])}/data/HO_${now}_${date}_${sendCode}_${arrCode}.json`
reqHO(date, sendCode, arrCode)

function setSearchParam(date = '2016-03-28', sendCode = 'SHA', arrCode = 'SYX', flightType = 'OW', tripType = 'D', directType = 'D', returnDate = 'undefined') {
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
        console.log('Oh requset has error!');
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
    console.log(`respond ErrorInfo: ${data.ErrorInfo}`);
  }

  let FlightInfoList = data.FlightInfoList;

  for (let flightInfo of FlightInfoList) {
    DepAirport = flightInfo.DepAirport;
    ArrAirport = flightInfo.ArrAirport;
    CarrierNo = flightInfo.CarrierNo;
    FType = flightInfo.FType;
    DepDateTime = flightInfo.DepDateTime;

    if (flightInfo.CabinFareList.length === 0) {
      console.log(`${CarrierNo}已售完`);
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
  jsonfile.writeFile(file, obj, {spaces: 2}, function(err) {
    if (err) {
      console.error(err)
    }else {
      console.log("save ok");
    }
  })
}


function strMapToObj(strMap) {
    let obj = Object.create(null);
    for (let [k,v] of strMap) {
        // We don’t escape the key '__proto__'
        // which can cause problems on older engines
        obj[k] = v;
    }
    return obj;
}
