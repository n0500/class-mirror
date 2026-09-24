/* مرآة الصف — البيانات المشتركة وطبقة الحفظ */
(function () {
  "use strict";

  var SCHOOL = "المتوسطة الرابعة والثانوية الثانية بالرس";

  /* الفصول العشرون — لكل فصل رمز قصير يُستخدم في رابط QR */
  var CLASSES = [
    { code: "m1-1", name: "أول متوسط 1", stage: "middle_1_2" },
    { code: "m1-2", name: "أول متوسط 2", stage: "middle_1_2" },
    { code: "m1-3", name: "أول متوسط 3", stage: "middle_1_2" },
    { code: "m2-1", name: "ثاني متوسط 1", stage: "middle_1_2" },
    { code: "m2-2", name: "ثاني متوسط 2", stage: "middle_1_2" },
    { code: "m2-3", name: "ثاني متوسط 3", stage: "middle_1_2" },
    { code: "m3-1", name: "ثالث متوسط 1", stage: "middle_3" },
    { code: "m3-2", name: "ثالث متوسط 2", stage: "middle_3" },
    { code: "m3-3", name: "ثالث متوسط 3", stage: "middle_3" },
    { code: "s1-1", name: "أول ثانوي 1", stage: "secondary_1" },
    { code: "s1-2", name: "أول ثانوي 2", stage: "secondary_1" },
    { code: "s1-3", name: "أول ثانوي 3", stage: "secondary_1" },
    { code: "s1-4", name: "أول ثانوي 4", stage: "secondary_1" },
    { code: "s2-1", name: "ثاني ثانوي 1", stage: "secondary_2" },
    { code: "s2-2", name: "ثاني ثانوي 2", stage: "secondary_2" },
    { code: "s2-3", name: "ثاني ثانوي 3", stage: "secondary_2" },
    { code: "s2-4", name: "ثاني ثانوي 4", stage: "secondary_2" },
    { code: "s3-1", name: "ثالث ثانوي 1", stage: "secondary_3" },
    { code: "s3-2", name: "ثالث ثانوي 2", stage: "secondary_3" },
    { code: "s3-3", name: "ثالث ثانوي 3", stage: "secondary_3" }
  ];

  /* المواد حسب الصف/السنة (من subjects-latest.json) — «أخرى» تُضاف تلقائيًا في آخر القائمة */
  /* المواد حسب الصف — العام الدراسي 1448هـ، الفصل الدراسي الأول
     (دليل الخطط الدراسية لوزارة التعليم، مقارنًا بفهرسة مقررات الفصل الأول)
     عند بداية الفصل الثاني تُحدَّث هذه القوائم. زر «أخرى» يُضاف تلقائيًا في كل الصفوف. */
  var SUBJECTS = {
    /* أول متوسط وثاني متوسط */
    middle_1_2: ["القرآن الكريم والدراسات الإسلامية", "اللغة العربية «لغتي الخالدة»", "الدراسات الاجتماعية", "الرياضيات", "العلوم", "اللغة الإنجليزية", "المهارات الرقمية", "التربية الفنية", "التربية البدنية والدفاع عن النفس", "المهارات الحياتية والأسرية"],
    /* ثالث متوسط: المواد السابقة + التفكير الناقد */
    middle_3: ["القرآن الكريم والدراسات الإسلامية", "اللغة العربية «لغتي الخالدة»", "الدراسات الاجتماعية", "الرياضيات", "العلوم", "اللغة الإنجليزية", "المهارات الرقمية", "التربية الفنية", "التربية البدنية والدفاع عن النفس", "المهارات الحياتية والأسرية", "التفكير الناقد"],
    /* أول ثانوي — السنة الأولى المشتركة — ف1 (9 مواد) */
    secondary_1: ["الرياضيات 1-1", "الكيمياء 1", "الأحياء 1", "الكفايات اللغوية 1-1", "اللغة الإنجليزية 1", "القرآن الكريم وتفسيره", "التقنية الرقمية 1", "التفكير الناقد", "التربية الصحية والبدنية 1"],
    /* ثاني ثانوي — المسار العام — ف1 (7 مواد) */
    secondary_2: ["الرياضيات 2-1", "الكيمياء 2-1", "الفيزياء 2", "الأحياء 2-1", "اللغة الإنجليزية 2", "الكفايات اللغوية 2-1", "التاريخ"],
    /* ثالث ثانوي — المسار العام — ف1 */
    secondary_3: ["الرياضيات 3-1", "الفيزياء 3-1", "الكيمياء 3", "علوم الأرض والفضاء", "اللغة الإنجليزية 3", "البحث ومصادر المعلومات", "التربية الصحية والبدنية 2", "التقنية الرقمية 3"]
  };


  var RATINGS = [
    { key: "متميز", cls: "excellent" },
    { key: "جيد", cls: "good" },
    { key: "يحتاج متابعة", cls: "follow" }
  ];
  /* تقديرات النسخة السابقة تُعرض بما يقابلها */
  var LEGACY = { "متوسط": "جيد" };

  function findClass(q) {
    if (!q) return null;
    q = String(q).trim();
    for (var i = 0; i < CLASSES.length; i++) {
      if (CLASSES[i].code === q || CLASSES[i].name === q) return CLASSES[i];
    }
    return null;
  }

  function subjectsFor(cls) {
    return (SUBJECTS[cls.stage] || []).concat(["أخرى"]);
  }

  function normRating(r) { return LEGACY[r] || r; }

  /* عرض أرقام المقررات (مثل 2-1) بترتيبها الصحيح داخل النص العربي، دون تغيير الاسم المحفوظ */
  function disp(name) { return String(name == null ? "" : name).replace(/(\d+(?:-\d+)+)/g, "\u2066$1\u2069"); }

  /* ---------------- طبقة الحفظ ---------------- */
  var cfg = window.MIRAAT_CONFIG || {};
  var fb = cfg.firebaseConfig || {};
  var DEMO = !fb.apiKey || fb.apiKey.indexOf("ضعي") === 0 || !fb.projectId;
  var DEMO_KEY = "miraat_demo_records";
  var V = "10.12.2";
  var G = "https://www.gstatic.com/firebasejs/" + V + "/";

  var fbReady = null;
  function firebase() {
    if (fbReady) return fbReady;
    fbReady = Promise.all([
      import(G + "firebase-app.js"),
      import(G + "firebase-firestore.js"),
      import(G + "firebase-auth.js")
    ]).then(function (m) {
      var app = m[0].initializeApp(fb);
      return { fs: m[1], au: m[2], db: m[1].getFirestore(app), auth: m[2].getAuth(app) };
    });
    return fbReady;
  }

  function demoRead() {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY) || "[]"); } catch (e) { return []; }
  }
  function randomCode() {
    var chars = "abcdefghijkmnpqrstuvwxyz23456789", out = "", buf = new Uint8Array(20);
    (window.crypto || window.msCrypto).getRandomValues(buf);
    for (var i = 0; i < buf.length; i++) out += chars[buf[i] % chars.length];
    return out;
  }
  function demoAdmins() {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY + "_admins") || "[]"); } catch (e) { return []; }
  }
  function demoWrite(rows) {
    try { localStorage.setItem(DEMO_KEY, JSON.stringify(rows)); } catch (e) {}
  }

  var Store = {
    demo: DEMO,

    save: function (rec) {
      var clean = {
        classCode: rec.classCode,
        classroom: rec.classroom,
        stage: rec.stage,
        subject: String(rec.subject || "").slice(0, 80),
        rating: rec.rating,
        note: String(rec.note || "").slice(0, 300)
      };
      if (DEMO) {
        var rows = demoRead();
        clean.id = "d" + Date.now() + Math.random().toString(36).slice(2, 6);
        clean.createdAt = new Date().toISOString();
        rows.push(clean);
        demoWrite(rows);
        return new Promise(function (res) { setTimeout(res, 250); });
      }
      return firebase().then(function (F) {
        clean.createdAt = F.fs.serverTimestamp();
        return F.fs.addDoc(F.fs.collection(F.db, "observations"), clean);
      });
    },

    onAuth: function (cb) {
      if (DEMO) { cb({ email: "وضع التجربة", demo: true }); return; }
      firebase().then(function (F) { F.au.onAuthStateChanged(F.auth, cb); })
        .catch(function () { cb(null); });
    },

    signIn: function (email, pw) {
      return firebase().then(function (F) { return F.au.signInWithEmailAndPassword(F.auth, email, pw); });
    },

    resetPassword: function (email) {
      return firebase().then(function (F) { return F.au.sendPasswordResetEmail(F.auth, email); });
    },

    signOut: function () {
      if (DEMO) return Promise.resolve();
      return firebase().then(function (F) { return F.au.signOut(F.auth); });
    },

    /* تحديد الدور من قاعدة البيانات: "owner" (المالكة) أو "admin" (إدارة) أو null */
    role: function (user) {
      if (!user) return Promise.resolve(null);
      if (user.demo) return Promise.resolve("owner");
      var email = String(user.email || "").toLowerCase();
      return firebase().then(function (F) {
        /* قراءة إعدادات الدعوة مسموحة للمالكة فقط وفق قواعد الحماية */
        return F.fs.getDoc(F.fs.doc(F.db, "settings", "invite")).then(function () { return "owner"; }, function () {
          return F.fs.getDoc(F.fs.doc(F.db, "admins", email)).then(function (d) {
            return d.exists() && !d.data().blocked ? "admin" : null;
          }, function () { return null; });
        });
      });
    },

    signUp: function (email, pw) {
      return firebase().then(function (F) { return F.au.createUserWithEmailAndPassword(F.auth, email, pw); });
    },

    /* تسجيل حساب إدارة عبر رابط الدعوة */
    joinWithInvite: function (user, name, code) {
      var email = String(user.email || "").toLowerCase();
      return firebase().then(function (F) {
        return F.fs.setDoc(F.fs.doc(F.db, "admins", email), {
          name: String(name || "").trim().slice(0, 60), invite: String(code), addedAt: F.fs.serverTimestamp()
        });
      });
    },

    /* رمز الدعوة: يُنشأ تلقائيًا أول مرة، ويمكن تغييره لإبطال الرابط القديم */
    getInvite: function (renew) {
      if (DEMO) {
        var c = null;
        try { c = localStorage.getItem(DEMO_KEY + "_invite"); } catch (e) {}
        if (!c || renew) { c = randomCode(); try { localStorage.setItem(DEMO_KEY + "_invite", c); } catch (e) {} }
        return Promise.resolve(c);
      }
      return firebase().then(function (F) {
        var ref = F.fs.doc(F.db, "settings", "invite");
        return F.fs.getDoc(ref).then(function (d) {
          if (d.exists() && d.data().code && !renew) return d.data().code;
          var code = randomCode();
          return F.fs.setDoc(ref, { code: code, updatedAt: F.fs.serverTimestamp() }).then(function () { return code; });
        });
      });
    },

    listAdmins: function () {
      if (DEMO) return Promise.resolve(demoAdmins());
      return firebase().then(function (F) {
        return F.fs.getDocs(F.fs.collection(F.db, "admins"));
      }).then(function (snap) {
        var out = [];
        snap.forEach(function (d) {
          var x = d.data(); x.email = d.id;
          x.addedAt = x.addedAt && x.addedAt.toDate ? x.addedAt.toDate() : null;
          out.push(x);
        });
        out.sort(function (a, b) { return (b.addedAt || 0) - (a.addedAt || 0); });
        return out;
      });
    },

    /* إيقاف الحساب أو إعادة تفعيله (الإيقاف يمنع العودة حتى برابط الدعوة) */
    setBlocked: function (email, blocked) {
      if (DEMO) {
        var list = demoAdmins().map(function (a) { if (a.email === email) a.blocked = blocked; return a; });
        try { localStorage.setItem(DEMO_KEY + "_admins", JSON.stringify(list)); } catch (e) {}
        return Promise.resolve();
      }
      return firebase().then(function (F) { return F.fs.updateDoc(F.fs.doc(F.db, "admins", email), { blocked: !!blocked }); });
    },

    /* تُرجع جميع السجلات منذ تاريخ معيّن (أو كلها) مرتبة من الأحدث */
    list: function (since) {
      if (DEMO) {
        var rows = demoRead().filter(function (r) { return !since || new Date(r.createdAt) >= since; });
        rows.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
        return Promise.resolve(rows.map(function (r) { r.createdAt = new Date(r.createdAt); return r; }));
      }
      return firebase().then(function (F) {
        var parts = [F.fs.collection(F.db, "observations")];
        if (since) parts.push(F.fs.where("createdAt", ">=", F.fs.Timestamp.fromDate(since)));
        parts.push(F.fs.orderBy("createdAt", "desc"));
        return F.fs.getDocs(F.fs.query.apply(null, parts));
      }).then(function (snap) {
        var out = [];
        snap.forEach(function (d) {
          var x = d.data();
          x.id = d.id;
          x.createdAt = x.createdAt && x.createdAt.toDate ? x.createdAt.toDate() : new Date();
          out.push(x);
        });
        return out;
      });
    },

    remove: function (id) {
      if (DEMO) {
        demoWrite(demoRead().filter(function (r) { return r.id !== id; }));
        return Promise.resolve();
      }
      return firebase().then(function (F) { return F.fs.deleteDoc(F.fs.doc(F.db, "observations", id)); });
    },

    /* بيانات تجريبية لمعاينة لوحة المتابعة في وضع التجربة فقط */
    seedDemo: function () {
      if (!DEMO) return;
      var rows = [], now = Date.now();
      var weights = [0.42, 0.4, 0.18];
      for (var i = 0; i < 140; i++) {
        var c = CLASSES[Math.floor(Math.random() * CLASSES.length)];
        var subs = SUBJECTS[c.stage];
        var p = Math.random(), r = p < weights[0] ? 0 : p < weights[0] + weights[1] ? 1 : 2;
        rows.push({
          id: "s" + i, classCode: c.code, classroom: c.name, stage: c.stage,
          subject: subs[Math.floor(Math.random() * subs.length)],
          rating: RATINGS[r].key, note: "",
          createdAt: new Date(now - Math.random() * 30 * 864e5).toISOString()
        });
      }
      demoWrite(demoRead().concat(rows));
    },
    clearDemo: function () { if (DEMO) demoWrite([]); }
  };

  window.Miraat = {
    SCHOOL: SCHOOL, CLASSES: CLASSES, SUBJECTS: SUBJECTS, RATINGS: RATINGS,
    findClass: findClass, subjectsFor: subjectsFor, disp: disp, normRating: normRating, Store: Store
  };
})();
