import { afterEach, describe, expect, it, vi } from 'vitest';
import { integerScale, fitPixelBox, applyPixelScale } from './pixel';
import { mapAsset } from './assets';
import { renderWorldMap, snapViewBox } from './map';
import { loadScenario } from '../content/scenario';
import { createGame } from '../engine/engine';

const DPR = [1, 1.25, 1.5, 2, 3];

describe('기기 픽셀 정수 배율', () => {
  it.each(DPR)('dpr %s에서 들어갈 수 있는 가장 큰 정수 배율을 고른다', (dpr) => {
    const size = integerScale(900, 450, dpr);
    expect(size.n).toBe(Math.floor(2 * dpr));
    expect(size.cssPx).toBe(size.n * 450 / dpr);
    expect(size.cssPx).toBeLessThanOrEqual(900);
    expect((size.n + 1) * 450 / dpr).toBeGreaterThan(900);
  });
  it.each(DPR)('dpr %s에서 공간이 1배보다 좁으면 넘치는 1배를 유지한다', (dpr) => {
    const available = 32 / dpr - 1;
    expect(integerScale(available, 32, dpr)).toEqual({ n: 1, cssPx: 32 / dpr });
  });
  it.each(DPR)('dpr %s의 정확한 경계에서 배율이 하나 작아지지 않는다', (dpr) => {
    for (const n of [1, 2, 7]) {
      const available = n * 96 / dpr;
      expect(integerScale(available, 96, dpr)).toEqual({ n, cssPx: available });
    }
  });
  it('부동소수 곱셈 오차를 보정하고 경계 바로 아래는 올리지 않는다', () => {
    expect(integerScale(0.3, 0.1, 1).n).toBe(3);
    expect(integerScale(299.999, 100, 1).n).toBe(2);
    expect(integerScale(900, 450, 1.25)).toEqual({ n: 2, cssPx: 720 });
  });
  it('높이 제약이 더 좁으면 높이 배율을 쓴다', () => {
    expect(fitPixelBox({ w: 500, h: 150 }, { w: 96, h: 128 }, 2))
      .toEqual({ n: 2, cssWidth: 96, cssHeight: 128 });
    expect(fitPixelBox({ w: 500 }, { w: 96, h: 128 }, 2))
      .toEqual({ n: 10, cssWidth: 480, cssHeight: 640 });
    expect(fitPixelBox({ w: 30, h: 20 }, { w: 96, h: 128 }, 1.25).n).toBe(1);
  });
});

describe('픽셀 지도 격자', () => {
  it.each([2, 5])('%s 단위로 넓히며 원래 영역을 포함한다', (unit) => {
    const source = { x: 13.1, y: 27.6, w: 212.2, h: 174.3 };
    const vb = snapViewBox(source, unit, 3600, 1220);
    for (const value of Object.values(vb)) expect(value % unit).toBe(0);
    expect(vb.x).toBeLessThanOrEqual(source.x);
    expect(vb.y).toBeLessThanOrEqual(source.y);
    expect(vb.x + vb.w).toBeGreaterThanOrEqual(source.x + source.w);
    expect(vb.y + vb.h).toBeGreaterThanOrEqual(source.y + source.h);
  });
  it('지도 밖으로 넓힌 영역은 지도 경계에서 자른다', () => {
    expect(snapViewBox({ x: -2.1, y: -1.3, w: 112, h: 60 }, 5, 100, 50))
      .toEqual({ x: 0, y: 0, w: 100, h: 50 });
  });
  it('두 지도 자산의 논리 격자와 좌표 크기가 일치한다', () => {
    for (const [id, w, h, units] of [['MAP_EAST_ASIA', 546, 615, 2], ['MAP_WORLD', 720, 244, 5]] as const) {
      const map = mapAsset(id)!;
      expect(map.pixelGrid).toEqual({ logicalWidth: w, logicalHeight: h, unitsPerPixel: units });
      expect(map.width).toBe(w * units);
      expect(map.height).toBe(h * units);
      expect(map.path).toMatch(/\.png$/);
    }
  });
  it.each(['route', 'world'] as const)('%s 보기의 논리 크기는 맞춘 viewBox ÷ 단위다', (mode) => {
    const config = loadScenario('SCENARIO_M2_MULTI_TRADE');
    const html = renderWorldMap(createGame(config), config, mode);
    const vb = html.match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/)!.slice(1).map(Number);
    const unit = mode === 'world' ? 5 : 2;
    expect(html).toContain('class="map-base pixel-art"');
    expect(html).toContain(`data-pixel-w="${vb[2]! / unit}"`);
    expect(html).toContain(`data-pixel-h="${vb[3]! / unit}"`);
    vb.forEach((value) => expect(value % unit).toBe(0));
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="');
  });
});

