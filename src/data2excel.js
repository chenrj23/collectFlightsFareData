const jsonfile = require('jsonfile');
const fs = require('fs');
const Excel = require("exceljs");

//Create a Workbook
var workbook = new Excel.Workbook();
//Add a Worksheet
var sheet = workbook.addWorksheet("data");
//Access Worksheets
//fetch sheet by id
var worksheet = workbook.getWorksheet(1);


fs.readdir('../data', (err, files) => {
  let SearchTimeSet = new Set(SearchTime(files));
  let departmentTimeSet = new Set();
  let dataBySearchTime = new Map();
  let pending = files.length;

  SearchTimeSet.forEach(time => {
    dataBySearchTime.set(time, new Map())
  })

  files.forEach(fileName => {
    let filePath = `../data/${fileName}`;

    jsonfile.readFile(filePath, function(err, obj) {
      let searchTime = fileName.split('_')[1];
      let depDateTimeMap = dataBySearchTime.get(searchTime);

      if (!obj) {
        // console.error(`${new Date} : ${fileName}`);
      } else {
        for (let flight of Object.keys(obj)) {
          depDateTimeMap.set(obj[flight].DepDateTime, obj[flight].Price)
        }
      }

      dataBySearchTime.forEach((flightsMap, key, map) => {
        flightsMap.forEach((price, depDateTime) => {
          departmentTimeSet.add(depDateTime)
        })
      })
      if (!--pending) {
        let excelData = strMapToObj(dataBySearchTime);

        for (let flight of Object.keys(excelData)) {
          excelData[flight] = strMapToObj(excelData[flight])
        }

        let columnsHeaderArray = [...departmentTimeSet].map(time => {
          return {
            header: time,
            key: time,
            width: 20
          }
        })

        columnsHeaderArray.unshift({
          header: "searchTime",
          key: "searchTime",
          width: 70
        });
        worksheet.columns = columnsHeaderArray;

        for (let flight of Object.keys(excelData)) {
          excelData[flight].searchTime = flight;
          worksheet.addRow(excelData[flight]);
        }

        workbook.xlsx.writeFile('./flightData.xlsx')
            .then(function() {
                console.log('save done');
            });

        // console.log(excelData);
        // console.log(departmentTimeSet);
      };
    })
  })
})

function SearchTime(files) {
  return files.map(file => {
    return file.split('_')[1]
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

//
//
// read all json
// json => Map
// maps =>mapArray
// departmentTimeArray SearchArray
// [departmentTime, price, price...]
// {
//   SearchTime: {DepDateTime: Price}
// }
