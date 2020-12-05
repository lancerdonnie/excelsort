const express = require('express');
const app = express();
XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');

app.use(express.json());
app.use(express.static('output'));
app.use(
  fileUpload({
    // createParentPath: true
    useTempFiles: true,
    tempFileDir: '/Input',
  })
);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const getSortedJson = (column) => {
  var workbook = XLSX.readFile(path.join(__dirname, 'Input', 'Uploaded.xlsx'));
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const json = XLSX.utils.sheet_to_json(worksheet);
  const sortedJson = json.sort((a, b) => {
    if (a[column].toLowerCase() < b[column].toLowerCase()) return -1;
    if (a[column].toLowerCase() > b[column].toLowerCase()) return 1;
    return 0;
  });
  return sortedJson;
};

app.post('/upload', (req, res) => {
  if (!req.files) {
    res.send({
      status: false,
      message: 'No file uploaded',
    });
  }
  fs.rmdir(__dirname + 'Input', { recursive: true }, (err, data) => {
    console.log(err);
  });
  let file = req.files.file;
  file.mv('./Input/' + 'Uploaded.xlsx');
  res.send();
});

app.get('/solve', (req, res) => {
  var x = req.query.column;
  if (!x) return res.send();
  console.log(x);
  let sortedJson = getSortedJson(x);
  res.send([...new Set(sortedJson.map((e) => e[x]))]);
});

app.post('/solve', async (req, res) => {
  var x = req.query.column;
  var groups = req.body;
  let sortedJson = getSortedJson(x);

  Object.keys(groups).forEach((e) => {
    sortedJson.forEach((f) => {
      if (groups[e].includes(f[x])) {
        f[x] = e;
      }
    });
  });

  const ws = XLSX.utils.json_to_sheet(sortedJson);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sorted');
  // var fileName = path.join(__dirname + 'Output' + 'Sorted.xlsx');
  XLSX.writeFile(wb, 'Output/Sorted.xlsx');
  console.log('file is written');
  res.end();
});

app.listen('5000', () => console.log('server running'));
