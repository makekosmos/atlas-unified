import { expect, test } from "nsh/test";
import { stagePlan } from "./benchmark-plan";

test("benchmark plan lists both passes and both libraries", () => {
  const plan = stagePlan();
  expect(plan.length).toBe(12);
  expect(plan[0]).toMatchObject({ id: "1:journal", kind: "page", round: 1 });
  expect(plan[5]).toMatchObject({ id: "2:journal", kind: "page", round: 2 });
  expect(plan[10]).toMatchObject({ kind: "library", notes: 10_000 });
  expect(plan[11]).toMatchObject({ kind: "library", notes: 100_000 });
});
