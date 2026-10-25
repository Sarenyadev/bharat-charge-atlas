import { describe, it, expect } from "vitest";
import { projectDeficit } from "./ev-data";

describe("projectDeficit", () => {
  it("runs through 2030", () => {
    const p = projectDeficit(1000, 10, 10, 10);
    expect(p[p.length - 1].year).toBe(2030);
  });
  it("computes required chargers from target ratio and CAGR", () => {
    const p = projectDeficit(1000, 10, 50, 10);
    expect(p[1].evs).toBe(1500);
    expect(p[1].required).toBe(150);
    expect(p[1].deficit).toBe(140);
  });
  it("never reports negative deficit", () => {
    expect(projectDeficit(10, 100, 10, 10)[0].deficit).toBe(0);
  });
});
