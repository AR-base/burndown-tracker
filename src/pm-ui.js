/* PM toolkit and PM brain tabs. Everything typed here goes through PM.clean (pm.js) before it is kept;
   all text is escaped on output. Uses only the public App API from app.js. */
const PMUI = (() => {
  const STR = {
    fr: { tabBrain: 'Cerveau PM', tabPm: 'Pilotage', brEyebrow: 'Le cerveau du chef de projet', brTitle: 'Tout ce que fait un chef de projet, branché sur votre projet',
      brLead: 'Chaque zone est une fonction du métier (les 10 domaines du PMBOK). Sa couleur suit l’état réel du projet ; cliquez pour agir.',
      brDoes: 'Le chef de projet', brOpen: 'Ouvrir', brGood: 'Sous contrôle', brWarn: 'À surveiller', brBad: 'Action requise',
      pmAdd: 'Ajouter une ligne', pmDel: 'Supprimer la ligne', pmNew: 'Nouvel élément', pmEmptyT: 'Ce projet n’a pas encore de registres de pilotage',
      pmEmptyL: 'Générez la charte, les parties prenantes, la matrice RACI, les risques, le plan de communication et les critères qualité à partir du planning. Tout reste modifiable.',
      pmGen: 'Générer le kit du chef de projet', pmGenDone: 'Kit de pilotage généré.', pmRoles: 'Rôles (séparés par des virgules)', pmItem: 'Livrable',
      pmCopy: 'Copier', pmDl: 'Télécharger (.txt)', pmCopied: 'Rapport copié.', pmReq: 'Champ obligatoire', pmRows: 'lignes', pmCount: 'élément(s)',
      noProjT: 'Aucun projet ouvert', noProjL: 'Créez votre premier projet : décrivez-le en une phrase, et le planning, le budget, les documents et tout le kit du chef de projet sont préparés pour vous.' },
    en: { tabBrain: 'PM brain', tabPm: 'PM toolkit', brEyebrow: 'The project manager’s brain', brTitle: 'Everything a project manager does, wired to your project',
      brLead: 'Each area is one part of the job (the 10 PMBOK knowledge areas). Its colour follows the real state of the project; click to act.',
      brDoes: 'The project manager', brOpen: 'Open', brGood: 'Under control', brWarn: 'Watch', brBad: 'Action needed',
      pmAdd: 'Add a row', pmDel: 'Delete row', pmNew: 'New item', pmEmptyT: 'This project has no management registers yet',
      pmEmptyL: 'Generate the charter, stakeholders, RACI matrix, risks, communication plan and quality criteria from the schedule. Everything stays editable.',
      pmGen: 'Generate the project manager kit', pmGenDone: 'Management kit generated.', pmRoles: 'Roles (comma-separated)', pmItem: 'Deliverable',
      pmCopy: 'Copy', pmDl: 'Download (.txt)', pmCopied: 'Report copied.', pmReq: 'Required field', pmRows: 'rows', pmCount: 'item(s)',
      noProjT: 'No project open', noProjL: 'Create your first project: describe it in one sentence, and the schedule, budget, documents and the full project-manager kit are prepared for you.' }
  };
  const LONG = new Set(['response', 'rationale', 'criteria', 'notes', 'actions', 'lesson', 'action']);

  function init(App) {
    App.addStrings(STR.fr, STR.en);
    const { t, esc } = App, $ = id => document.getElementById(id);
    const L = () => PM.LBL[App.ui.lang];
    if (!App.ui.pmSec || !PM.SECTIONS.includes(App.ui.pmSec)) App.ui.pmSec = 'charter';
    const pBrain = $('tab-brain'), pPm = $('tab-pm');
    if (!pBrain || !pPm) return;

    /* ------------------------------ brain ------------------------------ */
    pBrain.innerHTML = `<div class="brain">
      <div class="brain-head"><p class="eyebrow" data-i="brEyebrow"></p><h2 class="brain-h" id="brTitle"></h2><p class="brain-lead" data-i="brLead"></p></div>
      <div class="brain-stage" id="brainStage"><canvas class="brain-cv" id="brainCv" aria-hidden="true"></canvas>
        <ul class="bn-col bn-l" id="bnL" role="list"></ul><ul class="bn-col bn-r" id="bnR" role="list"></ul></div>
      <div class="brain-foot"><div class="card brain-detail" id="brainDetail" aria-live="polite"></div>
        <ul class="brain-legend" aria-hidden="true"><li class="st-good" data-i="brGood"></li><li class="st-risk" data-i="brWarn"></li><li class="st-late" data-i="brBad"></li></ul></div></div>`;
    const stage = $('brainStage'), cv = $('brainCv');
    let areas = [], focusId = null, hoverId = null;
    const narrow = () => window.innerWidth < 820;
    const brain = Brain.create(cv, {
      offsetX: 0.5, scale: 0.36, count: 2200,
      targets() {
        if (narrow()) return [];
        const c = cv.getBoundingClientRect();
        return [...stage.querySelectorAll('[data-area]')].map(b => {
          const r = b.getBoundingClientRect(), left = b.closest('.bn-l');
          return { id: b.dataset.area, x: (left ? r.right : r.left) - c.left, y: r.top + r.height / 2 - c.top };
        });
      }
    });
    const stCls = s => (s === 'good' ? 'st-good' : s === 'warn' ? 'st-risk' : 'st-late');
    const ANCH = Brain.ANCHORS;
    function renderBrain() {
      const [h1, h2] = t('brTitle').split(/,\s*/);
      $('brTitle').innerHTML = h2 ? `${esc(h1)}, <em>${esc(h2)}</em>` : esc(h1);
      areas = PM.areas(App.project, App.today(), App.ui.lang);
      const node = a => `<li><button type="button" class="bn ${stCls(a.status)}${a.id === focusId ? ' on' : ''}" data-area="${esc(a.id)}" aria-describedby="brainDetail">
        <span class="bn-dot" aria-hidden="true"></span><span class="bn-t"><b>${esc(a.name)}</b><small>${esc(a.value)}</small></span></button></li>`;
      const byY = (a, b) => ANCH[b.id][1] - ANCH[a.id][1];
      $('bnR').innerHTML = areas.filter(a => ANCH[a.id][0] > 0).sort(byY).map(node).join('');
      $('bnL').innerHTML = areas.filter(a => ANCH[a.id][0] <= 0).sort(byY).map(node).join('');
      brain.status(Object.fromEntries(areas.map(a => [a.id, a.status])));
      if (!focusId || !areas.some(a => a.id === focusId)) focusId = (areas.find(a => a.status === 'bad') || areas.find(a => a.status === 'warn') || areas[0]).id;
      showDetail(hoverId || focusId);
    }
    function showDetail(id) {
      const a = areas.find(x => x.id === id); if (!a) return;
      stage.querySelectorAll('[data-area]').forEach(b => b.classList.toggle('on', b.dataset.area === id));
      brain.focus(id);
      const modName = a.go.startsWith('pm:') ? PM.LBL[App.ui.lang][a.go.slice(3)][0] : t({ tasks: 'tabTasks', gantt: 'tabGantt', budget: 'tabBudget' }[a.go]);
      $('brainDetail').innerHTML = `<div class="bd-in"><span class="pill ${stCls(a.status)}">${esc(t(a.status === 'good' ? 'brGood' : a.status === 'warn' ? 'brWarn' : 'brBad'))}</span>
        <h3>${esc(a.name)}</h3><p class="hint"><b>${esc(t('brDoes'))}</b> ${esc(a.does.charAt(0).toLowerCase() + a.does.slice(1))}.</p>
        <p class="bd-val"><b>${esc(a.value)}</b><span>${esc(a.detail)}</span></p>
        <button class="btn pri" type="button" data-go="${esc(a.id)}">${esc(t('brOpen'))} · ${esc(modName)} →</button></div>`;
    }
    function go(id) {
      const a = areas.find(x => x.id === id); if (!a) return;
      if (a.go.startsWith('pm:')) { App.ui.pmSec = a.go.slice(3); App.goTab('pm'); renderPm(); }
      else App.goTab(a.go);
    }
    pBrain.addEventListener('click', ev => {
      const b = ev.target.closest('[data-area]'); if (b) { if (focusId === b.dataset.area || narrow()) go(b.dataset.area); else { focusId = b.dataset.area; showDetail(focusId); } return; }
      const g = ev.target.closest('[data-go]'); if (g) go(g.dataset.go);
    });
    pBrain.addEventListener('dblclick', ev => { const b = ev.target.closest('[data-area]'); if (b) go(b.dataset.area); });
    const hover = id => { hoverId = id; showDetail(id || focusId); };
    pBrain.addEventListener('pointerover', ev => { const b = ev.target.closest('[data-area]'); if (b && b.dataset.area !== hoverId) hover(b.dataset.area); });
    pBrain.addEventListener('pointerleave', () => hover(null));
    pBrain.addEventListener('focusin', ev => { const b = ev.target.closest('[data-area]'); if (b) { focusId = b.dataset.area; showDetail(focusId); } });

    /* --------------------------- PM toolkit --------------------------- */
    pPm.innerHTML = `<div class="pm-wrap"><nav class="pm-nav" id="pmNav" aria-label="${esc(t('tabPm'))}"></nav><div id="pmMain"></div></div>`;
    const pm = () => App.project.pm;
    let pending = null;
    const flush = () => { if (!pending) return; clearTimeout(pending); pending = null; App.mutate(() => {}); };
    const soon = () => { clearTimeout(pending); pending = setTimeout(() => { pending = null; App.mutate(() => {}); }, 450); };
    const count = k => k === 'charter' ? (pm().charter.purpose ? 1 : 0) : k === 'raci' ? pm().raci.rows.length : k === 'report' ? '' : pm()[k].length;
    const fmtD = v => v ? App.dLabel(App.Core.parseDate(v), true) : '';
    function cell(reg, i, row, [k, type, lim, req]) {
      const id = `pm-${reg}-${i}-${k}`, lab = esc(L().col[k] || k), v = row[k], ro = App.readOnly ? ' disabled' : '';
      if (type === 'enum') return `<select id="${id}" data-reg="${reg}" data-row="${i}" data-col="${k}" aria-label="${lab}"${ro}>${lim.map(o => `<option value="${o}"${o === v ? ' selected' : ''}>${esc(L().en_[o] || o)}</option>`).join('')}</select>`;
      if (type === 'int') return `<input id="${id}" type="number" class="pm-num" min="${lim[0]}" max="${lim[1]}" step="1" value="${esc(v)}" data-reg="${reg}" data-row="${i}" data-col="${k}" aria-label="${lab}"${ro}>`;
      if (type === 'date') return `<input id="${id}" type="date" value="${esc(v)}" data-reg="${reg}" data-row="${i}" data-col="${k}" aria-label="${lab}"${ro}>`;
      return `<textarea id="${id}" rows="1" class="grow${LONG.has(k) ? ' long' : ' short'}" maxlength="${lim}" data-reg="${reg}" data-row="${i}" data-col="${k}" aria-label="${lab}"${req ? ' data-req="1"' : ''}${ro}>${esc(v)}</textarea>`;
    }
    const scoreCls = s => (s >= 15 ? 'sc-bad' : s >= 10 ? 'sc-hi' : s >= 5 ? 'sc-mid' : 'sc-low');
    function table(reg) {
      const cols = PM.REG[reg], rows = pm()[reg];
      const sc = r => `<td class="c-score" data-label="${esc(L().col.score)}"><span class="score ${scoreCls(r.p * r.i)}">${r.p * r.i}</span></td>`;
      const head = (reg === 'stakeholders' ? '<th class="c-n">#</th>' : '') + cols.map(([k]) => `<th class="c-${k}">${esc(L().col[k] || k)}</th>${reg === 'risks' && k === 'i' ? `<th class="c-score">${esc(L().col.score)}</th>` : ''}`).join('') + '<th></th>';
      const body = rows.map((r, i) => `<tr>${reg === 'stakeholders' ? `<td class="c-n"><span class="num-dot">${i + 1}</span></td>` : ''}${cols.map(c => `<td class="c-${c[0]}" data-label="${esc(L().col[c[0]] || c[0])}">${cell(reg, i, r, c)}</td>${reg === 'risks' && c[0] === 'i' ? sc(r) : ''}`).join('')}
        <td class="r">${App.readOnly ? '' : `<button type="button" class="icon-btn" data-del="${i}" aria-label="${esc(t('pmDel'))} ${i + 1}">×</button>`}</td></tr>`).join('');
      return `<div class="tbl-wrap pm-tbl"><table class="pm-t pm-cards t-${reg}"><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${cols.length + 3}" class="hint empty-row">${esc(L().none)}</td></tr>`}</tbody></table></div>`;
    }
    function heatmap() {
      const open = pm().risks.filter(r => r.status !== 'closed');
      let h = `<div class="heat" role="img" aria-label="${esc(L().heat)}"><span class="heat-y">${esc(L().probability)}</span><div class="heat-g">`;
      for (let p = 5; p >= 1; p--) for (let i = 1; i <= 5; i++) {
        const here = open.filter(r => r.p === p && r.i === i);
        h += `<div class="hc ${scoreCls(p * i)}${here.length ? ' has' : ''}" title="${p}×${i}=${p * i}">${here.length ? `<b>${here.length}</b>` : ''}</div>`;
      }
      return h + `</div><span class="heat-x">${esc(L().impact)}</span></div>`;
    }
    function grid() {
      const q = L().grid;
      return `<div class="pi-grid" role="img" aria-label="${esc(PM.LBL[App.ui.lang].stakeholders[0])}"><span class="pi-y">${esc(L().col.influence)} ↑</span>
        <div class="pi-box"><div class="pi-q">${esc(q[0])}</div><div class="pi-q">${esc(q[1])}</div><div class="pi-q">${esc(q[2])}</div><div class="pi-q">${esc(q[3])}</div>
        ${pm().stakeholders.map((s, n) => { const same = pm().stakeholders.slice(0, n).filter(o => o.interest === s.interest && o.influence === s.influence).length;
          return `<span class="pi-dot" style="left:calc(${(s.interest - 1) / 4 * 76 + 12}% + ${same * 14}px);bottom:${(s.influence - 1) / 4 * 60 + 20}%" title="${esc(s.name)}">${n + 1}</span>`; }).join('')}</div>
        <span class="pi-x">${esc(L().col.interest)} →</span></div>`;
    }
    function topRisks() {
      const top = pm().risks.filter(r => r.status !== 'closed').sort((a, b) => b.p * b.i - a.p * a.i).slice(0, 4);
      return `<ol class="pm-side">${top.map(r => `<li><span class="score ${scoreCls(r.p * r.i)}">${r.p * r.i}</span><span><b>${esc(r.title)}</b><small>${esc(r.response || '—')}</small></span></li>`).join('') || `<li class="hint">${esc(L().none)}</li>`}</ol>`;
    }
    function legendSh() {
      return `<ol class="pm-side">${pm().stakeholders.map((s, n) => `<li><span class="num-dot">${n + 1}</span><span><b>${esc(s.name)}</b><small>${esc(L().en_[s.strategy] || s.strategy)} · ${esc(L().col.influence)} ${s.influence}/5 · ${esc(L().col.interest)} ${s.interest}/5</small></span></li>`).join('') || `<li class="hint">${esc(L().none)}</li>`}</ol>`;
    }
    function raci() {
      const R = pm().raci, issues = new Map(PM.raciIssues(R, App.ui.lang).map(x => [x.id, x.msg])), ro = App.readOnly ? ' disabled' : '';
      return `<p class="hint">${esc(L().raciLegend)}</p>
        <div class="f pm-roles"><label for="pm-raci-roles">${esc(t('pmRoles'))}</label><input id="pm-raci-roles" maxlength="200" value="${esc(R.roles.join(', '))}"${ro}></div>
        <div class="tbl-wrap pm-tbl"><table class="pm-t t-raci"><thead><tr><th>${esc(t('pmItem'))}</th>${R.roles.map(r => `<th class="c">${esc(r)}</th>`).join('')}<th></th></tr></thead><tbody>
        ${R.rows.map((r, i) => `<tr><td><input id="pm-raci-item-${i}" data-raci-item="${i}" maxlength="120" value="${esc(r.item)}" aria-label="${esc(t('pmItem'))}"${ro}>${issues.has(r.id) ? `<span class="chip c-late raci-warn">${esc(issues.get(r.id))}</span>` : ''}</td>
          ${R.roles.map(ro2 => { const v = R.cells[`${r.id}|${ro2}`] || ''; return `<td class="c"><select id="pm-raci-${i}-${esc(ro2)}" class="raci-sel rc-${v || 'n'}" data-raci="${esc(r.id)}|${esc(ro2)}" aria-label="${esc(r.item)} · ${esc(ro2)}"${ro}><option value="">·</option>${PM.RACI.map(x => `<option${x === v ? ' selected' : ''}>${x}</option>`).join('')}</select></td>`; }).join('')}
          <td class="r">${App.readOnly ? '' : `<button type="button" class="icon-btn" data-raci-del="${i}" aria-label="${esc(t('pmDel'))} ${i + 1}">×</button>`}</td></tr>`).join('')}</tbody></table></div>`;
    }
    function charter() {
      const c = pm().charter, ro = App.readOnly ? ' disabled' : '', col = L().col;
      const ta = k => `<div class="f wide"><label for="pm-ch-${k}">${esc(col[k])}</label><textarea id="pm-ch-${k}" class="doc-ta" data-ch="${k}" rows="3" maxlength="600"${ro}>${esc(c[k])}</textarea></div>`;
      const inp = k => `<div class="f"><label for="pm-ch-${k}">${esc(col[k])}</label><input id="pm-ch-${k}" data-ch="${k}" maxlength="120" value="${esc(c[k])}"${ro}></div>`;
      return `<div class="form pm-charter">${ta('purpose')}${inp('sponsor')}${inp('manager')}${ta('success')}
        <div class="f"><label class="chk"><input type="checkbox" id="pm-ch-approved" data-ch="approved"${c.approved ? ' checked' : ''}${ro}> <span>${esc(col.approved)}</span></label></div>
        <div class="f"><label for="pm-ch-approvedOn">${esc(col.approvedOn)}</label><input type="date" id="pm-ch-approvedOn" data-ch="approvedOn" value="${esc(c.approvedOn)}"${ro}></div></div>`;
    }
    function report() {
      return `<textarea class="report-box" id="pmReport" readonly rows="18" aria-label="${esc(L().report[0])}">${esc(PM.statusReport(App.project, App.today(), App.ui.lang))}</textarea>
        <div class="actions"><button class="btn pri" type="button" id="pmCopy">${esc(t('pmCopy'))}</button><button class="btn" type="button" id="pmDlRep">${esc(t('pmDl'))}</button></div>`;
    }
    function renderPm() {
      const sec = App.ui.pmSec;
      $('pmNav').innerHTML = PM.SECTIONS.map(k => { const n = count(k); return `<button type="button" data-sec="${k}" aria-current="${k === sec}">${esc(L()[k][0])}${n !== '' ? `<span class="n">${n}</span>` : ''}</button>`; }).join('');
      if (PM.isEmpty(pm()) && App.project.tasks.length && !App.readOnly) {
        $('pmMain').innerHTML = `<div class="card onboard pm-empty"><div class="card-b"><p class="eyebrow">${esc(t('tabPm'))}</p><h2 class="wiz-h">${esc(t('pmEmptyT'))}</h2><p class="hint">${esc(t('pmEmptyL'))}</p>
          <div class="actions"><button class="btn pri" type="button" id="pmGen">${esc(t('pmGen'))}</button></div></div></div>`;
        return;
      }
      const canAdd = !App.readOnly && !['charter', 'report'].includes(sec);
      const body = sec === 'charter' ? charter() : sec === 'raci' ? raci() : sec === 'report' ? report()
        : sec === 'risks' ? `<div class="pm-top">${heatmap()}${topRisks()}</div>${table('risks')}`
        : sec === 'stakeholders' ? `<div class="pm-top">${grid()}${legendSh()}</div>${table('stakeholders')}` : table(sec);
      queueMicrotask(autosize);
      $('pmMain').innerHTML = `<div class="card pm-card"><div class="card-h"><div class="pm-h"><h2>${esc(L()[sec][0])}</h2><p class="hint">${esc(L()[sec][1])}</p></div>
        ${canAdd ? `<button class="btn sm" type="button" id="pmAdd">+ ${esc(t('pmAdd'))}</button>` : ''}</div><div class="card-b">${body}</div></div>`;
    }
    function autosize(el) {
      const list = el && el.nodeType ? [el] : pPm.querySelectorAll('textarea.grow');
      list.forEach(t => { t.style.height = 'auto'; if (t.scrollHeight) t.style.height = t.scrollHeight + 2 + 'px'; });
    }
    pPm.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.matches && ev.target.matches('textarea.short')) ev.preventDefault(); });
    function newRow(reg) {
      const r = { id: 'n' + Date.now().toString(36).slice(-6) };
      for (const [k, type, lim, req] of PM.REG[reg]) r[k] = type === 'enum' ? lim[0] : type === 'int' ? Math.max(lim[0], Math.min(lim[1], k === 'p' || k === 'i' || k === 'influence' || k === 'interest' ? 3 : 0)) : type === 'date' ? App.Core.fmt(App.today()) : req ? t('pmNew') : '';
      return r;
    }
    pPm.addEventListener('click', ev => {
      const s = ev.target.closest('[data-sec]');
      if (s) { flush(); App.ui.pmSec = s.dataset.sec; App.persist(); renderPm(); document.querySelector(`#pmNav [data-sec="${s.dataset.sec}"]`)?.focus(); return; }
      if (App.readOnly) { if (ev.target.closest('#pmCopy')) copyReport(); return; }
      if (ev.target.closest('#pmGen')) { App.mutate(P => { P.pm = PM.generate(App.Core.validateProject(P).project, App.ui.lang, []); }); App.toast(t('pmGenDone')); return; }
      if (ev.target.closest('#pmAdd')) {
        const sec = App.ui.pmSec; flush();
        App.mutate(P => { if (sec === 'raci') { const id = 'D' + Date.now().toString(36).slice(-5); P.pm.raci.rows.push({ id, item: t('pmNew') }); if (P.pm.raci.roles.includes('PM')) P.pm.raci.cells[`${id}|PM`] = 'A'; } else P.pm[sec].push(newRow(sec)); });
        const last = pPm.querySelector('tbody tr:last-child input, tbody tr:last-child textarea'); last && (last.focus(), last.select && last.select());
        return;
      }
      const d = ev.target.closest('[data-del]'); if (d) { flush(); const sec = App.ui.pmSec, i = +d.dataset.del; App.mutate(P => { P.pm[sec].splice(i, 1); }); return; }
      const rd = ev.target.closest('[data-raci-del]'); if (rd) { flush(); const i = +rd.dataset.raciDel; App.mutate(P => { P.pm.raci.rows.splice(i, 1); }); return; }
      if (ev.target.closest('#pmCopy')) copyReport();
      if (ev.target.closest('#pmDlRep')) { const txt = $('pmReport').value; App.saveFile(new TextEncoder().encode(txt), `${(App.project.code || 'projet').replace(/[^\w-]+/g, '-')}-status.txt`, 'text/plain').then(r => r === 'saved' && App.toast(t('downloaded') + 'status.txt')); }
    });
    function copyReport() {
      const box = $('pmReport'); if (!box) return;
      try { navigator.clipboard.writeText(box.value).then(() => App.toast(t('pmCopied')), () => { box.focus(); box.select(); }); } catch { box.focus(); box.select(); }
    }
    function onEdit(ev, immediate) {
      if (App.readOnly) return;
      const el = ev.target, P = App.project;
      if (el.dataset.reg) {
        const row = P.pm[el.dataset.reg][+el.dataset.row]; if (!row) return;
        const v = el.type === 'number' ? Number(el.value) : el.value;
        if (el.dataset.req && !String(v).trim()) { el.setAttribute('aria-invalid', 'true'); el.title = t('pmReq'); return; }
        el.removeAttribute('aria-invalid'); row[el.dataset.col] = v;
      } else if (el.dataset.ch) P.pm.charter[el.dataset.ch] = el.type === 'checkbox' ? el.checked : el.value;
      else if (el.dataset.raci) { const [rid, role] = el.dataset.raci.split('|'); if (el.value) P.pm.raci.cells[`${rid}|${role}`] = el.value; else delete P.pm.raci.cells[`${rid}|${role}`]; }
      else if (el.dataset.raciItem) { const r = P.pm.raci.rows[+el.dataset.raciItem]; if (!r || !el.value.trim()) return; r.item = el.value; }
      else if (el.id === 'pm-raci-roles') { P.pm.raci.roles = el.value.split(',').map(x => x.trim()).filter(Boolean); }
      else return;
      immediate ? (clearTimeout(pending), pending = null, App.mutate(() => {})) : soon();
    }
    pPm.addEventListener('input', ev => { if (ev.target.matches && ev.target.matches('textarea.grow')) autosize(ev.target); if (ev.target.tagName !== 'SELECT' && ev.target.type !== 'checkbox' && ev.target.type !== 'date') onEdit(ev, false); });
    pPm.addEventListener('change', ev => { const el = ev.target; onEdit(ev, el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date'); });

    /* --------------------- render + empty state ---------------------- */
    App.on('render', () => {
      if (App.empty) return;
      renderBrain();
      if (!pending) renderPm();
    });
    App.on('tab', id => { if (id === 'brain' && !App.empty) { brain.redraw(); brain.start(); } else brain.stop(); });
    window.addEventListener('resize', () => { if (App.ui.tab === 'brain') brain.redraw(); });
    return { brain };
  }
  return { init, STR };
})();
if (typeof module !== 'undefined') module.exports = PMUI;
