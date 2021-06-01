---
title: 4.构建和插件
order: 4
group:
  title: NPM 依赖解析和预构建
---

## 4.构建和插件

此章节准备介绍构建和 vite 的自定义插件。

### 构建(build)

需要注意的几个参数：

1. `format`设为`esm`，是 Vite 的目的之一，将所有的代码视为原生 ES 模块。

   > CommonJS 和 UMD 兼容性: 开发阶段中，Vite 的开发服务器将所有代码视为原生 ES 模块。因此，Vite 必须先将作为 CommonJS 或 UMD 发布的依赖项转换为 ESM。

2. `splitting`设为`true`，仅适用于 esm 输出下，拆分多个文件引入的模块至单独文件，浏览页面 a 时，加载了 axios，再进入页面 b 时，直接调用已经加载后的 axios，省去了再次请求 axios 的操作。

   > Code shared between multiple entry points is split off into a separate shared file that both entry points import. That way if the user first browses to one page and then to another page, they don't have to download all of the JavaScript for the second page from scratch if the shared part has already been downloaded and cached by their browser.

   > Code referenced through an asynchronous import() expression will be split off into a separate file and only loaded when that expression is evaluated. This allows you to improve the initial download time of your app by only downloading the code you need at startup, and then lazily downloading additional code if needed later.

3. `plugins`含有 Vite 插件`esbuildDepPlugin`: 下面会详细解释此插件。

4. `treeShaking`设为`ignore-annotations`, 文档中提到的忽略无用的代码，以便减轻模块的体积。

```typescript
// /optimizer/index.ts

// 最核心的地方，使用esBuild打包了
const result = await build({
  entryPoints: Object.keys(flatIdDeps),
  bundle: true, //任何导入的依赖一起打包
  format: 'esm', // 符合vite 转换成esm
  external: config.optimizeDeps?.exclude, //不需要处理的模块
  logLevel: 'error', //日志级别，只显示错误
  //拆分代码，简单来说就是拆分入口内的共享import文件，在访问a页面时加载了axios，
  //进入了b页面直接使用a页面加载的axios省去了再次请求的过程。
  splitting: true,
  sourcemap: true, //这个不用多说哈
  outdir: cacheDir, //vite自定义的默认缓存文件夹， node_modules/.vite
  //修剪树枝？ 默认删除无用的代码，ignore-annotations的话指忽略那些删掉会损坏包的无用代码
  treeShaking: 'ignore-annotations',
  metafile: true, // 生成meta json
  define, // 替换标识符
  plugins: [...plugins, esbuildDepPlugin(flatIdDeps, flatIdToExports, config)],
  ...esbuildOptions,
});
```

### esbuild 插件

了解 esbuild 的插件的可以直接跳过这节，此节简单解释了下插件的结构:

(1) esbuild plugin 是一个包含`name`和`setup`的对象结构。 `name`为插件名,`setup`是一个接收`build`的函数。

(2) 主要的逻辑在`setup`函数中，分别为`build.onResolve`和 `build.onLoad`。

`build.onResolve`: 此函数拦截相应的导入路径，修改路径并标记特定的命名空间。

`build.onLoad`: 此函数接收并筛选所有标记命名空间为`env-ns`的传入项,告诉 esbuild 该如何处理。

```typescript
let envPlugin = {
  name: 'env',
  setup(build) {
    // 第一个参数为拦截规则。如下示例，用正则拦截了名为`env`的路径。
    // 第二个参数为函数，返回对象中包含路径（这里可以对路径修改并返回）和标记`env-ns`命名空间。
    build.onResolve({ filter: /^env$/ }, (args) => ({
      path: args.path,
      namespace: 'env-ns',
    }));

    // 第一个参数为接收命名空间为env-ns的路径并通过filter筛选。
    // 第二个参数为函数，告诉esbuild在env-ns命名空间中要返回json格式的环境变量。
    build.onLoad({ filter: /.*/, namespace: 'env-ns' }, () => ({
      contents: JSON.stringify(process.env),
      loader: 'json',
    }));
  },
};

require('esbuild')
  .build({
    entryPoints: ['app.js'],
    bundle: true,
    outfile: 'out.js',
    plugins: [envPlugin],
  })
  .catch(() => process.exit(1));
```

### esbuildDepPlugin

首先需要看下 Vite 插件的一些用到的函数：

```typescript
// /optimizer/esbuildDepPlugin.ts

export function esbuildDepPlugin(
  qualified: Record<string, string>,
  exportsData: Record<string, ExportsData>,
  config: ResolvedConfig,
): Plugin;
```

#### (1) 创建了两个解析器，分别对应 `esm` 和 `commonjs`。

```typescript
// /optimizer/esbuildDepPlugin.ts

// default resolver which prefers ESM
const _resolve = config.createResolver({ asSrc: false });

// cjs resolver that prefers Node
const _resolveRequire = config.createResolver({
  asSrc: false,
  isRequire: true,
});
```

