import "@testing-library/jest-dom/vitest";

if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };

  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

if (typeof ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    private callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element) {
      this.callback(
        [
          {
            target,
            contentRect: { width: 1024, height: 320 } as DOMRectReadOnly,
          } as ResizeObserverEntry,
        ],
        this,
      );
    }

    unobserve() {}
    disconnect() {}
  };
}

if (typeof HTMLElement !== "undefined") {
  Object.defineProperties(HTMLElement.prototype, {
    clientWidth: { configurable: true, value: 1024 },
    clientHeight: { configurable: true, value: 320 },
    offsetWidth: { configurable: true, value: 1024 },
    offsetHeight: { configurable: true, value: 320 },
  });

  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      width: 1024,
      height: 320,
      top: 0,
      right: 1024,
      bottom: 320,
      left: 0,
      toJSON: () => ({}),
    };
  };
}
