// 논리 픽셀 하나를 정수 개의 기기 픽셀로 표시한다.

function floorStable(value: number): number {
  const nearest = Math.round(value);
  return Math.abs(value - nearest) <= Number.EPSILON * Math.max(1, Math.abs(value)) * 8
    ? nearest : Math.floor(value);
}

export function integerScale(availableCssPx: number, logicalPx: number, dpr: number): { n: number; cssPx: number } {
  if (!Number.isFinite(availableCssPx) || availableCssPx < 0 || !Number.isFinite(logicalPx) || logicalPx <= 0
    || !Number.isFinite(dpr) || dpr <= 0) throw new RangeError('픽셀 크기와 기기 배율을 확인해 주세요.');
  const n = Math.max(1, floorStable(availableCssPx * dpr / logicalPx));
  return { n, cssPx: n * logicalPx / dpr };
}

export function fitPixelBox(available: { w: number; h?: number }, logical: { w: number; h: number }, dpr: number) {
  const width = integerScale(available.w, logical.w, dpr);
  const height = integerScale(available.h ?? 0, logical.h, dpr);
  const n = available.h === undefined ? width.n : Math.min(width.n, height.n);
  return { n, cssWidth: n * logical.w / dpr, cssHeight: n * logical.h / dpr };
}

type PixelElement = HTMLElement | SVGElement;
let observer: ResizeObserver | null = null;
let resolution: MediaQueryList | null = null;
let elements: PixelElement[] = [];
let activeRoot: HTMLElement | null = null;

function resizePixels() {
  const dpr = window.devicePixelRatio || 1;
  activeRoot?.style.setProperty('--pixel-dpr', String(dpr));
  for (const element of elements) {
    const parent = element.parentElement;
    if (!parent) continue;
    const parentStyle = window.getComputedStyle(parent);
    const padding = parseFloat(parentStyle.paddingLeft || '0') + parseFloat(parentStyle.paddingRight || '0');
    // clientWidth는 정수로 반올림된다. 계산된 CSS 폭이 있으면 소수 폭도 보존한다.
    const measured = parentStyle.width?.endsWith('px') ? parseFloat(parentStyle.width) : NaN;
    const border = parseFloat(parentStyle.borderLeftWidth || '0') + parseFloat(parentStyle.borderRightWidth || '0');
    const width = Math.max(0, Number.isFinite(measured)
      ? measured - (parentStyle.boxSizing === 'border-box' ? padding + border : 0)
      : parent.clientWidth - padding);
    const w = Number(element.dataset.pixelW);
    const h = Number(element.dataset.pixelH);
    if (!(w > 0 && h > 0)) continue;
    const size = fitPixelBox({ w: width }, { w, h }, dpr);
    const cssWidth = `${size.cssWidth}px`;
    const cssHeight = `${size.cssHeight}px`;
    // 같은 크기를 다시 쓰지 않아 부모 감시 콜백의 불필요한 반복을 줄인다.
    if (element.style.width !== cssWidth) element.style.width = cssWidth;
    if (element.style.height !== cssHeight) element.style.height = cssHeight;
  }
}

function watchResolution() {
  resolution?.removeEventListener('change', onResolutionChange);
  resolution = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
  resolution.addEventListener('change', onResolutionChange);
}

function onResolutionChange() {
  resizePixels();
  watchResolution();
}

/** 다시 그린 화면에 감시자 하나를 재연결한다. DOM 기능이 없는 테스트 환경은 건너뛴다. */
export function applyPixelScale(root: HTMLElement): void {
  if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined' || typeof window.matchMedia !== 'function') return;
  observer ??= new ResizeObserver(resizePixels);
  observer.disconnect();
  activeRoot = root;
  elements = Array.from(root.querySelectorAll<PixelElement>('[data-pixel-w][data-pixel-h]'));
  const parents = new Set(elements.map((element) => element.parentElement).filter((parent) => parent !== null));
  parents.forEach((parent) => observer!.observe(parent));
  resizePixels();
  watchResolution();
}
