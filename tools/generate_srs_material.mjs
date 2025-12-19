import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve(process.cwd(), "copyright-material");
fs.mkdirSync(outDir, { recursive: true });

function readPackageVersion() {
  try {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const v = typeof pkg?.version === "string" && pkg.version.trim() ? pkg.version.trim() : null;
    return v;
  } catch {
    return null;
  }
}

const packageVersion = readPackageVersion();

const meta = {
  title: "软件需求说明书（软著鉴别材料）",
  softwareName: "SiteHub（个人网址导航系统）",
  version: packageVersion ? `V${packageVersion}` : "V0.1.0",
  date: "2025年12月16日",
  org: "个人开发者",
};

const routes = {
  pages: [
    "/（首页）",
    "/dashboard",
    "/integrations",
    "/playground",
    "/privacy",
    "/settings",
    "/auth/*（回调/找回密码/重置密码等）",
    "/payment/*（支付结果页）",
  ],
  appApi: [
    "POST /api/auth/email",
    "POST /api/auth/wechat",
    "GET  /api/geo/detect",
    "GET  /api/test-google-auth",
    "POST /api/payment/stripe/create",
    "POST /api/payment/stripe/check",
    "POST /api/payment/stripe/webhook",
    "POST /api/payment/paypal/create",
    "POST /api/payment/paypal/capture",
    "POST /api/payment/alipay/create",
    "POST /api/payment/alipay/notify",
    "POST /api/payment/alipay/verify",
    "POST /api/payment/wechat/create",
    "POST /api/payment/wechat/notify",
  ],
  pagesApi: [
    "POST /api/auth-cn",
    "GET/POST /api/custom-sites-cn",
    "GET/POST /api/favorites-cn",
  ],
};

const features = [
  "内置站点库（canonical 数据源，含精选与分类）",
  "站点展示：超紧凑网格/可拖拽排序",
  "搜索与分类筛选",
  "收藏系统（⭐收藏/取消收藏）",
  "自定义站点（新增/删除/去重校验）",
  "访客模式：10分钟试用倒计时与数据丢失提示",
  "登录/注册：Email + WeChat（以及测试Google登录路由）",
  "地区与数据源适配：国内 CloudBase / 海外 Supabase（适配器模式）",
  "支付能力：Stripe / PayPal / 支付宝 / 微信支付（接口路由）",
  "国际化：中英文 UI 文案",
];

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function page(title, html) {
  return `\n<section class="page">\n  <div class="page-header">\n    <div class="h1">${esc(meta.softwareName)} — ${esc(meta.title)}</div>\n    <div class="meta">版本：${esc(meta.version)}　日期：${esc(meta.date)}　单位：${esc(meta.org)}</div>\n  </div>\n  <div class="page-body">\n    <h2>${esc(title)}</h2>\n    ${html}\n  </div>\n  <div class="page-footer">\n    <span class="muted">软著鉴别材料：前30页 + 后30页（不足可重复）</span>\n  </div>\n</section>\n`;
}

function ul(items) {
  return `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("\n")}</ul>`;
}

function dl(items) {
  return `<dl>${items
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
    .join("\n")}</dl>`;
}

function table(rows) {
  const [head, ...body] = rows;
  return `
<table>
  <thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
  <tbody>
    ${body
      .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
      .join("\n")}
  </tbody>
</table>`;
}

// 构造“完整说明书”的页序列（先生成 > 60 页，再抽取前30 + 后30）
const fullPages = [];

// 1) 封面与声明
fullPages.push(
  page(
    "封面",
    `
    ${dl([
      ["软件名称", meta.softwareName],
      ["文档名称", meta.title],
      ["版本", meta.version],
      ["编制日期", meta.date],
      ["编制单位", meta.org],
    ])}
    <p>本说明书用于描述软件的需求、功能范围、接口与运行环境，用于软件著作权登记的文档鉴别材料。</p>
    `
  )
);

fullPages.push(
  page(
    "文档使用说明与范围",
    `
    <p>本文档基于当前代码仓库实现整理，覆盖：功能需求、数据与接口、非功能性需求、约束与验收要点。</p>
    <p>如用于软著提交，通常需提交“前30页 + 后30页”内容；若不足60页，允许重复。</p>
    `
  )
);

