"use strict";

var request = require('superagent');
var program = require('commander');

program.version('0.0.1').option('-d, --date [time]', 'seaching date like 2016-03-28').option('-s, --sendCode [code]', 'sendCode like SHA').option('-a, --arrCode [code]', 'arrCode like SYX').parse(process.argv);

function setSearchParam() {
  var date = arguments.length <= 0 || arguments[0] === undefined ? '2016-03-12' : arguments[0];
  var OriCity = arguments.length <= 1 || arguments[1] === undefined ? '上海' : arguments[1];
  var DestCity = arguments.length <= 2 || arguments[2] === undefined ? '三亚' : arguments[2];

  var rawURL = 'SType=0&IfRet=false&OriCity=' + OriCity + '&DestCity=' + DestCity + '&MType=0&FDate=' + date + '&ANum=1&CNum=0&INum=0&PostType=0';
  var searchParam = encodeURI(rawURL);
  return searchParam;
}

function req9C(date, sendCode, arrCode, ck) {
  var searchParam = setSearchParam(date, sendCode, arrCode);
  request.post('http://flights.ch.com/default/SearchByTime').send(searchParam).set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
  // .set('Accept', 'application/json')
  .end(function (err, res) {
    if (err || !res.ok) {
      console.log('Oh no! error');
    } else {
      if (err || !res.ok) {
        console.log('Oh no! error');
      } else {
        console.log('9C req success!');
        ck(res.body);
      }
    }
  });
}

function nineCfliter(data) {
  var DepAirport = void 0,
      ArrAirport = void 0,
      CarrierNo = void 0,
      FType = void 0,
      DepDateTime = void 0,
      CabinFareList = void 0,
      Price = void 0,
      SaleOver = false,
      FlighsArray = [];

  // if (data.ErrorInfo !== "成功") {
  //   console.log(data.ErrorInfo);
  // }

  var Packages = data.Packages;
  console.log(Packages);

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Packages[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var thepackage = _step.value;

      DepAirport = thepackage[0].ArrivalStation;
      ArrAirport = thepackage[0].DepartureStation;
      CarrierNo = thepackage[0].No;
      FType = thepackage[0].Type;
      DepDateTime = thepackage[0].DepartureTimeBJ;
      if (thepackage[0].CabinInfos[2].Cabins.length === 0) {
        Price = 0;
      } else {
        Price = thepackage[0].CabinInfos[2].Cabins[0].CabinPrice;
      }
      var Flight = {
        CarrierNo: CarrierNo,
        FType: FType,
        DepAirport: DepAirport,
        ArrAirport: ArrAirport,
        DepDateTime: DepDateTime,
        Price: Price
      };
      // SaleOver: SaleOver
      console.log(Flight);
      FlighsArray.push(Flight);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

req9C(program.date, program.senCode, program.arrCode, nineCfliter);