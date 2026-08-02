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
    var intentDetail = $('#heroIntentDetail');
    var intentState = $('#heroIntentState');
    var sourceDetail = $('#heroSourceDetail');
    var sourceState = $('#heroSourceState');
    var fusionDetail = $('#heroFusionDetail');
    var fusionState = $('#heroFusionState');
    var currentIndex = 0;
    var timer = null;
    var userPaused = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cycleDelay = 6500;

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
      matrixCount.textContent = selectedIds.length + ' 个目标工具';
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
        var active = index === currentIndex;
        return '<button type="button" class="' + (active ? 'active' : '') + '" data-trace="' + index + '" aria-label="查看案例 ' + (index + 1) + '：' + escapeHtml(trace.label) + '" aria-pressed="' + (active ? 'true' : 'false') + '"><i></i></button>';
      }).join('');
    }

    function updatePauseState() {
      var paused = userPaused;
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
      var caseNumber = String((index + traces.length) % traces.length + 1).padStart(2, '0');
      var isChat = trace.type === 'chat';
      currentIndex = (index + traces.length) % traces.length;
      queryLabel.textContent = '案例 ' + caseNumber + ' · ' + trace.label + ' · ' + (isChat ? '意图分流固定集合' : '固定检索测试');
      query.textContent = trace.query;
      counter.textContent = caseNumber + ' / ' + String(traces.length).padStart(2, '0');

      if (isChat) {
        status.textContent = '闲聊 · 旁路';
        resultsLabel.textContent = '分流结果 · 无需工具调用';
        results.innerHTML = '<div class="result-row result-row-empty"><b>—</b><span>直接响应 · 工具检索旁路</span><em>闲聊</em></div>';
        renderMatrix([]);
        setPipeline(
          { detail: '闲聊类 · 直接响应', state: '闲聊' },
          { detail: '无需进入工具检索', state: '旁路' },
          { detail: '无需生成工具短名单', state: '旁路' }
        );
        footnote.innerHTML = '意图分流固定集合案例 · <strong>' + escapeHtml(trace.id) + '</strong>';
      } else {
        var gold = new Set(trace.gold);
        var recalled = trace.prediction.reduce(function (items, toolId, rank) {
          if (gold.has(toolId)) items.push({ id: toolId, rank: rank + 1 });
          return items;
        }, []);
        status.textContent = (trace.gold.length > 1 ? '多工具' : '单工具') + ' · ' + recalled.length + ' / ' + trace.gold.length;
        resultsLabel.textContent = '已召回全部 ' + trace.gold.length + ' 个目标工具';
        renderRows(recalled, '目标');
        renderMatrix(trace.gold);
        setPipeline(
          { detail: '电商类 · 进入工具选择', state: '通过' },
          { detail: 'BM25 + 负样本训练向量模型', state: '前 40' },
          { detail: '精排 20 + 二级 RRF', state: '输出 10' }
        );
        footnote.innerHTML = '固定检索集案例 · <strong>' + escapeHtml(trace.id) + '</strong>';
      }

      renderDots();
      animateBody();
      updatePauseState();
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
    if (grid) {
      var directChecks = data.audit.slice(0, 4);
      var allClear = directChecks.every(function (item) { return item.value === '0'; });
      var context = data.contextAudit;
      grid.innerHTML =
        '<tr><td><strong>显式泄漏检查</strong></td><td><strong>' + directChecks.length + ' 项均为 ' + (allClear ? '0' : '非 0') + '</strong><small>严格审计' + (allClear ? '通过' : '未通过') + '</small></td><td>归一化请求、Trace ID、工具目录触发词和表达簇</td></tr>' +
        '<tr><td><strong>上下文复用检查</strong></td><td><strong>' + escapeHtml(percent(context[0].value, 1)) + ' 骨架复用</strong><small>' + escapeHtml(percent(context[1].value, 2)) + ' 同骨架工具链 · ' + escapeHtml(percent(context[2].value, 2)) + ' 仅上下文 AllHit@10</small></td><td>场景可以复用，但不能靠骨架猜出目标工具组合</td></tr>';
    }
  }

  function renderIntent() {
    var root = $('#intentChart');
    if (!root) return;
    root.innerHTML = '<div class="intent-chart-head"><span>MODEL</span><span>ACCURACY BAR</span><span>ACC.</span><span>MACRO-F1</span></div>' +
      data.metrics.intent.map(function (row) {
        var finalClass = row.kind === 'final' ? ' is-final' : (row.kind === 'baseline' ? ' is-baseline' : '');
        return '<div class="intent-row' + finalClass + '">' +
          '<span>' + escapeHtml(row.short) + '</span>' +
          '<div class="intent-track" title="Accuracy ' + percent(row.accuracy, 2) + '"><div class="intent-fill" style="--bar-width:' + (row.accuracy * 100).toFixed(3) + '%"></div></div>' +
          '<strong>' + percent(row.accuracy, 2) + '</strong>' +
          '<em>' + percent(row.f1, 2) + '</em>' +
        '</div>';
      }).join('');
  }

  var activePlanningMetric = 'setEm';
  var planningMetricLabels = {
    setEm: 'SET EXACT MATCH',
    traceEm: 'TRACE EXACT MATCH',
    microF1: 'MICRO-F1',
    validRate: 'STRICT OUTPUT VALID RATE'
  };

  function renderPlanningResults(metric) {
    var root = $('#a3ResultChart');
    var planning = data.planning;
    if (!root || !planning) return;
    activePlanningMetric = metric;

    var groups = [];
    planning.formalResults.forEach(function (row) {
      var key = row.stageKey + '-' + row.modelShort;
      var group = groups.find(function (item) { return item.key === key; });
      if (!group) {
        group = {
          key: key,
          stage: row.stage,
          stageKey: row.stageKey,
          model: row.model,
          rows: []
        };
        groups.push(group);
      }
      group.rows.push(row);
    });

    root.innerHTML = '<div class="a3-chart-legend"><span><i></i>Wo-RAG · 100</span><span><i></i>RAG@10</span><strong>' + escapeHtml(planningMetricLabels[metric]) + '</strong></div>' +
      '<div class="a3-result-groups">' + groups.map(function (group) {
        return '<article class="a3-result-group is-' + escapeHtml(group.stageKey) + '">' +
          '<div class="a3-result-group-head"><span>' + escapeHtml(group.stage) + '</span><strong>' + escapeHtml(group.model) + '</strong></div>' +
          group.rows.map(function (row) {
            var value = row[metric];
            return '<div class="a3-result-view is-' + escapeHtml(row.viewKey) + '">' +
              '<span>' + escapeHtml(row.view) + '</span>' +
              '<div class="a3-result-track"><i style="--bar-width:' + (value * 100).toFixed(3) + '%"></i></div>' +
              '<strong>' + percent(value, 2) + '</strong>' +
            '</div>';
          }).join('') +
        '</article>';
      }).join('') + '</div>';
  }

  function setupPlanningMetricSwitch() {
    var root = $('#a3MetricSwitch');
    if (!root) return;
    root.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-a3-metric]');
      if (!button) return;
      $$('button[data-a3-metric]', root).forEach(function (item) {
        var active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      renderPlanningResults(button.getAttribute('data-a3-metric'));
    });
  }

  var activeScaleMetric = 'setEm';

  function renderPlanningScale(metric) {
    var root = $('#a3ScaleChart');
    var planning = data.planning;
    if (!root || !planning || !planning.scaleAblation) return;
    activeScaleMetric = metric;

    var groupOrder = [
      { model: '4B', viewKey: 'global' },
      { model: '4B', viewKey: 'rag' },
      { model: '8B', viewKey: 'global' },
      { model: '8B', viewKey: 'rag' }
    ];

    root.innerHTML = '<div class="a3-scale-legend">' +
      '<span><i></i>其他规模点</span><span><i></i>54K 系统端点</span>' +
      '<strong>' + escapeHtml(planningMetricLabels[metric]) + ' · AXIS 90–100%</strong>' +
      '</div><div class="a3-scale-groups">' +
      groupOrder.map(function (group) {
        var rows = planning.scaleAblation.filter(function (row) {
          return row.modelShort === group.model && row.viewKey === group.viewKey;
        });
        if (!rows.length) return '';
        return '<article class="a3-scale-group">' +
          '<header><span>QWEN3-' + escapeHtml(group.model) + '</span><strong>' + escapeHtml(rows[0].view) + '</strong></header>' +
          rows.map(function (row) {
            var value = row[metric];
            var axisWidth = Math.max(0, Math.min(100, ((value - 0.9) / 0.1) * 100));
            var endpoint = row.dataSize === 54000;
            return '<div class="a3-scale-row' + (endpoint ? ' is-endpoint' : '') + '">' +
              '<span>' + escapeHtml(row.dataLabel) + '</span>' +
              '<div class="a3-scale-track" role="img" aria-label="' + escapeHtml(row.model + ' ' + row.view + ' ' + row.dataLabel + ' ' + planningMetricLabels[metric] + ' ' + percent(value, 2)) + '">' +
                '<i style="--bar-width:' + axisWidth.toFixed(3) + '%"></i>' +
              '</div>' +
              '<strong>' + percent(value, 2) + '</strong>' +
            '</div>';
          }).join('') +
        '</article>';
      }).join('') +
      '</div>';
  }

  function setupPlanningScaleMetricSwitch() {
    var root = $('#a3ScaleMetricSwitch');
    if (!root) return;
    root.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-a3-scale-metric]');
      if (!button) return;
      $$('button[data-a3-scale-metric]', root).forEach(function (item) {
        var active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      renderPlanningScale(button.getAttribute('data-a3-scale-metric'));
    });
  }

  function renderPlanningCandidateOrder() {
    var root = $('#a3CandidateOrderChart');
    var planning = data.planning;
    if (!root || !planning) return;
    var viewOrder = ['global', 'rag'];
    root.innerHTML = viewOrder.map(function (viewKey) {
      var rows = planning.candidateOrder.filter(function (row) { return row.viewKey === viewKey; });
      if (!rows.length) return '';
      return '<div class="a3-order-group">' +
        '<div class="a3-order-group-head"><strong>' + escapeHtml(rows[0].view) + '</strong><span>TRACEEM / STABILITY</span></div>' +
        rows.map(function (row) {
          return '<div class="a3-order-row is-' + escapeHtml(row.viewKey) + '">' +
            '<span>' + escapeHtml(row.variant) + '</span>' +
            '<div class="a3-order-track"><i style="--bar-width:' + (row.traceEm * 100).toFixed(3) + '%"></i></div>' +
            '<strong>' + percent(row.traceEm, 2) + '</strong>' +
            '<small>' + percent(row.traceStability, 1) + '</small>' +
          '</div>';
        }).join('') +
      '</div>';
    }).join('');
  }

  function renderPlanningCounterfactual() {
    var root = $('#a3CounterfactualChart');
    var planning = data.planning;
    if (!root || !planning) return;
    root.innerHTML = '<div class="a3-counterfactual-head"><span>MODEL</span><span>PAIR-BOTH TRACEEM</span><span>ORDER FOLLOWING</span></div>' +
      planning.counterfactual.map(function (row) {
        return '<div class="a3-counterfactual-row is-' + escapeHtml(row.stageKey) + '">' +
          '<span><b>' + escapeHtml(row.model) + '</b> ' + escapeHtml(row.stage) + '</span>' +
          '<div class="a3-counterfactual-track"><i style="--bar-width:' + (row.pairBothTraceEm * 100).toFixed(3) + '%"></i></div>' +
          '<strong>' + percent(row.pairBothTraceEm, 2) + '</strong>' +
          '<small>' + percent(row.orderFollowing, 1) + '</small>' +
        '</div>';
      }).join('');
  }

  function renderPlanningCases() {
    var tabs = $('#a3CaseTabs');
    var planning = data.planning;
    if (!tabs || !planning || !planning.cases.length) return;
    tabs.innerHTML = planning.cases.map(function (item, index) {
      return '<button type="button" role="tab" id="a3-case-tab-' + index + '" aria-controls="a3CaseViewer" aria-selected="' + (index === 0 ? 'true' : 'false') + '" tabindex="' + (index === 0 ? '0' : '-1') + '" class="' + (index === 0 ? 'active' : '') + '" data-a3-case="' + index + '">' + escapeHtml(item.label) + '</button>';
    }).join('');

    function activate(button) {
      $$('button[data-a3-case]', tabs).forEach(function (item) {
        var active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', active ? 'true' : 'false');
        item.tabIndex = active ? 0 : -1;
      });
      renderPlanningCase(Number(button.getAttribute('data-a3-case')));
    }

    tabs.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-a3-case]');
      if (button) activate(button);
    });
    tabs.addEventListener('keydown', function (event) {
      var current = event.target.closest('button[data-a3-case]');
      if (!current || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      var buttons = $$('button[data-a3-case]', tabs);
      var currentIndex = buttons.indexOf(current);
      var nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : event.key === 'ArrowLeft' ? (currentIndex - 1 + buttons.length) % buttons.length : (currentIndex + 1) % buttons.length;
      buttons[nextIndex].focus();
      activate(buttons[nextIndex]);
    });
    renderPlanningCase(0);
  }

  function renderPlanningSequence(ids, gold, predicted) {
    return ids.map(function (toolId, index) {
      var tone = '';
      if (predicted) {
        tone = gold[index] === toolId ? ' is-position-match' : (gold.includes(toolId) ? ' is-set-match' : ' is-wrong');
      }
      return '<span class="a3-sequence-step' + tone + '"><code>' + escapeHtml(toolId) + '</code>' + (index < ids.length - 1 ? '<i aria-hidden="true">→</i>' : '') + '</span>';
    }).join('');
  }

  function renderPlanningCase(index) {
    var root = $('#a3CaseViewer');
    var planning = data.planning;
    var item = planning && planning.cases[index];
    if (!root || !item) return;
    root.setAttribute('role', 'tabpanel');
    root.setAttribute('aria-labelledby', 'a3-case-tab-' + index);
    root.innerHTML = '<div class="a3-case-query">' +
      '<div class="a3-case-meta"><span>' + escapeHtml(item.view) + '</span><strong>' + escapeHtml(item.id) + '</strong></div>' +
      '<blockquote>“' + escapeHtml(item.query) + '”</blockquote>' +
      '<p>' + escapeHtml(item.note) + '</p>' +
      '</div>' +
      '<div class="a3-case-trace">' +
        '<div class="a3-case-verdict"><span class="' + (item.setEm ? 'is-pass' : 'is-fail') + '">SetEM · ' + (item.setEm ? 'PASS' : 'FAIL') + '</span><span class="' + (item.traceEm ? 'is-pass' : 'is-fail') + '">TraceEM · ' + (item.traceEm ? 'PASS' : 'FAIL') + '</span></div>' +
        '<div class="a3-sequence"><strong>GOLD TRACE</strong><div>' + renderPlanningSequence(item.gold, item.gold, false) + '</div></div>' +
        '<div class="a3-sequence"><strong>PREDICTED TRACE</strong><div>' + renderPlanningSequence(item.prediction, item.gold, true) + '</div></div>' +
        '<div class="a3-sequence-legend"><span><i></i>位置正确</span><span><i></i>集合内但位置错误</span><span><i></i>错误工具</span></div>' +
      '</div>';
  }

  function setupNavigation() {
    var nav = $('#siteNav');
    var toggle = $('#navToggle');
    var links = $('#navLinks');
    var toTop = $('#toTop');
    if (!nav || !toggle || !links) return;
    var anchorLinks = $$('a[href^="#"]', links);
    var menuLinks = $$('a[href]', links);
    var mobileNav = window.matchMedia ? window.matchMedia('(max-width: 900px)') : null;

    function onScroll() {
      nav.classList.toggle('scrolled', window.scrollY > 8);
      if (toTop) toTop.classList.toggle('show', window.scrollY > 720);
    }

    function isMobileMenu() {
      return !!(mobileNav && mobileNav.matches);
    }

    function syncMenuAccessibility() {
      if (!isMobileMenu()) {
        links.removeAttribute('aria-hidden');
        links.removeAttribute('inert');
        return;
      }
      var open = links.classList.contains('open');
      links.setAttribute('aria-hidden', open ? 'false' : 'true');
      links.toggleAttribute('inert', !open);
    }

    function closeMenu(returnFocus) {
      var focusWasInside = links.contains(document.activeElement);
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', '打开导航菜单');
      document.body.classList.remove('menu-open');
      syncMenuAccessibility();
      if (isMobileMenu() && (returnFocus || focusWasInside)) {
        toggle.focus({ preventScroll: true });
      }
    }

    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
      document.body.classList.toggle('menu-open', open);
      syncMenuAccessibility();
    });

    links.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu(false);
    });

    document.addEventListener('keydown', function (event) {
      var menuOpen = isMobileMenu() && links.classList.contains('open');
      if (event.key === 'Escape' && menuOpen) {
        closeMenu(true);
        return;
      }
      if (event.key !== 'Tab' || !menuOpen || !menuLinks.length) return;
      if (event.shiftKey && document.activeElement === toggle) {
        event.preventDefault();
        menuLinks[menuLinks.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === menuLinks[menuLinks.length - 1]) {
        event.preventDefault();
        toggle.focus();
      }
    });

    syncMenuAccessibility();
    if (mobileNav && mobileNav.addEventListener) {
      mobileNav.addEventListener('change', function () { closeMenu(false); });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }

    var sectionGroups = {
      introduction: '#introduction',
      system: '#limits',
      intent: '#intent',
      results: '#results',
      insight: '#results',
      analysis: '#results',
      planning: '#planning',
      limits: '#limits',
      evidence: '#evidence'
    };
    var sections = Object.keys(sectionGroups).map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var activeHref = sectionGroups[entry.target.id];
          anchorLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === activeHref);
          });
        });
      }, { rootMargin: '-42% 0px -52% 0px', threshold: 0 });
      sections.forEach(function (section) { observer.observe(section); });
    }
  }

  function setupDisclosureAnchors() {
    function revealHashTarget() {
      if (!window.location.hash || window.location.hash.length < 2) return;
      var target;
      try {
        target = document.querySelector(window.location.hash);
      } catch (error) {
        return;
      }
      if (!target) return;
      var disclosure = target.closest('details');
      var revealed = false;
      while (disclosure) {
        if (!disclosure.open) revealed = true;
        disclosure.open = true;
        disclosure = disclosure.parentElement && disclosure.parentElement.closest('details');
      }
      if (revealed) {
        window.requestAnimationFrame(function () {
          target.scrollIntoView({ block: 'start' });
        });
      }
    }

    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;
      window.setTimeout(revealHashTarget, 0);
    });
    window.addEventListener('hashchange', revealHashTarget);
    revealHashTarget();
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
  renderIntent();
  renderPlanningResults(activePlanningMetric);
  setupPlanningMetricSwitch();
  renderPlanningScale(activeScaleMetric);
  setupPlanningScaleMetricSwitch();
  renderPlanningCandidateOrder();
  renderPlanningCounterfactual();
  renderPlanningCases();
  setupNavigation();
  setupDisclosureAnchors();
  setupCopy();
})();
