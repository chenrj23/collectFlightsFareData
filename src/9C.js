"use strict"
const request = require('superagent');
const program = require('commander');

program
  .version('0.0.1')
  .option('-d, --date [time]', 'seaching date like 2016-03-28')
  .option('-s, --sendCode [code]', 'sendCode like SHA')
  .option('-a, --arrCode [code]', 'arrCode like SYX')
  .parse(process.argv);

function setSearchParam(date = '2016-03-12', OriCity = '上海', DestCity = '三亚') {
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
        if (err || !res.ok) {
          console.log('Oh no! error');
        } else {
          console.log('9C req success!');
          console.log(res.body);
          ck(res.body)
        }
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
    SaleOver = false,
    FlighsArray = [];

  // if (data.ErrorInfo !== "成功") {
  //   console.log(data.ErrorInfo);
  // }

  let Packages = data.Packages;
  if (Packages) {
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
    console.log(Flight);
    FlighsArray.push(Flight)
  }
}

req9C(program.date, program.senCode, program.arrCode, nineCfliter)