// 2) 概述
fullPages.push(page("系统概述", `<p>本系统为个人网址导航与管理平台，提供类似浏览器新标签页的快速入口，支持站点收藏、拖拽排序、自定义站点、账号登录与数据持久化，并兼容国内/海外不同数据源。</p>`));

fullPages.push(page("术语与缩略语", table([
  ["术语", "说明"],
  ["访客模式", "未登录用户的试用模式，具有时间限制与数据丢失提示"],
  ["收藏", "用户标记的重要站点（⭐）"],
  ["自定义站点", "用户自行添加的站点快捷方式"],
  ["适配器", "对不同后端（CloudBase/Supabase）提供统一接口的抽象"],
])));

// 3) 总体描述
fullPages.push(page("用户角色", ul([
  "访客用户：无需登录试用核心能力（受10分钟限制）",
  "注册用户：可持久化保存收藏与自定义站点",
  "管理员（可选）：用于运营配置、支付回调核验等（以服务端接口能力为主）",
])));

fullPages.push(page("运行环境", ul([
  "前端：Next.js 14 + React 18 + TypeScript",
  "样式与组件：Tailwind CSS + Radix UI",
  "后端：Next.js Route Handlers / Pages API",
  "数据：海外 Supabase；国内 CloudBase（通过接口/SDK）",
  "浏览器：Chrome/Edge/Safari 等现代浏览器",
])));

fullPages.push(page("系统边界与外部接口", ul([
  "第三方支付：Stripe / PayPal / 支付宝 / 微信支付",
  "认证与身份：Email、WeChat（以及测试Google登录路由）",
  "地理位置/地区识别：服务端检测接口",
])));

// 4) 功能需求（分多页写）
fullPages.push(page("核心功能清单", ul(features)));

fullPages.push(
  page(
    "FR-01 站点展示与分类",
    `
    <p><b>描述</b>：系统提供内置站点库，并按类别展示；支持精选内容优先展示。</p>
    ${table([
      ["条目", "要求"],
      ["分类", "站点具备category字段；可按类别导航"],
      ["精选", "精选内容在列表中优先展示"],
      ["地区优先", "国内/海外下站点排序策略不同"],
    ])}
    `
  )
);

fullPages.push(
  page(
    "FR-02 搜索与筛选",
    `
    <p><b>描述</b>：用户可通过搜索框快速定位站点，并结合分类筛选显示结果。</p>
    ${table([
      ["条目", "要求"],
      ["搜索范围", "站点名称/别名（中英文）"],
      ["筛选", "按分类过滤"],
      ["展示", "结果实时更新，保持响应速度"],
    ])}
    `
  )
);

fullPages.push(
  page(
    "FR-03 收藏管理",
    `
    <p><b>描述</b>：用户可将站点加入收藏（⭐）或取消收藏；收藏状态在UI中可见。</p>
    ${table([
      ["条目", "要求"],
      ["加入收藏", "对未收藏站点执行添加操作"],
      ["取消收藏", "对已收藏站点执行移除操作"],
      ["持久化", "登录用户写入后端；访客写入localStorage"],
    ])}
    `
  )
);

fullPages.push(
  page(
    "FR-04 自定义站点管理",
    `
    <p><b>描述</b>：用户可新增自定义站点快捷方式，并支持删除；系统应避免重复链接。</p>
    ${table([
      ["条目", "要求"],
      ["新增", "输入名称与URL，生成站点条目"],
      ["去重", "同一URL不应重复添加"],
      ["删除", "仅自定义站点允许删除"],
      ["持久化", "登录用户写入后端；访客写入localStorage"],
    ])}
    `
  )
);

fullPages.push(
  page(
    "FR-05 拖拽排序",
    `
    <p><b>描述</b>：用户可通过拖拽改变站点顺序，系统保存新排序并在下次打开时恢复。</p>
    ${table([
      ["条目", "要求"],
      ["拖拽交互", "拖拽手势生效，排序即时更新"],
      ["保存策略", "访客localStorage；登录用户保存到后端"],
      ["兼容性", "桌面端与移动端触控均可用"],
    ])}
    `
  )
);

fullPages.push(
  page(
    "FR-06 访客模式与时间限制",
    `
    <p><b>描述</b>：访客模式提供10分钟体验倒计时；接近到期提示数据将丢失，到期后引导注册/升级。</p>
    ${table([
      ["条目", "要求"],
      ["开始计时", "首次进入时记录开始时间"],
      ["倒计时展示", "在Header区域展示剩余时间"],
      ["警告提示", "临近到期展示提示语"],
      ["到期处理", "到期后限制部分操作并提示升级"],
    ])}
    `
  )
);