#### (2) 创建 `resolve` 函数，主要用来解决判断是什么类型的模块，并且返回相应的解析器结果。

```typescript
// /optimizer/esbuildDepPlugin.ts

const resolve = (
  id: string,
  importer: string,
  kind: ImportKind,
  resolveDir?: string,
): Promise<string | undefined> => {
  let _importer;
  // explicit resolveDir - this is passed only during yarn pnp resolve for
  // entries
  // 传如果传入文件夹，那就获取绝对路径的文件夹路径
  if (resolveDir) {
    _importer = normalizePath(path.join(resolveDir, '*'));
  } else {
    // map importer ids to file paths for correct resolution
    /**
     * mporter是否在外部传入的flatIdDeps中，
     * {
     *  vue: '/Users/kev1nzh/Desktop/new/my-vue-app/node_modules/vue/dist/vue.runtime.esm-bundler.js',
     *  axios: '/Users/kev1nzh/Desktop/new/my-vue-app/node_modules/axios/index.js'
     * }
     * 如果在获取value的路径
     */
    _importer = importer in qualified ? qualified[importer] : importer;
  }
  //判断是否时以require开头，为了筛选出 kind为require-resolve, require-call的模块，调用resolveRequire
  const resolver = kind.startsWith('require') ? _resolveRequire : _resolve;
  // 返回解决完的路径,这个函数的代码后续会有章节详细讲
  return resolver(id, _importer);
};
```

#### (3) 创建`resolveEntry`函数，根据传入类型返回命名空间。

```typescript
function resolveEntry(id: string, isEntry: boolean, resolveDir: string) {
  const flatId = flattenId(id);
  if (flatId in qualified) {
    return isEntry
      ? {
          path: flatId,
          namespace: 'dep',
        }
      : {
          path: require.resolve(qualified[flatId], {
            paths: [resolveDir],
          }),
        };
  }
}
```

#### (4) Vite 的`onResolve`

Vite 创建了两个`onResolve`， 一个处理 js 文件，一个处理非 js 类型的文件。

处理非 js：

```typescript
// /optimizer/esbuildDepPlugin.ts

// 这个onResolve为处理非js类型的文件

// 非js类型的文件数组
const externalTypes = [
  'css',
  'less',
  'sass',
  ...
];
build.onResolve(
  {
    // 这边通过正则匹配出在externalTypes数组内格式的文件
    filter: new RegExp(`\\.(` + externalTypes.join('|') + `)(\\?.*)?$`),
  },
  async ({ path: id, importer, kind }) => {
    // importer {string} 要打包的导入模块路径
    // kind {string} 导入规则 | 'entry-point'| 'import-statement'| 'require-call'| 'dynamic-import'| 'require-resolve'| 'import-rule'| 'url-token'
    const resolved = await resolve(id, importer, kind);
    if (resolved) {
      // 返回标记特殊处理，并返回引入文件的路径
      return {
        path: resolved,
        external: true,
      };
    }
  },
);
```

处理 js 类型的文件:

以下代码就是 Vite 最刺激的地方，我应该会新建一篇章节来解释这块代码。

```typescript
// /optimizer/esbuildDepPlugin.ts

// 这个onResolve为处理js类型的文件

build.onResolve(
  { filter: /^[\w@][^:]/ },
  async ({ path: id, importer, kind, resolveDir }) => {
    /**
      id:  vue
      importer:
      kind:  entry-point

      id:  @vue/runtime-dom
      importer:  /Users/kev1nzh/Desktop/new/my-vue-app/node_modules/vue/dist/vue.runtime.esm-bundler.js
      kind:  import-statement

      参数如上，vite把预打包的模块分为 入口模块和依赖模块，
      像axios vue之类的 我们在项目中import的模块，
      runtime-dom 这种模块则是在package-lock.json, 是项目中入口模块的依赖模块，
      然后经过以下代码来区分并处理。
    */
    const isEntry = !importer;
    // ensure esbuild uses our resolved entries
    let entry;
    // if this is an entry, return entry namespace resolve result
    // 如果他是入口，就返回名为dep的命名空间来做接下来操作
    if ((entry = resolveEntry(id, isEntry, resolveDir))) return entry;

    // check if this is aliased to an entry - also return entry namespace
    const aliased = await _resolve(id, undefined, true);
    if (aliased && (entry = resolveEntry(aliased, isEntry, resolveDir))) {
      return entry;
    }

    // use vite's own resolver
    // ok这里开始处理依赖模块的流程，这边resolve
    const resolved = await resolve(id, importer, kind);
    if (resolved) {
      // vite自定义的id const browserExternalId = '__vite-browser-external'
      // 返回命名空间和id，因为浏览器兼容问题，无法处理的忽略模块
      if (resolved.startsWith(browserExternalId)) {
        //返回给browser-external命名空间处理并返回id
        return {
          path: id,
          namespace: 'browser-external',
        };
      }
      // 是否是非js或者外部文件，和上一个onResolve一样返回处理
      if (isExternalUrl(resolved)) {
        return {
          path: resolved,
          external: true,
        };
      }
      return {
        path: path.resolve(resolved),
      };
    }
  },
);
```

