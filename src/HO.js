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


class myError extends Error {
  constructor(message) {
    super(message);
    this.time = Date();
    this.message = `[${this.time}]:   ${this.message}`;
  }
}



var date = program.date,
  sendCode = program.sendCode,
  arrCode = program.arrCode,
  outPath = program.outPath || `../data`;

if (!(date || sendCode || arrCode)) {
  console.log('need  -d -s -a');
  throw new myError("err arguments")
  // console.error(`[${new Date()}]: err arguments\n`);
}

var now = moment().format('YYYY-MM-DD-HH-mm');
var file = `${path.dirname(process.argv[1])}/${outPath}/HO_${now}_${date}_${sendCode}_${arrCode}.json`;

fs.mkdir(`${path.dirname(process.argv[1])}/${outPath}`, error => {
  if (error && error.code != 'EEXIST') {
    console.error(`[${Date()}]: file is haved`);
    console.error(`[${Date()}]: ${error}`);
  }else {
    reqHO(date, sendCode, arrCode)
  }
})

function setSearchParam(date, sendCode, arrCode, flightType = 'OW', tripType = 'D', directType = 'D', returnDate = 'undefined') {
  let searchParam = `flightType=${flightType}&tripType=${tripType}&directType=${directType}&departureDate=${date}&sendCode=${sendCode}&arrCode=${arrCode}&returnDate=${returnDate}&_=1454901318488`;

  return searchParam

}

function reqHO(date, sendCode, arrCode, reqCount = 0) {
  reqCount++;

  if (reqCount > 5) {
    console.error(`[${Date()}]: ${reqCount} requset out `);
    return
  }
  let searchParam = setSearchParam(date, sendCode, arrCode);
  request
    .get('http://www.juneyaoair.com/UnitOrderWebAPI/Book/QueryFlightFareNew')
    .query(searchParam)
    .end(function(err, res) {
      if (err || !res.ok) {
        console.log(`[${new Date()}]:Oh no!HO_${now}_${date}_${sendCode}_${arrCode}  requset error `);
        console.error(`[${Date()}]: req error`);
        console.error(`[${Date()}]: reqCount is ${reqCount}`);
        console.error(`[${Date()}]: ${err}`);

        reqHO(date, sendCode, arrCode, reqCount)

      } else {
        console.log('HO req success!');
        try {
          var resJson = JSON.parse(res.text);
        } catch (e) {
          console.error(`[${Date()}]:  Json res.text has err`);
          console.error(res.text);
          console.error(`[${Date()}]: ${e}`);
          throw res
          // process.exit (131)
        }
        // console.error(resJson);
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
    console.error(`[${Date()}]: data.ErrorInfo !== "成功"`);
    console.error(`[${Date()}]: ${data.ErrorInfo}`);
    console.log(`[${Date()}]: ${data.ErrorInfo}`);

    jsonfile.writeFile(file, {
      'respond ErrorInfo': data.ErrorInfo
    }, {
      spaces: 2
    }, function(err) {
      if (err) {
        console.error(`[${new Date()}]: jsonfile have err`);
        console.error(`[${Date()}]: ${err}`);
      } else {
        console.log("save ok");
      }
      process.exit(129); //  129"查询出错"
    })
  }else {
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
        console.error(`[${new Date()}]: jsonfile have err`);
        console.error(`[${new Date()}]: ${err}`);
      } else {
        console.log(`HO_${now}_${date}_${sendCode}_${arrCode} save ok`);
      }
    })
  }
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
