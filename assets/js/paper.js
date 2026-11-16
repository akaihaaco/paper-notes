/* 單篇論文頁：paper.html?id=<論文 id>
 * 書目資料來自 data/papers.json，內文來自 papers/<id>.md（去掉 frontmatter 後用 marked 轉成 HTML）。
 */
(function () {
  "use strict";

  var esc = PN.escapeHtml;
  var root = document.getElementById("paper");
  var id = new URLSearchParams(location.search).get("id") || "";

  function notFound() {
    document.title = "找不到論文｜論文札記";
    root.innerHTML = '<p class="empty">找不到這篇論文（id：' + esc(id || "未指定") +
      '）。<br><a href="index.html">回到論文列表</a></p>';
  }

  function stripFrontmatter(text) {
    return text.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  }

  function renderMarkdown(markdown) {
    if (window.marked && typeof window.marked.parse === "function") {
      var html = window.marked.parse(markdown);
      // 表格包一層，手機上可以橫向捲動
      return html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
    }
    // marked 沒載到時的退路：原樣顯示文字
    return '<pre style="white-space:pre-wrap">' + esc(markdown) + "</pre>";
  }

  function row(label, html) {
    return html ? "<tr><th>" + label + "</th><td>" + html + "</td></tr>" : "";
  }

  function linkItem(paper) {
    return '<li><span class="year">' + esc(paper.year) + '</span><a href="' + PN.paperUrl(paper.id) + '">' +
      esc(paper.title) + '</a><span class="muted">' + esc(paper.summary) + "</span></li>";
  }

  function render(data, paper, markdown) {
    document.title = paper.title + "｜論文札記";
    var papers = data.papers;
    var index = papers.indexOf(paper);
    var newer = papers[index - 1];
    var older = papers[index + 1];
    var related = (paper.related || [])
      .map(function (rid) { return papers.filter(function (p) { return p.id === rid; })[0]; })
      .filter(Boolean);

    root.innerHTML =
      '<header class="paper-head">' +
      '<a class="back" href="index.html">← 論文列表</a>' +
      "<h1>" + esc(paper.title) + "</h1>" +
      (paper.title_zh ? '<p class="title-zh">' + esc(paper.title_zh) + "</p>" : "") +
      "</header>" +
      '<table class="meta-table"><tbody>' +
      row("作者", esc(paper.authors.join("、"))) +
      row("發表", esc(paper.venue) + "（" + esc(paper.year) + "）") +
      row("連結", '<a href="' + esc(paper.url) + '" target="_blank" rel="noopener">' + esc(paper.url) + "</a>") +
      row("主題", '<div class="tags">' + paper.tags.map(function (t) { return PN.tagLink(t, data.tags); }).join("") + "</div>") +
      row("狀態", PN.statusBadge(paper.status) + (paper.rating ? "　" + PN.ratingStars(paper.rating) : "")) +
      row("加入日期", esc(paper.added)) +
      "</tbody></table>" +
      '<div class="callout"><span class="label">一句話摘要</span><p>' + esc(paper.summary) + "</p></div>" +
      '<div class="prose">' + renderMarkdown(markdown) + "</div>" +
      (related.length
        ? '<h2 class="section-title">相關論文</h2><ul class="link-list">' + related.map(linkItem).join("") + "</ul>"
        : "") +
      '<nav class="pager" aria-label="上一篇與下一篇">' +
      (newer ? '<a class="btn btn-ghost" href="' + PN.paperUrl(newer.id) + '">← ' + esc(newer.title) + "</a>" : "<span></span>") +
      (older ? '<a class="btn btn-ghost" href="' + PN.paperUrl(older.id) + '">' + esc(older.title) + " →</a>" : "<span></span>") +
      "</nav>";
  }

  PN.loadData().then(function (data) {
    var paper = data.papers.filter(function (p) { return p.id === id; })[0];
    if (!paper) { notFound(); return null; }
    return fetch("papers/" + encodeURIComponent(paper.id) + ".md")
      .then(function (res) {
        if (!res.ok) throw new Error("無法載入 papers/" + paper.id + ".md（HTTP " + res.status + "）");
        return res.text();
      })
      .then(function (text) { render(data, paper, stripFrontmatter(text)); });
  }).catch(function (error) { PN.showError(root, error); });
})();