#### (5) Vite 的`onLoad`

`dep`命名空间处理,下面代码有点复杂，简单说下逻辑。

第一步，获取每个入口模块的引入路径，例如`axios`的`entryFile`为`/.../my-vue-app/node_modules/axios/index.js`,

转换成路径`relativePath`并添加前缀`node_modules/axios/index.js`。

第二步，根据`exportsData`（之前 parse 后返回出的引入和导出的数据）来判断`commonjs、default、export from`类型，

最后转换成`contents` => `export default require("./node_modules/axios/index.js")`。

第三步，根据入口模块的路径获取后缀`ext`。

最后返回对象。

```typescript
/**
 * loader {string} 告诉esbuild要解析成js/css/....
 * resolveDir {string} 模块导入路径
 * contents: {string} 加载内容
 */
return {
  loader: ext as Loader,
  contents,
  resolveDir: root,
};
```

```typescript
// 获取项目的路径
const root = path.resolve(config.root);
build.onLoad({ filter: /.*/, namespace: 'dep' }, ({ path: id }) => {
  // 入口文件 vue => /.../my-vue-app/node_modules/vue/dist/vue.runtime.esm-bundler.js
  const entryFile = qualified[id];
  // 获取原始路径
  let relativePath = normalizePath(path.relative(root, entryFile));
  // 这边来处理 .abc.js => ./abc.js
  if (!relativePath.startsWith('.')) {
    relativePath = `./${relativePath}`;
  }

  let contents = '';
  const data = exportsData[id];
  const [imports, exports] = data;
  // 下面都是处理不同模块的流程
  if (!imports.length && !exports.length) {
    // cjs
    // export default require("./node_modules/axios/index.js");
    contents += `export default require("${relativePath}");`;
  } else {
    if (exports.includes('default')) {
      // default
      // import d from "./node_modules/element-plus/lib/index.esm.js";export default d;
      contents += `import d from "${relativePath}";export default d;`;
    }
    if (data.hasReExports || exports.length > 1 || exports[0] !== 'default') {
      // hasReExports
      // export * from "./node_modules/vue/dist/vue.runtime.esm-bundler.js"
      contents += `\nexport * from "${relativePath}"`;
    }
  }
  // 获取入口文件的后缀
  let ext = path.extname(entryFile).slice(1);
  if (ext === 'mjs') ext = 'js';
  /**
   * loader {string} 告诉esbuild要解析成js/css/....
   * resolveDir {string} 模块导入路径
   * contents: {string} 加载内容
   *
   * 以下是一个处理vue runtime-dom的例子
   * {
   *  ext: 'js',
   *  contents: "export * from "./node_modules/vue/dist/vue.runtime.esm-bundler.js",
   *  resolveDir: '..../node_modules/vue/dist'
   * }
   */
  return {
    loader: ext as Loader,
    contents,
    resolveDir: root,
  };
});
```

### 总结

1. 上一章节[预构建对象和前期准备](/docs/rebuild/optimizer)中获取`deps`对象后，调用`esbuild`的打包功能。

2. 传入`Vite`自定义的插件中，以文件类型分类。

3.  告诉 esbuild 分为入口模块和依赖模块并处理，最终打包文件写入至`/node_modules/.vite`文件夹中。

### 最后

Vite 项目(Vue)中的`axios`编译走向如下：

#### 1. Vue 项目组件中引入`axios`

![pre-build](/images/build/1.png)

#### 2. .vite 文件中的`axios.js`文件，已经编译成上一节中`contents`的路径了。

![pre-build](/images/build/3.png)

### 最后的最后

所有依赖模块构建完毕后写入`/node_modules/.vite`文件中，如若依赖项新增或改变，则会重写构建`.vite`。每次启动项目时，如果有预构建文件，可以直接启动，不需要每次重写打包依赖项。

`ECMA Script Modules(esm)`, 虽然 2021 年了，很多前端都已经在用最新的技术和代码来做项目，但是还有很多很多很多非常好用的模块都是好几年前创建的，那些模块导出机制五花八门，由`Vite`统一转换成 esm 的方式，只提供源码，让浏览器接管了打包这一服务。当页面需要某个模块时，Vite 只要转换并返回 esm 方式的源码就行了。

### 看完本章节有收获的朋友，可以去 github 点个赞，后续还有相应的源码解析或分享，谢谢。
