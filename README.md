# sveltekit-deno-template

用于快速构建网页应用的模板

## 检查列表

- [ ] `static/manifest.json`: PWA 配置
- [ ] `static/favicon.png`: 应用图标
- [ ] `.env.example`: 环境变量
- [ ] `package.json`: 应用配置

## 安装

确保安装 Deno 2 之后，在项目根目录执行以下命令以安装

```sh
deno install --allow-scripts=npm:@sveltejs/kit@2.7.7,npm:msgpackr-extract@3.0.3
```

完成安装后，执行以下命令以启动服务器（VSCode会自动启动服务器）

```sh
deno task dev
```
