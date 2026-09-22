# 汉堡王 Burger King · NEXUS

独立的汉堡主题介绍站。滚动拆开汉堡，穿过烤箱、烘焙台、芝士柜、农场、铁板与冰箱；配方是场景里的三维物件。最后食材飞来、弹性叠合、旋转，落到 46 位伙伴围坐的大圆桌上。

## 本地运行

使用 Node.js 22.18 或更新版本，在本目录运行：

```powershell
npm ci
npm run dev
```

生产构建固定写入 `../burger/`：

```powershell
npm run build
cd ..
python -m http.server 4173 --bind 127.0.0.1
```

新版：http://127.0.0.1:4173/burger/ 。旧站：http://127.0.0.1:4173/ 。原站 `index.html`、`style.css`、`script.js`、`assets/`、`ecommerce-agent/` 保持原样。

## 体验

- 首屏：大汉堡、BURGER KING 与 `100% MADE OF PASSION` 星芒印章。别称说明只放在页脚，介绍为“我们热爱汉堡，正如我们热爱大语言模型！”。
- 目录：左侧固定显示六个原始方向、伙伴院校与入席；当前章节持续高亮，原生锚点直达。
- 配方：三维厨具、油盐瓶、研磨器、种植袋、浇水壶、盆栽、蛋盒、牛奶盒等。名称印在三维纸签上，点击实物直接访问原地址。
- 长架：每个方向的物件排成一条连续长架，纵向滚动驱动物件横向经过画面。两端使用三维裁剪平面，无分页、弹窗、抽屉或筛选。桌面通常同时显示 5 件，手机 3 件，较矮横屏 4 件。
- 食材：镜头特写当前层，其余层保留上下关系。面包具有孔隙和烘烤色差，肉饼有焦痕和细碎表面，芝士有闭合薄边与下垂轮廓，生菜有褶皱和叶脉。
- 分隔：冰箱章节之后，独立的绿色转场与棋盘边缘引入院校名录。
- 入席：各层沿随机路径飞来、弹性叠合，快速旋转三圈；14 道暖金光束、56 颗缓慢闪烁的金色粒子与落桌光晕加强收尾。倒滚沿本次路径还原，再次进入更换路径。
- 成员：46 位成员各有独立校徽桌牌。肩、肘、腕相连；长短发、帽子、眼镜、卫衣、西装与夹克搭配使用，普渡成员明确为长发。
- 讨论：桌面持续 5 人发言，手机和矮横屏持续 4 人；错峰轮换话语及成员，引线跟随实际座位。144 条改写、扩展的情景话语覆盖四个技术方向（每方向 32 条）、Infra 与饭桌闲聊，包含公式和代码。气泡避让目录、标题与彼此，并尽量让出汉堡。原始聊天记录只作本地参考，不发布。
- 圆桌：自动慢转，支持横向拖动或左右方向键。白色透明邀请席保留，红色欢迎引线跟随它旋转。
- 收尾：保留“一起入席，成为新的汉堡王！”，接大面积红色 `YOUR SEAT IS WAITING!` 与简短页脚。

## 内容

| 原分类           | 汉堡层     | 配方数 |
| ---------------- | ---------- | -----: |
| 基础必修         | 底层面包   |     16 |
| 基础设施 / Infra | 顶层面包   |     26 |
| 智能体 / Agent   | 芝士       |     23 |
| 具身智能         | 生菜与番茄 |     18 |
| 大模型后训练     | 肉饼       |     16 |
| 推荐算法         | 煎蛋       |      8 |

107 个原始链接、22 个公开院校／校区、46 位成员。原 HTML 注释隐藏的院校不公开。运行 `npm run sync-content` 可同步原站公开内容及校徽。

## 实现

React 19、TypeScript、Vite、Three.js、React Three Fiber、Drei。字体、校徽、模型与纹理均本地运行。食材是本项目参数化模型，并非食物扫描资产。

目录使用本地 Noto Sans SC 600 字重子集（16 KB），统一中文与数字字体。`scripts/menu-font.py` 可重新生成，需 Python 的 fontTools 和 Brotli。各层特写较上一版缩小 8%，首屏及圆桌尺寸保持原设定。

| 文件                                                                 | 用途                                 |
| -------------------------------------------------------------------- | ------------------------------------ |
| `src/App.tsx` / `styles.css`                                         | 内容、目录、文档滚动与响应式布局     |
| `src/scene/Scene.tsx` / `timeline.ts`                                | 相机、灯光、整体时间轴               |
| `src/scene/Burger.tsx` / `geometry.ts` / `materials.ts`              | 六层食材与表面细节                   |
| `src/scene/Backdrop.tsx`                                             | 六种环境                             |
| `src/scene/RecipeShelf.tsx` / `RecipeObjects.tsx` / `PropModels.tsx` | 连续长架、物件、纸签与点击投影       |
| `src/scene/arrival.ts` / `ArrivalFX.tsx`                             | 可逆随机飞行、弹性、旋转、光束与光晕 |
| `src/scene/RoundTable.tsx` / `Avatars.tsx` / `TableThoughts.tsx`     | 圆桌、实例化人物、气泡               |
| `src/scene/GuestSeat.tsx` / `seating.ts`                             | 邀请席与校徽分配                     |

三维表面承载物件和名称；透明普通链接根据物体的屏幕投影定位，保留完整可访问名称、键盘焦点和新窗口行为。键盘聚焦架外物件时自动定位。

布局尺寸由 ResizeObserver 缓存，动画帧不逐项读取 DOM 布局。仅挂载当前方向的物件，架外网格不绘制；人物和微小食材细节使用实例化网格。像素比上限 1.25，动态阴影最多每秒更新 24 次。原生滚动保留，不拦截滚轮或纵向触摸。

系统减少动态效果时关闭飞行、自动旋转、光束与气泡，保留静态内容和手动旋转。后台或场景离开视口时停止持续绘制。WebGL 不可用时显示静态海报和完整文字链接；无 JavaScript 时提供原站入口。

## 验收与发布

```powershell
npm test
npm run build
npm run test:browser
npm run capture
node scripts/capture-motion.mjs
```

浏览器检查使用独立无头 Chromium，需先启动 4173 静态服务器。`?qa` 额外计算实际网格与点击边界，只用于验收。正常访问不计算这些投影报告。截图在 `artifacts/`、报告在 `test-results/`，均不进入发布目录。检查记录见 `VALIDATION.md`。

Vite `base: './'` 支持 GitHub Pages 嵌套路径。发布目标为 `https://ryannnice.github.io/nexus/burger/`，沿用 main 分支的 GitHub Pages 自动发布，旧站路径不变。依赖许可位于 `public/THIRD-PARTY-LICENSES.txt`，字体许可位于 `public/fonts/OFL.txt` 和 `public/fonts/NotoSansSC-OFL.txt`，参考来源见 `public/credits.html`。
