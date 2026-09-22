# 汉堡王 Burger King

NEXUS 的汉堡主题独立新版。以电脑横屏为主，滚动穿过烤箱、烘焙台、芝士柜、农场、铁板调料台和蛋盒工作台，逐层近看汉堡，最后进入成员圆桌。学习资料是角落的小物件链接，没有弹窗、抽屉或分类筛选。

## 运行

使用 Node.js 22.18 或更新版本，在本目录运行：

```powershell
npm ci
npm run dev
```

开发预览：http://127.0.0.1:5173/ 。生产构建写入固定目录 `../burger/`：

```powershell
npm run build
cd ..
python -m http.server 4173 --bind 127.0.0.1
```

生产预览：http://127.0.0.1:4173/burger/ 。旧站仍在 http://127.0.0.1:4173/ 。原 `index.html`、`style.css`、`script.js`、`assets/` 和 `ecommerce-agent/` 保持原样。未推送远程或部署上线。

## 页面结构

- 首屏：烤箱场景中的大汉堡缓慢转动，BURGER KING 位于左侧。标题、导航与页脚附上“汉堡王 · NEXUS 的别称”。
- 资料：桌面右下角约 23% 宽的小物件阵列，分别使用厨具、调料罐、种植袋、蛋盒；完整标题保留在链接名称及悬停提示中，点击直接访问原地址。手机使用底部的小物件阵列。
- 特写：镜头沿上下层移动，当前食材前移并放大约 30%。其他层仍在原有垂直轴线上，可从画面上下边缘露出，不再为了展示全栈而牺牲主体大小。
- 背景：六个真实三维场景随章节淡入淡出，包含厨房橱窗、工作台、农田、栅栏、调料罐和蛋盒。背景为本地程序化模型。
- 名录：公开院校及人数在圆桌之前静态排列，不需要打开另一个页面或弹窗。
- 圆桌：46 位成员围坐，每人前面都有对应校徽。桌子、汉堡、成员和校徽整体缓慢自转，鼠标拖动或左右方向键可旋转；手机保留原生纵向滚动。
- 收尾：“一起入席，成为新的汉堡王！”。额外预留一个白色半透明小人，红色引导线跟随席位旋转，并在席位转到后方时淡出；占位不计入成员人数。

资源名称、顺序、标题、来源和链接沿用原站：

| 分类 | 食材 | 数量 |
| --- | --- | ---: |
| 基础必修 | 底层面包 | 16 |
| 基础设施 / Infra | 顶层面包 | 26 |
| 智能体 / Agent | 芝士 | 23 |
| 具身智能 | 生菜与番茄 | 18 |
| 大模型后训练 | 肉饼 | 16 |
| 推荐算法 | 煎蛋 | 8 |

共 107 项资料、22 个公开院校／校区、46 位成员。原 HTML 注释隐藏的院校不公开。`src/data/content.json` 是同步数据，更新旧站内容后可运行 `npm run sync-content`；同步只读原 HTML 并复制公开校徽。

## 实现

React 19、TypeScript、Vite、Three.js、React Three Fiber、Drei。字体、校徽和运行资产均本地托管，无后端或外部模型 CDN。

滚动位置根据实际章节高度计算，再映射到可逆的三维时间轴。章节使用正常文档流和 sticky 构图，没有滚轮劫持和内部滚动框。GSAP 和旧抽屉组件已移除。圆桌拖动只改变场景角度，触摸使用 `pan-y` 保留纵向页面浏览。

| 文件 | 用途 |
| --- | --- |
| `src/App.tsx` | 静态内容、原生锚点、文档位置测量 |
| `src/styles.css` | 横屏布局和移动端阅读区 |
| `src/scene/timeline.ts` | 分层、突出、合拢与圆桌过渡 |
| `src/scene/Scene.tsx` | 相机、取景、灯光和降级 |
| `src/scene/Burger.tsx` | 六个独立食材和轻微浮动 |
| `src/scene/Backdrop.tsx` | 六个三维场景及环境切换 |
| `src/components/ResourceProp.tsx` | 可直接点击的小物件资料链接 |
| `src/scene/RoundTable.tsx` | 46 个实例化人物、圆桌和学校桌牌 |
| `src/scene/GuestSeat.tsx` / `seating.ts` | 透明入席占位、三维标注和座位分配 |
| `src/scene/geometry.ts` / `materials.ts` | 程序化食材模型和材质 |

食材为本项目程序化实时模型，并非扫描资产。系统启用减少动态效果时，场景按章节切换静态状态，关闭自动旋转，保留手动旋转；后台和离开视口时暂停持续绘制。WebGL 不可用时显示静态汉堡，全部资料和名录仍可访问。无 JavaScript 时提供原站入口。

## 验证与发布

```powershell
npm run check
npm test
npx playwright install chromium
# 先启动仓库根目录的 4173 静态服务器
npm run test:browser
npm run capture
```

浏览器检查使用独立无头 Chromium。`?qa` 仅在验收时输出真实网格顶点的屏幕投影边界，检查各层是否在视口内；普通页面不计算这些边界。截图在 `artifacts/`，结构化报告在 `test-results/`，均不进入发布目录。具体记录见 `VALIDATION.md`。

`base: './'` 支持现有 GitHub Pages 项目路径。未来提交 `burger/` 产物后，新版可在 `https://ryannnice.github.io/nexus/burger/` 发布，旧站路径不变。当前没有执行提交、推送或上线。

依赖许可在构建前自动汇总到 `public/THIRD-PARTY-LICENSES.txt`，字体许可在 `public/fonts/OFL.txt`，视觉与开源参考在 `public/credits.html`。
