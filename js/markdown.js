/* Tiny markdown -> HTML renderer. Just enough for our dossier content:
   headers, bold, hr, blockquotes, tables, lists, paragraphs. Keeps text verbatim. */
(function () {
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function inline(s) {
    s = escapeHtml(s);
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return s;
  }
  function isTableSep(line) {
    return /^\|?[\s:|-]+\|?$/.test(line) && line.includes("-");
  }
  function parseTableRow(line) {
    return line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  }

  window.renderMarkdown = function (md) {
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let i = 0;
    let listBuffer = [];
    let listType = null;

    function flushList() {
      if (listBuffer.length) {
        const tag = listType === "ol" ? "ol" : "ul";
        html += `<${tag}>` + listBuffer.map((li) => `<li>${inline(li)}</li>`).join("") + `</${tag}>`;
        listBuffer = [];
        listType = null;
      }
    }

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed === "") { flushList(); i++; continue; }

      if (/^---+$/.test(trimmed)) { flushList(); html += "<hr/>"; i++; continue; }

      let m;
      if ((m = /^(#{1,6})\s+(.*)$/.exec(trimmed))) {
        flushList();
        const level = Math.min(m[1].length + 2, 6); // shift down so h1 -> h3 visually
        html += `<h${level} class="md-h${m[1].length}">${inline(m[2])}</h${level}>`;
        i++; continue;
      }

      if (/^>\s?/.test(trimmed)) {
        flushList();
        let quote = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
          quote.push(lines[i].trim().replace(/^>\s?/, ""));
          i++;
        }
        html += `<blockquote>${inline(quote.join(" "))}</blockquote>`;
        continue;
      }

      if (trimmed.startsWith("|")) {
        flushList();
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          rows.push(lines[i].trim());
          i++;
        }
        if (rows.length >= 2 && isTableSep(rows[1])) {
          const head = parseTableRow(rows[0]);
          const body = rows.slice(2).map(parseTableRow);
          html += '<div class="md-table-wrap"><table class="md-table"><thead><tr>' +
            head.map((h) => `<th>${inline(h)}</th>`).join("") + "</tr></thead><tbody>" +
            body.map((r) => "<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>").join("") +
            "</tbody></table></div>";
        }
        continue;
      }

      if ((m = /^[*-]\s+(.*)$/.exec(trimmed))) {
        if (listType !== "ul") flushList();
        listType = "ul";
        listBuffer.push(m[1]);
        i++; continue;
      }
      if ((m = /^\d+\.\s+(.*)$/.exec(trimmed))) {
        if (listType !== "ol") flushList();
        listType = "ol";
        listBuffer.push(m[1]);
        i++; continue;
      }

      flushList();
      let para = [trimmed];
      i++;
      while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,6})\s/.test(lines[i].trim())
        && !/^[*-]\s+/.test(lines[i].trim()) && !/^\d+\.\s+/.test(lines[i].trim())
        && !/^---+$/.test(lines[i].trim()) && !lines[i].trim().startsWith("|") && !/^>/.test(lines[i].trim())) {
        para.push(lines[i].trim());
        i++;
      }
      html += `<p>${inline(para.join(" "))}</p>`;
    }
    flushList();
    return html;
  };
})();
