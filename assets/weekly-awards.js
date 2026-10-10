/* تكريم الأسبوع: الرصيد المنشور نفسه للشاشة والشهادة، مع حفظ حق المتعادلين. */
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
  function winners(b, id) {
    var s = findStage(id);
    if (!s || !validBoard(b)) return [];
    var list = M.CLASSES.filter(function (c) { return c.code.charAt(0) === s.prefix; }).map(function (c) {
      return { c: c, n: count((b.classes[c.code] || {}).n), stage: s };
    });
    var max = list.reduce(function (n, x) { return Math.max(n, x.n); }, 0);
    return max ? list.filter(function (x) { return x.n === max; }) : [];
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

  M.WeeklyAwards = { stages: stages, findStage: findStage, validBoard: validBoard, winners: winners, allWinners: allWinners, periodLabel: periodLabel, countLabel: countLabel, certificateUrl: certificateUrl };
})();
