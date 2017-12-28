// Visualization of a symmetric matrix using D3.js.
// Licensed under The MIT License.
// Author: Tomi Peltola, http://www.tmpl.fi.
//
// The use of nodejs to export svg modified from: https://gist.github.com/Fil/fe6c5681a6102ec483c7
var d3 = require("d3"),
    fs = require("fs"),
    vm = require('vm'),
    jsdom = require("jsdom"),
    hmatrix = require('./hmatrix_lib.js');
var document = jsdom.jsdom();

// load data (default to data.json)
var datafile = "data.json";
if (process.argv.length >= 3) datafile = process.argv[2];
var json = JSON.parse(fs.readFileSync(datafile, 'utf8'));

// load options
var opts = hmatrix.get_default_options();
if (process.argv.length >= 4) {
  var optsfile = process.argv[3];
  opts = JSON.parse(fs.readFileSync(optsfile, 'utf8'));
}

hmatrix.draw(document.body, json, opts);

// print to stdout
console.log(d3.select(document.body).html());
