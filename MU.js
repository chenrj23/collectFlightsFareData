'use strict';

var request = require('superagent');
var program = require('commander');

program.version('0.0.1').option('-t, --deptDt [time]', 'seaching date like 2016-03-28').option('-d, --deptCd [code]', 'depart airportCode like PVG').option('-f, --deptCdTxt [code]', 'depart city text like 上海').option('-r, --deptCityCode [code]', 'depart city code like SHA').option('-a, --arrCd [code]', 'arrive airportCode like SYX').option('-c, --arrCdTxt [code]', 'arrive city text like 三亚').option('-x, --arrCityCode [code]', 'arrive city text like SYX').parse(process.argv);

function setSearchParam() {
  var deptCd = arguments.length <= 0 || arguments[0] === undefined ? "PVG" : arguments[0];
  var arrCd = arguments.length <= 1 || arguments[1] === undefined ? "SYX" : arguments[1];
  var deptDt = arguments.length <= 2 || arguments[2] === undefined ? "2016-03-26" : arguments[2];
  var deptCdTxt = arguments.length <= 3 || arguments[3] === undefined ? "上海" : arguments[3];
  var arrCdTxt = arguments.length <= 4 || arguments[4] === undefined ? "三亚" : arguments[4];
  var deptCityCode = arguments.length <= 5 || arguments[5] === undefined ? "SHA" : arguments[5];
  var arrCityCode = arguments.length <= 6 || arguments[6] === undefined ? "SYX" : arguments[6];

  var searchParam = '{"tripType":"OW","adtCount":1,"chdCount":0,"infCount":0,"currency":"CNY","sortType":"a","segmentList":[{"deptCd":"' + deptCd + '","arrCd":"' + arrCd + '","deptDt":"' + deptDt + '","deptCdTxt":"' + deptCdTxt + '","arrCdTxt":"' + arrCdTxt + '","deptCityCode":"' + deptCityCode + '","arrCityCode":"' + arrCityCode + '"}],"sortExec":"a","page":"0","inter":0}';
  return searchParam;
}

function reqMU(deptCd, arrCd, deptDt, deptCdTxt, arrCdTxt, deptCityCode, arrCityCode, ck) {
  var searchParam = setSearchParam(deptCd, arrCd, deptDt, deptCdTxt, arrCdTxt, deptCityCode, arrCityCode);
  request.post('http://www.ceair.com/otabooking/flight-search!doFlightSearch.shtml?rand=0.1625524084083736').send({
    searchCond: searchParam
  }).set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
  // .set('Accept', 'application/json')
  .end(function (err, res) {
    if (err || !res.ok) {
      console.log('Oh no! error');
    } else {
      console.log('MU req success!');
      var resJson = JSON.parse(res.text);
      // console.log(resJson);
      ck(resJson);
    }
  });
}

function MUfliter(data) {
  var DepAirport = void 0,
      ArrAirport = void 0,
      CarrierNo = void 0,
      FType = void 0,
      DepDateTime = void 0,
      Price = void 0,
      FlightMap = new Map();

  if (data.resultMsg) {
    console.log(data.ErrorInfo);
  }

  var productUnits = data.airResultDto.productUnits;

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = productUnits[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var productUnit = _step.value;

      if (productUnit.cabinInfo.baseCabinCode !== "economy") {
        continue;
      }
      CarrierNo = productUnit.flightNoGroup;
      DepAirport = productUnit.oriDestOption[0].flights[0].departureAirport.cityCode;
      ArrAirport = productUnit.oriDestOption[0].flights[0].arrivalAirport.cityCode;
      FType = productUnit.oriDestOption[0].flights[0].equipment.airEquipType;
      DepDateTime = productUnit.oriDestOption[0].flights[0].departureDateTime;
      Price = Number(productUnit.fareInfoView[0].fare.salePrice);

      if (FlightMap.has(CarrierNo)) {

        var flight = FlightMap.get(CarrierNo);
        if (flight.Price > Price) {
          var Flight = {
            FType: FType,
            DepAirport: DepAirport,
            ArrAirport: ArrAirport,
            DepDateTime: DepDateTime,
            Price: Price
          };
          FlightMap.set(CarrierNo, Flight);
        }
      } else {
        var _Flight = {
          FType: FType,
          DepAirport: DepAirport,
          ArrAirport: ArrAirport,
          DepDateTime: DepDateTime,
          Price: Price
        };
        FlightMap.set(CarrierNo, _Flight);
      }
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

  console.log(FlightMap);
}

reqMU(program.deptCd, program.arrCd, program.deptDt, program.deptCdTxt, program.arrCdTxt, program.deptCityCode, program.arrCityCode, MUfliter);