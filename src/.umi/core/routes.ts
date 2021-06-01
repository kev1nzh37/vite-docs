// @ts-nocheck
import React from 'react';
import { ApplyPluginsType } from '/Users/kev1nzh/Desktop/new/docs/vite-babysitter/node_modules/@umijs/runtime';
import * as umiExports from './umiExports';
import { plugin } from './plugin';

export function getRoutes() {
  const routes = [
  {
    "path": "/~demos/:uuid",
    "layout": false,
    "wrappers": [require('/Users/kev1nzh/Desktop/new/docs/vite-babysitter/node_modules/@umijs/preset-dumi/lib/theme/layout').default],
    "component": (props) => {
        const { default: getDemoRenderArgs } = require('/Users/kev1nzh/Desktop/new/docs/vite-babysitter/node_modules/@umijs/preset-dumi/lib/plugins/features/demo/getDemoRenderArgs');
        const { default: Previewer } = require('dumi-theme-default/src/builtins/Previewer.tsx');
        const { default: demos } = require('@@/dumi/demos');
        const { usePrefersColor } = require('dumi/theme');

        
      const renderArgs = getDemoRenderArgs(props, demos);

      // for listen prefers-color-schema media change in demo single route
      usePrefersColor();

      switch (renderArgs.length) {
        case 1:
          // render demo directly
          return renderArgs[0];

        case 2:
          // render demo with previewer
          return React.createElement(
            Previewer,
            renderArgs[0],
            renderArgs[1],
          );

        default:
          return `Demo ${props.match.params.uuid} not found :(`;
      }
    
        }
  },
  {
    "path": "/_demos/:uuid",
    "redirect": "/~demos/:uuid"
  },
  {
    "__dumiRoot": true,
    "layout": false,
    "path": "/",
    "wrappers": [require('/Users/kev1nzh/Desktop/new/docs/vite-babysitter/node_modules/@umijs/preset-dumi/lib/theme/layout').default, require('/Users/kev1nzh/Desktop/new/docs/vite-babysitter/node_modules/dumi-theme-default/src/layout.tsx').default],
    "routes": [
      {
        "path": "/components/foo",
        "component": require('/Users/kev1nzh/Desktop/new/docs/vite-babysitter/src/Foo/index.md').default,
        "exact": true,
        "meta": {
          "filePath": "src/Foo/index.md",
          "updatedTime": 1621665173877,
          "componentName": "Foo",
          "nav": {
            "title": "Components",
            "path": "/components"
          },
          "slugs": [
            {
              "depth": 2,
              "value": "Foo",
              "heading": "foo"
            }
          ],
          "title": "Foo",
          "group": {
            "path": "/components/foo",
            "title": "Foo"
          }
        },
        "title": "Foo"
      },
      {
        "path": "/",
        "component": require('/Users/kev1nzh/Desktop/new/docs/vite-babysitter/docs/index.md').default,
        "exact": true,
        "meta": {
          "filePath": "docs/index.md",
          "updatedTime": 1621669382687,
          "title": "vite-babysitter",
          "hero": {
            "title": "vite-babysitter",
            "desc": "<div class=\"markdown\"><p>保姆式学习Vite源码</p></div>",
            "actions": [
              {
                "text": "Getting Started",
                "link": "/docs"
              }
            ]
          },
          "features": [
            {
              "icon": "images/home-build.gif",
              "title": "NPM 依赖解析和预构建",
              "desc": "<div class=\"markdown\"><p>全面提升页面重载速度和强缓存依赖。</p></div>"
            },
            {
              "icon": "images/home-hmr.gif",
              "title": "动态模块热重载（HMR）",
              "desc": "<div class=\"markdown\"><p>Vite 提供了一套原生 ESM 的 HMR API。 具有 HMR 功能的框架可以利用该 API 提供即时、准确的更新，而无需重新加载页面或删除应用程序状态。</p></div>"
            },
            {
              "icon": "images/home-plugin.gif",
              "title": "Plugins 插件",
              "desc": "<div class=\"markdown\"><p>可以利用 Rollup 插件的强大生态系统，同时根据需要也能够扩展开发服务器和 SSR 功能。</p></div>"
            }
          ],
          "footer": "<div class=\"markdown\"><p>Open-source MIT Licensed | Copyright © 2020<br />Powered by <a href=\"https://d.umijs.org/\" target=\"_blank\">dumi<svg xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"\" x=\"0px\" y=\"0px\" viewBox=\"0 0 100 100\" width=\"15\" height=\"15\" class=\"__dumi-default-external-link-icon\"><path fill=\"currentColor\" d=\"M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z\"></path><polygon fill=\"currentColor\" points=\"45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9\"></polygon></svg></a></p></div>",
          "slugs": []
        },
        "title": "vite-babysitter"
      },
      {
        "path": "/docs",
        "component": require('/Users/kev1nzh/Desktop/new/docs/vite-babysitter/docs/docs/index.md').default,
        "exact": true,
        "meta": {
          "filePath": "docs/docs/index.md",
          "updatedTime": 1622537531313,
          "title": "介绍",
          "order": 1,
          "slugs": [
            {
              "depth": 1,
              "value": "介绍",
              "heading": "介绍"
            },
            {
              "depth": 1,
              "value": "能学到什么？",
              "heading": "能学到什么？"
            },
            {
              "depth": 1,
              "value": "章节简介",
              "heading": "章节简介"
            },
            {
              "depth": 2,
              "value": "NPM 依赖解析和预构建",
              "heading": "npm-依赖解析和预构建"
            },
            {
              "depth": 2,
              "value": "动态模块热重载（HMR）",
              "heading": "动态模块热重载（hmr）"
            },
            {
              "depth": 2,
              "value": "Plugins 插件",
              "heading": "plugins-插件"
            }
          ],
          "nav": {
            "path": "/docs",
            "title": "Docs"
          }
        },
        "title": "介绍"
      },
      {
        "path": "/docs/hot/start",
        "component": require('/Users/kev1nzh/Desktop/new/docs/vite-babysitter/docs/docs/hot/start.md').default,
        "exact": true,
        "meta": {
          "filePath": "docs/docs/hot/start.md",
          "updatedTime": 1622537264050,
          "title": "施工中",
          "order": 2,
          "group": {
            "title": "动态模块热重载（HMR）",
            "order": 4,
            "path": "/docs/hot"
          },
          "slugs": [],
          "nav": {
            "path": "/docs",
            "title": "Docs"
          }
        },
        "title": "施工中"
      },
      {
        "path": "/docs/plugin/start",
        "component": require('/Users/kev1nzh/Desktop/new/docs/vite-babysitter/docs/docs/plugin/start.md').default,
        "exact": true,
        "meta": {
          "filePath": "docs/docs/plugin/start.md",
          "updatedTime": 1622537259414,
          "title": "施工中",
          "order": 1,
          "group": {
            "title": "Plugins 插件",
            "order": 3,
            "path": "/docs/plugin"
          },
          "slugs": [],
          "nav": {
            "path": "/docs",
            "title": "Docs"
          }
        },
        "title": "施工中"
      },
      {
        "path": "/docs/rebuild/build",
        "component": require('/Users/kev1nzh/Desktop/new/docs/vite-babysitter/docs/docs/rebuild/build.md').default,
        "exact": true,
        "meta": {
          "filePath": "docs/docs/rebuild/build.md",
          "updatedTime": 1622535650087,
          "title": "4.构建和插件",
          "order": 4,
          "group": {
            "title": "NPM 依赖解析和预构建",
            "path": "/docs/rebuild"
          },
          "slugs": [
            {
              "depth": 2,
              "value": "4.构建和插件",
              "heading": "4构建和插件"
            },
            {
              "depth": 3,
              "value": "构建(build)",
              "heading": "构建build"
            },
            {
              "depth": 3,
              "value": "esbuild 插件",
              "heading": "esbuild-插件"
            },
            {
              "depth": 3,
              "value": "esbuildDepPlugin",
              "heading": "esbuilddepplugin"
            },
            {
              "depth": 4,
              "value": "(1) 创建了两个解析器，分别对应 esm 和 commonjs。",
              "heading": "1-创建了两个解析器，分别对应-esm-和-commonjs。"
            },
            {
              "depth": 4,
              "value": "(2) 创建 resolve 函数，主要用来解决判断是什么类型的模块，并且返回相应的解析器结果。",
              "heading": "2-创建-resolve-函数，主要用来解决判断是什么类型的模块，并且返回相应的解析器结果。"
            },
            {
              "depth": 4,
              "value": "(3) 创建resolveEntry函数，根据传入类型返回命名空间。",
              "heading": "3-创建resolveentry函数，根据传入类型返回命名空间。"
            },
            {
              "depth": 4,
              "value": "(4) Vite 的onResolve",
              "heading": "4-vite-的onresolve"
            },
            {
              "depth": 4,
              "value": "(5) Vite 的onLoad",
              "heading": "5-vite-的onload"
            },
            {
              "depth": 3,
              "value": "总结",
              "heading": "总结"
            },
            {
              "depth": 3,
              "value": "最后",
              "heading": "最后"
            },
            {
              "depth": 4,
              "value": "1. Vue 项目组件中引入axios",
              "heading": "1-vue-项目组件中引入axios"
            },
            {
              "depth": 4,
              "value": "2. .vite 文件中的axios.js文件，已经编译成上一节中contents的路径了。",
              "heading": "2-vite-文件中的axiosjs文件，已经编译成上一节中contents的路径了。"
            },
            {
              "depth": 3,
              "value": "最后的最后",
              "heading": "最后的最后"
            },
            {
              "depth": 3,
              "value": "看完本章节有收获的朋友，可以去 github 点个赞，后续还有相应的源码解析或分享，谢谢。",
              "heading": "看完本章节有收获的朋友，可以去-github-点个赞，后续还有相应的源码解析或分享，谢谢。"
            }
          ],
          "nav": {
            "path": "/docs",
            "title": "Docs"
          }
        },
        "title": "4.构建和插件"
      },
      {
        "path": "/docs/rebuild/entry",
        "component": require('/Users/kev1nzh/Desktop/new/docs/vite-babysitter/docs/docs/rebuild/entry.md').default,
        "exact": true,
        "meta": {
          "filePath": "docs/docs/rebuild/entry.md",
          "updatedTime": 1622259810147,
          "title": "2.代码入口",
          "order": 2,
          "group": {
            "title": "NPM 依赖解析和预构建",
            "path": "/docs/rebuild"
          },
          "slugs": [
            {
              "depth": 4,
              "value": "Server.listen",
              "heading": "serverlisten"
            }
          ],
          "nav": {
            "path": "/docs",
            "title": "Docs"
          }
        },
        "title": "2.代码入口"
      },
      {
        "path": "/docs/rebuild/optimizer",
        "component": require('/Users/kev1nzh/Desktop/new/docs/vite-babysitter/docs/docs/rebuild/optimizer.md').default,
        "exact": true,
        "meta": {
          "filePath": "docs/docs/rebuild/optimizer.md",
          "updatedTime": 1622519721114,
          "title": "3.预构建对象和前期准备",
          "order": 3,
          "group": {
            "title": "NPM 依赖解析和预构建",
            "path": "/docs/rebuild"
          },
          "slugs": [
            {
              "depth": 2,
              "value": "预构建对象和前期准备",
              "heading": "预构建对象和前期准备"
            },
            {
              "depth": 3,
              "value": "如何获取hash值？",
              "heading": "如何获取hash值？"
            },
            {
              "depth": 3,
              "value": "是否强制优化并处理.vite 文件夹",
              "heading": "是否强制优化并处理vite-文件夹"
            },
            {
              "depth": 3,
              "value": "获取需要编译依赖关系的模块路径",
              "heading": "获取需要编译依赖关系的模块路径"
            },
            {
              "depth": 3,
              "value": "没有找到来源的模块处理(missing)",
              "heading": "没有找到来源的模块处理missing"
            },
            {
              "depth": 3,
              "value": "获取并导入 自定义的强制预构建(include)",
              "heading": "获取并导入-自定义的强制预构建include"
            },
            {
              "depth": 3,
              "value": "命令行打印需要构建模块的信息",
              "heading": "命令行打印需要构建模块的信息"
            },
            {
              "depth": 3,
              "value": "创建预构建对象",
              "heading": "创建预构建对象"
            },
            {
              "depth": 3,
              "value": "总结",
              "heading": "总结"
            }
          ],
          "nav": {
            "path": "/docs",
            "title": "Docs"
          }
        },
        "title": "3.预构建对象和前期准备"
      },
      {
        "path": "/docs/rebuild/start",
        "component": require('/Users/kev1nzh/Desktop/new/docs/vite-babysitter/docs/docs/rebuild/start.md').default,
        "exact": true,
        "meta": {
          "filePath": "docs/docs/rebuild/start.md",
          "updatedTime": 1622537253253,
          "title": "1.介绍",
          "order": 1,
          "group": {
            "title": "NPM 依赖解析和预构建",
            "order": 2,
            "path": "/docs/rebuild"
          },
          "slugs": [
            {
              "depth": 1,
              "value": "NPM 依赖解析和预构建",
              "heading": "npm-依赖解析和预构建"
            },
            {
              "depth": 2,
              "value": "介绍",
              "heading": "介绍"
            },
            {
              "depth": 3,
              "value": "Vite的实现",
              "heading": "vite的实现"
            }
          ],
          "nav": {
            "path": "/docs",
            "title": "Docs"
          }
        },
        "title": "1.介绍"
      },
      {
        "path": "/components",
        "meta": {},
        "exact": true,
        "redirect": "/components/foo"
      },
      {
        "path": "/docs/hot",
        "meta": {
          "order": 4
        },
        "exact": true,
        "redirect": "/docs/hot/start"
      },
      {
        "path": "/docs/plugin",
        "meta": {
          "order": 3
        },
        "exact": true,
        "redirect": "/docs/plugin/start"
      },
      {
        "path": "/docs/rebuild",
        "meta": {},
        "exact": true,
        "redirect": "/docs/rebuild/start"
      }
    ],
    "title": "vite-babysitter",
    "component": (props) => props.children
  }
];

  // allow user to extend routes
  plugin.applyPlugins({
    key: 'patchRoutes',
    type: ApplyPluginsType.event,
    args: { routes },
  });

  return routes;
}
