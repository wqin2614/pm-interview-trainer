# Product Interview Lab

面向产品岗位求职者的 AI 面试训练项目，支持随机抽题、分类题库、限时作答、语音转写与历史复盘，适合作为一个可展示“产品思维 + 前后端协同 + AI 能力接入 + 多端体验设计”的作品项目。

## 项目简介

产品岗面试准备通常会遇到几个典型问题：

- 面试题分散，缺少结构化练习入口
- 真实面试考察的是限时表达，不只是静态看题
- 练习后没有转写和复盘，很难持续优化回答结构

这个项目围绕上述问题，设计了一条完整的练习闭环：

`随机抽题 -> 选择时长 -> 个人准备 -> 限时作答 -> 语音转写 -> 历史沉淀`

相比单纯的静态题库页，这个项目更强调完整产品链路和可交付体验。

## 核心功能

### 1. 首页随机抽题

- 支持随机抽取高频产品面试题
- 首页直接展示题目标签、难度、来源和题目说明
- 支持一键进入限时作答流程

### 2. 分类题库

- 支持按类型浏览题目，如产品增长、数据分析、产品设计、用户研究、商业化、策略思考
- 支持从题库中直接开始某一道题
- 首页抽题与题库数据联动

### 3. 自定义上传题目

- 支持单个录入题目
- 支持批量导入题目
- 批量导入格式：`题目标题||题目描述||类型||难度||来源`
- 新增题目会写入本地存储，刷新后仍然保留

### 4. 模拟面试作答

- 支持 3 / 5 / 10 分钟限时作答
- 面试前提供简洁准备引导
- 面试中展示倒计时圆环与实时转写区

### 5. 语音转写

- H5 端优先使用浏览器语音识别能力
- H5 / 小程序端均支持录音分段上传
- 后端接入 OpenAI 音频转写接口，将语音转成文本

### 6. 历史记录与复盘

- 自动保存题目、作答时长与转写内容
- 支持复制转写结果
- 支持从历史记录中重新练习原题

## 我重点做了什么

### 产品闭环设计

我没有只做一个题库展示页，而是把“抽题、准备、作答、转写、沉淀”完整跑通，更贴近真实面试训练场景。

### 前后端协同

- 前端使用 Taro + React 构建，同时兼顾 H5 与微信小程序
- 后端使用 NestJS 提供语音转写接口
- 围绕录音上传、状态切换、转写结果返回做了完整联动

### 多端兼容处理

项目不是纯 Web 页面，而是同时考虑了 H5 和微信小程序的差异：

- 小程序端使用 `RecorderManager`
- H5 端优先使用 SpeechRecognition
- H5 识别不可用时回退到录音上传
- 页面交互与视觉样式尽量保持跨端一致

### AI 能力接入

后端接入 OpenAI Audio Transcriptions API，将作答语音转成文字，用于面试复盘和后续可扩展的 AI 点评。

## 技术栈

### 前端

- Taro 4
- React 18
- TypeScript
- Tailwind CSS 4
- weapp-tailwindcss
- lucide-react-taro
- shadcn/ui（Taro 适配组件）

### 后端

- NestJS
- TypeScript
- Multer / FileInterceptor
- OpenAI Audio Transcriptions API

### 工程化

- pnpm
- Vite
- ESLint
- H5 / 微信小程序双端构建

## 项目结构

```text
.
├─ server/                     # NestJS 后端
│  └─ src/
│     ├─ main.ts
│     ├─ app.module.ts
│     ├─ interview.controller.ts
│     └─ interview.service.ts
├─ src/                        # Taro 前端
│  ├─ data/                    # 题目与历史记录数据层
│  ├─ pages/
│  │  ├─ index/                # 首页 / 抽题
│  │  ├─ interview/            # 模拟面试
│  │  ├─ question-bank/        # 分类题库
│  │  └─ history/              # 历史记录
│  ├─ components/ui/           # 通用 UI 组件
│  ├─ network.ts               # 统一请求封装
│  └─ app.config.ts
├─ scripts/                    # 本地开发辅助脚本
├─ package.json
└─ README.md
```

## 本地启动

### 安装依赖

```bash
pnpm install
```

### 启动前后端开发环境

```bash
pnpm dev
```

默认地址：

- H5: [http://localhost:5000](http://localhost:5000)
- Server: [http://localhost:3000](http://localhost:3000)

### 单独启动

```bash
pnpm dev:web
pnpm dev:weapp
pnpm dev:server
```

## 构建命令

```bash
pnpm build
pnpm build:web
pnpm build:weapp
pnpm build:server
pnpm tsc
```

## 环境变量

如需使用语音转写能力，请在服务端配置：

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
```

未配置时，页面功能仍可正常演示，但语音转写接口无法使用。

## 向面试官介绍时可这样说

> 这是我做的一个“产品面试训练”项目。我没有只做静态页面，而是把完整练习链路跑通了，包括随机抽题、分类题库、限时作答、语音转写和历史沉淀。技术上我用 Taro 做了 H5 和微信小程序双端，NestJS 做后端，并接入了 OpenAI 的音频转写能力。这个项目比较能体现我把产品场景转成可交付功能的能力。

## 当前完成度

目前已完成：

- 首页抽题与题库联动
- 自定义题目本地上传
- 模拟面试流程页面
- 录音 / 转写基础链路
- 历史记录沉淀与回看
- H5 与微信小程序双端构建

## 后续可优化方向

- 上传题目接入服务端同步，而不只是本地持久化
- 支持 Excel / CSV 模板导入
- 增加 AI 点评与结构化反馈
- 增加账号体系与云端记录同步
- 增加收藏、错题回练、专项训练模式

## 说明

当前版本更适合作为作品集展示版和面试演示版，重点体现产品设计思路、前后端协作能力、AI 能力接入和跨端实现能力。