fullPages.push(
  page(
    "FR-07 登录与账号体系",
    `
    <p><b>描述</b>：系统支持用户登录/注册，登录后可跨会话持久化数据。</p>
    ${table([
      ["方式", "说明"],
      ["Email", "通过服务端路由进行认证处理"],
      ["WeChat", "支持微信相关认证流程"],
      ["会话管理", "支持刷新、过期处理与退出"],
    ])}
    `
  )
);

fullPages.push(
  page(
    "FR-08 地区识别与数据源适配",
    `
    <p><b>描述</b>：系统根据用户地区选择国内/海外数据通道，实现同一业务能力在不同后端上工作。</p>
    ${table([
      ["条目", "要求"],
      ["地区检测", "提供/使用地区检测接口"],
      ["海外", "使用Supabase等后端存储"],
      ["国内", "使用CloudBase相关接口/SDK"],
      ["统一接口", "通过适配器封装增删改查"],
    ])}
    `
  )
);

fullPages.push(
  page(
    "FR-09 支付与订阅（接口能力）",
    `
    <p><b>描述</b>：系统提供多支付渠道的创建、查询与回调通知接口，用于会员/订阅或增值服务的支付链路。</p>
    ${table([
      ["渠道", "接口"],
      ["Stripe", "create/check/webhook"],
      ["PayPal", "create/capture"],
      ["支付宝", "create/notify/verify"],
      ["微信支付", "create/notify"],
    ])}
    <p class="muted">说明：具体业务策略（商品、价格、权益）可在后续迭代中完善。</p>
    `
  )
);

// 5) 数据与接口（拆分多页）
fullPages.push(page("页面与路由（Page）清单", ul(routes.pages)));
fullPages.push(page("服务端接口（App Router）清单", ul(routes.appApi)));
fullPages.push(page("服务端接口（Pages API）清单", ul(routes.pagesApi)));

fullPages.push(
  page(
    "核心数据结构（概念模型）",
    table([
      ["实体", "关键字段", "说明"],
      ["Site", "id, name, url, category, custom, featured", "站点条目"],
      ["Favorite", "user_id, site_id", "用户收藏关系"],
      ["CustomWebsite", "user_id, name, url, icon, category, sort_order", "用户自定义站点"],
    ])
  )
);

fullPages.push(
  page(
    "数据持久化策略",
    `
    ${ul([
      "访客：localStorage 保存站点列表、收藏列表与试用开始时间",
      "登录用户：通过后端接口/适配器写入数据库（国内/海外差异化实现）",
      "迁移：可支持从访客数据迁移到登录用户（以业务逻辑实现为准）",
    ])}
    `
  )
);

// 6) 非功能性需求（多页）
fullPages.push(page("NFR-01 性能需求", ul([
  "首屏加载尽量减少阻塞，客户端渲染避免Hydration不一致",
  "列表渲染与拖拽交互需保持流畅（避免大规模重算）",
  "生产环境构建启用压缩与分包策略",
])));

fullPages.push(page("NFR-02 可靠性与容错", ul([
  "localStorage读取失败时需要兜底默认数据",
  "接口调用失败需提示并允许重试",
  "支付回调应具备签名/校验（由渠道要求决定）",
])));

fullPages.push(page("NFR-03 安全性", ul([
  "认证令牌不得在日志中泄露",
  "支付回调接口需校验来源与签名",
  "敏感配置通过环境变量注入，不写死在前端",
])));

fullPages.push(page("NFR-04 兼容性与可用性", ul([
  "适配桌面与移动端（响应式布局）",
  "触控拖拽与鼠标拖拽均可用",
  "中英文界面切换",
])));

// 7) 约束、验收与附录（做成大量页以保证 fullPages 足够长）
fullPages.push(page("约束与假设", ul([
  "依赖第三方服务可用性（Supabase/CloudBase/支付渠道）",
  "客户端需支持localStorage与现代JS特性",
  "支付相关流程需按各渠道文档配置密钥与回调地址",
])));

