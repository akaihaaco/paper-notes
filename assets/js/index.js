/* 首頁：論文列表、搜尋、標籤／狀態篩選、排序 */
(function () {
  "use strict";

  var esc = PN.escapeHtml;
  var listEl = document.getElementById("paper-list");
  var statsEl = document.getElementById("stats");
  var tagsEl = document.getElementById("tag-filter");
  var searchEl = document.getElementById("search");
  var statusEl = document.getElementById("status-filter");
  var sortEl = document.getElementById("sort");
  var countEl = document.getElementById("result-count");

  var state = {
    query: "",
    tag: new URLSearchParams(location.search).get("tag") || "",
    status: "",
    sort: "year-desc"
  };
  var data = null;

  var SORTERS = {
    "year-desc": function (a, b) { return b.year - a.year || a.title.localeCompare(b.title); },
    "year-asc": function (a, b) { return a.year - b.year || a.title.localeCompare(b.title); },
    "rating-desc": function (a, b) { return (b.rating || 0) - (a.rating || 0) || b.year - a.year; },
    "added-desc": function (a, b) { return b.added.localeCompare(a.added) || b.year - a.year; }
  };

  function renderStats() {
    var papers = data.papers;
    var read = papers.filter(function (p) { return p.status === "read"; }).length;
    var usedTags = Object.keys(data.tags).filter(function (id) { return data.tags[id].count > 0; }).length;
    var years = papers.map(function (p) { return p.year; });
    var span = years.length ? Math.min.apply(null, years) + "–" + Math.max.apply(null, years) : "—";
    statsEl.innerHTML =
      "<li><strong>" + papers.length + "</strong> 篇論文</li>" +
      "<li><strong>" + read + "</strong> 篇已讀</li>" +
      "<li><strong>" + usedTags + "</strong> 個主題</li>" +
      "<li><strong>" + esc(span) + "</strong> 發表年份</li>";
  }

  function renderTagFilter() {
    var html = '<button type="button" class="tag' + (state.tag ? "" : " is-active") + '" data-tag="">全部</button>';
    Object.keys(data.tags).forEach(function (id) {
      var tag = data.tags[id];
      if (!tag.count) return;
      html += '<button type="button" class="tag' + (state.tag === id ? " is-active" : "") + '" data-tag="' + esc(id) +
        '" title="' + esc(tag.desc) + '">' + esc(tag.label) + ' <span class="count">' + tag.count + "</span></button>";
    });
    tagsEl.innerHTML = html;
  }

  function matches(paper) {
    if (state.tag && paper.tags.indexOf(state.tag) === -1) return false;
    if (state.status && paper.status !== state.status) return false;
    if (!state.query) return true;
    var tagLabels = paper.tags.map(function (id) { return data.tags[id] ? data.tags[id].label : id; });
    var haystack = [paper.title, paper.title_zh, paper.authors.join(" "), paper.venue, paper.year, paper.summary,
      paper.tags.join(" "), tagLabels.join(" ")].join(" ").toLowerCase();
    return state.query.toLowerCase().split(/\s+/).every(function (word) { return haystack.indexOf(word) !== -1; });
  }

  function card(paper) {
    return '<article class="card">' +
      '<div class="card-meta"><span class="year">' + esc(paper.year) + "</span><span>" + esc(paper.venue) + "</span>" +
      '<span class="spacer"></span>' + PN.ratingStars(paper.rating) + PN.statusBadge(paper.status) + "</div>" +
      '<h2><a href="' + PN.paperUrl(paper.id) + '">' + esc(paper.title) + "</a></h2>" +
      (paper.title_zh ? '<p class="title-zh">' + esc(paper.title_zh) + "</p>" : "") +
      '<p class="authors">' + esc(PN.shortAuthors(paper.authors)) + "</p>" +
      '<p class="summary">' + esc(paper.summary) + "</p>" +
      '<div class="tags">' + paper.tags.map(function (id) { return PN.tagLink(id, data.tags); }).join("") + "</div>" +
      "</article>";
  }

  function renderList() {
    var papers = data.papers.filter(matches).sort(SORTERS[state.sort] || SORTERS["year-desc"]);
    countEl.textContent = "顯示 " + papers.length + " / " + data.papers.length + " 篇";
    listEl.innerHTML = papers.length
      ? '<div class="card-grid">' + papers.map(card).join("") + "</div>"
      : '<p class="empty">沒有符合條件的論文，試試其他關鍵字或清除篩選。</p>';
  }

  function syncUrl() {
    var url = state.tag ? "index.html?tag=" + encodeURIComponent(state.tag) : "index.html";
    history.replaceState(null, "", url);
  }

  searchEl.addEventListener("input", function () { state.query = searchEl.value.trim(); renderList(); });
  statusEl.addEventListener("change", function () { state.status = statusEl.value; renderList(); });
  sortEl.addEventListener("change", function () { state.sort = sortEl.value; renderList(); });
  tagsEl.addEventListener("click", function (event) {
    var button = event.target.closest("[data-tag]");
    if (!button) return;
    state.tag = button.getAttribute("data-tag");
    syncUrl();
    renderTagFilter();
    renderList();
  });

  PN.loadData().then(function (loaded) {
    data = loaded;
    if (state.tag && !data.tags[state.tag]) state.tag = "";
    renderStats();
    renderTagFilter();
    renderList();
  }).catch(function (error) { PN.showError(listEl, error); });
})();
