---
title: 3.预构建对象和前期准备
order: 3
group:
  title: NPM 依赖解析和预构建
---

## 预构建对象和前期准备

首先获取预缓存(metadata.json)的路径，以及预构建的hash值，以便后续比对。

这个json文件为vite处理后导出的数据信息，当此文件存在时，会比对hash值，如果相同就会直接读取此文件中的依赖。
```typescript
// /optimizer.ts
async function optimizeDeps(
  config: ResolvedConfig,
  force = config.server.force,
  asCommand = false,
  newDeps?: Record<string, string>,
) {
  const { root, logger, cacheDir } = config
   // 这边第三个args为 asCommand, 是否是命令行运行的
   // 为了讲述的流畅性，在上一章节代码入口没有提到， 在vite --force 后，会直接运行optimizeDeps函数，因此需要区分log的输出方式
   // vite --force    =>    await optimizeDeps(config, options.force, true)
  const log = asCommand ? logger.info : debug

  if (!cacheDir) {
    log(`No cache directory. Skipping.`)
    return null

  //这边首先获取 预构建模块路径
  const dataPath = path.join(cacheDir, '_metadata.json'); //预缓存路径
  // /.../my-vue-app/node_modules/.vite/_metadata.json
  const mainHash = getDepHash(root, config);
  // 创建一个data的对象，后面会用到
  const data: DepOptimizationMetadata = {
    hash: mainHash,
    browserHash: mainHash,
    optimized: {},
  };
```

### 如何获取hash值？

首先获取了预构建模块的路径，默认情况为 node_modules/.vite。

以下为 metadata.json 的数据结构, 后续会说到。

```json
// node_modules/.vite/_metadata.json
{
  "hash": "9a4fa980",
  "browserHash": "6f00d484",
  "optimized": {
    "vue": {
      "file": "/.../my-vue-app/node_modules/.vite/vue.js",
      "src": "/.../my-vue-app/node_modules/vue/dist/vue.runtime.esm-bundler.js",
      "needsInterop": false
    },
    "axios": {
      "file": "/.../new/my-vue-app/node_modules/.vite/axios.js",
      "src": "/.../new/my-vue-app/node_modules/axios/index.js",
      "needsInterop": true
    }
  }
}
```

接着我们看 getDepHash 函数。
官方文档中描述，Vite 在预构建之前，根据以下源来确定是否要重新运行预构建。

- package.json 中的 dependencies 列表
- **包管理器的 lockfile，例如 package-lock.json, yarn.lock，或者 pnpm-lock.yaml**
- 可能在 vite.config.js 相关字段中配置过的

以下代码中，变量 lockfileFormats 就是包管理器的locakfile。
```typescript
// /optimizer.ts 
const lockfileFormats = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];

// /optimizer.ts => getDepHash
let cachedHash: string | undefined;

function getDepHash(root: string, config: ResolvedConfig): string {
  if (cachedHash) {
    return cachedHash;
  }
  let content = lookupFile(root, lockfileFormats) || ''; //往下滑会有lookupFile函数的解释。
  // 这边已经获取了所有local file array 内的文件内容

  // also take config into account
  // only a subset of config options that can affect dep optimization

  content += JSON.stringify(
    {
      mode: config.mode,
      root: config.root,
      resolve: config.resolve,
      assetsInclude: config.assetsInclude,
      plugins: config.plugins.map((p) => p.name),
      optimizeDeps: {
        include: config.optimizeDeps?.include, // null
        exclude: config.optimizeDeps?.exclude, //null
      },
    },
    (_, value) => {
      if (typeof value === 'function' || value instanceof RegExp) {
        return value.toString();
      }
      return value;
    },
  );
  //这里不说了  最终返回 "9a4fa980" 八位数hash值。
  return createHash('sha256').update(content).digest('hex').substr(0, 8);
}

// /optimizer.ts => lookupFile
function lookupFile(
  dir: string,
  formats: string[],
  pathOnly = false,
): string | undefined {
  for (const format of formats) {
    const fullPath = path.join(dir, format); //获取root + format路径
    // 路径对象是否存在 并且是文件
    // pathOnly 为true就只返回路径，不然就都默认返回utf-8的文件内容
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return pathOnly ? fullPath : fs.readFileSync(fullPath, 'utf-8');
    }
  }
  const parentDir = path.dirname(dir);
  if (parentDir !== dir) {
    return lookupFile(parentDir, formats, pathOnly);
  }
}
```

### 是否强制优化并处理.vite 文件夹