fullPages.push(page("验收要点（摘要）", table([
  ["编号", "验收项", "通过标准"],
  ["AC-01", "站点展示", "可正常展示内置站点并可分类浏览"],
  ["AC-02", "搜索筛选", "搜索与筛选组合生效"],
  ["AC-03", "收藏", "可加/取消收藏且状态可见"],
  ["AC-04", "自定义站点", "可新增/删除且避免重复"],
  ["AC-05", "拖拽排序", "拖拽后顺序可保存并恢复"],
  ["AC-06", "访客倒计时", "10分钟倒计时与到期提示生效"],
])));

// 生成附录页（可重复，用于补足页数）
function makeAppendixPage(idx) {
  return page(
    `附录A：接口与状态码（第${idx}页）`,
    `
    <p>本页为附录内容，用于软著材料补页。接口清单如下（节选）：</p>
    ${table([
      ["类型", "路径", "说明"],
      ["Auth", "/api/auth/email", "Email认证"],
      ["Auth", "/api/auth/wechat", "微信认证"],
      ["Geo", "/api/geo/detect", "地区检测"],
      ["Pay", "/api/payment/stripe/webhook", "Stripe回调"],
      ["Pay", "/api/payment/paypal/capture", "PayPal扣款确认"],
      ["Pay", "/api/payment/alipay/notify", "支付宝回调"],
      ["Pay", "/api/payment/wechat/notify", "微信回调"],
    ])}
    <p class="muted">状态码示例：200成功；400参数错误；401未认证；403无权限；500服务端异常。</p>
    `
  );
}

for (let i = 1; i <= 80; i += 1) {
  fullPages.push(makeAppendixPage(i));
}

// 选取“前30页 + 后30页”（不足则重复补足）
const need = 60;
const frontCount = 30;
const backCount = 30;

let front = fullPages.slice(0, frontCount);
let back = fullPages.slice(Math.max(0, fullPages.length - backCount));

let selected = [...front, ...back];
if (selected.length < need) {
  // 理论上不会发生（fullPages>=60），但为了稳妥补足
  const pad = [];
  while (selected.length + pad.length < need) {
    pad.push(fullPages[(selected.length + pad.length) % fullPages.length]);
  }
  selected = selected.concat(pad);
}

const css = `
:root { --fg: #111; --muted: #666; --border: #ddd; }
* { box-sizing: border-box; }
html, body { padding: 0; margin: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", Arial, sans-serif; color: var(--fg); }
@page { size: A4; margin: 16mm 14mm; }
.page { page-break-after: always; }
.page-header { border-bottom: 1px solid var(--border); padding-bottom: 6mm; margin-bottom: 6mm; }
.h1 { font-size: 15pt; font-weight: 700; letter-spacing: 0.2px; }
.meta { margin-top: 2mm; font-size: 10pt; color: var(--muted); }
.page-body h2 { font-size: 13pt; margin: 0 0 4mm 0; }
.page-body p { font-size: 10.5pt; line-height: 1.55; margin: 0 0 3mm 0; }
.page-body ul { margin: 0 0 3mm 5mm; padding: 0; }
.page-body li { font-size: 10.5pt; line-height: 1.55; margin: 0 0 2mm 0; }
.page-body dl { display: grid; grid-template-columns: 30mm 1fr; gap: 2mm 6mm; margin: 0 0 3mm 0; }
.page-body dt { font-weight: 700; font-size: 10.5pt; }
.page-body dd { margin: 0; font-size: 10.5pt; }
.page-footer { border-top: 1px solid var(--border); margin-top: 8mm; padding-top: 3mm; font-size: 9pt; color: var(--muted); }
.muted { color: var(--muted); }
table { width: 100%; border-collapse: collapse; margin: 0 0 3mm 0; }
th, td { border: 1px solid var(--border); padding: 2.2mm 2.5mm; vertical-align: top; font-size: 10pt; line-height: 1.4; }
th { background: #f6f6f6; }
`;

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(meta.softwareName)} - ${esc(meta.title)}</title>
  <style>${css}</style>
</head>
<body>
${selected.join("\n")}
</body>
</html>`;

const safeVersion = meta.version.replace(/[^0-9A-Za-z._-]/g, "_");
const baseName = `SRS_MATERIAL_first30_last30_60p_${safeVersion}`;
const htmlPath = path.join(outDir, `${baseName}.html`);
fs.writeFileSync(htmlPath, html, "utf8");

console.log("OK: wrote", htmlPath);
console.log("Pages (expected 60):", selected.length);
