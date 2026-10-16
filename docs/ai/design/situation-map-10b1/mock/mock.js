// 상황실 지도 1판(10b-1) 정적 모형. 게임 빌드 위에 덧씌우는 시안이며 저장소 코드가 아니다.
// window.__SR = { ports, nightlights(dataURL), css, preset: 'free'|'briefing', layers: {...} }
(() => {
  const D = window.__SR;
  const B = { lon_min: 98, lon_max: 146, lat_min: -10, lat_max: 44 }, W = 1092, H = 1230;
  const proj = (lon, lat) => ({ x: (lon - B.lon_min) / (B.lon_max - B.lon_min) * W, y: (B.lat_max - lat) / (B.lat_max - B.lat_min) * H });
  const src = document.querySelector('svg.sea-map');
  const ship = src.querySelector('[class*="ship"]');
  const shipBox = ship ? ship.getBBox() : null;
  const style = document.createElement('style');
  style.textContent = D.css + `
  .sr{position:fixed;inset:0;z-index:9999;background:#0d1b2a;color:#e8eef4;font:14px/1.45 "Noto Sans KR",system-ui,sans-serif;display:grid;grid-template-rows:auto 1fr;}
  .sr header{display:flex;align-items:center;gap:10px;padding:8px 14px;background:#132a3e;border-bottom:1px solid #2c4a66;flex-wrap:wrap}
  .sr h2{font-size:17px;margin:0 8px 0 0}
  .sr .tag{font-size:12px;background:#d9822b;color:#111;border-radius:3px;padding:1px 6px}
  .sr button,.sr .seg label{white-space:nowrap;font:inherit;color:#e8eef4;background:#1d3a55;border:1px solid #3d6283;border-radius:6px;padding:6px 12px;min-height:40px}
  .sr .seg{display:inline-flex;border:1px solid #3d6283;border-radius:8px;overflow:hidden}
  .sr .seg button{border:0;border-radius:0}
  .sr .seg button[aria-pressed=true]{background:#e8eef4;color:#0d1b2a;font-weight:700}
  .sr .body{display:grid;grid-template-columns:1fr 300px;min-height:0}
  .sr .stage{position:relative;overflow:hidden;background:#0a1622}
  .sr .stage svg{width:100%;height:100%;display:block}
  .sr aside{overflow:auto;border-left:1px solid #2c4a66;padding:10px 12px;background:#10233a}
  .sr fieldset{border:1px solid #2c4a66;border-radius:8px;margin:0 0 10px;padding:6px 10px}
  .sr legend{font-weight:700;padding:0 4px}
  .sr .lyr{display:flex;align-items:center;gap:8px;min-height:40px}
  .sr .lyr input{width:22px;height:22px;accent-color:#f0b84a}
  .sr .lyr small{color:#9db4c8;margin-left:auto}
  .sr .card{position:absolute;background:rgba(16,35,58,.9);border:1px solid #3d6283;border-radius:8px;padding:5px 9px;font-size:12px;width:168px;z-index:3}
  .sr .card h4{margin:0 0 2px;font-size:13.5px}
  .sr .card dl{display:grid;grid-template-columns:1fr auto;gap:0 8px;margin:0}
  .sr .card dt{color:#9db4c8;white-space:nowrap}.sr .card dd{margin:0;text-align:right;white-space:nowrap}
  .sr .pending{color:#f0b84a}
  .sr .brief{border:1px solid #d9822b;background:#2a2112;border-radius:8px;padding:8px 10px;margin-bottom:10px}
  .sr .brief h3{margin:0 0 4px;font-size:14.5px}
  .sr table{border-collapse:collapse;width:100%;font-size:11.5px}
  .sr th,.sr td{border-bottom:1px solid #2c4a66;padding:3px 4px;text-align:left;vertical-align:top}
  .sr .note{color:#9db4c8;font-size:11.5px}
  .sr .port-dot{fill:#7fd3ff;stroke:#0a1622;stroke-width:1.2}
  .sr .port-lbl{fill:#cfe7f7;font-size:15px;paint-order:stroke;stroke:#0a1622;stroke-width:4}
  .sr .focus-ring{fill:none;stroke:#f0b84a;stroke-width:4;stroke-dasharray:10 6}
  @media (max-width:1100px){.sr .body{grid-template-columns:1fr 272px}.sr .card{width:150px;font-size:11.5px}.sr aside button{padding:6px 8px}}
  `;
  document.head.appendChild(style);
  const sr = document.createElement('section');
  sr.className = 'sr'; sr.setAttribute('role', 'dialog'); sr.setAttribute('aria-modal', 'true'); sr.setAttribute('aria-labelledby', 'sr-h');
  const L = D.layers;
  const layerRows = [
    ['cargo', '내 화물·선박', '운항 1척'], ['routes', '항로', '2개'], ['ports', '항만', `${D.ports.length}곳`],
    ['lights', '야간 불빛', '2016'], ['cards', '국가 카드', '3개국'],
  ].map(([k, n, s]) => `<label class="lyr"><input type="checkbox" ${L[k] ? 'checked' : ''} data-layer="${k}"> ${n}<small>${s}</small></label>`).join('');
  const briefing = D.preset === 'briefing';
  sr.innerHTML = `
  <header>
    <h2 id="sr-h">상황실 지도</h2><span class="tag">정적 모형 · 1판</span>
    <div class="seg" role="group" aria-label="보기 방식"><button aria-pressed="${briefing}">브리핑</button><button aria-pressed="${!briefing}">자유 탐색</button></div>
    <button aria-pressed="true">상황실 화면 켬</button>
    <span style="margin-left:auto">${D.dayText}</span>
    <button>표로 보기</button><button>닫기</button>
  </header>
  <div class="body">
    <div class="stage sr-mode" id="sr-stage"></div>
    <aside>
      ${briefing ? `<div class="brief" role="status"><h3>사건 1/2 · 항만 지연</h3><p style="margin:0">${D.briefText}</p><p class="note" style="margin:4px 0 0">지도가 도착 항만으로 옮겨 확대했습니다. ‘다음 사건’으로 넘깁니다.</p><div style="display:flex;gap:6px;margin-top:6px"><button>이전</button><button>다음 사건</button><button>브리핑 끝내기</button></div></div>` : ''}
      <fieldset><legend>레이어</legend>${layerRows}</fieldset>
      <fieldset><legend>출처 (license_tier 등록부)</legend>
        <table><thead><tr><th>자료</th><th>제공·라이선스</th><th>기준일</th><th>등급</th></tr></thead><tbody>
        <tr><td>바탕 지도·항만</td><td>Natural Earth · 퍼블릭 도메인</td><td>v5.1</td><td class="pending">확인 전</td></tr>
        <tr><td>야간 불빛</td><td>NASA Black Marble · 크레딧 표기</td><td>2016</td><td class="pending">확인 전</td></tr>
        <tr><td>국가 지표</td><td>World Bank WDI · CC BY 4.0</td><td>자리표시</td><td class="pending">확인 전</td></tr>
        <tr><td>항로·화물</td><td>게임 자료(가상)</td><td>—</td><td>게임</td></tr>
        </tbody></table>
        <p class="note">실시간 외부 호출 없음. 모든 층은 저장소 안 스냅숏.</p>
      </fieldset>
    </aside>
  </div>`;
  document.body.appendChild(sr);
  // 지도: 게임이 그린 SVG를 복제하고 층을 얹는다.
  const svg = src.cloneNode(true);
  svg.removeAttribute('style'); svg.removeAttribute('width'); svg.removeAttribute('height');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  const base = svg.querySelector('image.map-base') || (() => { const im = document.createElementNS('http://www.w3.org/2000/svg', 'image'); im.setAttribute('href', document.querySelector('.map-layers img.map-base')?.getAttribute('src') || 'assets/maps/east-asia.png'); im.setAttribute('width', W); im.setAttribute('height', H); im.setAttribute('class', 'map-base pixel-art'); im.style.imageRendering = 'pixelated'; svg.insertBefore(im, svg.firstChild.nextSibling); return im; })();
  base.style.filter = 'brightness(.55) saturate(.7)';
  const ns = 'http://www.w3.org/2000/svg';
  if (L.lights) { const nl = document.createElementNS(ns, 'image'); nl.setAttribute('href', D.nightlights); nl.setAttribute('width', W); nl.setAttribute('height', H); nl.setAttribute('preserveAspectRatio', 'none'); nl.style.imageRendering = 'pixelated'; nl.style.opacity = '.95'; base.after(nl); }
  if (!L.routes) svg.querySelectorAll('.route-line,.route-under').forEach((e) => e.remove());
  if (!L.cargo) svg.querySelectorAll('[class*="ship"]').forEach((e) => e.remove());
  if (L.ports) { const g = document.createElementNS(ns, 'g'); g.setAttribute('aria-hidden', 'true');
    const major = new Set(D.majorPorts);
    for (const p of D.ports) { const q = proj(p.lon, p.lat); g.insertAdjacentHTML('beforeend', `<rect class="port-dot" x="${q.x - 4}" y="${q.y - 4}" width="8" height="8"/>`);
      }
    svg.querySelector('g.graticule').after(g); }
  if (briefing && D.focus) { const f = proj(D.focus.lon, D.focus.lat); const w = 560, h = 400; const vx = Math.max(0, Math.min(W - w, f.x - w / 2)), vy = Math.max(0, Math.min(H - h, f.y - h / 2)); svg.setAttribute('viewBox', `${vx} ${vy} ${w} ${h}`);
    svg.insertAdjacentHTML('beforeend', `<circle class="focus-ring" cx="${f.x}" cy="${f.y}" r="26"/>`); }
  else svg.setAttribute('viewBox', '60 40 760 640');
  const stage = sr.querySelector('#sr-stage'); stage.appendChild(svg);
  if (L.cards && !briefing) for (const c of D.cards) { const el = document.createElement('div'); el.className = 'card'; el.style.left = c.left; el.style.top = c.top;
    el.innerHTML = `<h4>${c.name}</h4><dl>${c.rows.map(([k]) => `<dt>${k}</dt><dd class="pending">—</dd>`).join('')}</dl><div class="note">WDI · 값·기준일 확인 전</div>`; stage.appendChild(el); }
  if (L.cards && briefing) { const c = D.cards.find((x) => x.name === D.focus.country); if (c) { const el = document.createElement('div'); el.className = 'card'; el.style.left = '14px'; el.style.bottom = '14px';
    el.innerHTML = `<h4>${c.name}</h4><dl>${c.rows.map(([k]) => `<dt>${k}</dt><dd class="pending">—</dd>`).join('')}</dl><div class="note">WDI · 값·기준일 확인 전</div>`; stage.appendChild(el); } }
})();