获取了预构建的 hash 值后，让我退回到 optimizeDeps 函数中，继续往下看。

通过参数 force 来判断是否需要强制优化，如果不需要那就对比老 hash 值，如果相等就返回老的 metadata.json 文件内容。

最后处理.vite文件夹，为后续做准备。

```typescript
// /optimizer.ts
...
const data: DepOptimizationMetadata = {
    hash: mainHash, //"9a4fa980"
    browserHash: mainHash, //"9a4fa980"
    optimized: {},
  };


// 是否强制预先优化 不管是否已经更改。
// force = config.server.force 来源于cli.ts，获取命令行参数中是否有 --force
if (!force) {
  let prevData;
  try {
    // 尝试解析已经存在的metadata数据， 获取/.vite/metadata.json中的内容
    prevData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (e) {}
  // hash is consistent, no need to re-bundle
  // 如果预dep数据的hash相同，那就直接跳过，如果需要覆盖就使用 --force
  if (prevData && prevData.hash === data.hash) {
    log('Hash is consistent. Skipping. Use --force to override.');
    return prevData;
  }
}
//如果 node_modules/.vite 存在，那就清空。
if (fs.existsSync(cacheDir)) {
  emptyDir(cacheDir);
} else {
  // 要不然就创建文件夹， 并且recursive：true 返回创建文件夹的路径
  fs.mkdirSync(cacheDir, { recursive: true });
}
```

### 获取需要编译依赖关系的模块路径

解决.vite 文件夹后，我们跟着代码处理.vite 中的内容文件。

这边创建了两个变量 deps 和 missing。

deps: 需要处理依赖关系的路径对象。

missing: 需要处理依赖关系但在 node_modules 中没有找到来源的数组对象。

```json
//deps
{
  "vue": "/.../my-vue-app/node_modules/vue/dist/vue.runtime.esm-bundler.js",
  "axios": "/.../my-vue-app/node_modules/axios/index.js"
}
```

需要提前知道的是，newDeps 这个 args 参数区分了第一次编译和已启动后遇到新依赖关系导入重写运行的编译。

```typescript
// /optimizer.ts

let deps: Record<string, string>, missing: Record<string, string>;
// 在服务器已经启动之后，如果遇到一个新的依赖关系导入，
// 而这个依赖关系还没有在缓存中，Vite 将重新运行依赖构建进程并重新加载页面。
// 如上官方文档所述，最终会得出deps 和missing
if (!newDeps) {
  // scanImports 这里就不展开了，他的作用就是获取导入源，用正则检测后，使用esbuild编译所有的入口依赖（entries)
  ({ deps, missing } = await scanImports(config));
} else {
  deps = newDeps;
  missing = {};
}
// 重写更新了浏览器的哈希
// update browser hash
data.browserHash = createHash('sha256')
  .update(data.hash + JSON.stringify(deps))
  .digest('hex')
  .substr(0, 8);
```

### 没有找到来源的模块处理(missing)

下面代码很简单，处理在 node_modules 中没有找到来源的模块。

```typescript
// /optimizer.ts

// missing是一个储存需要处理依赖关系但在 node_modules 中没有找到来源的数组对象，如果有的话直接error提醒一波。
const missingIds = Object.keys(missing);
if (missingIds.length) {
  throw new Error(
    `The following dependencies are imported but could not be resolved:\n\n  ${missingIds
      .map(
        (id) =>
          `${chalk.cyan(id)} ${chalk.white.dim(
            `(imported by ${missing[id]})`,
          )}`,
      )
      .join(`\n  `)}\n\nAre they installed?`,
  );
}
```

### 获取并导入 自定义的强制预构建(include)

接着处理在 vite.config.js 中 optimizeDeps.include。

如官方文档 API 所述，

optimizeDeps.include: 默认情况下，不在 node_modules 中的，链接的包不会被预构建。使用此选项可强制预构建链接的包

```typescript
// /optimizer.ts

//config中是否有需要强制构建的依赖项, 处理后再deps中加入
const include = config.optimizeDeps?.include;
if (include) {
  const resolve = config.createResolver({ asSrc: false });
  for (const id of include) {
    if (!deps[id]) {
      const entry = await resolve(id);
      if (entry) {
        deps[id] = entry;
      } else {
        throw new Error(
          `Failed to resolve force included dependency: ${chalk.cyan(id)}`,
        );
      }
    }
  }
}
```

### 命令行打印需要构建模块的信息

