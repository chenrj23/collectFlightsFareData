'use strict';

var request = require('superagent');
var program = require('commander');

program.version('0.0.1').option('-d, --date [time]', 'seaching date like 2016-03-28').option('-s, --sendCode [code]', 'sendCode like SHA').option('-a, --arrCode [code]', 'arrCode like SYX').parse(process.argv);

function setSearchParam() {
  var date = arguments.length <= 0 || arguments[0] === undefined ? '2016-03-28' : arguments[0];
  var sendCode = arguments.length <= 1 || arguments[1] === undefined ? 'SHA' : arguments[1];
  var arrCode = arguments.length <= 2 || arguments[2] === undefined ? 'SYX' : arguments[2];
  var flightType = arguments.length <= 3 || arguments[3] === undefined ? 'OW' : arguments[3];
  var tripType = arguments.length <= 4 || arguments[4] === undefined ? 'D' : arguments[4];
  var directType = arguments.length <= 5 || arguments[5] === undefined ? 'D' : arguments[5];
  var returnDate = arguments.length <= 6 || arguments[6] === undefined ? 'undefined' : arguments[6];

  var searchParam = 'flightType=' + flightType + '&tripType=' + tripType + '&directType=' + directType + '&departureDate=' + date + '&sendCode=' + sendCode + '&arrCode=' + arrCode + '&returnDate=' + returnDate + '&_=1454901318488';

  return searchParam;
}

function reqHO(date, sendCode, arrCode) {
  var searchParam = setSearchParam(date, sendCode, arrCode);
  request.get('http://www.juneyaoair.com/UnitOrderWebAPI/Book/QueryFlightFareNew').query(searchParam).end(function (err, res) {
    if (err || !res.ok) {
      console.log('Oh requset has error!');
    } else {
      console.log('HO req success!');
      var resJson = JSON.parse(res.text);
      HOfliter(resJson);
    }
  });
}

function HOfliter(data) {
  var DepAirport = void 0,
      ArrAirport = void 0,
      CarrierNo = void 0,
      FType = void 0,
      DepDateTime = void 0,
      CabinFareList = void 0,
      Price = void 0,
      SaleOver = false,
      FlighsArray = [];

  if (data.ErrorInfo !== "成功") {
    console.log(data.ErrorInfo);
  }

  var FlightInfoList = data.FlightInfoList;

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = FlightInfoList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var flightInfo = _step.value;

      DepAirport = flightInfo.DepAirport;
      ArrAirport = flightInfo.ArrAirport;
      CarrierNo = flightInfo.CarrierNo;
      FType = flightInfo.FType;
      DepDateTime = flightInfo.DepDateTime;

      if (flightInfo.CabinFareList.length === 0) {
        console.log(CarrierNo + '已售完');
        SaleOver = true;
        Price = 0;
      } else {
        CabinFareList = flightInfo.CabinFareList;
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = CabinFareList[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var cabinFare = _step2.value;

            if (cabinFare.PriceShowType === "EconomicMin") {
              Price = cabinFare.PriceValue;
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
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

reqHO(program.date, program.senCode, program.arrCode);