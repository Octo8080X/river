import { assertEquals } from "@std/assert";
import { pipeAsync } from "./lib.ts";

Deno.test("単一関数のパイプライン", async () => {
  const add = () => 1 + 2;
  assertEquals(await pipeAsync(add).run(), 3);
});

Deno.test("3個の関数を使ったシンプルなパイプライン", async () => {
  const f1 = () => 1;
  const f2 = (n: number) => Promise.resolve(`value ${n}`);
  const f3 = (s: string) => s.length;
  
  const simplePipeline = pipeAsync(f1, f2, f3);
  const result = await simplePipeline.run();
  
  // f1() -> 1, f2(1) -> "value 1", f3("value 1") -> 7
  assertEquals(result, 7);
});

Deno.test("5個の関数を使ったパイプライン", async () => {
  const f1 = () => 1;
  const f2 = (n: number) => Promise.resolve(`value ${n}`);
  const f3 = (s: string) => s.length;
  const f4 = (s: number) => s * 3;
  const f5 = (s: number) => s * 10;
  
  const syncPipeline = pipeAsync(f1, f2, f3, f4, f5);
  const result = await syncPipeline.run();
  
  // f1() -> 1, f2(1) -> "value 1", f3("value 1") -> 7, f4(7) -> 21, f5(21) -> 210
  assertEquals(result, 210);
});

Deno.test("10個の関数を使った長いパイプライン", async () => {
  const f1 = () => 1;
  // 1
  const f2 = (n: number) => Promise.resolve(`value ${n}`);
  // value 1
  const f3 = (s: string) => s.length;
  // 7
  const f4 = (s: number) => s * 3;
  // 21
  const f5 = (s: number) => s * 10;
  // 210
  const f6 = (n: number) => n + 100;
  // 310
  const f7 = (n: number) => `Result: ${n}`;
  // "Result: 310"
  const f8 = (s: string) => s.toUpperCase();
  // "RESULT: 310"
  const f9 = (s: string) => s.length;
  // 11
  const f10 = (n: number) => n * 2;
  // 22
  const longPipeline = pipeAsync(f1, f2, f3, f4, f5, f6, f7, f8, f9, f10);
  const result = await longPipeline.run();

  assertEquals(result, 22);
});

Deno.test("非同期関数のみのパイプライン", async () => {
  const f1 = () => Promise.resolve(10);
  const f2 = (n: number) => Promise.resolve(n * 2);
  const f3 = (n: number) => Promise.resolve(n + 5);
  
  const asyncPipeline = pipeAsync(f1, f2, f3);
  const result = await asyncPipeline.run();
  
  // f1() -> 10, f2(10) -> 20, f3(20) -> 25
  assertEquals(result, 25);
});

Deno.test("同期関数のみのパイプライン", async () => {
  const f1 = () => 5;
  const f2 = (n: number) => n * 3;
  const f3 = (n: number) => n - 2;
  
  const syncPipeline = pipeAsync(f1, f2, f3);
  const result = await syncPipeline.run();
  
  // f1() -> 5, f2(5) -> 15, f3(15) -> 13
  assertEquals(result, 13);
});