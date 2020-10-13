const loader = require('../index');
const fs = require('fs');
const path = require('path');

const cssStr = fs.readFileSync(
  path.resolve(__dirname, './example.css'),
  'utf-8'
);

const res = loader(cssStr);

console.log(res);
