/* 主題索引頁：依 config/tags.json 的標籤把論文分組 */
(function () {
  "use strict";

  var esc = PN.escapeHtml;
  var root = document.getElementById("topics");

  PN.loadData().then(function (data) {
    var ids = Object.keys(data.tags).filter(function (id) { return data.tags[id].count > 0; });
    if (!ids.length) {
      root.innerHTML = '<p class="empty">目前還沒有任何論文。</p>';
      return;
    }

    var nav = '<div class="tags topic-nav">' + ids.map(function (id) {
      return '<a class="tag" href="#' + esc(id) + '">' + esc(data.tags[id].label) +
        ' <span class="count">' + data.tags[id].count + "</span></a>";
    }).join("") + "</div>";

    var sections = ids.map(function (id) {
      var tag = data.tags[id];
      var papers = data.papers.filter(function (p) { return p.tags.indexOf(id) !== -1; });
      return '<section class="topic" id="' + esc(id) + '">' +
        '<div class="topic-head"><h2>' + esc(tag.label) + "</h2><code>" + esc(id) + "</code>" +
        '<a href="index.html?tag=' + encodeURIComponent(id) + '">在列表中篩選 →</a></div>' +
        "<p>" + esc(tag.desc) + "</p>" +
        '<ul class="link-list">' + papers.map(function (p) {
          return '<li><span class="year">' + esc(p.year) + '</span><a href="' + PN.paperUrl(p.id) + '">' + esc(p.title) +
            "</a>" + PN.statusBadge(p.status) + '<span class="muted">' + esc(p.summary) + "</span></li>";
        }).join("") + "</ul></section>";
    }).join("");

    root.innerHTML = nav + sections;
    if (location.hash) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
    }
  }).catch(function (error) { PN.showError(root, error); });
})();
