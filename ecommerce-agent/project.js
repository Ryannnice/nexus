(function () {
  'use strict';

  var data = window.PROJECT_DATA;
  if (!data) return;

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var operationLabels = {
    read: '读取',
    write: '写入',
    compute: '计算',
    decision: '判断'
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function percent(value, digits) {
    if (value === null || typeof value === 'undefined') return '—';
    return (value * 100).toFixed(typeof digits === 'number' ? digits : 2) + '%';
  }

  function allTools() {
    return data.domains.reduce(function (items, domain) {
      return items.concat(domain.tools.map(function (tool) {
        return Object.assign({ domain: domain.id, domainName: domain.name }, tool);
      }));
    }, []);
  }

  var tools = allTools();
  var toolById = tools.reduce(function (index, tool) {
    index[tool.id] = tool;
    return index;
  }, {});

  function setupHeroDemo() {
    var root = $('#heroDemo');
    var traces = data.heroTraces || [];
    if (!root || !traces.length) return;

    var body = $('#heroTraceBody');
    var status = $('#heroDemoStatus');
    var queryLabel = $('#heroQueryLabel');
    var query = $('#heroDemoQuery');
    var resultsLabel = $('#heroResultsLabel');
    var results = $('#heroDemoResults');
    var matrix = $('#heroToolMatrix');
    var matrixCount = $('#heroMatrixCount');
    var footnote = $('#heroDemoFootnote');
    var dots = $('#heroTraceDots');
    var counter = $('#heroTraceCounter');
    var pauseButton = $('#heroDemoPause');
    var previousButton = $('#heroTracePrev');
    var nextButton = $('#heroTraceNext');
    var form = $('#heroPromptForm');
    var input = $('#heroPromptInput');
    var submitButton = $('#heroPromptSubmit');
    var exampleButton = $('#heroPromptExample');
    var resumeButton = $('#heroTraceResume');
    var message = $('#heroPromptMessage');
    var intentDetail = $('#heroIntentDetail');
    var intentState = $('#heroIntentState');
    var sourceDetail = $('#heroSourceDetail');
    var sourceState = $('#heroSourceState');
    var fusionDetail = $('#heroFusionDetail');
    var fusionState = $('#heroFusionState');
    var currentIndex = 0;
    var timer = null;
    var runToken = 0;
    var manualMode = false;
    var hoverPaused = false;
    var inputPaused = false;
    var userPaused = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cycleDelay = 6500;
    var defaultMessage = '前端即时匹配 100 项工具能力，不执行真实工具调用。';
    var samplePrompt = '查一下订单物流和预计送达时间，顺便看看有哪些可用优惠券。';

    var promptRules = [
      { pattern: /订单(详情|信息)|单笔订单|订单内容/i, tools: ['get_order_detail'] },
      { pattern: /订单列表|购买记录|交易记录|历史订单/i, tools: ['get_order_list'] },
      { pattern: /物流|快递|包裹轨迹|运输进度|logistics/i, tools: ['get_order_logistics'] },
      { pattern: /预计.*(送达|到货)|送达.*时间|多久能到|delivery time/i, tools: ['estimate_delivery_time'] },
      { pattern: /丢件|包裹.*丢|快递.*丢/i, tools: ['get_lost_package_process'] },
      { pattern: /运费|配送费/i, tools: ['query_delivery_fee'] },
      { pattern: /退款.*(进度|状态|到账|失败)|到账.*退款|refund status/i, tools: ['get_refund_status'] },
      { pattern: /能退多少|退款.*(金额|估算)/i, tools: ['get_refund_amount_estimate'] },
      { pattern: /申请退款|发起退款/i, tools: ['create_refund_request'] },
      { pattern: /退货|退换规则/i, tools: ['get_return_policy'] },
      { pattern: /售后.*(进度|状态)|工单.*(进度|状态)/i, tools: ['get_aftersale_ticket_status'] },
      { pattern: /创建.*售后|售后.*建单|破损.*处理|发起.*售后/i, tools: ['create_aftersale_ticket'] },
      { pattern: /质量争议|质量问题.*(规则|处理)|质量.*政策/i, tools: ['get_quality_issue_policy'] },
      { pattern: /评价.*(总结|摘要)|评论.*(总结|风险)|优缺点/i, tools: ['summarize_item_reviews'] },
      { pattern: /评价|评论|买家反馈|reviews?/i, tools: ['get_item_reviews'] },
      { pattern: /比价|哪.*便宜|更省钱|购买渠道/i, tools: ['compare_item_price'] },
      { pattern: /价格走势|历史价格|降价/i, tools: ['get_price_history'] },
      { pattern: /优惠券|可用券|领券|coupons?/i, tools: ['get_available_coupons'] },
      { pattern: /使用.*(优惠)?券|用(这张|掉|一下).*(优惠)?券|核销.*券/i, tools: ['apply_coupon'] },
      { pattern: /折扣|少付多少|优惠.*计算/i, tools: ['calc_discount'] },
      { pattern: /仓库|地区仓|本地仓/i, tools: ['get_warehouse_stock_region'] },
      { pattern: /库存|有货|余量|stock/i, tools: ['get_sku_stock'] },
      { pattern: /商品.*(详情|信息)|品牌|卖点/i, tools: ['get_item_info'] },
      { pattern: /规格|参数|尺寸|容量|功率/i, tools: ['get_item_specs'] },
      { pattern: /保修|质保/i, tools: ['get_item_warranty'] },
      { pattern: /维修|修理/i, tools: ['get_repair_service_policy'] },
      { pattern: /发票/i, tools: ['get_order_invoice'] },
      { pattern: /加入购物车/i, tools: ['create_cart_item'] },
      { pattern: /购物车.*(查看|汇总)|购物车里/i, tools: ['get_cart_summary'] },
      { pattern: /修改.*地址|更改.*地址/i, tools: ['modify_order_address'] },
      { pattern: /地址.*(查询|有哪些|可用)/i, tools: ['get_user_addresses'] },
      { pattern: /积分.*余额|有多少积分/i, tools: ['get_points_balance'] },
      { pattern: /会员等级|会员级别/i, tools: ['get_member_level'] },
      { pattern: /推荐|猜你喜欢/i, tools: ['get_recommendation_feed'] }
    ];

    function setPipeline(intent, source, fusion) {
      intentDetail.textContent = intent.detail;
      intentState.textContent = intent.state;
      sourceDetail.textContent = source.detail;
      sourceState.textContent = source.state;
      fusionDetail.textContent = fusion.detail;
      fusionState.textContent = fusion.state;
    }

    function renderMatrix(selectedIds) {
      var selected = new Set(selectedIds);
      matrix.innerHTML = tools.map(function (tool) {
        return '<i class="' + (selected.has(tool.id) ? 'selected' : '') + '"></i>';
      }).join('');
      matrixCount.textContent = selectedIds.length + ' SELECTED';
    }

    function renderRows(rows, tag) {
      results.innerHTML = rows.map(function (row) {
        var tool = toolById[row.id];
        return '<div class="result-row"><b>' + String(row.rank).padStart(2, '0') + '</b><span title="' + escapeHtml(tool ? tool.name : row.id) + '">' + escapeHtml(row.id) + '</span><em>' + tag + '</em></div>';
      }).join('');
    }

    function animateBody() {
      body.classList.remove('trace-enter');
      void body.offsetWidth;
      body.classList.add('trace-enter');
    }

    function renderDots() {
      dots.innerHTML = traces.map(function (trace, index) {
        var active = !manualMode && index === currentIndex;
        return '<button type="button" class="' + (active ? 'active' : '') + '" data-trace="' + index + '" aria-label="查看案例 ' + (index + 1) + '" aria-pressed="' + (active ? 'true' : 'false') + '"><i></i></button>';
      }).join('');
    }

    function updatePauseState() {
      var paused = manualMode || hoverPaused || inputPaused || userPaused;
      window.clearTimeout(timer);
      timer = null;
      root.classList.toggle('is-paused', paused);
      pauseButton.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      pauseButton.setAttribute('aria-label', userPaused ? '继续案例轮播' : '暂停案例轮播');
      pauseButton.firstElementChild.textContent = userPaused ? '▶' : 'Ⅱ';
      if (!paused) {
        timer = window.setTimeout(function () {
          renderTrace(currentIndex + 1);
        }, cycleDelay);
      }
    }

    function renderTrace(index) {
      var trace = traces[(index + traces.length) % traces.length];
      var gold = new Set(trace.gold);
      var recalled = trace.prediction.reduce(function (items, toolId, rank) {
        if (gold.has(toolId)) items.push({ id: toolId, rank: rank + 1 });
        return items;
      }, []);
      currentIndex = (index + traces.length) % traces.length;
      manualMode = false;
      runToken += 1;
      root.classList.remove('is-manual', 'is-running', 'is-chat');
      status.textContent = (trace.gold.length > 1 ? 'MULTI' : 'SINGLE') + '-INTENT · ' + recalled.length + ' / ' + trace.gold.length;
      queryLabel.textContent = 'USER QUERY · FIXED TEST · CONDENSED';
      query.textContent = trace.query;
      resultsLabel.textContent = 'RECALLED TOOLS · ALL ' + trace.gold.length + ' GOLD TOOLS';
      renderRows(recalled, 'GOLD');
      renderMatrix(trace.gold);
      setPipeline(
        { detail: '电商类 · 进入工具选择', state: 'PASS' },
        { detail: 'BM25 + Fine-tuned Embedding', state: 'TOP 50' },
        { detail: 'Source + Task Reranker RRF', state: 'TOP 10' }
      );
      footnote.innerHTML = '固定测试集回放 · <strong>' + escapeHtml(trace.id) + '</strong>';
      counter.textContent = String(currentIndex + 1).padStart(2, '0') + ' / ' + String(traces.length).padStart(2, '0');
      message.textContent = defaultMessage;
      resumeButton.hidden = true;
      submitButton.disabled = false;
      renderDots();
      animateBody();
      updatePauseState();
    }

    function normalize(value) {
      return String(value).toLowerCase().replace(/[^\u3400-\u9fffa-z0-9]+/g, '');
    }

    function ngrams(value, size) {
      var output = [];
      for (var index = 0; index <= value.length - size; index += 1) output.push(value.slice(index, index + size));
      return Array.from(new Set(output));
    }

    function matchPrompt(value) {
      var scores = {};
      var ruleMatches = new Set();
      var normalizedQuery = normalize(value);
      var pairs = ngrams(normalizedQuery, 2);
      var triples = ngrams(normalizedQuery, 3);

      promptRules.forEach(function (rule) {
        if (!rule.pattern.test(value)) return;
        rule.tools.forEach(function (toolId) {
          ruleMatches.add(toolId);
          scores[toolId] = (scores[toolId] || 0) + 30;
        });
      });

      tools.forEach(function (tool) {
        var haystack = normalize(tool.name + tool.description + tool.domainName + tool.id);
        var lexical = 0;
        pairs.forEach(function (part) { if (haystack.indexOf(part) !== -1) lexical += .45; });
        triples.forEach(function (part) { if (haystack.indexOf(part) !== -1) lexical += .9; });
        if (lexical) scores[tool.id] = (scores[tool.id] || 0) + lexical;
      });

      return Object.keys(scores).map(function (toolId) {
        return { id: toolId, score: scores[toolId] };
      }).filter(function (item) {
        return ruleMatches.size ? ruleMatches.has(item.id) : item.score >= 2;
      }).sort(function (left, right) {
        return right.score - left.score || left.id.localeCompare(right.id);
      }).slice(0, 5).map(function (item, index) {
        return { id: item.id, rank: index + 1 };
      });
    }

    function renderManualResult(matched) {
      var hasTools = matched.length > 0;
      root.classList.remove('is-running');
      root.classList.toggle('is-chat', !hasTools);
      status.textContent = hasTools ? 'CUSTOM PROMPT · ' + matched.length + ' MATCHES' : 'OPEN CHAT · NO TOOL';
      resultsLabel.textContent = hasTools ? 'TOP MATCHES · CLIENT-SIDE CATALOG DEMO' : 'ROUTE RESULT · NO TOOL CALL';
      if (hasTools) {
        renderRows(matched, 'MATCH');
        renderMatrix(matched.map(function (item) { return item.id; }));
        setPipeline(
          { detail: '电商类 · 进入目录匹配', state: 'PASS' },
          { detail: '100 项 Catalog 字段即时匹配', state: '100 TOOLS' },
          { detail: '规则 + 文本相关度排序', state: 'TOP ' + matched.length }
        );
        message.textContent = '目录匹配已完成；该结果用于页面交互演示。';
      } else {
        results.innerHTML = '<div class="result-row result-row-empty"><b>—</b><span>直接响应 · 工具检索旁路</span><em>CHAT</em></div>';
        renderMatrix([]);
        setPipeline(
          { detail: '开放闲聊 · 工具检索旁路', state: 'CHAT' },
          { detail: '未触发电商能力', state: 'BYPASS' },
          { detail: '无需生成工具短名单', state: 'BYPASS' }
        );
        message.textContent = '未匹配到明确的电商工具能力，示例按开放问题旁路展示。';
      }
      footnote.innerHTML = '浏览器端目录匹配 · <strong>不调用模型或真实工具</strong>';
      submitButton.disabled = false;
      submitButton.innerHTML = 'RUN <span aria-hidden="true">↗</span>';
      animateBody();
    }

    function runPrompt(value) {
      var token = runToken + 1;
      var matched = matchPrompt(value);
      runToken = token;
      manualMode = true;
      window.clearTimeout(timer);
      root.classList.add('is-manual', 'is-running');
      root.classList.remove('is-chat');
      queryLabel.textContent = 'YOUR PROMPT · LOCAL INTERACTIVE DEMO';
      query.textContent = value;
      status.textContent = 'ANALYZING PROMPT';
      resultsLabel.textContent = 'MATCHING AGAINST 100 TOOL CATALOG';
      results.innerHTML = '<div class="result-row result-row-loading"><b>··</b><span>正在解析请求并匹配能力目录</span><em>RUN</em></div>';
      renderMatrix([]);
      setPipeline(
        { detail: '正在识别请求类型', state: 'RUN' },
        { detail: '等待 Intent 结果', state: 'WAIT' },
        { detail: '等待候选工具', state: 'WAIT' }
      );
      footnote.innerHTML = '浏览器端交互演示 · <strong>LOCAL ONLY</strong>';
      counter.textContent = 'CUSTOM';
      message.textContent = '正在运行目录匹配…';
      resumeButton.hidden = false;
      submitButton.disabled = true;
      submitButton.textContent = 'RUNNING';
      renderDots();
      animateBody();

      window.setTimeout(function () {
        if (token !== runToken) return;
        intentDetail.textContent = matched.length ? '电商类 · 进入目录匹配' : '开放闲聊 · 工具检索旁路';
        intentState.textContent = matched.length ? 'PASS' : 'CHAT';
        sourceDetail.textContent = matched.length ? '正在扫描 100 项工具能力' : '未触发电商能力';
        sourceState.textContent = matched.length ? 'RUN' : 'BYPASS';
      }, 260);
      window.setTimeout(function () {
        if (token !== runToken) return;
        sourceState.textContent = matched.length ? '100 TOOLS' : 'BYPASS';
        fusionDetail.textContent = matched.length ? '正在合并规则与文本相关度' : '无需生成工具短名单';
        fusionState.textContent = matched.length ? 'RUN' : 'BYPASS';
      }, 620);
      window.setTimeout(function () {
        if (token !== runToken) return;
        renderManualResult(matched);
      }, 980);
    }

    previousButton.addEventListener('click', function () { renderTrace(currentIndex - 1); });
    nextButton.addEventListener('click', function () { renderTrace(currentIndex + 1); });
    dots.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-trace]');
      if (button) renderTrace(Number(button.getAttribute('data-trace')));
    });
    pauseButton.addEventListener('click', function () {
      userPaused = !userPaused;
      updatePauseState();
    });
    root.addEventListener('pointerenter', function (event) {
      if (event.pointerType === 'mouse') { hoverPaused = true; updatePauseState(); }
    });
    root.addEventListener('pointerleave', function (event) {
      if (event.pointerType === 'mouse') { hoverPaused = false; updatePauseState(); }
    });
    input.addEventListener('focus', function () { inputPaused = true; updatePauseState(); });
    input.addEventListener('blur', function () { inputPaused = false; updatePauseState(); });
    exampleButton.addEventListener('click', function () {
      input.value = samplePrompt;
      input.focus();
      message.textContent = '示例已填入，点击 RUN 查看匹配结果。';
    });
    resumeButton.addEventListener('click', function () {
      input.value = '';
      renderTrace(currentIndex);
    });
    form.addEventListener('submit', function (event) {
      var value = input.value.trim();
      event.preventDefault();
      if (!value) {
        message.textContent = '请先输入一条电商请求。';
        input.focus();
        return;
      }
      runPrompt(value);
    });

    renderTrace(0);
  }

  function renderAtlas() {
    var summary = $('#domainSummary');
    var filters = $('#atlasFilters');
    var atlas = $('#toolAtlas');
    var count = $('#atlasCount');
    if (!summary || !filters || !atlas) return;

    summary.innerHTML = data.domains.map(function (domain) {
      return '<article><strong>' + domain.tools.length + '</strong><span>' + escapeHtml(domain.name) + '</span><small>' + escapeHtml(domain.description) + '</small></article>';
    }).join('');

    filters.innerHTML = '<button type="button" class="active" data-domain="all" aria-pressed="true">全部 · 100</button>' +
      data.domains.map(function (domain) {
        return '<button type="button" data-domain="' + domain.id + '" aria-pressed="false">' + escapeHtml(domain.name) + ' · ' + domain.tools.length + '</button>';
      }).join('');

    atlas.innerHTML = tools.map(function (tool, index) {
      return '<button type="button" class="tool-cell" data-domain="' + tool.domain + '" data-tool="' + tool.id + '" aria-label="查看工具 ' + escapeHtml(tool.name) + '">' +
        '<strong>' + String(index + 1).padStart(3, '0') + ' · ' + escapeHtml(tool.name) + '</strong>' +
        '<span>' + escapeHtml(tool.id) + '</span></button>';
    }).join('');

    filters.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-domain]');
      if (!button) return;
      var domainId = button.getAttribute('data-domain');
      $$('button', filters).forEach(function (item) {
        var active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      var visible = 0;
      $$('.tool-cell', atlas).forEach(function (cell) {
        var show = domainId === 'all' || cell.getAttribute('data-domain') === domainId;
        cell.hidden = !show;
        if (show) visible += 1;
      });
      count.textContent = visible;
    });

    atlas.addEventListener('click', function (event) {
      var cell = event.target.closest('.tool-cell');
      if (!cell) return;
      $$('.tool-cell.active', atlas).forEach(function (item) { item.classList.remove('active'); });
      cell.classList.add('active');
      renderToolDetail(toolById[cell.getAttribute('data-tool')]);
    });
  }

  function renderToolDetail(tool) {
    var root = $('#toolDetail');
    if (!root || !tool) return;
    var confusable = tool.confusable.length ? tool.confusable.map(function (id) {
      var related = toolById[id];
      return '<code>' + escapeHtml(id) + (related ? ' · ' + escapeHtml(related.name) : '') + '</code>';
    }).join('') : '<code>无显式易混工具</code>';

    root.innerHTML = '<span class="corner-square" aria-hidden="true"></span>' +
      '<p class="tool-detail-kicker">CATALOG INSPECTOR</p>' +
      '<h3>' + escapeHtml(tool.name) + '</h3>' +
      '<p class="tool-id">' + escapeHtml(tool.id) + '</p>' +
      '<p>' + escapeHtml(tool.description) + '</p>' +
      '<div class="tool-meta"><div><span>DOMAIN</span><strong>' + escapeHtml(tool.domainName) + '</strong></div><div><span>OPERATION</span><strong>' + escapeHtml(operationLabels[tool.operation] || tool.operation) + '</strong></div></div>' +
      '<div class="confusable-list"><span>CONFUSABLE BOUNDARIES</span>' + confusable + '</div>';
  }

  function renderAudit() {
    var grid = $('#auditGrid');
    var context = $('#contextMetrics');
    if (grid) {
      grid.innerHTML = data.audit.map(function (item) {
        return '<article class="audit-card"><strong>' + escapeHtml(item.value) + '</strong><span>' + escapeHtml(item.label) + '</span><small>' + escapeHtml(item.detail) + '</small></article>';
      }).join('');
    }
    if (context) {
      context.innerHTML = data.contextAudit.map(function (item) {
        return '<div class="context-row"><strong>' + percent(item.value, item.value < .1 ? 2 : 1) + '</strong><div><span>' + escapeHtml(item.label) + '</span><small>' + escapeHtml(item.interpretation) + '</small></div></div>';
      }).join('');
    }
  }

  var activeMetric = 'a10';

  function renderRetrievalCharts(metric) {
    activeMetric = metric;
    renderRetrievalTrack($('#genericChart'), data.metrics.retrieval.generic, metric, false);
    renderRetrievalTrack($('#trainedChart'), data.metrics.retrieval.trained, metric, true);
  }

  function renderRetrievalTrack(root, rows, metric, trained) {
    if (!root) return;
    root.innerHTML = rows.map(function (row, index) {
      var value = row[metric];
      var isFinal = trained && index === rows.length - 1;
      var width = value === null ? 0 : Math.max(0, Math.min(100, value * 100));
      return '<div class="chart-row' + (isFinal ? ' is-final' : '') + '">' +
        '<div class="chart-row-head"><strong>' + escapeHtml(row.short) + '</strong><span>' + escapeHtml(row.note) + '</span></div>' +
        '<div class="chart-track"><div class="chart-fill" style="--bar-width:' + width.toFixed(3) + '%"></div></div>' +
        '<div class="chart-value">' + percent(value, 2) + '</div>' +
      '</div>';
    }).join('');
  }

  function setupMetricSwitch() {
    var root = $('#metricSwitch');
    if (!root) return;
    root.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-metric]');
      if (!button) return;
      $$('button', root).forEach(function (item) { item.classList.toggle('active', item === button); });
      renderRetrievalCharts(button.getAttribute('data-metric'));
    });
  }

  function renderIntent() {
    var root = $('#intentChart');
    if (!root) return;
    root.innerHTML = data.metrics.intent.map(function (row) {
      var finalClass = row.kind === 'final' ? ' is-final' : (row.kind === 'baseline' ? ' is-baseline' : '');
      return '<div class="intent-row' + finalClass + '">' +
        '<span>' + escapeHtml(row.short) + '</span>' +
        '<div class="intent-track" title="Macro-F1 ' + percent(row.f1, 2) + '"><div class="intent-fill" style="--bar-width:' + (row.accuracy * 100).toFixed(3) + '%"></div></div>' +
        '<strong>' + percent(row.accuracy, 2) + '</strong>' +
      '</div>';
    }).join('');
  }

  function renderInsight() {
    var root = $('#insightChart');
    if (!root) return;
    root.innerHTML = data.metrics.rerankerInsight.map(function (row) {
      return '<div class="insight-row is-' + row.tone + '">' +
        '<div class="insight-label"><strong>' + escapeHtml(row.label) + '</strong><small>' + escapeHtml(row.note) + '</small></div>' +
        '<div class="insight-track"><div class="insight-fill" style="--bar-width:' + (row.value * 100).toFixed(3) + '%"></div></div>' +
        '<div class="insight-value">' + percent(row.value, 2) + '</div>' +
      '</div>';
    }).join('');
  }

  function renderTransitions() {
    var bar = $('#transitionBar');
    var legend = $('#transitionLegend');
    if (!bar || !legend) return;
    var total = data.transitions.reduce(function (sum, item) { return sum + item.value; }, 0);
    bar.innerHTML = data.transitions.map(function (item) {
      return '<div class="transition-segment ' + item.tone + '" style="--segment-width:' + ((item.value / total) * 100).toFixed(4) + '%" title="' + escapeHtml(item.label) + ': ' + item.value + '"></div>';
    }).join('');
    legend.innerHTML = data.transitions.map(function (item) {
      return '<div class="transition-key ' + item.tone + '"><i></i><div><strong>' + item.value.toLocaleString('zh-CN') + '</strong><span>' + escapeHtml(item.label) + '</span></div></div>';
    }).join('');
  }

  function renderFailures() {
    var root = $('#failureChart');
    if (!root) return;
    root.innerHTML = data.metrics.failures.map(function (row) {
      return '<div class="failure-row">' +
        '<span>' + row.tools + ' 工具</span>' +
        '<div class="failure-bars">' +
          '<div class="failure-track" title="Embedding 单路 ' + percent(row.embedding, 2) + '"><div class="failure-fill" style="--bar-width:' + (row.embedding * 100).toFixed(3) + '%"></div></div>' +
          '<div class="failure-track final" title="最终链路 ' + percent(row.final, 2) + '"><div class="failure-fill" style="--bar-width:' + (row.final * 100).toFixed(3) + '%"></div></div>' +
        '</div>' +
        '<strong>' + percent(row.final, 2) + '</strong>' +
      '</div>';
    }).join('') + '<div class="failure-legend"><span><i></i>Embedding 单路</span><span><i></i>最终链路</span></div>';

    var ranks = $('#rankBandList');
    if (ranks) {
      var max = Math.max.apply(null, data.rankBands.map(function (row) { return row.value; }));
      ranks.innerHTML = data.rankBands.map(function (row) {
        return '<div class="rank-band-row"><span>' + escapeHtml(row.label) + '</span><div class="rank-band-track"><div class="rank-band-fill" style="--bar-width:' + ((row.value / max) * 100).toFixed(3) + '%"></div></div><strong>' + row.value + '</strong></div>';
      }).join('');
    }
  }

  function renderCases() {
    var tabs = $('#caseTabs');
    if (!tabs) return;
    tabs.innerHTML = data.cases.map(function (item, index) {
      return '<button type="button" role="tab" aria-selected="' + (index === 0 ? 'true' : 'false') + '" class="' + (index === 0 ? 'active' : '') + '" data-case="' + index + '">' + escapeHtml(item.label) + '</button>';
    }).join('');
    tabs.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-case]');
      if (!button) return;
      $$('button', tabs).forEach(function (item) {
        var active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      renderCase(Number(button.getAttribute('data-case')));
    });
    renderCase(0);
  }

  function renderCase(index) {
    var root = $('#caseViewer');
    var item = data.cases[index];
    if (!root || !item) return;
    var gold = new Set(item.gold);
    var note = item.note || '全部 Gold Tools 位于前四名，严格集合覆盖成功。';
    var rows = item.prediction.map(function (toolId, rank) {
      var isGold = gold.has(toolId);
      var outside = rank >= 6;
      return '<div class="case-rank-row' + (isGold ? ' is-gold' : '') + (outside ? ' beyond-k' : '') + '">' +
        '<b>' + String(rank + 1).padStart(2, '0') + '</b><span>' + escapeHtml(toolId) + '</span><em>' + (isGold ? (outside ? 'GOLD · OUTSIDE K=6' : 'GOLD') : (outside ? 'OUTSIDE K=6' : 'CANDIDATE')) + '</em></div>';
    }).join('');
    root.innerHTML = '<div class="case-query-panel">' +
      '<div class="case-meta"><span>FROZEN TEST · ' + escapeHtml(item.id) + '</span><strong>' + escapeHtml(item.label) + '</strong></div>' +
      '<blockquote>“' + escapeHtml(item.query) + '”</blockquote>' +
      '<p class="case-note">' + escapeHtml(note) + '</p>' +
      '</div>' +
      '<div class="case-ranking"><div class="case-ranking-head"><span>FINAL RANKING · TOP-6 DIAGNOSTIC</span><span>' + item.gold.length + ' GOLD TOOLS</span></div>' + rows + '</div>';
  }

  function renderCompetition() {
    var root = $('#competitionBody');
    if (!root) return;
    root.innerHTML = data.competition.map(function (row) {
      return '<tr><td>' + escapeHtml(row.missing) + '</td><td>' + escapeHtml(row.competing) + '</td><td>' + row.count + '</td></tr>';
    }).join('');
  }

  function setupNavigation() {
    var nav = $('#siteNav');
    var toggle = $('#navToggle');
    var links = $('#navLinks');
    var toTop = $('#toTop');
    if (!nav || !toggle || !links) return;

    function onScroll() {
      nav.classList.toggle('scrolled', window.scrollY > 8);
      if (toTop) toTop.classList.toggle('show', window.scrollY > 720);
    }

    function closeMenu() {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', '打开导航菜单');
      document.body.classList.remove('menu-open');
    }

    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
      document.body.classList.toggle('menu-open', open);
    });

    links.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }

    var anchorLinks = $$('a[href^="#"]', links);
    var sections = anchorLinks.map(function (link) {
      return document.getElementById(link.getAttribute('href').slice(1));
    }).filter(Boolean);
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          anchorLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
          });
        });
      }, { rootMargin: '-42% 0px -52% 0px', threshold: 0 });
      sections.forEach(function (section) { observer.observe(section); });
    }
  }

  function setupCopy() {
    var button = $('#copyCommands');
    var source = $('#reproCommands');
    var status = $('#copyStatus');
    if (!button || !source || !status) return;

    button.addEventListener('click', function () {
      var value = source.innerText;
      var copyPromise;
      if (navigator.clipboard && window.isSecureContext) {
        copyPromise = navigator.clipboard.writeText(value);
      } else {
        copyPromise = new Promise(function (resolve, reject) {
          var area = document.createElement('textarea');
          area.value = value;
          area.style.position = 'fixed';
          area.style.opacity = '0';
          document.body.appendChild(area);
          area.select();
          try {
            document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
          } catch (error) {
            reject(error);
          }
          area.remove();
        });
      }
      copyPromise.then(function () {
        status.textContent = '命令已复制。';
        window.setTimeout(function () { status.textContent = ''; }, 2200);
      }).catch(function () {
        status.textContent = '复制失败，请手动选择命令。';
      });
    });
  }

  setupHeroDemo();
  renderAtlas();
  renderAudit();
  renderRetrievalCharts(activeMetric);
  setupMetricSwitch();
  renderIntent();
  renderInsight();
  renderTransitions();
  renderFailures();
  renderCases();
  renderCompetition();
  setupNavigation();
  setupCopy();
})();
