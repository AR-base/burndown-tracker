/* Document generator: builds real .docx files (Office Open XML in a zip) from any project.
   Pure JS, no dependencies, no DOM. Images are passed in as PNG bytes. */
const DocGen = (() => {
  const C = (typeof Core !== 'undefined') ? Core : require('./core.js');
  const BG = () => (typeof Budget !== 'undefined') ? Budget : require('./budget.js');
  const enc = s => new TextEncoder().encode(s);
  const x = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  /* ---------- zip (store) ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {
    const parts = [], central = []; let off = 0;
    files.forEach(f => {
      const name = enc(f.name), data = typeof f.data === 'string' ? enc(f.data) : f.data, crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    });
    const cdSize = central.reduce((a, p) => a + p.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
    const all = [...parts, ...central, new Uint8Array(e.buffer)], out = new Uint8Array(all.reduce((a, p) => a + p.length, 0));
    let p = 0; all.forEach(a => { out.set(a, p); p += a.length; });
    return out;
  }

  /* ---------- docx parts ---------- */
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:color w:val="142033"/><w:lang w:val="%LANG%"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="142033"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:sz w:val="24"/><w:color w:val="596579"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="0"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="1F56F0"/></w:pBdr></w:pPr><w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="1F56F0"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="142033"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="caption"/><w:basedOn w:val="Normal"/><w:qFormat/><w:rPr><w:i/><w:sz w:val="17"/><w:color w:val="596579"/></w:rPr></w:style>
</w:styles>`;

  function runs(text, base = '') {
    return String(text).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(s => {
      const b = /^\*\*.*\*\*$/.test(s), t = b ? s.slice(2, -2) : s;
      return `<w:r><w:rPr>${base}${b ? '<w:b/>' : ''}</w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
    }).join('');
  }
  const para = (text, style, rpr = '') => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}${runs(text, rpr)}</w:p>`;
  const bullet = text => `<w:p><w:pPr><w:ind w:left="360" w:hanging="220"/><w:spacing w:after="40"/></w:pPr>${runs('•  ' + text)}</w:p>`;
  function table(rows, opts = {}) {
    if (!rows.length) return '';
    const cols = Math.max(...rows.map(r => r.length));
    const border = '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(b => `<w:${b} w:val="single" w:sz="4" w:space="0" w:color="C9D1DD"/>`).join('') + '</w:tblBorders>';
    const cell = (v, head, i) => `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/>${head ? '<w:shd w:val="clear" w:color="auto" w:fill="E8EEFC"/>' : ''}${opts.fills && opts.fills[i] ? `<w:shd w:val="clear" w:color="auto" w:fill="${opts.fills[i]}"/>` : ''}</w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr>${runs(v, `<w:sz w:val="17"/>${head ? '<w:b/>' : ''}`)}</w:p></w:tc>`;
    return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>${border}<w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>` +
      rows.map((r, i) => `<w:tr>${i === 0 ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}${Array.from({ length: cols }, (_, j) => cell(r[j] ?? '', i === 0, j)).join('')}</w:tr>`).join('') + '</w:tbl><w:p><w:pPr><w:spacing w:after="60"/></w:pPr></w:p>';
  }
  function image(rid, id, w, h) {
    let cx = 6120000, cy = Math.round(cx * h / w);
    const maxH = 8640000; if (cy > maxH) { cx = Math.round(cx * maxH / cy); cy = maxH; }
    return `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Figure ${id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="figure${id}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
  }

  /* Blocks → docx bytes. Block kinds: title, subtitle, h1, h2, p, note, bullets, table, img, caption, pagebreak */
  function build(blocks, meta) {
    const styles = STYLES.replace('%LANG%', meta.lang === 'en' ? 'en-GB' : 'fr-FR');
    const media = []; let body = '';
    blocks.forEach(b => {
      if (b.k === 'title') body += para(b.t, 'Title');
      else if (b.k === 'subtitle') body += para(b.t, 'Subtitle');
      else if (b.k === 'h1') body += para(b.t, 'Heading1');
      else if (b.k === 'h2') body += para(b.t, 'Heading2');
      else if (b.k === 'p') body += para(b.t);
      else if (b.k === 'note') body += para(b.t, null, '<w:i/><w:color w:val="8F9BB0"/>');
      else if (b.k === 'caption') body += para(b.t, 'Caption');
      else if (b.k === 'bullets') body += b.items.map(bullet).join('');
      else if (b.k === 'table') body += table(b.rows, b);
      else if (b.k === 'pagebreak') body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      else if (b.k === 'img' && b.img && b.img.bytes) {
        const n = media.length + 1; media.push(b.img.bytes);
        body += image(`rIdImg${n}`, n, b.img.w, b.img.h);
      }
    });
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body}<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1020" w:right="1020" w:bottom="1020" w:left="1020" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const footer = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NS}><w:p><w:pPr><w:jc w:val="right"/></w:pPr>${runs(meta.footer + ' · ', '<w:sz w:val="16"/><w:color w:val="8F9BB0"/>')}<w:r><w:rPr><w:sz w:val="16"/><w:color w:val="8F9BB0"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="8F9BB0"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${media.map((_, i) => `<Relationship Id="rIdImg${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/figure${i + 1}.png"/>`).join('')}</Relationships>`;
    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const files = [
      { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>` },
      { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>` },
      { name: 'docProps/core.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${x(meta.title)}</dc:title><dc:creator>${x(meta.author || '')}</dc:creator><dc:language>${meta.lang === 'en' ? 'en-GB' : 'fr-FR'}</dc:language><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created></cp:coreProperties>` },
      { name: 'word/document.xml', data: doc },
      { name: 'word/styles.xml', data: styles },
      { name: 'word/footer1.xml', data: footer },
      { name: 'word/_rels/document.xml.rels', data: rels },
      ...media.map((m, i) => ({ name: `word/media/figure${i + 1}.png`, data: m }))
    ];
    return zip(files);
  }

  /* ---------- free-text fields → blocks ("- " bullets, "a | b" tables, "## " subheadings) ---------- */
  function textBlocks(text) {
    const out = []; let buf = [], tbl = [];
    const flush = () => { if (buf.length) out.push({ k: 'bullets', items: buf }); buf = []; if (tbl.length) out.push({ k: 'table', rows: tbl }); tbl = []; };
    String(text || '').split(/\r?\n/).forEach(raw => {
      const l = raw.trim();
      if (!l) return flush();
      if (/^#{2,3}\s/.test(l)) { flush(); out.push({ k: 'h2', t: l.replace(/^#+\s*/, '') }); }
      else if (/^[-*•]\s+/.test(l)) { if (tbl.length) flush(); buf.push(l.replace(/^[-*•]\s+/, '')); }
      else if (l.includes(' | ') || /^\|.*\|$/.test(l)) {
        if (buf.length) flush();
        if (/^\|?\s*:?-{2,}/.test(l)) return; // markdown separator row
        tbl.push(l.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
      } else { flush(); out.push({ k: 'p', t: l }); }
    });
    flush();
    return out;
  }

  const FIELDS = [
    ['context', 'Contexte et problème', 'Context and problem'],
    ['objectives', 'Objectifs et indicateurs', 'Objectives and KPIs'],
    ['scope', 'Périmètre', 'Scope'],
    ['stakeholders', 'Parties prenantes', 'Stakeholders'],
    ['functional', 'Exigences fonctionnelles', 'Functional requirements'],
    ['nonfunctional', 'Exigences non fonctionnelles', 'Non-functional requirements'],
    ['constraints', 'Contraintes et hypothèses', 'Constraints and assumptions'],
    ['architecture', 'Architecture technique', 'Technical architecture'],
    ['stack', 'Stack et choix techniques', 'Stack and technical choices'],
    ['security', 'Sécurité et conformité', 'Security and compliance'],
    ['testing', 'Stratégie de test', 'Test strategy'],
    ['deployment', 'Déploiement et exploitation', 'Deployment and operations'],
    ['risks', 'Risques', 'Risks'],
    ['conclusion', 'Conclusion et prochaines étapes', 'Conclusion and next steps']
  ];
  const DOCS = {
    needs: { fr: 'Cahier des charges', en: 'Requirements specification', fields: ['context', 'objectives', 'scope', 'stakeholders', 'functional', 'nonfunctional', 'constraints'], plan: 'summary', status: false },
    technical: { fr: 'Dossier technique', en: 'Technical document', fields: ['architecture', 'stack', 'security', 'testing', 'deployment', 'risks'], plan: 'full', status: false },
    report: { fr: 'Rapport de projet complet', en: 'Full project report', fields: FIELDS.map(f => f[0]).filter(k => k !== 'conclusion'), plan: 'full', status: true }
  };
  const L = {
    fr: { card: 'Fiche projet', field: 'Champ', value: 'Valeur', name: 'Projet', code: 'Code', period: 'Période', effort: 'Charge', tasks: 'tâches', pts: 'points', phases: 'phases', ms: 'jalons',
      author: 'Auteur / chef de projet', sponsor: 'Sponsor / client', schedule: 'Planning', phaseT: 'Phases', phase: 'Phase', start: 'Début', end: 'Fin', progress: 'Avancement', msT: 'Jalons et livrables', id: 'ID',
      milestone: 'Jalon', date: 'Date', task: 'Tâche', owner: 'Resp.', deps: 'Dépend de', st: 'Statut', summaryG: 'Gantt synthétique', masterG: 'Gantt maître', wbs: 'Structure de découpage (WBS)',
      crit: 'Chemin critique (marge nulle)', critTxt: 'Tout retard sur ces tâches décale la date de fin', exec: 'Résumé', statusT: 'État d’avancement', metric: 'Indicateur', kpiDone: 'Points terminés',
      kpiEarned: 'Avancement acquis / prévu', kpiSpi: 'SPI (valeur acquise ÷ planifiée)', kpiVel: 'Vélocité / requise', kpiFc: 'Fin prévue', perWk: 'pts/sem', bd: 'Burndown', snap: 'Historique hebdomadaire',
      ideal: 'Idéal (reste)', actual: 'Réel (reste)', gap: 'Écart', watch: 'À surveiller', late: 'En retard', inprog: 'En cours', none: 'Aucune', todo: 'À compléter dans Projet → Contenu des documents.',
      statusW: { on: 'dans les temps', risk: 'à risque', late: 'en retard' }, sDone: 'Terminée', sLate: 'En retard', sIn: 'En cours', sTodo: 'À faire', generated: 'Généré le', asOf: 'Date d’état', days: 'jours',
      conclusion: 'Conclusion et prochaines étapes', noVel: 'pas encore de vélocité', fig: 'Figure',
      budgetT: 'Budget et ressources', teamT: 'Équipe nécessaire', role: 'Rôle', people: 'Personnes', pdays: 'Jours-homme', period: 'Période', load: 'Charge', rate: 'Taux / jour', cost: 'Coût',
      costPhase: 'Coût par phase', fixed: 'Coûts fixes (première année)', item: 'Poste', amount: 'Montant', labour: 'Main-d’œuvre', fixedT: 'Coûts fixes', contingencyL: 'Marge pour imprévus',
      totalB: 'Budget total estimé', summaryB: 'Synthèse du budget', evL: 'Valeur acquise à date', pvL: 'Valeur planifiée à date', share: 'Part',
      budgetNote: 'Taux journaliers indicatifs (marché français), modifiables dans l’onglet Budget. Chaque tâche compte une personne à temps plein sur ses jours ouvrés ; le nombre de personnes répartit ces jours sur la période d’activité du rôle.',
      budgetLine: (tot, pd, pp) => `Budget estimé : **${tot}** pour ${pd} jours-homme, avec une équipe de ${pp} personnes.` },
    en: { card: 'Project card', field: 'Field', value: 'Value', name: 'Project', code: 'Code', period: 'Period', effort: 'Effort', tasks: 'tasks', pts: 'points', phases: 'phases', ms: 'milestones',
      author: 'Author / project manager', sponsor: 'Sponsor / client', schedule: 'Schedule', phaseT: 'Phases', phase: 'Phase', start: 'Start', end: 'End', progress: 'Progress', msT: 'Milestones and deliverables', id: 'ID',
      milestone: 'Milestone', date: 'Date', task: 'Task', owner: 'Owner', deps: 'Depends on', st: 'Status', summaryG: 'Summary Gantt', masterG: 'Master Gantt', wbs: 'Work breakdown structure (WBS)',
      crit: 'Critical path (zero float)', critTxt: 'Any delay on these tasks moves the finish date', exec: 'Executive summary', statusT: 'Status report', metric: 'Metric', kpiDone: 'Points done',
      kpiEarned: 'Earned / planned progress', kpiSpi: 'SPI (earned ÷ planned value)', kpiVel: 'Velocity / required', kpiFc: 'Forecast finish', perWk: 'pts/wk', bd: 'Burndown', snap: 'Weekly history',
      ideal: 'Ideal (remaining)', actual: 'Actual (remaining)', gap: 'Gap', watch: 'Watch list', late: 'Late', inprog: 'In progress', none: 'None', todo: 'To be completed in Project → Document content.',
      statusW: { on: 'on track', risk: 'at risk', late: 'late' }, sDone: 'Done', sLate: 'Late', sIn: 'In progress', sTodo: 'To do', generated: 'Generated on', asOf: 'Status date', days: 'days',
      conclusion: 'Conclusion and next steps', noVel: 'no velocity yet', fig: 'Figure',
      budgetT: 'Budget and resources', teamT: 'Required team', role: 'Role', people: 'People', pdays: 'Person-days', period: 'Period', load: 'Load', rate: 'Day rate', cost: 'Cost',
      costPhase: 'Cost by phase', fixed: 'Fixed costs (first year)', item: 'Item', amount: 'Amount', labour: 'Labour', fixedT: 'Fixed costs', contingencyL: 'Contingency',
      totalB: 'Estimated total budget', summaryB: 'Budget summary', evL: 'Earned value to date', pvL: 'Planned value to date', share: 'Share',
      budgetNote: 'Indicative day rates (French market), editable in the Budget tab. Each task counts one full-time person on its working days; headcount spreads those days over the role’s active period.',
      budgetLine: (tot, pd, pp) => `Estimated budget: **${tot}** for ${pd} person-days, with a team of ${pp} people.` }
  };
  const dfmt = (t, lang) => new Date(t).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  const num = (v, lang, d = 1) => v.toFixed(d).replace('.', lang === 'fr' ? ',' : '.');

  /* Assemble one document. imgs = {summary, master, burndown} each {bytes,w,h} or undefined. */
  function assemble(kind, P, lang, todayT, imgs = {}) {
    const T = L[lang], spec = DOCS[kind], nm = o => (lang === 'fr' ? o.fr : o.en) || o.fr || o.en || o.id;
    const other = lang === 'fr' ? 'en' : 'fr', all = P.docs || {}, docs = { ...((all && all[other]) || {}), ...((all && all[lang]) || {}) }, now = C.statusTime(P, todayT), b = C.burndown(P, todayT), h = C.health(P, todayT), cp = C.criticalPath(P);
    const st = k => k.done ? T.sDone : C.parseDate(k.end) < now ? T.sLate : C.parseDate(k.start) <= now ? T.sIn : T.sTodo;
    const out = []; let sec = 0, fig = 0;
    const H1 = t => out.push({ k: 'h1', t: `${++sec}. ${t}` });
    const IMG = (img, cap) => { if (img && img.bytes) { out.push({ k: 'img', img }); out.push({ k: 'caption', t: `${T.fig} ${++fig} — ${cap}` }); } };
    out.push({ k: 'title', t: `${P.name} — ${spec[lang]}` });
    out.push({ k: 'subtitle', t: `${P.code ? P.code + ' · ' : ''}${dfmt(C.parseDate(P.start), lang)} → ${dfmt(C.parseDate(P.end), lang)} · ${T.generated} ${dfmt(todayT, lang)}${docs.author ? ' · ' + docs.author : ''}` });
    if (spec.status) {
      out.push({ k: 'h1', t: T.exec });
      const pct = b.total ? Math.round(b.done / b.total * 100) : 0, slip = b.forecast !== null ? C.diffDays(C.parseDate(P.end), b.forecast) : null;
      const firstEnd = P.tasks.length ? Math.min(...P.tasks.map(k => C.parseDate(k.end))) : Infinity;
      if (b.done === 0 && now < firstEnd) out.push({ k: 'p', t: lang === 'fr'
        ? `Le projet démarre le ${dfmt(C.parseDate(P.start), lang)} et se termine le ${dfmt(C.parseDate(P.end), lang)} : ${P.tasks.length} tâches, ${b.total} points d’effort, ${P.milestones.length} jalons. Le suivi (burndown, SPI, fin prévue) se met à jour dès que les premières tâches sont terminées.`
        : `The project starts on ${dfmt(C.parseDate(P.start), lang)} and ends on ${dfmt(C.parseDate(P.end), lang)}: ${P.tasks.length} tasks, ${b.total} effort points, ${P.milestones.length} milestones. Tracking (burndown, SPI, forecast) updates as soon as the first tasks are done.` });
      else out.push({ k: 'p', t: lang === 'fr'
        ? `Au ${dfmt(now, lang)}, ${b.done} points sur ${b.total} sont terminés (${pct} %) ; SPI ${num(h.spi, lang, 2)} : le projet est **${T.statusW[h.status]}**. ${b.forecast !== null ? `La fin prévue au rythme actuel est le ${dfmt(b.forecast, lang)} (${slip > 0 ? '+' : ''}${slip} jours par rapport au ${dfmt(C.parseDate(P.end), lang)}).` : 'Aucune vélocité mesurée pour l’instant.'} Vélocité : ${num(b.velocityWeek, lang)} pts/sem, requise : ${num(b.requiredWeek, lang)} pts/sem.`
        : `As of ${dfmt(now, lang)}, ${b.done} of ${b.total} points are done (${pct}%); SPI ${num(h.spi, lang, 2)}: the project is **${T.statusW[h.status]}**. ${b.forecast !== null ? `At the current pace it finishes on ${dfmt(b.forecast, lang)} (${slip > 0 ? '+' : ''}${slip} days vs ${dfmt(C.parseDate(P.end), lang)}).` : 'No velocity measured yet.'} Velocity: ${num(b.velocityWeek, lang)} pts/wk, required: ${num(b.requiredWeek, lang)} pts/wk.` });
      { const bx = BG().compute(P, todayT), eu = v => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v); out.push({ k: 'p', t: T.budgetLine(eu(bx.total), bx.personDays, bx.people) }); }
      if (docs.context) out.push(...textBlocks(docs.context).slice(0, 1));
    }
    H1(T.card);
    out.push({ k: 'table', rows: [[T.field, T.value], [T.name, P.name], ...(P.code ? [[T.code, P.code]] : []), ...(docs.author ? [[T.author, docs.author]] : []), ...(docs.sponsor ? [[T.sponsor, docs.sponsor]] : []),
      [T.period, `${dfmt(C.parseDate(P.start), lang)} → ${dfmt(C.parseDate(P.end), lang)}`], [T.effort, `${b.total} ${T.pts} · ${P.tasks.length} ${T.tasks} · ${P.phases.length} ${T.phases} · ${P.milestones.length} ${T.ms}`]] });
    const fieldName = key => { const f = FIELDS.find(f => f[0] === key); return lang === 'fr' ? f[1] : f[2]; };
    const textSection = key => { H1(fieldName(key)); const bl = textBlocks(docs[key]); if (bl.length) out.push(...bl); else out.push({ k: 'note', t: T.todo }); };
    const before = spec.fields.filter(k => k !== 'risks');
    before.forEach(textSection);
    // budget and resources (computed from the schedule and the day rates)
    const BB = BG().compute(P, todayT), eur = v => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
    H1(T.budgetT);
    out.push({ k: 'p', t: T.budgetLine(eur(BB.total), BB.personDays, BB.people) });
    out.push({ k: 'h2', t: T.teamT });
    out.push({ k: 'table', rows: kind === 'needs'
      ? [[T.role, T.people, T.pdays], ...BB.staff.map(r => [nm(r), String(r.people), String(r.personDays)])]
      : [[T.role, T.people, T.pdays, T.period, T.load, T.rate, T.cost], ...BB.staff.map(r => [nm(r), String(r.people), String(r.personDays), `${dfmt(C.parseDate(r.start), lang).slice(0, 5)} → ${dfmt(C.parseDate(r.end), lang).slice(0, 5)}`, Math.round(r.load * 100) + ' %', eur(r.rate), eur(r.cost)])] });
    if (kind !== 'needs') {
      out.push({ k: 'h2', t: T.costPhase });
      out.push({ k: 'table', rows: [[T.phase, T.cost, T.share], ...BB.byPhase.map(x => [`${x.id} · ${nm(x)}`, eur(x.cost), BB.labour ? Math.round(x.cost / BB.labour * 100) + ' %' : '—'])] });
    }
    if (BB.extras.length) { out.push({ k: 'h2', t: T.fixed }); out.push({ k: 'table', rows: [[T.item, T.amount], ...BB.extras.map(x => [nm(x), eur(x.amount)])] }); }
    out.push({ k: 'h2', t: T.summaryB });
    out.push({ k: 'table', rows: [[T.item, T.amount], [T.labour, eur(BB.labour)], [T.fixedT, eur(BB.extrasTotal)], [`${T.contingencyL} (${Math.round(BB.contingencyRate * 100)} %)`, eur(BB.contingency)], [`**${T.totalB}**`, `**${eur(BB.total)}**`],
      ...(spec.status ? [[T.pvL, eur(BB.plannedValue)], [T.evL, eur(BB.earnedValue)]] : [])] });
    out.push({ k: 'note', t: T.budgetNote });
    // schedule
    H1(T.schedule);
    const spans = C.phaseSpans(P).filter(s => s.start);
    out.push({ k: 'h2', t: T.phaseT });
    out.push({ k: 'table', rows: [[T.id, T.phase, T.start, T.end, T.pts, T.progress], ...spans.map(s => [s.id, nm(s), dfmt(C.parseDate(s.start), lang), dfmt(C.parseDate(s.end), lang), String(s.points), Math.round(s.progress * 100) + ' %'])] });
    if (P.milestones.length) { out.push({ k: 'h2', t: T.msT }); out.push({ k: 'table', rows: [[T.id, T.milestone, T.date], ...P.milestones.map(m => [m.id, nm(m), dfmt(C.parseDate(m.date), lang)])] }); }
    out.push({ k: 'h2', t: T.summaryG }); IMG(imgs.summary, T.summaryG);
    if (spec.plan === 'full') {
      out.push({ k: 'h2', t: T.masterG }); IMG(imgs.master, T.masterG);
      out.push({ k: 'h2', t: T.wbs });
      out.push({ k: 'table', rows: [[T.id, T.task, T.owner, T.start, T.end, 'Pts', T.deps, T.st], ...P.tasks.map(k => [k.id, nm(k), k.owner, dfmt(C.parseDate(k.start), lang).slice(0, 5), dfmt(C.parseDate(k.end), lang).slice(0, 5), String(k.points), k.deps.join(', ') || '—', st(k)])] });
      const crit = P.tasks.filter(k => cp.critical.has(k.id)).map(k => k.id);
      out.push({ k: 'p', t: `**${T.crit} :** ${crit.join(' · ') || T.none}. ${T.critTxt}.` });
    }
    if (spec.fields.includes('risks')) textSection('risks');
    if (spec.status) {
      H1(T.statusT);
      out.push({ k: 'table', rows: [[T.metric, T.value],
        [T.asOf, dfmt(now, lang)],
        [T.kpiDone, `${b.done} / ${b.total}`],
        [T.kpiEarned, `${num(h.pctEarned * 100, lang)} % / ${num(h.pctPlanned * 100, lang)} %`],
        [T.kpiSpi, `${num(h.spi, lang, 2)} — ${T.statusW[h.status]}`],
        [T.kpiVel, `${num(b.velocityWeek, lang)} / ${num(b.requiredWeek, lang)} ${T.perWk}`],
        [T.kpiFc, b.forecast !== null ? dfmt(b.forecast, lang) : T.noVel]] });
      out.push({ k: 'h2', t: T.bd }); IMG(imgs.burndown, T.bd);
      const snaps = []; let f = C.parseDate(P.start); while (new Date(f).getUTCDay() !== 5) f = C.addDays(f, 1);
      for (; f <= now; f = C.addDays(f, 7)) snaps.push(f);
      if (snaps.at(-1) !== now) snaps.push(now);
      out.push({ k: 'h2', t: T.snap });
      out.push({ k: 'table', rows: [[T.date, T.ideal, T.actual, T.gap], ...snaps.reverse().slice(0, 10).map(s => { const i = C.idealAt(P, s), hit = b.actual.find(x => x.t === s), a = hit ? hit.v : b.total - C.donePointsAt(P, s); return [dfmt(s, lang), num(i, lang), num(a, lang), (a - i >= 0 ? '+' : '') + num(a - i, lang)]; })] });
      out.push({ k: 'h2', t: T.watch });
      const late = P.tasks.filter(k => !k.done && C.parseDate(k.end) < now), prog = P.tasks.filter(k => !k.done && C.parseDate(k.start) <= now && C.parseDate(k.end) >= now);
      out.push({ k: 'p', t: `**${T.late} :** ${late.map(k => `${k.id} ${nm(k)}`).join(' · ') || T.none}` });
      out.push({ k: 'p', t: `**${T.inprog} :** ${prog.map(k => `${k.id} ${nm(k)} (${k.progress} %)`).join(' · ') || T.none}` });
      H1(T.conclusion);
      const bl = textBlocks(docs.conclusion); if (bl.length) out.push(...bl); else out.push({ k: 'note', t: T.todo });
    }
    const fname = `${(P.code || P.name).replace(/[^\w\-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'projet'}-${spec[lang].replace(/[^\w\-]+/g, '-')}.docx`;
    return { bytes: build(out, { title: `${P.name} — ${spec[lang]}`, author: docs.author, footer: `${P.name} — ${spec[lang]}`, lang }), name: fname, blocks: out };
  }
  return { zip, crc32, build, textBlocks, assemble, FIELDS, DOCS };
})();
if (typeof module !== 'undefined') module.exports = DocGen;
