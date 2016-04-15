const request = require('superagent');
const program = require('commander');
const jsonfile = require('jsonfile');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
program
  .version('0.0.1')
  .option('-t, --deptDt <time>', 'seaching date like 2016-03-28')
  .option('-d, --deptCd <code>', 'depart airportCode like PVG')
  .option('-f, --deptCdTxt <code>', 'depart city text like 上海')
  .option('-r, --deptCityCode <code>', 'depart city code like SHA')
  .option('-a, --arrCd <code>', 'arrive airportCode like SYX')
  .option('-c, --arrCdTxt <code>', 'arrive city text like 三亚')
  .option('-x, --arrCityCode <code>', 'arrive city text like SYX')
  .option('-o, --outPath <path>', 'outpath like ../data/fool')
  .parse(process.argv);

var deptCd = program.deptCd,
  arrCd = program.arrCd,
  deptDt = program.deptDt,
  deptCdTxt = program.deptCdTxt,
  arrCdTxt = program.arrCdTxt,
  deptCityCode = program.deptCityCode,
  arrCityCode = program.arrCityCode,
  outPath = program.outPath || `../data`;

if (!(deptCd || arrCd || deptDt || deptCdTxt || arrCdTxt || deptCityCode || arrCityCode)) {
  console.log('please use -h ');
  console.error(`[${new Date()}]: err arguments`);
  process.exit(9);
}

var now = moment().format('YYYY-MM-DD-HH-mm');
var file = `${__dirname}/${outPath}/MU_${now}_${deptDt}_${deptCd}_${arrCd}.json`

fs.mkdir(`${path.dirname(process.argv[1])}/${outPath}`, error => {
  if (error && error.code != 'EEXIST') {
    console.error(`[${Date()}]: ${error}`);
  }else {
    reqMU(deptCd, arrCd, deptDt, deptCdTxt, arrCdTxt, deptCityCode, arrCityCode, MUfliter)
  }
})

function setSearchParam(deptCd, arrCd, deptDt, deptCdTxt, arrCdTxt, deptCityCode, arrCityCode) {
  let searchParam = `{"tripType":"OW","adtCount":1,"chdCount":0,"infCount":0,"currency":"CNY","sortType":"a","segmentList":[{"deptCd":"${deptCd}","arrCd":"${arrCd}","deptDt":"${deptDt}","deptCdTxt":"${deptCdTxt}","arrCdTxt":"${arrCdTxt}","deptCityCode":"${deptCityCode}","arrCityCode":"${arrCityCode}"}],"sortExec":"a","page":"0","inter":0}`;
  return searchParam
}

function reqMU(deptCd, arrCd, deptDt, deptCdTxt, arrCdTxt, deptCityCode, arrCityCode, ck) {
  let searchParam = setSearchParam(deptCd, arrCd, deptDt, deptCdTxt, arrCdTxt, deptCityCode, arrCityCode);
  request
    .post('http://www.ceair.com/otabooking/flight-search!doFlightSearch.shtml?rand=0.1625524084083736')
    .send({
      searchCond: searchParam
    })
    .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
    // .set('Accept', 'application/json')
    .end(function(err, res) {
      if (err || !res.ok) {
        console.log(`[${new Date()}]: Oh no! MU_${now}_${deptDt}_${deptCd}_${arrCd} requset error `);
        console.error(`[${new Date()}]: Oh no! MU_${now}_${deptDt}_${deptCd}_${arrCd} requset error `);
        console.error(`[${Date()}]: ${err}`);
      } else {
        console.log('MU req success!');
        let resJson = JSON.parse(res.text);
        // console.log(resJson);
        ck(resJson)
      }
    });
}

function MUfliter(data) {
  let DepAirport,
    ArrAirport,
    CarrierNo,
    FType,
    DepDateTime,
    Price,
    FlightMap = new Map();

  if (data.resultMsg) {
    console.error(`[${Date()}]: ${data.resultMsg}`);
    process.exit(130);
  }

  let productUnits = data.airResultDto.productUnits;

  for (let productUnit of productUnits) {
    if (productUnit.cabinInfo.baseCabinCode !== "economy") {
      continue
    }
    CarrierNo = productUnit.flightNoGroup;
    DepAirport = productUnit.oriDestOption[0].flights[0].departureAirport.code;
    ArrAirport = productUnit.oriDestOption[0].flights[0].arrivalAirport.code;
    FType = productUnit.oriDestOption[0].flights[0].equipment.airEquipType;
    DepDateTime = productUnit.oriDestOption[0].flights[0].departureDateTime;
    Price = Number(productUnit.fareInfoView[0].fare.salePrice);

    if (FlightMap.has(CarrierNo)) {

      let flight = FlightMap.get(CarrierNo)
      if (flight.Price > Price) {
        let Flight = {
          FType: FType,
          DepAirport: DepAirport,
          ArrAirport: ArrAirport,
          DepDateTime: DepDateTime,
          Price: Price,
        };
        FlightMap.set(CarrierNo, Flight);
      }
    } else {
      let Flight = {
        FType: FType,
        DepAirport: DepAirport,
        ArrAirport: ArrAirport,
        DepDateTime: DepDateTime,
        Price: Price,
      };
      FlightMap.set(CarrierNo, Flight);
    }
  }
  var obj = strMapToObj(FlightMap);
  jsonfile.writeFile(file, obj, {
    spaces: 2
  }, function(err) {
    if (err) {
      console.error(`[${new Date()}]: ${err}`);
    } else {
      console.log(`MU_${now}_${deptDt}_${deptCd}_${arrCd} save ok`);
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
