const request = require('superagent');
const program = require('commander');

program
  .version('0.0.1')
  .option('-t, --deptDt [time]', 'seaching date like 2016-03-28')
  .option('-d, --deptCd [code]', 'depart airportCode like PVG')
  .option('-f, --deptCdTxt [code]', 'depart city text like 上海')
  .option('-r, --deptCityCode [code]', 'depart city code like SHA')
  .option('-a, --arrCd [code]', 'arrive airportCode like SYX')
  .option('-c, --arrCdTxt [code]', 'arrive city text like 三亚')
  .option('-x, --arrCityCode [code]', 'arrive city text like SYX')
  .parse(process.argv);

function setSearchParam(deptCd = "PVG", arrCd = "SYX", deptDt = "2016-03-26", deptCdTxt = "上海", arrCdTxt = "三亚", deptCityCode = "SHA", arrCityCode = "SYX") {
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
        console.log('Oh no! error');
      } else {
        console.log('MU req success!');
        let resJson = JSON.parse(res.text);
        // console.log(resJson);
        console.log(resJson);
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
    console.log(data.ErrorInfo);
  }


  let productUnits = data.airResultDto.productUnits;

  for (let productUnit of productUnits) {
    if (productUnit.cabinInfo.baseCabinCode !== "economy") {
      continue
    }
    CarrierNo = productUnit.flightNoGroup;
    DepAirport = productUnit.oriDestOption[0].flights[0].departureAirport.cityCode;
    ArrAirport = productUnit.oriDestOption[0].flights[0].arrivalAirport.cityCode;
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
    }else {
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
  console.log(FlightMap);
}

reqMU(program.deptCd, program.arrCd, program.deptDt, program.deptCdTxt, program.arrCdTxt, program.deptCityCode, program.arrCityCode, MUfliter)
