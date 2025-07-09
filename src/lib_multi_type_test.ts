import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { pipeline, Result } from "./lib.ts";

// 複数の型に対応したパイプラインのテスト
Deno.test("pipeline handles different input/output types", () => {
  // number -> string -> number -> boolean の変換
  const r1 = (): Result<number, "E1"> => ({v: 10});
  const r2 = (n: number): Result<string, "E2"> => ({v: n.toString() + " converted"});
  const r3 = (s: string): Result<number, "E3"> => ({v: s.length});
  const r4 = (n: number): Result<boolean, "E4"> => ({v: n > 15});

  const p = pipeline(r1, r2, r3, r4);
  const result = p();

  assertEquals(result, false); // "10 converted" の文字列長は11なので、11 > 15 は false
});

// 異なる型でエラーが発生した場合のテスト
Deno.test("pipeline handles errors with different types", () => {
  const r1 = (): Result<number, "E1"> => ({v: 5});
  const r2 = (n: number): Result<string, "E2"> => ({v: n.toString(), e: "E2"});
  const r3 = (s: string): Result<boolean, "E3"> => ({v: s.length > 10});

  let caughtError = "";
  const p = pipeline(r1, r2, r3);
  const result = p((res) => {
    caughtError = res.e;
    return false;
  });

  assertEquals(caughtError, "E2");
  assertEquals(result, false);
});

// オブジェクト型の変換テスト
Deno.test("pipeline transforms object types", () => {
  interface User {
    id: number;
    name: string;
  }

  interface ProcessedUser {
    userId: string;
    displayName: string;
  }

  interface FinalResult {
    success: boolean;
    message: string;
  }

  const r1 = (): Result<User, "EU1"> => ({v: {id: 123, name: "John Doe"}});
  const r2 = (user: User): Result<ProcessedUser, "EU2"> => ({
    v: {userId: `user-${user.id}`, displayName: user.name.toUpperCase()}
  });
  const r3 = (processed: ProcessedUser): Result<FinalResult, "EU3"> => ({
    v: {success: true, message: `Processed ${processed.displayName} with ID ${processed.userId}`}
  });

  const p = pipeline(r1, r2, r3);
  const result = p();

  assertEquals(result.success, true);
  assertEquals(result.message, "Processed JOHN DOE with ID user-123");
});
