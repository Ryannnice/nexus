(function (root, factory) {
  'use strict';

  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (!root) return;

  root.PROJECT_PROGRESS_CHARTS = api;
  if (root.document && root.PROJECT_DATA && root.PROJECT_DATA.progressCharts) {
    api.mount(root.document, root.PROJECT_DATA.progressCharts);
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var FONT = "Arial,'Noto Sans CJK SC',sans-serif";
  var COLORS = {
    black: '#000',
    ink: '#111',
    white: '#fff',
    green: '#76b900',
    greenDark: '#557f00',
    orange: '#f39a18',
    orangeText: '#d77d00',
    red: '#e52020',
    gray: '#777',
    mute: '#bdbdbd',
    hairline: '#d7d7d7',
    card: '#f7f7f7',
    cardFinal: '#edf5e3'
  };

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function attributes(values) {
    return Object.keys(values || {}).filter(function (key) {
      return values[key] !== null && typeof values[key] !== 'undefined' && values[key] !== false;
    }).map(function (key) {
      return ' ' + key + '="' + escapeXml(values[key]) + '"';
    }).join('');
  }

  function element(name, values, content) {
    var opening = '<' + name + attributes(values);
    return typeof content === 'undefined' ? opening + '/>' : opening + '>' + content + '</' + name + '>';
  }

  function text(x, y, value, values) {
    var options = Object.assign({
      x: x,
      y: y,
      fill: COLORS.ink,
      'font-family': FONT
    }, values || {});
    return element('text', options, escapeXml(value));
  }

  function group(content, values) {
    return element('g', values || {}, content);
  }

  function formatInteger(value) {
    return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatCompactTotal(value) {
    return value >= 1000 && value % 1000 === 0 ? value / 1000 + 'K' : formatInteger(value);
  }

  function percent(correct, total, digits) {
    return (correct / total * 100).toFixed(digits);
  }

  function signed(value, digits) {
    var prefix = value < 0 ? '−' : '+';
    return prefix + Math.abs(value).toFixed(digits);
  }

  function signedInteger(value) {
    return (value < 0 ? '−' : '+') + formatInteger(Math.abs(value));
  }

  function pointX(chart, index) {
    return chart.pointStart + chart.pointStep * index;
  }

  function pointY(chart, score) {
    var plot = chart.plot;
    return Math.round(plot.bottom - (score - plot.min) / (plot.max - plot.min) * (plot.bottom - plot.top));
  }

  function score(point, key, total) {
    return point[key] / total * 100;
  }

  function pathData(points) {
    return points.map(function (point, index) {
      return (index ? 'L' : 'M') + point[0] + ' ' + point[1];
    }).join(' ');
  }

  function renderBands(chart) {
    var tones = {
      neutral: { fill: '#eee', text: '#333' },
      soft: { fill: '#e8e8e8', text: '#333' },
      green: { fill: '#edf5e3', text: COLORS.greenDark },
      greenMid: { fill: '#e6f0db', text: COLORS.greenDark },
      greenStrong: { fill: '#dfeecf', text: COLORS.greenDark }
    };

    return group(chart.bands.map(function (band) {
      var tone = tones[band.tone];
      return element('rect', { x: band.x, y: 226, width: band.width, height: 40, fill: tone.fill, stroke: '#cfcfcf' }) +
        text(band.x + band.width / 2, 252, band.label, {
          fill: tone.text,
          'font-size': chart.kind === 'system' ? 19 : 18,
          'font-weight': 700,
          'text-anchor': 'middle'
        });
    }).join(''), {});
  }

  function renderGrid(chart) {
    var plot = chart.plot;
    var grid = plot.ticks.map(function (tick) {
      var y = pointY(chart, tick);
      return element('line', { x1: plot.x1, y1: y, x2: plot.x2, y2: y, stroke: COLORS.hairline, 'stroke-width': 1 }) +
        text(124, y + 6, tick + '%', { fill: COLORS.gray, 'font-family': 'Arial,sans-serif', 'font-size': 17, 'text-anchor': 'end' });
    }).join('');

    grid += text(plot.axisX, plot.axisY, plot.axisTitle, { fill: COLORS.gray, 'font-family': 'Arial,sans-serif', 'font-size': 17, 'font-weight': 700 });
    if (plot.axisSubtitle) {
      grid += text(plot.axisX, plot.axisSubtitleY, plot.axisSubtitle, { fill: '#999', 'font-size': 16 });
    }
    return grid;
  }

  function renderSystemHeader(chart) {
    var finalPoint = chart.points[chart.points.length - 1];
    var finalScore = percent(finalPoint.correct, chart.total, 2);
    return element('rect', { x: 70, y: 40, width: 120, height: 14, fill: COLORS.green }) +
      text(70, 94, chart.header.eyebrow, { fill: COLORS.green, 'font-size': 24, 'font-weight': 700 }) +
      text(70, 150, chart.header.titlePrefix + finalScore + '%', { fill: COLORS.white, 'font-size': 40, 'font-weight': 700 }) +
      text(70, 184, chart.header.subtitle, { fill: COLORS.mute, 'font-size': 22 }) +
      element('line', { x1: 1640, y1: 32, x2: 1640, y2: 162, stroke: '#555' }) +
      text(1710, 68, chart.header.finalLabel, { fill: COLORS.green, 'font-family': 'Arial,sans-serif', 'font-size': 22, 'font-weight': 700 }) +
      text(1710, 128, finalScore + '%', { fill: COLORS.white, 'font-family': 'Arial,sans-serif', 'font-size': 58, 'font-weight': 700 }) +
      text(1932, 128, formatInteger(finalPoint.correct) + ' / ' + formatInteger(chart.total), { fill: COLORS.mute, 'font-family': 'Arial,sans-serif', 'font-size': 24 });
  }

  function renderMultiturnHeader(chart) {
    var side = chart.sideComparison;
    var finalPoint = chart.points[chart.points.length - 1];
    var finalScore = percent(finalPoint.correct, chart.total, 2);
    return element('rect', { x: 70, y: 40, width: 120, height: 14, fill: COLORS.green }) +
      text(70, 94, chart.header.eyebrow, { fill: COLORS.green, 'font-size': 24, 'font-weight': 700 }) +
      text(70, 150, chart.header.titlePrefix + finalScore + '%', { fill: COLORS.white, 'font-size': 40, 'font-weight': 700 }) +
      text(70, 184, chart.header.subtitle, { fill: COLORS.mute, 'font-size': 22 }) +
      element('line', { x1: 1285, y1: 32, x2: 1285, y2: 162, stroke: '#555' }) +
      text(1325, 68, side.id + ' · ' + side.label, { fill: COLORS.red, 'font-family': 'Arial,sans-serif', 'font-size': 20, 'font-weight': 700 }) +
      text(1325, 124, percent(side.correct, chart.total, 2) + '%', { fill: COLORS.white, 'font-family': 'Arial,sans-serif', 'font-size': 46, 'font-weight': 700 }) +
      text(1500, 124, '新请求 ' + percent(side.noInheritCorrect, chart.noInheritTotal, 2) + '%', { fill: COLORS.red, 'font-size': 19, 'font-weight': 700 }) +
      text(1325, 154, side.note, { fill: '#aaa', 'font-size': 17 }) +
      element('line', { x1: 1660, y1: 32, x2: 1660, y2: 162, stroke: '#555' }) +
      text(1710, 68, chart.header.finalLabel, { fill: COLORS.green, 'font-family': 'Arial,sans-serif', 'font-size': 22, 'font-weight': 700 }) +
      text(1710, 128, finalScore + '%', { fill: COLORS.white, 'font-family': 'Arial,sans-serif', 'font-size': 58, 'font-weight': 700 }) +
      text(1932, 128, formatInteger(finalPoint.correct) + ' / ' + formatInteger(chart.total), { fill: COLORS.mute, 'font-family': 'Arial,sans-serif', 'font-size': 24 });
  }

  function renderSystemSeries(chart) {
    var coordinates = chart.points.map(function (point, index) {
      return [pointX(chart, index), pointY(chart, score(point, 'correct', chart.total))];
    });
    var last = coordinates[coordinates.length - 1];
    var area = pathData(coordinates) + ' L' + last[0] + ' ' + chart.plot.areaBottom + ' L' + coordinates[0][0] + ' ' + chart.plot.areaBottom + ' Z';
    var output = element('path', { d: area, fill: COLORS.green, opacity: 0.08 }) +
      element('path', { d: pathData(coordinates), fill: 'none', stroke: COLORS.green, 'stroke-width': 8, 'stroke-linejoin': 'round' });

    output += group(chart.points.map(function (point, index) {
      var xy = coordinates[index];
      var isBackfill = point.kind === 'backfill';
      var radius = index === chart.points.length - 1 ? 17 : (isBackfill ? 12 : 13);
      return element('circle', {
        cx: xy[0], cy: xy[1], r: radius,
        fill: isBackfill ? COLORS.white : COLORS.green,
        stroke: isBackfill ? COLORS.orange : COLORS.ink,
        'stroke-width': isBackfill ? 5 : 3
      }) + text(xy[0], xy[1] - (index === chart.points.length - 1 ? 33 : 28), percent(point.correct, chart.total, 2) + '%', {
        fill: isBackfill ? COLORS.orange : COLORS.ink,
        'font-family': 'Arial,sans-serif',
        'font-size': 22,
        'font-weight': 700,
        'text-anchor': 'middle'
      });
    }).join(''), {});
    return output;
  }

  function renderSystemDeltas(chart) {
    return group(chart.points.slice(1).map(function (point, offset) {
      var previous = chart.points[offset];
      var deltaScore = score(point, 'correct', chart.total) - score(previous, 'correct', chart.total);
      var deltaCorrect = point.correct - previous.correct;
      var badge = point.badge;
      var label = signed(deltaScore, 2) + 'pp / ' + signedInteger(deltaCorrect);
      return group(
        element('rect', { width: badge.width, height: 30, fill: COLORS.ink }) +
        text(badge.width / 2, 21, label, { fill: COLORS.white, 'font-family': 'Arial,sans-serif', 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle' }),
        { transform: 'translate(' + badge.x + ' ' + badge.y + ')' }
      );
    }).join(''), {});
  }

  function renderMultiturnLegend(chart) {
    return group(
      element('line', { x1: 140, y1: 298, x2: 192, y2: 298, stroke: COLORS.green, 'stroke-width': 8 }) +
      element('circle', { cx: 166, cy: 298, r: 9, fill: COLORS.green, stroke: COLORS.ink, 'stroke-width': 2 }) +
      text(208, 304, '全部 ' + chart.total + ' 个目标', { fill: '#333', 'font-size': 17, 'font-weight': 700 }) +
      element('line', { x1: 430, y1: 298, x2: 482, y2: 298, stroke: COLORS.orange, 'stroke-width': 5 }) +
      element('circle', { cx: 456, cy: 298, r: 7, fill: COLORS.orange, stroke: COLORS.white, 'stroke-width': 2 }) +
      text(498, 304, '历史任务恢复', { fill: '#333', 'font-size': 17, 'font-weight': 700 }) +
      element('line', { x1: 720, y1: 298, x2: 772, y2: 298, stroke: COLORS.ink, 'stroke-width': 4, 'stroke-dasharray': '10 8' }) +
      element('rect', { x: 739, y: 291, width: 14, height: 14, fill: COLORS.ink }) +
      text(788, 304, '完整新请求', { fill: '#333', 'font-size': 17, 'font-weight': 700 }) +
      element('circle', { cx: 1070, cy: 298, r: 9, fill: COLORS.white, stroke: COLORS.red, 'stroke-width': 4 }) +
      text(1092, 304, chart.sideComparison.id + ' 为直接拼接单独对照', { fill: COLORS.red, 'font-size': 17, 'font-weight': 700 }),
      {}
    );
  }

  function renderMultiturnSeries(chart) {
    var series = [
      { key: 'correct', total: chart.total, color: COLORS.green, width: 8 },
      { key: 'replayCorrect', total: chart.replayTotal, color: COLORS.orange, width: 5 },
      { key: 'noInheritCorrect', total: chart.noInheritTotal, color: COLORS.ink, width: 4, dash: '12 9' }
    ];
    var coordinates = series.map(function (item) {
      return chart.points.map(function (point, index) {
        return [pointX(chart, index), pointY(chart, score(point, item.key, item.total))];
      });
    });
    var primary = coordinates[0];
    var last = primary[primary.length - 1];
    var area = pathData(primary) + ' L' + last[0] + ' ' + chart.plot.areaBottom + ' L' + primary[0][0] + ' ' + chart.plot.areaBottom + ' Z';
    var output = element('path', { d: area, fill: COLORS.green, opacity: 0.08 });

    output += series.map(function (item, seriesIndex) {
      return element('path', {
        d: pathData(coordinates[seriesIndex]), fill: 'none', stroke: item.color,
        'stroke-width': item.width, 'stroke-dasharray': item.dash,
        'stroke-linejoin': 'round'
      });
    }).join('');

    output += group(coordinates[0].map(function (xy, index) {
      return element('circle', { cx: xy[0], cy: xy[1], r: index === chart.points.length - 1 ? 17 : 12, fill: COLORS.green, stroke: COLORS.ink, 'stroke-width': 3 });
    }).join(''), {});
    output += group(coordinates[1].map(function (xy) {
      return element('circle', { cx: xy[0], cy: xy[1], r: 8, fill: COLORS.orange, stroke: COLORS.white, 'stroke-width': 2 });
    }).join(''), {});
    output += group(coordinates[2].map(function (xy) {
      return element('rect', { x: xy[0] - 7, y: xy[1] - 7, width: 14, height: 14, fill: COLORS.ink });
    }).join(''), {});

    var first = chart.points[0];
    var finalPoint = chart.points[chart.points.length - 1];
    var finalIndex = chart.points.length - 1;
    output += group(
      text(coordinates[2][0][0] + 15, coordinates[2][0][1] - 10, percent(first.noInheritCorrect, chart.noInheritTotal, 1), { fill: COLORS.ink, 'font-family': 'Arial,sans-serif', 'font-size': 16, 'font-weight': 700 }) +
      text(coordinates[0][0][0] + 15, coordinates[0][0][1] - 9, percent(first.correct, chart.total, 1), { fill: COLORS.greenDark, 'font-family': 'Arial,sans-serif', 'font-size': 16, 'font-weight': 700 }) +
      text(coordinates[1][0][0] + 15, coordinates[1][0][1] - 6, percent(first.replayCorrect, chart.replayTotal, 1), { fill: COLORS.orangeText, 'font-family': 'Arial,sans-serif', 'font-size': 16, 'font-weight': 700 }) +
      text(coordinates[2][finalIndex][0] + 24, coordinates[2][finalIndex][1] - 3, percent(finalPoint.noInheritCorrect, chart.noInheritTotal, 1), { fill: COLORS.ink, 'font-family': 'Arial,sans-serif', 'font-size': 16, 'font-weight': 700 }) +
      text(coordinates[0][finalIndex][0] + 24, coordinates[0][finalIndex][1] + 4, percent(finalPoint.correct, chart.total, 1), { fill: COLORS.greenDark, 'font-family': 'Arial,sans-serif', 'font-size': 16, 'font-weight': 700 }) +
      text(coordinates[1][finalIndex][0] + 24, coordinates[1][finalIndex][1] + 19, percent(finalPoint.replayCorrect, chart.replayTotal, 1), { fill: COLORS.orangeText, 'font-family': 'Arial,sans-serif', 'font-size': 16, 'font-weight': 700 }),
      {}
    );
    return output;
  }

  function renderCards(chart) {
    return group(chart.points.map(function (point, index) {
      var isFinal = point.kind === 'final';
      var isSystem = chart.kind === 'system';
      var footer = isSystem
        ? formatInteger(point.correct) + ' / ' + formatCompactTotal(chart.total)
        : percent(point.correct, chart.total, 2) + '% · ' + formatInteger(point.correct) + ' / ' + formatInteger(chart.total);
      var content = element('rect', {
        width: chart.card.width,
        height: chart.card.height,
        fill: isFinal && !isSystem ? COLORS.cardFinal : COLORS.card,
        stroke: isFinal && !isSystem ? COLORS.green : '#ccc'
      }) + element('rect', { width: chart.card.width, height: 6, fill: isSystem && point.kind === 'backfill' ? COLORS.orange : (isSystem ? COLORS.green : (index ? COLORS.green : '#888')) }) +
        text(14, 42, point.id + ' · ' + point.title, { 'font-size': 18, 'font-weight': 700 }) +
        text(14, 76, point.lines[0], { fill: isFinal && !isSystem ? COLORS.greenDark : COLORS.gray, 'font-size': 15 }) +
        text(14, 101, point.lines[1], { fill: isFinal && !isSystem ? COLORS.greenDark : COLORS.gray, 'font-size': 15 }) +
        text(14, 208, footer, { 'font-size': isSystem ? 16 : 15, 'font-weight': 700 });
      return group(content, { transform: 'translate(' + pointX(chart, index) + ' ' + chart.card.y + ')' });
    }).join(''), {});
  }

  function renderSystemFooter(chart) {
    var first = chart.points[0];
    var finalPoint = chart.points[chart.points.length - 1];
    var gain = score(finalPoint, 'correct', chart.total) - score(first, 'correct', chart.total);
    return element('rect', { x: 70, y: 1090, width: 12, height: 150, fill: COLORS.green }) +
      text(108, 1125, '累计净增益', { fill: COLORS.green, 'font-size': 20, 'font-weight': 700 }) +
      text(108, 1182, signed(gain, 2) + 'pp', { fill: COLORS.white, 'font-family': 'Arial,sans-serif', 'font-size': 48, 'font-weight': 700 }) +
      text(108, 1224, formatInteger(first.correct) + ' → ' + formatInteger(finalPoint.correct) + '（' + signedInteger(finalPoint.correct - first.correct) + ' 条）', { fill: '#bbb', 'font-family': 'Arial,sans-serif', 'font-size': 22 }) +
      element('line', { x1: 650, y1: 1090, x2: 650, y2: 1240, stroke: '#555' }) +
      text(690, 1125, chart.footer.pathTitle, { fill: COLORS.green, 'font-size': 20, 'font-weight': 700 }) +
      text(690, 1172, chart.footer.pathLines[0], { fill: COLORS.white, 'font-size': 28, 'font-weight': 700 }) +
      text(690, 1214, chart.footer.pathLines[1], { fill: '#bbb', 'font-size': 21 }) +
      element('line', { x1: 1580, y1: 1090, x2: 1580, y2: 1240, stroke: '#555' }) +
      text(1620, 1125, '读图口径', { fill: COLORS.green, 'font-size': 20, 'font-weight': 700 }) +
      element('circle', { cx: 1634, cy: 1168, r: 10, fill: COLORS.white, stroke: COLORS.orange, 'stroke-width': 4 }) +
      text(1660, 1176, '回溯补测', { fill: '#bbb', 'font-size': 18 }) +
      element('circle', { cx: 1634, cy: 1210, r: 10, fill: COLORS.green, stroke: COLORS.white, 'stroke-width': 2 }) +
      text(1660, 1218, '当前训练路径端点', { fill: '#bbb', 'font-size': 18 });
  }

  function renderMultiturnFooter(chart) {
    var first = chart.points[0];
    var finalPoint = chart.points[chart.points.length - 1];
    var gain = score(finalPoint, 'correct', chart.total) - score(first, 'correct', chart.total);
    var callReduction = (1 - finalPoint.plannerCalls / chart.total) * 100;
    return element('rect', { x: 70, y: 1104, width: 12, height: 176, fill: COLORS.green }) +
      text(108, 1142, '整体净增益', { fill: COLORS.green, 'font-size': 20, 'font-weight': 700 }) +
      text(108, 1200, signed(gain, 2) + 'pp', { fill: COLORS.white, 'font-family': 'Arial,sans-serif', 'font-size': 48, 'font-weight': 700 }) +
      text(108, 1243, formatInteger(first.correct) + ' → ' + formatInteger(finalPoint.correct) + '（' + signedInteger(finalPoint.correct - first.correct) + ' 条）', { fill: '#bbb', 'font-family': 'Arial,sans-serif', 'font-size': 22 }) +
      text(108, 1277, chart.footer.note, { fill: '#888', 'font-size': 17 }) +
      element('line', { x1: 650, y1: 1104, x2: 650, y2: 1280, stroke: '#555' }) +
      text(690, 1142, '两类相反能力', { fill: COLORS.green, 'font-size': 20, 'font-weight': 700 }) +
      text(690, 1192, '历史恢复 ' + percent(first.replayCorrect, chart.replayTotal, 2) + '% → ' + percent(finalPoint.replayCorrect, chart.replayTotal, 2) + '%', { fill: COLORS.white, 'font-size': 27, 'font-weight': 700 }) +
      text(690, 1234, '完整新请求 ' + percent(first.noInheritCorrect, chart.noInheritTotal, 2) + '% → ' + percent(finalPoint.noInheritCorrect, chart.noInheritTotal, 2) + '%', { fill: COLORS.white, 'font-size': 27, 'font-weight': 700 }) +
      text(690, 1274, chart.footer.summary, { fill: '#bbb', 'font-size': 18 }) +
      element('line', { x1: 1540, y1: 1104, x2: 1540, y2: 1280, stroke: '#555' }) +
      text(1580, 1142, '最终复用收益', { fill: COLORS.green, 'font-size': 20, 'font-weight': 700 }) +
      text(1580, 1200, formatInteger(chart.total) + ' → ' + formatInteger(finalPoint.plannerCalls), { fill: COLORS.white, 'font-family': 'Arial,sans-serif', 'font-size': 42, 'font-weight': 700 }) +
      text(1810, 1200, 'Planner 调用', { fill: '#bbb', 'font-size': 20 }) +
      text(1580, 1243, 'L 与 J / K 准确率相同', { fill: '#bbb', 'font-size': 20 }) +
      text(1580, 1277, '调用次数减少 ' + callReduction.toFixed(1) + '%', { fill: '#bbb', 'font-size': 20 });
  }

  function renderChart(chart) {
    var svg = element('rect', { width: chart.width, height: chart.height, fill: COLORS.black }) +
      (chart.kind === 'system' ? renderSystemHeader(chart) : renderMultiturnHeader(chart)) +
      element('rect', { x: 0, y: chart.canvas.y, width: chart.width, height: chart.canvas.height, fill: COLORS.white }) +
      renderBands(chart) +
      (chart.kind === 'multiturn' ? renderMultiturnLegend(chart) : '') +
      renderGrid(chart) +
      (chart.kind === 'system' ? renderSystemSeries(chart) + renderSystemDeltas(chart) : renderMultiturnSeries(chart)) +
      renderCards(chart) +
      (chart.kind === 'system' ? renderSystemFooter(chart) : renderMultiturnFooter(chart));

    return element('svg', {
      class: 'progress-chart-svg',
      xmlns: 'http://www.w3.org/2000/svg',
      width: chart.width,
      height: chart.height,
      viewBox: '0 0 ' + chart.width + ' ' + chart.height,
      'aria-hidden': 'true',
      focusable: 'false'
    }, svg);
  }

  function accessibleLabel(chart) {
    var first = chart.points[0];
    var finalPoint = chart.points[chart.points.length - 1];
    if (chart.kind === 'system') {
      return '单轮 ' + formatCompactTotal(chart.total) + ' 工具链成功率累计增益图：从 ' +
        percent(first.correct, chart.total, 2) + '% 提高到 ' + percent(finalPoint.correct, chart.total, 2) +
        '%，正确数量从 ' + formatInteger(first.correct) + ' 增至 ' + formatInteger(finalPoint.correct) + '。';
    }
    return '多轮 Agent 独立测试进步图：方案 ' + first.id + ' 的整体正确率为 ' +
      percent(first.correct, chart.total, 2) + '%，最终方案 ' + finalPoint.id + ' 为 ' +
      percent(finalPoint.correct, chart.total, 2) + '%；历史任务恢复为 ' +
      percent(finalPoint.replayCorrect, chart.replayTotal, 2) + '%，完整新请求为 ' +
      percent(finalPoint.noInheritCorrect, chart.noInheritTotal, 2) + '%，Planner 调用从 ' +
      formatInteger(chart.total) + ' 次降至 ' + formatInteger(finalPoint.plannerCalls) + ' 次。方案 ' +
      chart.sideComparison.id + ' 是单独对照，不属于逐步累加主线。';
  }

  function mount(documentRoot, charts) {
    var hosts = Array.prototype.slice.call(documentRoot.querySelectorAll('[data-progress-chart]'));
    hosts.forEach(function (host) {
      var chart = charts[host.getAttribute('data-progress-chart')];
      if (!chart) return;
      host.innerHTML = renderChart(chart);
      host.setAttribute('aria-label', accessibleLabel(chart));
      host.setAttribute('data-chart-rendered', 'true');
    });
  }

  return {
    mount: mount,
    renderChart: renderChart
  };
});
