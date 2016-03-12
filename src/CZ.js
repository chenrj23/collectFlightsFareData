const request = require('superagent');
const program = require('commander');

function setSearchParam(depcity="SHA", arrcity="PEK", flightdate="20160331") {
  let rawURL = `{"depcity":"${depcity}", "arrcity":"${arrcity}", "flightdate":"${flightdate}", "adultnum":"1", "childnum":"0", "infantnum":"0", "cabinorder":"0", "airline":"1", "flytype":"0", "international":"0", "action":"0", "segtype":"1", "cache":"0", "preUrl":"", "isMember":""}`;
  let searchParam = 'json=' + encodeURIComponent(rawURL);
  return searchParam
}

function reqCZ(depcity, arrcity, flightdate, ck) {
  let searchParam = setSearchParam(depcity, arrcity, flightdate);
  request
    .post('http://b2c.csair.com/B2C40/query/jaxb/direct/query.ao')
    .send(searchParam)
    .set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
    // .set('Accept', 'application/json')
    .end(function(err, res) {
      if (err || !res.ok) {
        console.log('Oh no! error');
      } else {
        console.log('MU req success!');
        // let resJson = JSON.parse(res.text);
        // console.log(resJson);
        console.log(res);
      }
    });
}

reqCZ()
