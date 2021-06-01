// @ts-nocheck
import React from 'react';
import { dynamic } from 'dumi';

export default {
  'Foo-demo': {
    component: function DumiDemo() {
  var _interopRequireDefault = require("/Users/kev1nzh/Desktop/new/docs/vite-babysitter/node_modules/@umijs/babel-preset-umi/node_modules/@babel/runtime/helpers/interopRequireDefault");

  var _react = _interopRequireDefault(require("react"));

  var _viteBabysitter = require("vite-babysitter");

  var _default = function _default() {
    return /*#__PURE__*/_react["default"].createElement(_viteBabysitter.Foo, {
      title: "First Demo"
    });
  };

  return _react["default"].createElement(_default);
},
    previewerProps: {"sources":{"_":{"tsx":"import React from 'react';\nimport { Foo } from 'vite-babysitter';\n\nexport default () => <Foo title=\"First Demo\" />;"}},"dependencies":{"react":{"version":"16.14.0"},"vite-babysitter":{"version":"1.0.0"}},"componentName":"Foo","identifier":"Foo-demo"},
  },
};
