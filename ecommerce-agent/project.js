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
    var hoverPaused = false;
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
        var active = index === currentIndex;
        return '<button type="button" class="' + (active ? 'active' : '') + '" data-trace="' + index + '" aria-label="查看案例 ' + (index + 1) + '：' + escapeHtml(trace.label) + '" aria-pressed="' + (active ? 'true' : 'false') + '"><i></i></button>';
      }).join('');
    }

    function updatePauseState() {
      var paused = hoverPaused || userPaused;
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
      queryLabel.textContent = 'CASE ' + caseNumber + ' · ' + trace.label + ' · ' + (isChat ? 'INTENT FIXED SET' : 'RETRIEVAL FIXED TEST · CONDENSED');
      query.textContent = trace.query;
      counter.textContent = caseNumber + ' / ' + String(traces.length).padStart(2, '0');

      if (isChat) {
        status.textContent = 'CHAT · BYPASS';
        resultsLabel.textContent = 'ROUTE RESULT · NO TOOL CALL';
        results.innerHTML = '<div class="result-row result-row-empty"><b>—</b><span>直接响应 · 工具检索旁路</span><em>CHAT</em></div>';
        renderMatrix([]);
        setPipeline(
          { detail: '闲聊类 · 直接响应', state: 'CHAT' },
          { detail: '无需进入工具检索', state: 'BYPASS' },
          { detail: '无需生成工具短名单', state: 'BYPASS' }
        );
        footnote.innerHTML = 'Intent 固定集回放 · <strong>' + escapeHtml(trace.id) + '</strong>';
      } else {
        var gold = new Set(trace.gold);
        var recalled = trace.prediction.reduce(function (items, toolId, rank) {
          if (gold.has(toolId)) items.push({ id: toolId, rank: rank + 1 });
          return items;
        }, []);
        status.textContent = (trace.gold.length > 1 ? 'MULTI-TOOL' : 'SINGLE-TOOL') + ' · ' + recalled.length + ' / ' + trace.gold.length;
        resultsLabel.textContent = 'RECALLED TOOLS · ALL ' + trace.gold.length + (trace.gold.length === 1 ? ' GOLD TOOL' : ' GOLD TOOLS');
        renderRows(recalled, 'GOLD');
        renderMatrix(trace.gold);
        setPipeline(
          { detail: '电商类 · 进入工具选择', state: 'PASS' },
          { detail: 'BM25 + Fine-tuned Embedding', state: 'TOP 50' },
          { detail: 'Source + Task Reranker RRF', state: 'TOP 10' }
        );
        footnote.innerHTML = '固定检索集回放 · <strong>' + escapeHtml(trace.id) + '</strong>';
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
    root.addEventListener('pointerenter', function (event) {
      if (event.pointerType === 'mouse') { hoverPaused = true; updatePauseState(); }
    });
    root.addEventListener('pointerleave', function (event) {
      if (event.pointerType === 'mouse') { hoverPaused = false; updatePauseState(); }
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
