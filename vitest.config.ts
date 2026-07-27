import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // DOMPurify 가 DOM 을 필요로 하므로 jsdom 에서 실행한다.
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
