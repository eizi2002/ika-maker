'use strict';

const fs   = require('fs');
const path = require('path');

const BASE_DIR  = process.cwd();
const PARTS_DIR = './img/ika/';
const SCHEME_SRC_DIR  = './src/script/models/_parts';
const SCHEME_DIST_DIR = './src/script/models/parts';

if (path.basename(BASE_DIR) !== 'ika-maker') {
  console.log('Execute from project root!');
  process.exit(1);
}

console.log(`Generate ${SCHEME_DIST_DIR}.js`);

/**
 * このオブジェクトを、存在する画像ファイルから補完する
 *
 */
const partsScheme = require(path.resolve(BASE_DIR, SCHEME_SRC_DIR));


Object.keys(partsScheme).forEach((parts) => {
  let partsList = fs.readdirSync(path.resolve(PARTS_DIR, parts));
  let selectType = partsScheme[parts].selectType;

  if (selectType === 'TYPE' || selectType === 'COLOR') {
    partsList
      .sort(_sortByFileNo)
      .forEach((file) => {
        partsScheme[parts].items.push(_getElementByFileName(file));
      });
  }

  if (selectType === 'TYPE_COLOR') {
    partsList.forEach((type) => {
      let colorsList = fs.readdirSync(path.resolve(PARTS_DIR, parts, type));
      let colorItems = colorsList
        .sort(_sortByFileNo)
        .map((file) => {
          return _getElementByFileName(file);
        });

      partsScheme[parts].items.push({
        id:    type|0,
        items: colorItems
      });
    });
  }
});

let data = `export default ${JSON.stringify(partsScheme, null, 2)};`;

fs.writeFileSync(`${path.resolve(BASE_DIR, SCHEME_DIST_DIR)}.js`, data);
console.log('Done!');

function _getElementByFileName(file) {
  return {
    id: file.split('.')[0]|0
  };
}

function _sortByFileNo(a, b) {
  return parseInt(a, 10) > parseInt(b, 10) ? 1 : -1;
}