---
title: 2.代码入口
order: 2
group:
  title: NPM 依赖解析和预构建
---

#### Server.listen

在 cli.ts 文件中，接收命令行的运行参数。

```typescript
// 命令行输入命令启动vite
npm run dev
// 根据package调用vite并获取命令参数 如--force build...
vite xxxx xxx xxx
```

vite 运行的第一步，获取命令参数，最后创建 server 并运行 listen 函数。

```typescript
//cli.ts

.action(async (root: string, options: ServerOptions & GlobalCLIOptions) => {
        const { createServer } = await import('./server')
        try {
                const server = await createServer({
                ...
                })
                await server.listen()
        } catch (e) {
                ...
        }
})
```

listen 函数中，runOptimize 函数就是预构建的核心代码。

```typescript
// server/index.ts => listen
if (!middlewareMode && httpServer) {
  // overwrite listen to run optimizer before server start
  const listen = httpServer.listen.bind(httpServer);
  httpServer.listen = (async (port: number, ...args: any[]) => {
    try {
      await container.buildStart({});
      await runOptimize();
    } catch (e) {
      httpServer.emit('error', e);
      return;
    }
    return listen(port, ...args);
  }) as any;
  ...
} else {
  await container.buildStart({});
  await runOptimize();
}

// server/index.ts
import { DepOptimizationMetadata, optimizeDeps } from '../optimizer'

const runOptimize = async () => {
  if (config.cacheDir) {
    server._isRunningOptimizer = true;
    try {
      server._optimizeDepsMetadata = await optimizeDeps(config);
    } finally {
      server._isRunningOptimizer = false;
    }
    server._registerMissingImport = createMissingImporterRegisterFn(server);
  }
};
```

```typescript
// server/index.ts
import { DepOptimizationMetadata, optimizeDeps } from '../optimizer'

const runOptimize = async () => {
  if (config.cacheDir) {
    server._isRunningOptimizer = true;
    try {
      server._optimizeDepsMetadata = await optimizeDeps(config);
    } finally {
      server._isRunningOptimizer = false;
    }
    server._registerMissingImport = createMissingImporterRegisterFn(server);
  }
};
```

入口代码很简单，获取了vite命令行参数后，创建内部server，触发各个功能的构建。

接下来进入详解optimizeDeps的章节。