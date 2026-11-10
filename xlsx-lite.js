// 의존성 없는 .xlsx / .csv 리더 (브라우저 내장 DecompressionStream 사용)
(function (g) {
  'use strict';
  function u16(d, o) { return d[o] | (d[o + 1] << 8); }
  function u32(d, o) { return (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0; }

  async function inflate(bytes) {
    if (typeof DecompressionStream === 'undefined') throw new Error('이 브라우저는 압축 해제를 지원하지 않아요. 최신 크롬에서 열어주세요.');
    const ds = new DecompressionStream('deflate-raw');
    const buf = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
    return new Uint8Array(buf);
  }

  async function unzip(buf) {
    const d = new Uint8Array(buf);
    let eocd = -1;
    for (let i = d.length - 22; i >= Math.max(0, d.length - 66000); i--) {
      if (u32(d, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('엑셀(.xlsx) 파일이 아니에요. 구버전 .xls라면 엑셀에서 .xlsx로 저장해서 올려주세요.');
    const count = u16(d, eocd + 10);
    let p = u32(d, eocd + 16);
    const files = {};
    const dec = new TextDecoder();
    for (let k = 0; k < count; k++) {
      if (u32(d, p) !== 0x02014b50) break;
      const method = u16(d, p + 10), csize = u32(d, p + 20);
      const nlen = u16(d, p + 28), elen = u16(d, p + 30), clen = u16(d, p + 32);
      const loff = u32(d, p + 42);
      const name = dec.decode(d.subarray(p + 46, p + 46 + nlen));
      files[name] = { method, csize, loff };
      p += 46 + nlen + elen + clen;
    }
    async function get(name) {
      const f = files[name];
      if (!f) return null;
      const start = f.loff + 30 + u16(d, f.loff + 26) + u16(d, f.loff + 28);
      const raw = d.subarray(start, start + f.csize);
      const out = f.method === 0 ? raw : await inflate(raw);
      return dec.decode(out);
    }
    return { names: Object.keys(files), get };
  }

  function xml(s) { return new DOMParser().parseFromString(s, 'application/xml'); }
  function tags(node, t) { return Array.from(node.getElementsByTagNameNS('*', t)); }
  function colIdx(ref) {
    const m = /^([A-Z]+)/.exec(ref || ''); if (!m) return -1;
    let n = 0; for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1;
  }

  async function readXlsx(buf) {
    const z = await unzip(buf);
    let sheetPath = 'xl/worksheets/sheet1.xml';
    const wb = await z.get('xl/workbook.xml');
    const rels = await z.get('xl/_rels/workbook.xml.rels');
    if (wb && rels) {
      const first = tags(xml(wb), 'sheet')[0];
      const rid = first && (first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
      const rel = tags(xml(rels), 'Relationship').find(r => r.getAttribute('Id') === rid);
      if (rel) {
        let t = rel.getAttribute('Target');
        t = t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, '');
        if (z.names.includes(t)) sheetPath = t;
      }
    }
    if (!z.names.includes(sheetPath)) sheetPath = z.names.find(n => /^xl\/worksheets\/.*\.xml$/.test(n));
    const ssXml = await z.get('xl/sharedStrings.xml');
    const ss = ssXml ? tags(xml(ssXml), 'si').map(si => tags(si, 't').map(t => t.textContent).join('')) : [];
    const sh = xml(await z.get(sheetPath));
    const rows = [];
    for (const r of tags(sh, 'row')) {
      const ri = parseInt(r.getAttribute('r'), 10) - 1;
      const row = [];
      let ci = 0;
      for (const c of tags(r, 'c')) {
        const ref = c.getAttribute('r'); const idx = ref ? colIdx(ref) : ci;
        const t = c.getAttribute('t');
        const v = tags(c, 'v')[0];
        let val = null;
        if (t === 's') val = v ? ss[parseInt(v.textContent, 10)] : '';
        else if (t === 'inlineStr') val = tags(c, 't').map(x => x.textContent).join('');
        else if (t === 'str' || t === 'e') val = v ? v.textContent : '';
        else if (t === 'b') val = v ? v.textContent === '1' : null;
        else if (v) { const n = Number(v.textContent); val = isNaN(n) ? v.textContent : n; }
        row[idx] = val; ci = idx + 1;
      }
      rows[isNaN(ri) ? rows.length : ri] = row;
    }
    return Array.from(rows, r => r || []);
  }

  function readCsv(buf) {
    let text = new TextDecoder('utf-8').decode(buf);
    if (text.includes('\uFFFD')) { try { text = new TextDecoder('euc-kr').decode(buf); } catch (e) {} }
    text = text.replace(/^﻿/, '');
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; }
      else cur += ch;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }

  g.XlsxLite = {
    read: async function (file) {
      const buf = await file.arrayBuffer();
      return /\.csv$/i.test(file.name) ? readCsv(buf) : readXlsx(buf);
    }
  };
})(window);
