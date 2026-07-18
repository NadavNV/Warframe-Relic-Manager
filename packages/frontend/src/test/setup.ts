import "@testing-library/jest-dom";

// Mock crypto.randomUUID since jsdom doesn't support it natively yet
Object.defineProperty(window, "crypto", {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2, 15),
  },
});
