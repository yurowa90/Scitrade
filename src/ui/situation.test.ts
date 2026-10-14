import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGame, openDay } from '../engine/engine';
import { loadScenario } from '../content/scenario';
import { loadMapCities, loadRouteWaypoints, type GeoPoint } from '../content/map';
import routes from '../../data/routes.json';
import referencePorts from '../../docs/ai/design/situation-map-10b1/data/ports-ea.json';
import { runDays, standardDayOneCommands } from '../engine/testkit';
import { paymentDefaultStatus } from '../engine/operations';
import { startUi } from './main-testkit';
import { briefingBox, briefingEvents, defaultLayers, initialSituationView, layerAnnouncement, openSituation, prominentPort, segmentDistanceKm, shipmentArrival, situationData, situationHtml, situationTables } from './situation';

const config = loadScenario('SCENARIO_M1_DELAY_ACCEPTED');
const empty = () => openDay(createGame(config), config).state;
const delayed = () => openDay(runDays(createGame(config), config, 7, { 1: standardDayOneCommands(config) }).state, config).state;
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.doUnmock('./lazy'); });
const html = (view = initialSituationView(), state = empty()) => situationHtml(state, config, view);

/** 최소 DOM은 실제 modal의 수신기·초점·그림 요소 생성 시점을 읽는다. */
function modalDom(reduced = false) {
  const listeners: Record<string, (event: any) => void> = {};
  const focused: string[] = [];
  const live = { textContent: '' };
  const root = { innerHTML: '', className: '', setAttribute: vi.fn(), remove: vi.fn(),
    addEventListener: (type: string, fn: (event: any) => void) => { listeners[type] = fn; },
    querySelector: (selector: string) => selector === '#situation-live' ? live : { focus: () => focused.push(selector) },
    querySelectorAll: () => [] };
  const progress = { disabled: false }, background = { inert: false, querySelector: () => progress };
  const opener = { focus: vi.fn() };
  vi.stubGlobal('window', { matchMedia: () => ({ matches: reduced }) });
  vi.stubGlobal('document', { activeElement: null, createElement: () => root, querySelector: () => background, body: { appendChild: vi.fn() } });
  const click = (action: string) => listeners.click!({ target: { closest: (selector: string) => selector === '[data-situation]' ? { dataset: { situation: action } } : null } });
  const toggle = (id: string, checked: boolean) => listeners.change!({ target: { dataset: { layer: id }, checked } });
  const key = (key: string) => listeners.keydown!({ key, preventDefault: vi.fn(), stopPropagation: vi.fn() });
  return { root, opener, progress, background, click, toggle, key, live, focused };
}

// 독립적인 수치 최소화로 대원 선분 거리를 확인한다(화면의 횡거리 공식을 쓰지 않는다).
function referenceDistance(a: GeoPoint, b: GeoPoint) {
  const r = Math.PI / 180;
  const vector = (p: GeoPoint) => [Math.cos(p.lat * r) * Math.cos(p.lon * r), Math.cos(p.lat * r) * Math.sin(p.lon * r), Math.sin(p.lat * r)];
  const x = vector(a), y = vector(b);
  return 6371 * Math.acos(Math.max(-1, Math.min(1, x.reduce((s, n, i) => s + n * y[i]!, 0))));
}
function referenceSegment(p: GeoPoint, a: GeoPoint, b: GeoPoint) {
  const r = Math.PI / 180, omega = referenceDistance(a, b) / 6371;
  if (omega < 1e-9) return referenceDistance(p, a);
  const at = (t: number) => {
    const v = [a, b].map((q) => [Math.cos(q.lat * r) * Math.cos(q.lon * r), Math.cos(q.lat * r) * Math.sin(q.lon * r), Math.sin(q.lat * r)]);
    const weights = [Math.sin((1 - t) * omega) / Math.sin(omega), Math.sin(t * omega) / Math.sin(omega)];
    const xyz = v[0]!.map((_, i) => v[0]![i]! * weights[0]! + v[1]![i]! * weights[1]!);
    return referenceDistance(p, { lon: Math.atan2(xyz[1]!, xyz[0]!) / r, lat: Math.atan2(xyz[2]!, Math.hypot(xyz[0]!, xyz[1]!)) / r });
  };
  let left = 0, right = 1;
  for (let i = 0; i < 60; i++) { const x = left + (right - left) / 3, y = right - (right - left) / 3; if (at(x) < at(y)) right = y; else left = x; }
  return Math.min(at(0), at(1), at((left + right) / 2));
}

