(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var header = document.getElementById('siteHeader');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  var traceConsole = document.getElementById('traceConsole');
  var traceTabs = document.getElementById('traceTabs');
  var toolMatrix = document.getElementById('toolMatrix');

  function setHeaderState() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 18);
  }

  function setNav(open) {
    if (!header || !navToggle) return;
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      setNav(navToggle.getAttribute('aria-expanded') !== 'true');
    });
  }

  if (navLinks) {
    navLinks.addEventListener('click', function (event) {
      if (event.target.closest('a')) setNav(false);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setNav(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 980) setNav(false);
  });

  window.addEventListener('scroll', setHeaderState, { passive: true });
  setHeaderState();

  var navItems = Array.prototype.slice.call(
    document.querySelectorAll('.nav-links a[href^="#"]')
  );
  var observedSections = navItems
    .map(function (link) {
      return document.querySelector(link.getAttribute('href'));
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && observedSections.length) {
    var activeSectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navItems.forEach(function (link) {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === '#' + entry.target.id
            );
          });
        });
      },
      { rootMargin: '-28% 0px -64% 0px', threshold: 0 }
    );

    observedSections.forEach(function (section) {
      activeSectionObserver.observe(section);
    });
  }

  var revealItems = Array.prototype.slice.call(
    document.querySelectorAll('.reveal')
  );

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });

    window.setTimeout(function () {
      revealItems.forEach(function (item) {
        item.classList.add('is-visible');
      });
    }, 1200);
  } else {
    revealItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
  }

  var traceCases = [
    {
      label: '多工具售后',
      type: 'MULTI-TOOL',
      query: '订单里有两件商品，我想退掉其中一件，并确认退款什么时候到账。',
      intentState: 'PASS',
      intentDetail: '电商类 · 进入工具系统',
      retrievalState: '3 / 3',
      retrievalDetail: '全部 Gold 工具进入 Top-10',
      plannerState: 'EXACT',
      plannerDetail: '集合与调用顺序均正确',
      tools: [
        'get_order_item_snapshot',
        'create_partial_return',
        'get_refund_status'
      ],
      selected: [17, 58, 83]
    },
    {
      label: '商品决策',
      type: 'MULTI-TOOL',
      query: '帮我比较这两款相机的到手价、核心参数和近期评价，再告诉我哪款更适合旅行。',
      intentState: 'PASS',
      intentDetail: '电商类 · 进入工具系统',
      retrievalState: '4 / 4',
      retrievalDetail: '四个目标工具全部召回',
      plannerState: 'EXACT',
      plannerDetail: '检索、比较、总结顺序正确',
      tools: [
        'compare_item_price',
        'get_item_specs',
        'summarize_item_reviews',
        'get_purchase_recommendation'
      ],
      selected: [4, 21, 36, 72]
    },
    {
      label: '闲聊旁路',
      type: 'CHAT · BYPASS',
      query: '番茄炒蛋怎么做？给我一个简单版本。',
      intentState: 'CHAT',
      intentDetail: '开放闲聊 · 直接响应',
      retrievalState: 'BYPASS',
      retrievalDetail: '不进入工具检索',
      plannerState: 'BYPASS',
      plannerDetail: '不生成工具调用轨迹',
      tools: [],
      selected: []
    }
  ];

  function createToolMatrix() {
    if (!toolMatrix) return;
    var fragment = document.createDocumentFragment();
    for (var index = 0; index < 100; index += 1) {
      var cell = document.createElement('i');
      cell.setAttribute('aria-hidden', 'true');
      fragment.appendChild(cell);
    }
    toolMatrix.replaceChildren(fragment);
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function renderTrace(index, animate) {
    var trace = traceCases[index];
    if (!trace) return;

    setText('traceCounter', String(index + 1).padStart(2, '0'));
    setText('traceType', trace.type);
    setText('traceQuery', trace.query);
    setText('intentState', trace.intentState);
    setText('intentDetail', trace.intentDetail);
    setText('retrievalState', trace.retrievalState);
    setText('retrievalDetail', trace.retrievalDetail);
    setText('plannerState', trace.plannerState);
    setText('plannerDetail', trace.plannerDetail);

    var traceTools = document.getElementById('traceTools');
    if (traceTools) {
      var toolsFragment = document.createDocumentFragment();
      if (trace.tools.length) {
        trace.tools.forEach(function (tool, toolIndex) {
          var item = document.createElement('li');
          var order = document.createElement('b');
          var code = document.createElement('code');
          order.textContent = String(toolIndex + 1).padStart(2, '0');
          code.textContent = tool;
          item.append(order, code);
          toolsFragment.appendChild(item);
        });
      } else {
        var emptyItem = document.createElement('li');
        var emptyOrder = document.createElement('b');
        var emptyText = document.createElement('code');
        emptyItem.className = 'trace-empty';
        emptyOrder.textContent = '—';
        emptyText.textContent = '直接响应 · 无工具调用';
        emptyItem.append(emptyOrder, emptyText);
        toolsFragment.appendChild(emptyItem);
      }
      traceTools.replaceChildren(toolsFragment);
    }

    if (toolMatrix) {
      var selected = new Set(trace.selected);
      Array.prototype.forEach.call(toolMatrix.children, function (cell, cellIndex) {
        cell.classList.toggle('selected', selected.has(cellIndex));
      });
      toolMatrix.setAttribute(
        'aria-label',
        trace.selected.length
          ? '100 个工具中的 ' + trace.selected.length + ' 个目标工具已高亮'
          : '闲聊请求未选择任何工具'
      );
    }

    if (traceTabs) {
      Array.prototype.forEach.call(
        traceTabs.querySelectorAll('button[data-trace]'),
        function (button, buttonIndex) {
          var active = buttonIndex === index;
          button.classList.toggle('active', active);
          button.setAttribute('aria-pressed', active ? 'true' : 'false');
        }
      );
    }

    if (traceConsole && animate) {
      traceConsole.classList.remove('trace-changing');
      void traceConsole.offsetWidth;
      traceConsole.classList.add('trace-changing');
    }
  }

  createToolMatrix();

  if (traceTabs) {
    traceTabs.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-trace]');
      if (!button) return;
      renderTrace(Number(button.getAttribute('data-trace')), true);
    });
  }

  renderTrace(0, false);

  var currentYear = document.getElementById('currentYear');
  if (currentYear) currentYear.textContent = String(new Date().getFullYear());
})();