describe('픽셀 크기 감시 연결', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('node처럼 DOM 기능이 없는 환경에서는 아무것도 하지 않는다', () => {
    expect(() => applyPixelScale({} as HTMLElement)).not.toThrow();
  });
  it('크기 감시나 해상도 감시가 없으면 아무것도 하지 않는다', () => {
    vi.stubGlobal('window', { devicePixelRatio: 1 });
    vi.stubGlobal('ResizeObserver', undefined);
    expect(() => applyPixelScale({} as HTMLElement)).not.toThrow();
    vi.stubGlobal('ResizeObserver', vi.fn());
    expect(() => applyPixelScale({} as HTMLElement)).not.toThrow();
    expect(ResizeObserver).not.toHaveBeenCalled();
  });
  it('재렌더 때 감시자를 재사용하고 dpr 변화 뒤 새 해상도를 감시한다', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    const callbacks: (() => void)[] = [];
    const construct = vi.fn();
    let computedWidth: string | undefined;
    class FakeObserver {
      observe = observe;
      disconnect = disconnect;
      constructor(callback: () => void) { construct(); callbacks.push(callback); }
    }
    const media: { query: string; change?: () => void; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> }[] = [];
    const fakeWindow = {
      devicePixelRatio: 1.25,
      getComputedStyle: () => ({ paddingLeft: '10px', paddingRight: '10px', borderLeftWidth: '3px', borderRightWidth: '3px',
        boxSizing: 'border-box', width: computedWidth }),
      matchMedia: (query: string) => {
        const item = { query, change: undefined as (() => void) | undefined,
          addEventListener: vi.fn((_name, listener) => { item.change = listener; }), removeEventListener: vi.fn() };
        media.push(item);
        return item;
      },
    };
    vi.stubGlobal('ResizeObserver', FakeObserver);
    vi.stubGlobal('window', fakeWindow);
    const parent = { clientWidth: 220 };
    const first = { dataset: { pixelW: '96', pixelH: '128' }, style: { width: '', height: '' }, parentElement: parent };
    const second = { ...first, style: { width: '', height: '' } };
    const root = (element: typeof first) => ({ querySelectorAll: () => [element], style: { setProperty: vi.fn() } } as unknown as HTMLElement);
    applyPixelScale(root(first));
    expect(first.style).toEqual({ width: '153.6px', height: '204.8px' });
    applyPixelScale(root(second));
    expect(construct).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(2);
    expect(media[0]!.removeEventListener).toHaveBeenCalledTimes(1);
    fakeWindow.devicePixelRatio = 2;
    media[1]!.change!();
    expect(second.style).toEqual({ width: '192px', height: '256px' });
    expect(first.style.width).toBe('153.6px');
    expect(media[2]!.query).toBe('(resolution: 2dppx)');
    parent.clientWidth = 120;
    callbacks[0]!();
    expect(second.style.width).toBe('96px');
    // 2倍の境界直下を clientWidth の丸めで2倍にしない。
    fakeWindow.devicePixelRatio = 1.25;
    computedWidth = '179.599px'; // 테두리와 여백 26px를 빼면 153.599px
    parent.clientWidth = 174;
    callbacks[0]!();
    expect(second.style.width).toBe('76.8px');
  });
});