describe('TASK-0061 상황실 지도', () => {
  it('레이어 기본 상태는 게임 층 켬·야간 불빛 끔이며 SVG와 낭독을 바꾼다', () => {
    expect(defaultLayers()).toEqual({ cargo: true, routes: true, ports: true, nightlights: false, countries: true });
    const dom = modalDom(); openSituation(delayed(), config, dom.opener as unknown as HTMLElement, vi.fn());
    for (const id of ['cargo', 'routes', 'ports', 'countries'] as const) {
      expect(dom.root.innerHTML).not.toContain(`data-situation-layer="${id}" hidden`);
      dom.toggle(id, false);
      expect(dom.root.innerHTML).toContain(`data-situation-layer="${id}" hidden`);
      expect(dom.live.textContent).toBe(layerAnnouncement(id, false));
      dom.toggle(id, true);
      expect(dom.live.textContent).toBe(layerAnnouncement(id, true));
    }
    expect(dom.root.innerHTML).not.toContain('data-situation-layer="nightlights"');
    dom.toggle('nightlights', true);
    expect(dom.root.innerHTML).toContain('data-situation-layer="nightlights"');
    expect(dom.live.textContent).toBe('야간 불빛 켬');
    expect(dom.root.innerHTML).toContain('4단계');
    dom.toggle('nightlights', false);
    expect(dom.root.innerHTML).not.toContain('data-situation-layer="nightlights"');
  });
  it('항만 정리 두 곳 외에는 원본 순서·좌표·등급·ID를 보존한다', () => {
    const kept = referencePorts.filter((_, i) => i !== 13 && i !== 27);
    expect(situationData.ports.map((p) => [p.name_en, p.lon, p.lat, p.scalerank])).toEqual(kept);
    expect(situationData.ports).toHaveLength(133);
    expect(situationData.ports.map((p) => p.id)).toEqual(referencePorts.flatMap((_, i) => i === 13 || i === 27 ? [] : [`NE-PORT-${String(i + 1).padStart(3, '0')}`]));
    for (const name of ['Sorong', 'Bangkok', 'Guangzhou', 'Surabaya']) expect(situationData.ports.filter((p) => p.name_en === name)).toHaveLength(2);
    for (const [english, korean] of [['Hai Phong', '하이퐁'], ['Shanghai', '상하이'], ['Hong Kong', '홍콩'], ['Singapore', '싱가포르'], ['Yokohama', '요코하마'], ['Hankow', '한커우']]) {
      expect(situationData.ports.find((p) => p.name_en === english)?.name_ko).toBe(korean);
    }
    expect(situationData.ports.find((p) => p.name_en === 'Ho Chi Minh City')?.name_ko).toBeNull();
  });
  it('항만 두 단계는 모든 거점·항로 50 km 집합과 같고 경계 안팎을 나눈다', () => {
    const cities = loadMapCities(), lines = routes.items.map((r) => loadRouteWaypoints(r.id));
    const expected = situationData.ports.filter((p) => cities.some((c) => referenceDistance(p, c) <= 50) || lines.some((l) => l.slice(1).some((b, i) => referenceSegment(p, l[i]!, b) <= 50))).map((p) => p.id);
    expect(situationData.ports.filter((p) => prominentPort(p)).map((p) => p.id)).toEqual(expected);
    const degrees = (km: number) => km / 6371 * 180 / Math.PI;
    expect(prominentPort({ lon: 0, lat: degrees(49.999) }, [{ lon: 0, lat: 0 }], [])).toBe(true);
    expect(prominentPort({ lon: 0, lat: degrees(50.001) }, [{ lon: 0, lat: 0 }], [])).toBe(false);
    const line = [[{ lon: 0, lat: 0 }, { lon: 2, lat: 0 }]];
    expect(prominentPort({ lon: 1, lat: degrees(49.999) }, [], line)).toBe(true);
    expect(prominentPort({ lon: 1, lat: degrees(50.001) }, [], line)).toBe(false);
    expect(segmentDistanceKm({ lon: -1, lat: 0 }, line[0]![0]!, line[0]![1]!)).toBeGreaterThan(100);
    expect(html()).toContain('opacity="0.35"');
  });
  it('브리핑 영역은 두 위치·양쪽 15% 여백·최소 크기·가장자리 경계를 지킨다', () => {
    const box = briefingBox({ x: 200, y: 200 }, { x: 800, y: 700 }, 1092, 1230);
    expect(box).toEqual({ x: 110, y: 125, w: 780, h: 650 });
    const min = briefingBox({ x: 500, y: 500 }, { x: 510, y: 510 }, 1092, 1230);
    expect(min.w).toBe(560); expect(min.h).toBe(400);
    for (const [a, b] of [[{ x: 0, y: 0 }, { x: 550, y: 390 }], [{ x: 1092, y: 1230 }, { x: 790, y: 840 }], [{ x: 0, y: 0 }, { x: 1092, y: 1230 }]]) {
      const v = briefingBox(a!, b!, 1092, 1230);
      for (const p of [a!, b!]) { expect(p.x).toBeGreaterThanOrEqual(v.x); expect(p.x).toBeLessThanOrEqual(v.x + v.w); expect(p.y).toBeGreaterThanOrEqual(v.y); expect(p.y).toBeLessThanOrEqual(v.y + v.h); }
      expect(v.x).toBeGreaterThanOrEqual(0); expect(v.y).toBeGreaterThanOrEqual(0); expect(v.x + v.w).toBeLessThanOrEqual(1092); expect(v.y + v.h).toBeLessThanOrEqual(1230);
    }
  });
  it('M1 항만 지연 8일에 공개 공지·지연 사건이 있고 사건 없는 날 안내를 보인다', () => {
    const state = delayed(); expect(state.day).toBe(8);
    expect(briefingEvents(state, config).some((e) => e.id.startsWith('delay:'))).toBe(true);
    expect(briefingEvents(state, config).some((e) => e.id === state.notices[0]!.id)).toBe(true);
    expect(shipmentArrival(state, config, state.shipments[0]!)).toBe(9);
    expect(briefingEvents(empty(), config)).toEqual([]);
    expect(html()).toContain('오늘 확인할 사건이 없습니다');
    const notPublished = { ...state, notices: [], shipments: [] };
    expect(briefingEvents(notPublished, config)).toEqual([]);
  });
  it('오늘 도착·규칙 2 지급 경고도 확정 상태에서만 읽는다', () => {
    const state = delayed(); state.shipments[0]!.arrivalDay = state.day;
    expect(briefingEvents(state, config).some((e) => e.id.startsWith('arrival:'))).toBe(true);
    const ops = loadScenario('SCENARIO_M2_OPERATIONS'), opsState = openDay(createGame(ops), ops).state;
    opsState.obligations.push({ id: 'UNPAID', currency: 'KRW', amountMinor: 1, reasonKo: '급여', incurredDay: 0, paidDay: null });
    expect(briefingEvents(opsState, ops, paymentDefaultStatus(opsState, ops)).some((e) => e.id === 'payment')).toBe(true);
  });
  it('표 세 개의 행 수는 운항 화물·항만·국가 지표 수와 같다', () => {
    const state = delayed(), tables = situationTables(state, config);
    const count = (name: string) => (tables.match(new RegExp(`<table data-table="${name}">[\\s\\S]*?<tbody>([\\s\\S]*?)</tbody>`))![1]!.match(/<tr>/g) ?? []).length;
    expect(count('cargo')).toBe(state.shipments.filter((s) => s.arrivalDay === null).length);
    expect(count('ports')).toBe(situationData.ports.length);
    expect(count('countries')).toBe(situationData.countries.reduce((n, c) => n + c.indicators.length, 0));
    expect(tables).toContain('(영문 표기)'); expect(tables).not.toContain('값·기준일 확인 전');
  });
  it('국가 카드와 표는 원값을 보존하고 표시 단위와 지표별 연도를 보인다', () => {
    const expected = [
      ['86%', '7,093억 달러', '36,227 달러', '3.8점'],
      ['38%', '37,718억 달러', '13,862 달러', '3.7점'],
      ['190%', '4,729억 달러', '5,066 달러', '3.3점'],
    ];
    const cards = [...html().matchAll(/class="situation-country-card"[\s\S]*?<\/article>/g)].map((m) => m[0]);
    const tables = situationTables(empty(), config);
    expected.forEach((values, i) => {
      values.forEach((value, j) => {
        expect(cards[i]).toContain(`${value} · ${j === 3 ? 2022 : 2025}년`);
        expect(tables).toContain(`<td>${value}</td><td>${j === 3 ? 2022 : 2025}년</td>`);
      });
    });
    expect(situationData.countries[0]!.indicators[0]!.value).toBe(86.3616006442431);
    expect(situationData.countries[0]!.indicators[2]!.value).toBe(36226.9663637512);
    expect(html()).toContain('표시 단위로 반올림함.');
    expect(html()).toContain('최대 약 30 km 오차');
    expect(situationData.layers.find((l) => l.id === 'nightlights')!.verification_status).toBe('pending');
  });
  it('reduced-motion은 이동 클래스 없이 비네트만 남기는 모드를 쓴다', async () => {
    expect(html(initialSituationView(), delayed())).toContain('situation-moving');
    const dom = modalDom(true); openSituation(delayed(), config, dom.opener as unknown as HTMLElement, vi.fn());
    expect(dom.root.innerHTML).not.toContain('situation-moving'); expect(dom.root.innerHTML).toContain('situation-reduced');
    const fs = await import('node:fs' as string) as { readFileSync(path: string, encoding: string): string };
    const css = fs.readFileSync('src/ui/situation.css', 'utf8');
    expect(css).toContain('.situation-reduced.situation-visual::after{background:radial-gradient');
  });
  it('대화상자는 Escape로 닫고 열기 단추로 초점을 돌리며 배경·진행을 복구한다', () => {
    const dom = modalDom(), close = vi.fn(); openSituation(empty(), config, dom.opener as unknown as HTMLElement, close);
    expect(dom.root.setAttribute).toHaveBeenCalledWith('role', 'dialog'); expect(dom.root.setAttribute).toHaveBeenCalledWith('aria-modal', 'true');
    expect(dom.background.inert).toBe(true); expect(dom.progress.disabled).toBe(true);
    dom.key('Escape'); expect(dom.root.remove).toHaveBeenCalledOnce(); expect(close).toHaveBeenCalledOnce(); expect(dom.opener.focus).toHaveBeenCalledOnce();
    expect(dom.background.inert).toBe(false); expect(dom.progress.disabled).toBe(false);
  });
  it('열린 동안 하루 진행과 키보드 단추 활성화도 막고 닫은 뒤 진행한다', async () => {
    const ui = await startUi(); vi.clearAllTimers();
    const dom = modalDom();
    // main 시험용 DOM 위에 실제 상황실 root만 붙인다.
    vi.stubGlobal('window', ui.win); vi.stubGlobal('document', ui.doc);
    ui.doc.createElement.mockImplementation(() => dom.root as any);
    (ui.doc.body as any).appendChild = vi.fn();
    const before = ui.app.innerHTML;
    await ui.click({ action: 'situation' });
    expect(dom.root.innerHTML).toContain('상황실 지도');
    await ui.click({ action: 'end-day' });
    expect(ui.app.innerHTML).toBe(before);
    ui.keydown(ui.rendered({ action: 'end-day' }), 'Enter'); await ui.click({ action: 'end-day' });
    expect(ui.app.innerHTML).toBe(before);
    dom.key('Escape');
    await ui.click({ action: 'end-day' }); expect(ui.app.innerHTML).not.toBe(before);
  });
  it('야간 불빛 켜기 전에는 그림 요소·주소가 없고 브리핑은 다시 끈다', () => {
    const dom = modalDom(); openSituation(delayed(), config, dom.opener as unknown as HTMLElement, vi.fn());
    expect(dom.root.innerHTML).not.toContain('nightlights-ea.png');
    dom.click('free'); expect(dom.root.innerHTML).not.toContain('nightlights-ea.png');
    dom.toggle('nightlights', true); expect(dom.root.innerHTML).toContain('href="assets/situation/nightlights-ea.png"');
    dom.click('briefing'); expect(dom.root.innerHTML).not.toContain('nightlights-ea.png');
  });
  it('상황실 지연 불러오기 실패는 한 번 재시도한 뒤 저장·새로 고침을 안내한다', async () => {
    let attempts = 0;
    vi.doMock('./lazy', async (original) => {
      const module = await original<typeof import('./lazy')>();
      return { ...module, lazyScreen<T>(loader: () => Promise<T>) {
        return module.lazyScreen(async () => {
          if (loader.toString().includes('situation')) { attempts++; throw new Error('상황실 불러오기 실패'); }
          return loader();
        });
      } };
    });
    const ui = await startUi(); vi.clearAllTimers();
    for (let i = 0; i < 3; i++) {
      await ui.click({ action: 'situation' });
      expect(attempts).toBe(Math.min(i + 1, 2));
      expect(ui.app.innerHTML).toContain(i === 0 ? '인터넷 연결을 확인하고 다시 눌러 주세요' : '저장하고 새로 고침해 주세요');
      expect(ui.app.innerHTML).not.toContain('role="dialog"');
    }
  });
});

