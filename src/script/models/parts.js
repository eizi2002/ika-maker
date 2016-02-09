'use strict';
import objectAssign from 'object-assign';
import {Promise} from 'es6-promise';
import PartsScheme from '../data/parts';
import {
  DEFAULT_PARTS_SETTINGS,
  IMG_SIZE,
  TEXT_STYLES
} from '../data/const';

/**
 * Modelとかいう名前になってるがココにはstateは無い。
 * あるのは定数的なオブジェクトや、アプリ自体の不変な設定だけ。
 *
 * stateをもらって何か返すとかはあるが、ただの関数。
 *
 */
class PartsModel {
  constructor() {
    this.cache   = {};
    this.scheme  = {};
    this.appType = null;
  }

  init(type) {
    this.appType = type;
    this.scheme = objectAssign({}, PartsScheme[type]);
    return this;
  }

  getAppType() {
    return this.appType;
  }

  getDefaultSettings() {
    return objectAssign({}, DEFAULT_PARTS_SETTINGS[this.appType]);
  }

  getParts(partsName) {
    return objectAssign({}, this.scheme[partsName]);
  }

  _getImgRef(partsName, type, color) {
    let parts = this.scheme[partsName];
    let path = '';
    let types = [], colors = [];

    if (type && color) {
      types = parts.items.filter((item) => {
        return item.id === type;
      })[0].items;
      colors = types.filter((item) => {
        return item.id === color;
      });

      // その色は、他のタイプには存在しない場合がある
      // その時は、先頭のものに戻す
      if (colors.length !== 0) {
        path = colors[0].path;
      } else {
        path = types[0].path;
      }
    }
    else {
      path = parts.items.filter((item) => {
        return item.id === type;
      })[0].path;
    }

    if (partsName === 'hat' && type === 0) {
      return null;
    }

    return this.cache[path];
  }

  getFixImgSrcBySettings(settings) {
    let imgRefArr = [
      this._getImgRef('bg', settings.bgType, settings.bgColor),

      this._getImgRef('body', settings.bodyColor),

      this._getImgRef('mouth', settings.mouthType),
      this._getImgRef('brows', settings.browsType, settings.browsColor),
      this._getImgRef('eyes', settings.eyesType, settings.eyesColor),

      this._getImgRef('clothes', settings.clothesType),

      this._getImgRef('hair', settings.hairType, settings.hairColor),

      this._getImgRef('hat', settings.hatType),
    ];

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.width = canvas.height = IMG_SIZE;

    imgRefArr.forEach((img) => {
      // new Imageして呼ぶと、たまに間に合わないやつが出る
      // なのでキャッシュから確実に取る
      img && ctx.drawImage(img, 0, 0, IMG_SIZE, IMG_SIZE);
    });

    // 文字は別途書き込む
    let text = settings.text;
    if (text.trim().length > 0) {
      ctx.font = TEXT_STYLES.font;
      ctx.textAlign = TEXT_STYLES.textAlign;

      // 白いフクに白い文字だと見えないので、
      ctx.fillStyle = TEXT_STYLES.COLORS[0];
      ctx.fillText(
        text,
        IMG_SIZE - TEXT_STYLES.GAP + 2,  // x
        IMG_SIZE - TEXT_STYLES.GAP + 2,  // y
        IMG_SIZE - TEXT_STYLES.GAP*2     // maxWidth
      );
      // 2重に書いて影をつける
      ctx.fillStyle = TEXT_STYLES.COLORS[1];
      ctx.fillText(
        text,
        IMG_SIZE - TEXT_STYLES.GAP,  // x
        IMG_SIZE - TEXT_STYLES.GAP,  // y
        IMG_SIZE - TEXT_STYLES.GAP*2 // maxWidth
      );
    }

    let src = canvas.toDataURL();
    canvas = null;
    return src;
  }

  getTabItems() {
    let tabItems = Object.keys(this.scheme).map((partsName) => {
      let parts = this.scheme[partsName];
      return {
        id:    partsName,
        order: parts.tabOrder,
        group: parts.tabGroup,
        name:  parts.tabName
      };
    }).sort((a, b) => {
      return a.order > b.order ? 1 : -1;
    });

    // これは画像がないので個別にいれる
    tabItems.push({
      id:    'text',
      order: 99,
      group: 'OTHERS',
      name:  'テキスト'
    });

    return tabItems;
  }

  getAllImgPath() {
    let imgPathArr = [];
    Object.keys(this.scheme).forEach((parts) => {
      this.scheme[parts].items.forEach((item) => {
        if ('path' in item) {
          imgPathArr.push(item.path);
        } else {
          item.items.forEach((item) => {
            imgPathArr.push(item.path);
          });
        }
      });
    });

    return imgPathArr;
  }

  fetchAll() {
    let cache = this.cache;
    return Promise.all(this.getAllImgPath().map((path) => {
      cache[path] = null;
      return new Promise((resolve) => {
        let img = new Image();
        img.src = path;
        img.onload = () => {
          cache[path] = img;
          resolve();
        };
        img.onabort = () => {
          resolve();
        };
        img.onerror = () => {
          throw new Error('Cant get image properly..');
        };
      });
    }));
  }
};

export default (new PartsModel());
