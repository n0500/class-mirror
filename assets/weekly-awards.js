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
  /* اعتماد تقييمين لكل مادة وفصل بدءا من أسبوع 1 نوفمبر 2026. */
  var TWO_RATINGS_WEEK = "2026-11-01";
  function twoRule(b) { return validBoard(b) && b.weekStart >= TWO_RATINGS_WEEK; }
  function stageReady(b, id) {
    var s = findStage(id);
    if (!s || !validBoard(b)) return false;
    if (!twoRule(b)) return true;
    return M.CLASSES.filter(function (c) { return c.code[0] === s.prefix; }).every(function (c) {
      return (b.classes[c.code] || {}).complete === true;
    });
  }
  /* تُختار أفضل درجتي تقييم لكل مادة أسبوعيا من جميع مرات الرصد، دون حذف بقية السجلات. */
  function calculateTwo(rows, period) {
    var classes = {}, logs = {}, coverage = [], total = 0, totalPrev = 0;
    M.CLASSES.forEach(function (c) {
      var subjects = M.subjectsFor(c).filter(function (name) { return name !== "أخرى"; });
      var now = Object.create(null), prev = Object.create(null);
      subjects.forEach(function (name) { now[name] = []; prev[name] = []; });
      logs[c.code] = { subjects: subjects, now: now, prev: prev, follow: 0 };
      classes[c.code] = { n: 0, p: 0, t: 0, score: null, complete: false };
    });
    rows.forEach(function (r) {
      var code = r.classCode || ((M.findClass(r.classroom) || {}).code), x = logs[code];
      if (!x) return;
      var curr = r.createdAt >= period.start && r.createdAt < period.end;
      var prev = r.createdAt >= period.prevStart && r.createdAt < period.prevEnd;
      if (!curr && !prev) return;
      if (isExtra(r.subject)) {
        if (curr && M.normRating(r.rating) === "يحتاج متابعة") x.follow++;
        return;
      }
      var target = curr ? x.now : x.prev;
      if (Object.prototype.hasOwnProperty.call(target, r.subject)) target[r.subject].push(r);
    });
    /* متميز أعلى من جيد، وجيد أعلى من يحتاج متابعة. تعادل التقدير يُحسم بأسبقية الرصد. */
    function rank(r) {
      var rating = M.normRating(r.rating);
      return rating === "متميز" ? 2 : rating === "جيد" ? 1 : 0;
    }
    var order = function (a, b) {
      return rank(b) - rank(a) || a.createdAt - b.createdAt || String(a.id || "").localeCompare(String(b.id || ""));
    };
    var localDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" });
    M.CLASSES.forEach(function (c) {
      var book = logs[c.code], stat = classes[c.code], deficits = [], sameDay = [], extra = 0;
      book.subjects.forEach(function (name) {
        var all = book.now[name].sort(order), chosen = all.slice(0, 2);
        extra += Math.max(0, all.length - 2);
        if (chosen.length < 2) deficits.push({ subject: name, recorded: chosen.length, missing: 2 - chosen.length });
        if (chosen.length === 2 && localDay.format(chosen[0].createdAt) === localDay.format(chosen[1].createdAt)) sameDay.push(name);
        stat.t += chosen.length;
        chosen.forEach(function (r) { if (M.normRating(r.rating) === "متميز") stat.n++; });
        if (period.prevStartDay >= TWO_RATINGS_WEEK) book.prev[name].sort(order).slice(0, 2).forEach(function (r) {
          if (M.normRating(r.rating) === "متميز") stat.p++;
        });
      });
      /* أسبوع الانتقال: إخفاء مقارنة أرقام محدودة بأسبوع غير محدود. */
      if (period.prevStartDay < TWO_RATINGS_WEEK) stat.p = stat.n;
      stat.complete = deficits.length === 0;
      if (stat.complete) {
        var base = Math.round(10000 * stat.n / (2 * book.subjects.length)) / 100;
        stat.score = Math.max(0, base - Math.min(10, 5 * book.follow));
      }
      total += stat.n; totalPrev += stat.p;
      if (deficits.length || sameDay.length || extra) coverage.push({
        classCode: c.code, className: c.name, missing: deficits, sameDay: sameDay, ignored: extra,
        expected: book.subjects.length * 2, recorded: stat.t
      });
    });
    return { classes: classes, total: total, totalPrev: totalPrev, coverage: coverage };
  }
  /* الأسابيع السابقة تبقى بمنطق الحساب القديم. */
  function calculate(rows, period) {
    if (period.weekStart >= TWO_RATINGS_WEEK) return calculateTwo(rows, period);
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
    if (twoRule(b) && !stageReady(b, id)) return [];
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

  M.WeeklyAwards = { stages: stages, findStage: findStage, validBoard: validBoard, newRule: newRule, twoRule: twoRule, stageReady: stageReady, calculate: calculate, winners: winners, allWinners: allWinners, periodLabel: periodLabel, countLabel: countLabel, scoreLabel: scoreLabel, certificateUrl: certificateUrl };
})();