describe('TASK-0061 빌드 청크 보호', () => {
  it('실제 빌드에서 상황실은 나중에 받으며 data·첫 화면에는 자료와 그림 주소가 없다', async () => {
    const fs = await import('node:fs' as string) as { readFileSync(path: string, encoding: string): string; readdirSync(path: string): string[] };
    const vite = await import('vite' as string) as { build(config: object): Promise<unknown> };
    await vite.build({ logLevel: 'silent', build: { outDir: '/tmp/scitrade-task0061-test-dist', emptyOutDir: true } });
    const dir = '/tmp/scitrade-task0061-test-dist';
    const page = fs.readFileSync(`${dir}/index.html`, 'utf8'), names = fs.readdirSync(`${dir}/assets`);
    const situation = names.find((n) => /^situation-.*\.js$/.test(n))!;
    expect(situation).toBeTruthy(); expect(page).not.toContain(situation);
    const data = names.find((n) => /^data-.*\.js$/.test(n))!;
    expect(fs.readFileSync(`${dir}/assets/${data}`, 'utf8')).not.toContain('NE-PORT-001');
    expect(fs.readFileSync(`${dir}/assets/${situation}`, 'utf8')).toContain('NE-PORT-001');
    for (const match of page.matchAll(/(?:src|href)="\.\/([^\"]+\.(?:js|css))"/g)) {
      expect(fs.readFileSync(`${dir}/${match[1]}`, 'utf8')).not.toContain('nightlights-ea.png');
      expect(fs.readFileSync(`${dir}/${match[1]}`, 'utf8')).not.toContain('NE-PORT-001');
    }
    const bundle = await import('../../tools/bundle-size.mjs' as string) as { collectDist(path: string): { lazy: string[] } };
    expect(bundle.collectDist(dir).lazy.some((chunk) => chunk.endsWith(situation))).toBe(true);
  }, 30000);
});
