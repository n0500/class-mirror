/* مرآة الصف — ملاءمة عرض الصفحة لشاشة الجوال
   إذا كان المتصفح يعرض الموقع بنسخة الحاسب على جوال (عرض افتراضي كبير على شاشة صغيرة)،
   تُكبَّر الصفحة تلقائيًا لتملأ عرض الشاشة كما في نسخة الجوال. */
(function () {
  function fit() {
    var root = document.documentElement;
    root.style.zoom = ""; root.classList.remove("fitted");
    var sw = Math.min(screen.width || 0, screen.height || 0) || screen.width;
    if (window.matchMedia && matchMedia("(orientation: landscape)").matches) sw = Math.max(screen.width, screen.height);
    var coarse = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    var vw = window.innerWidth;
    if (coarse && sw && sw < 900 && vw > sw * 1.25) { root.style.zoom = String(vw / sw); root.classList.add("fitted"); }
  }
  fit();
  window.addEventListener("orientationchange", function () { setTimeout(fit, 300); });
})();
