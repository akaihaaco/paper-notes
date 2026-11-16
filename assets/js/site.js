/* 論文札記 — 全站共用程式。
 * 每個頁面都要載入本檔：負責產生導覽列、頁尾，並提供 window.PN 小工具。
 * 新增頁面時，在下面的 NAV 加一項即可（見 CLAUDE.md 8.4）。
 */
(function () {
  "use strict";

  var SITE_NAME = "論文札記";
  var SITE_TAGLINE = "PaperNotes";

  var NAV = [
    { href: "index.html", label: "論文列表" },
    { href: "topics.html", label: "主題索引" },
    { href: "about.html", label: "關於本站" }
  ];

  var STATUS_LABELS = { read: "已讀", reading: "閱讀中", "to-read": "待讀" };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  var dataPromise = null;
  /** 載入 data/papers.json，回傳 { tags: {...}, papers: [...] } */
  function loadData() {
    if (!dataPromise) {
      dataPromise = fetch("data/papers.json").then(function (res) {
        if (!res.ok) throw new Error("無法載入 data/papers.json（HTTP " + res.status + "）");
        return res.json();
      });
    }
    return dataPromise;
  }

  function statusBadge(status) {
    var label = STATUS_LABELS[status] || status;
    return '<span class="status status-' + escapeHtml(status) + '">' + escapeHtml(label) + "</span>";
  }

  function ratingStars(rating) {
    if (!rating) return "";
    var html = "";
    for (var i = 1; i <= 5; i++) html += i <= rating ? "★" : '<span class="off">★</span>';
    return '<span class="rating" title="推薦程度 ' + rating + ' / 5" aria-label="推薦程度 ' + rating + ' / 5">' + html + "</span>";
  }

  /** 作者太多時縮短顯示：第一作者 + 人數 */
  function shortAuthors(authors) {
    if (!authors || !authors.length) return "";
    if (authors.length <= 3) return authors.join("、");
    return authors[0] + " 等 " + authors.length + " 人";
  }

  function tagLink(tagId, tags) {
    var label = tags && tags[tagId] ? tags[tagId].label : tagId;
    return '<a class="tag" href="index.html?tag=' + encodeURIComponent(tagId) + '">' + escapeHtml(label) + "</a>";
  }

  function paperUrl(id) {
    return "paper.html?id=" + encodeURIComponent(id);
  }

  function showError(container, error) {
    container.innerHTML =
      '<p class="empty">資料載入失敗：' + escapeHtml(error && error.message ? error.message : error) +
      "<br>如果是在本機直接開啟檔案，請改用 <code>python -m http.server 8000</code> 預覽。</p>";
  }

  function renderChrome() {
    var current = location.pathname.split("/").pop() || "index.html";
    if (current === "paper.html") current = "index.html";

    var header = document.getElementById("site-header");
    if (header) {
      header.className = "site-header";
      header.innerHTML =
        '<div class="container">' +
        '<a class="brand" href="index.html">' + SITE_NAME + " <small>" + SITE_TAGLINE + "</small></a>" +
        '<nav class="site-nav" aria-label="主選單">' +
        NAV.map(function (item) {
          var active = item.href === current ? ' aria-current="page"' : "";
          return '<a href="' + item.href + '"' + active + ">" + escapeHtml(item.label) + "</a>";
        }).join("") +
        "</nav></div>";
    }

    var footer = document.getElementById("site-footer");
    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML =
        '<div class="container">' + SITE_NAME + " " + SITE_TAGLINE +
        "　·　個人論文閱讀筆記，內容依 CLAUDE.md 的規則整理，若有錯誤請以原論文為準。</div>";
    }
  }

  window.PN = {
    STATUS_LABELS: STATUS_LABELS,
    escapeHtml: escapeHtml,
    loadData: loadData,
    statusBadge: statusBadge,
    ratingStars: ratingStars,
    shortAuthors: shortAuthors,
    tagLink: tagLink,
    paperUrl: paperUrl,
    showError: showError
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderChrome);
  } else {
    renderChrome();
  }
})();
