/* تكريم الأسبوع: إبقاء النتائج السابقة، وتطبيق أحكام «أخرى» بدءا من أسبوع 25 أكتوبر 2026. */
(function () {
  "use strict";
  var M = window.Miraat;
  var stages = [
    { id: "middle", prefix: "m", name: "المرحلة المتوسطة" },
    { id: "secondary", prefix: "s", name: "المرحلة الثانوية" }
  ];

  function findStage(id) {
    return stages.filter(function (s) { return s.id === id; })[0] || null;
  }
  function date(iso) {
    if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    var d = new Date(iso + "T12:00:00Z");
    return isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso ? null : d;
  }
  function validBoard(b) {
    if (!b || !b.classes) return false;
    var start = date(b.weekStart), end = date(b.weekEnd);
    return !!(start && end && start.getUTCDay() === 0 && end - start === 4 * 86400000);
  }
  function count(value) {
    return typeof value === "number" && isFinite(value) && value > 0 && Math.floor(value) === value ? value : 0;
  }
  /* الفترات المنتهية قبل هذا التاريخ تبقى بمنطق الفوز الأصلي. */
  var NEW_RULE_WEEK = "2026-10-25";
  function newRule(b) {
    return validBoard(b) && b.weekStart >= NEW_RULE_WEEK;
  }
  function isExtra(subject) {
    var x = String(subject || "").trim();
    return x === "أخرى" || x.indexOf("أخرى:") === 0 || x.indexOf("أخرى：") === 0;
  }
  /* لا تحدد هذه الآلية عدد مرات تقييم المادة؛ القرار مؤجل. */
  function calculate(rows, period) {
    var modern = period.weekStart >= NEW_RULE_WEEK;
    var classes = {}, followUps = {}, total = 0, totalPrev = 0;
    M.CLASSES.forEach(function (c) {
      classes[c.code] = { n: 0, p: 0 };
      if (modern) { classes[c.code].t = 0; classes[c.code].score = null; followUps[c.code] = 0; }
    });
    rows.forEach(function (r) {
      var code = r.classCode || ((M.findClass(r.classroom) || {}).code);
      var x = classes[code];
      if (!x) return;
      var rating = M.normRating(r.rating);
      var extra = isExtra(r.subject);
      if (r.createdAt >= period.start && r.createdAt < period.end) {
        if (modern && extra) {
          if (rating === "يحتاج متابعة") followUps[code]++;
          return;
        }
        if (modern) x.t++;
        if (rating === "متميز") { x.n++; total++; }
      } else if (r.createdAt >= period.prevStart && r.createdAt < period.prevEnd) {
        if ((!modern || !extra) && rating === "متميز") { x.p++; totalPrev++; }
      }
    });
    if (modern) M.CLASSES.forEach(function (c) {
      var x = classes[c.code];
      if (x.t > 0) {
        var base = Math.round(10000 * x.n / x.t) / 100;
        x.score = Math.max(0, base - Math.min(10, 5 * followUps[c.code]));
      }
    });
    return { classes: classes, total: total, totalPrev: totalPrev };
  }
  function scoreLabel(n) {
    return new Intl.NumberFormat("ar-SA-u-nu-latn", { maximumFractionDigits: 2 }).format(n) + "%";
  }
  function winners(b, id) {
    var stage = findStage(id);
    if (!stage || !validBoard(b)) return [];
    var modern = newRule(b);
    var list = M.CLASSES.filter(function (c) { return c.code.charAt(0) === stage.prefix; }).map(function (c) {
      var x = b.classes[c.code] || {};
      return { c: c, n: count(x.n), t: count(x.t),
        score: typeof x.score === "number" && isFinite(x.score) ? x.score : null, stage: stage };
    }).filter(function (x) { return x.n > 0 && (!modern || (x.t > 0 && x.score !== null)); });
    if (!list.length) return [];
    var max = list.reduce(function (n, x) { return Math.max(n, modern ? x.score : x.n); }, 0);
    return list.filter(function (x) { return (modern ? x.score : x.n) === max; });
  }
  function allWinners(b) {
    return stages.reduce(function (list, s) { return list.concat(winners(b, s.id)); }, []);
  }
  function hdate(iso, withYear) {
    var d = date(iso); if (!d) return "";
    var opts = { timeZone: "Asia/Riyadh", weekday: "long", day: "numeric", month: "long" };
    if (withYear) opts.year = "numeric";
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", opts).format(d);
  }
  function periodLabel(b) {
    return validBoard(b) ? "من " + hdate(b.weekStart) + " إلى " + hdate(b.weekEnd, true) : "";
  }
  function countLabel(n) {
    var num = new Intl.NumberFormat("ar-SA-u-nu-latn");
    return n === 1 ? "حصة متميزة واحدة" : n === 2 ? "حصتان متميزتان" : num.format(n) + (n >= 3 && n <= 10 ? " حصص متميزة" : " حصة متميزة");
  }
  function certificateUrl(b, c) {
    return "certificate.html?mode=weekly&week=" + encodeURIComponent(b.weekStart) + (c ? "&c=" + encodeURIComponent(c.code) : "&scope=all");
  }

  M.WeeklyAwards = { stages: stages, findStage: findStage, validBoard: validBoard, newRule: newRule, calculate: calculate, winners: winners, allWinners: allWinners, periodLabel: periodLabel, countLabel: countLabel, scoreLabel: scoreLabel, certificateUrl: certificateUrl };
})();