```typescript
// /optimizer.ts

const qualifiedIds = Object.keys(deps);
//不用说很简单，没有需要依赖的dep就跳过
if (!qualifiedIds.length) {
  writeFile(dataPath, JSON.stringify(data, null, 2));
  log(`No dependencies to bundle. Skipping.\n\n\n`);
  return data;
}

// 这里也不用解释太多，基本上就是打印出信息的逻辑，然后绿色高亮告诉你要预缓存巴拉巴拉
const total = qualifiedIds.length;
const maxListed = 5;
const listed = Math.min(total, maxListed);
const extra = Math.max(0, total - maxListed);
const depsString = chalk.yellow(
  qualifiedIds.slice(0, listed).join(`\n  `) +
    (extra > 0 ? `\n  (...and ${extra} more)` : ``),
);
if (!asCommand) {
  if (!newDeps) {
    // This is auto run on server start - let the user know that we are
    // pre-optimizing deps
    logger.info(
      chalk.greenBright(`Pre-bundling dependencies:\n  ${depsString}`),
    );
    logger.info(
      `(this will be run only when your dependencies or config have changed)`,
    );
  }
} else {
  logger.info(chalk.greenBright(`Optimizing dependencies:\n  ${depsString}`));
}
```

### 创建预构建对象

使用es-module-lexer模块获取每个deps中的预构建模块文件，输出引入和导出的数据并保存。

```typescript
// /optimizer.ts

import { ImportSpecifier, init, parse } from 'es-module-lexer';

// esbuild generates nested directory output with lowest common ancestor base
// this is unpredictable and makes it difficult to analyze entry / output
// mapping. So what we do here is:
// 1. flatten all ids to eliminate slash
// 2. in the plugin, read the entry ourselves as virtual files to retain the
//    path.
const flatIdDeps: Record<string, string> = {};
const idToExports: Record<string, ExportsData> = {};
const flatIdToExports: Record<string, ExportsData> = {};
// 运行es-module-lexer的初始化函数，后续会用到
await init;

for (const id in deps) {
  // 替换id中的斜杠变成下划线 node/abc => node_abc
  const flatId = flattenId(id);
  flatIdDeps[flatId] = deps[id];
  // 获取每个依赖源的文件内容
  //{ vue: '/.../my-vue-app/node_modules/vue/dist/vue.runtime.esm-bundler.js',
  // 'element-plus': '/.../my-vue-app/node_modules/element-plus/lib/index.esm.js',
  //  axios: '/.../my-vue-app/node_modules/axios/index.js' }
  const entryContent = fs.readFileSync(deps[id], 'utf-8');
  // parse出自es-module-lexer，这个包是一个js模块语法词法分析器，体积非常小
  // 解析出后的ExportsData 是一个数组，[0]是imports, [1]是exports
  const exportsData = parse(entryContent) as ExportsData;

  /*
    ss/se => statement start/end 缩写, {number} import的开始和结束index
    这里以vue举例，parse返回的值 =>  ss = 0 se = 60
    entryContent.slice(0, 60) => "import { initCustomFormatter, warn } from '@vue/runtime-dom'"
    entryContent.slice(62, 94) => "export * from '@vue/runtime-dom"
    最后标注需要特殊处理的 export from
  */
  for (const { ss, se } of exportsData[0]) {
    const exp = entryContent.slice(ss, se);
    if (/export\s+\*\s+from/.test(exp)) {
      exportsData.hasReExports = true; //待定
    }
  }
  // 分别记录以id flatId的exportsData
  // exportsData数据太多这里就不贴了，总之里面包含每个构建模块中的import和export的数据。
  idToExports[id] = exportsData;
  flatIdToExports[flatId] = exportsData;

}
```

### 总结

上述描述代码中，我们理一下当前的逻辑。

1. 获取了预构建模块的内容（hash 值，优化对象等）。
2. 获取包管理器的 lockfile 转换的 hash 值，判断是否需要重新运行预构建。
3. 获取需要编译依赖关系的模块路径（deps）和需要编译但没找到来源的模块（missing)。
4. 处理 missing 数组，打印 error 提示是否已安装来源。
5. 获取 vite.config.js 中自定义强制预构建的模块路径(include)，加入 deps 对象中。
6. 命令行打印需要构建模块的信息。


   ![pre-build](/images/pre-build.png)


7. 创建预构建对象，获取预构建对象中的引入导出数据并记录。

**处理完各种琐事之后，我们获取了需要构建的 deps 对象，接下来进入下一章节来解析 deps 对象。**
