import 'fake-indexeddb/auto';
import { vi, beforeAll, afterEach } from 'vitest';
import '@testing-library/dom';

// jsdom lacks these
if (!window.matchMedia) {
  // @ts-ignore
  window.matchMedia = (q: string) => ({
    matches: false, media: q, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  });
}
// @ts-ignore
global.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
// @ts-ignore
window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
// @ts-ignore
window.HTMLMediaElement.prototype.pause = vi.fn();
// @ts-ignore
window.HTMLMediaElement.prototype.load = vi.fn();
// @ts-ignore
window.scrollTo = vi.fn();
// @ts-ignore
global.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} takeRecords(){return []} root=null; rootMargin=''; thresholds=[] };
// canvas stub for react-confetti
// @ts-ignore
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(), clearRect: vi.fn(), getImageData: vi.fn(() => ({data:[]})),
  putImageData: vi.fn(), createImageData: vi.fn(), setTransform: vi.fn(),
  drawImage: vi.fn(), save: vi.fn(), fillText: vi.fn(), restore: vi.fn(),
  beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(),
  stroke: vi.fn(), translate: vi.fn(), scale: vi.fn(), rotate: vi.fn(),
  arc: vi.fn(), fill: vi.fn(), measureText: vi.fn(() => ({width:0})),
  transform: vi.fn(), rect: vi.fn(), clip: vi.fn(), ellipse: vi.fn(),
  createLinearGradient: vi.fn(()=>({addColorStop:vi.fn()})),
}));
