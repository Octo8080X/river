import { assertEquals } from "@std/assert";
import { failure, pipeline, Result, success } from "./lib.ts";

/**
 * TypeScript パイプライン関数のテスト
 *
 * このテストファイルは、パイプライン関数の機能を網羅的にテストします。
 * テストは以下のカテゴリに分類されています：
 *
 * 1. 基本的な成功パターンのテスト - 単純な成功ケースからさまざまな長さのチェーンまで
 * 2. 型変換のテスト - 異なる型の間の変換をテスト
 * 3. エラーハンドリングのテスト - 異なる場所でのエラー発生とハンドリング
 * 4. エッジケースのテスト - 空のパイプラインなど特殊なケース
 * 5. 非同期パイプラインのテスト - Promiseを返す関数の処理
 * 6. 型推論のテスト - 型が正しく推論されることを確認
 */

// ================ 1. 基本的な成功パターンのテスト ================

// 最もシンプルな成功ケース（number型のみ、3つの関数）
Deno.test("pipeline handles successful execution", () => {
  const r1 = (): Result<number, "EEE1"> => (success(1));
  const r2 = (s: number): Result<number, "EEE2"> => (success(s + 1));
  const r3 = (s: number): Result<number, "EEE3"> => (success(s + 2));

  // 型推論によってエラー型は "EEE1" | "EEE2" | "EEE3" になる
  const a = pipeline(r1, r2, r3);
  const result = a();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, 4); // 1 + 1 + 2 = 4
  }
});

// 文字列型を使ったテスト（単一型、3つの関数）
Deno.test("pipeline works with string type", () => {
  const r1 = (): Result<string, "STR1"> => (success("hello"));
  const r2 = (s: string): Result<string, "STR2"> => (success(s + " world"));
  const r3 = (s: string): Result<string, "STR3"> => (success(s + "!"));

  const p = pipeline(r1, r2, r3);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, "hello world!");
  }
});

// 中程度のチェーンの成功ケース（5つの関数）
Deno.test("pipeline handles medium-length successful chain", () => {
  const r1 = (): Result<number, "EEE1"> => success(1);
  const r2 = (s: number): Result<number, "EEE2"> => success(s + 1);
  const r3 = (s: number): Result<number, "EEE3"> => success(s + 2);
  const r4 = (s: number): Result<number, "EEE4"> => success(s * 2);
  const r5 = (s: number): Result<number, "EEE5"> => success(s - 1);

  const p = pipeline(r1, r2, r3, r4, r5);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, 7); // (1 + 1 + 2) * 2 - 1 = 7
  }
});

// 長いチェーン（6つの関数）のテスト
Deno.test("pipeline handles 6 functions", () => {
  const r1 = (): Result<number, "LONG1"> => success(1);
  const r2 = (n: number): Result<number, "LONG2"> => success(n + 2);
  const r3 = (n: number): Result<number, "LONG3"> => success(n * 3);
  const r4 = (n: number): Result<number, "LONG4"> => success(n - 4);
  const r5 = (n: number): Result<number, "LONG5"> => success(n / 5);
  const r6 = (n: number): Result<number, "LONG6"> => success(n + 6);

  const p = pipeline(r1, r2, r3, r4, r5, r6);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    // 計算過程: 1 + 2 = 3, 3 * 3 = 9, 9 - 4 = 5, 5 / 5 = 1, 1 + 6 = 7
    assertEquals(result.value, 7);
  }
});

// 最大長のチェーン（10個の関数）のテスト
Deno.test("pipeline handles maximum chain of 10 functions", () => {
  const r1 = (): Result<number, "L1"> => success(0);
  const r2 = (n: number): Result<number, "L2"> => success(n + 1);
  const r3 = (n: number): Result<number, "L3"> => success(n + 1);
  const r4 = (n: number): Result<number, "L4"> => success(n + 1);
  const r5 = (n: number): Result<number, "L5"> => success(n + 1);
  const r6 = (n: number): Result<number, "L6"> => success(n + 1);
  const r7 = (n: number): Result<number, "L7"> => success(n + 1);
  const r8 = (n: number): Result<number, "L8"> => success(n + 1);
  const r9 = (n: number): Result<number, "L9"> => success(n + 1);
  const r10 = (n: number): Result<number, "L10"> => success(n + 1);

  const p = pipeline(r1, r2, r3, r4, r5, r6, r7, r8, r9, r10);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, 9); // 0 + (1 * 9) = 9
  }
});

// ================ 2. 型変換のテスト ================

// 複数の型が混ざるケース（number -> string -> boolean）
Deno.test("pipeline handles type conversion (number -> string -> boolean)", () => {
  const r1 = (): Result<number, "EEE1"> => success(1);
  const r2 = (s: number): Result<string, "EEE2"> => success(`Value: ${s + 1}`);
  const r3 = (s: string): Result<boolean, "EEE3"> => success(s.length > 10);

  // 型推論によってエラー型は "EEE1" | "EEE2" | "EEE3" になる
  const a = pipeline(r1, r2, r3);
  const result = a();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, false); // "Value: 2".length > 10 = false
  }
});

// 複雑な型変換（number -> string -> number -> boolean）
Deno.test("pipeline handles complex type conversion (number -> string -> number -> boolean)", () => {
  const r1 = (): Result<number, "E1"> => success(10);
  const r2 = (n: number): Result<string, "E2"> =>
    success(n.toString() + " converted");
  const r3 = (s: string): Result<number, "E3"> => success(s.length);
  const r4 = (n: number): Result<boolean, "E4"> => success(n > 15);

  const p = pipeline(r1, r2, r3, r4);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, false); // "10 converted" の文字列長は11なので、11 > 15 は false
  }
});

// シンプルなオブジェクト型を使ったテスト
Deno.test("pipeline works with simple object type", () => {
  type User = { name: string; age: number };

  const r1 = (): Result<User, "USER1"> => success({ name: "John", age: 30 });
  const r2 = (u: User): Result<User, "USER2"> =>
    success({ ...u, age: u.age + 1 });
  const r3 = (u: User): Result<User, "USER3"> =>
    success({ ...u, name: u.name + " Doe" });

  const p = pipeline(r1, r2, r3);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, { name: "John Doe", age: 31 });
  }
});

// 複雑なオブジェクト型の変換テスト
Deno.test("pipeline transforms complex object types", () => {
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

  const r1 = (): Result<User, "EU1"> => success({ id: 123, name: "John Doe" });
  const r2 = (user: User): Result<ProcessedUser, "EU2"> =>
    success({
      userId: `user-${user.id}`,
      displayName: user.name.toUpperCase(),
    });
  const r3 = (processed: ProcessedUser): Result<FinalResult, "EU3"> =>
    success({
      success: true,
      message: `Processed ${processed.displayName} with ID ${processed.userId}`,
    });

  const p = pipeline(r1, r2, r3);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value.success, true);
    assertEquals(result.value.message, "Processed JOHN DOE with ID user-123");
  }
});

// ================ 3. エラーハンドリングのテスト ================

// エラーハンドラなしの場合のテスト（最もシンプルなエラーケース）
Deno.test("pipeline returns failure when error occurs without handler", () => {
  const e1 = (): Result<number, "EEE1"> => failure(999, "EEE1");
  const r2 = (s: number): Result<number, "EEE2"> => success(s + 1);
  const r3 = (s: number): Result<number, "EEE3"> => success(s + 2);

  const p = pipeline(e1, r2, r3);
  const result = p(); // エラーハンドラなし

  assertEquals(result.isSuccess, false);
  if (!result.isSuccess) {
    assertEquals(result.value, 999); // エラー発生時に元の値が返る
    assertEquals(result.error, "EEE1");
  }
});

// 最初の関数でエラーが発生した場合のテスト（エラーハンドラあり）
Deno.test("pipeline handles error in first function with error handler", () => {
  const e1 = (): Result<number, "EEE1"> => failure(1, "EEE1");
  const r2 = (s: number): Result<number, "EEE2"> => success(s + 1);
  const r3 = (s: number): Result<number, "EEE3"> => success(s + 2);

  let caughtError = "";
  const b = pipeline(e1, r2, r3);
  const result = b((res) => {
    caughtError = res.error;

    // エラーハンドラのテスト - Result型を返す
    switch (res.error) {
      case "EEE1":
        return success(-1);
      case "EEE2":
        return success(-2);
      case "EEE3":
        return success(-3);
      default:
        return success(-999);
    }
  });

  assertEquals(caughtError, "EEE1");
  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, -1);
  }
});

// 真ん中の関数でエラーが発生した場合のテスト
Deno.test("pipeline handles error in middle function", () => {
  const r1 = (): Result<number, "EEE1"> => success(1);
  const e2 = (s: number): Result<number, "EEE2"> => failure(s + 1, "EEE2");
  const r3 = (s: number): Result<number, "EEE3"> => success(s + 2);

  let caughtError = "";
  const p = pipeline(r1, e2, r3);
  const result = p((res) => {
    caughtError = res.error;
    return success(-2);
  });

  assertEquals(caughtError, "EEE2");
  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, -2);
  }
});

// 長いチェーンの末尾でエラーが発生した場合のテスト
Deno.test("pipeline handles error in last function of a chain", () => {
  const r1 = (): Result<number, "EEE1"> => success(1);
  const r2 = (s: number): Result<number, "EEE2"> => success(s + 1);
  const r3 = (s: number): Result<number, "EEE3"> => success(s + 2);
  const r4 = (s: number): Result<number, "EEE4"> => success(s * 2);
  const e5 = (s: number): Result<number, "EEE5"> => failure(s - 1, "EEE5");

  let caughtError = "";
  const d = pipeline(r1, r2, r3, r4, e5);
  const result = d((res) => {
    caughtError = res.error;

    // エラーハンドラのテスト - Result型を返す
    switch (res.error) {
      case "EEE1":
        return success(-1);
      case "EEE2":
        return success(-2);
      case "EEE3":
        return success(-3);
      case "EEE4":
        return success(-4);
      case "EEE5":
        return success(-5);
      default:
        return success(-999);
    }
  });

  assertEquals(caughtError, "EEE5");
  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, -5);
  }
});

// 長いチェーンの中間でエラーが発生するテスト
Deno.test("pipeline handles error in middle of a long chain", () => {
  const r1 = (): Result<number, "LONG1"> => success(1);
  const r2 = (n: number): Result<number, "LONG2"> => success(n + 2);
  const r3 = (n: number): Result<number, "LONG3"> => success(n * 3);
  const e4 = (n: number): Result<number, "LONG4"> => failure(n, "LONG4");
  const r5 = (n: number): Result<number, "LONG5"> => success(n / 5);
  const r6 = (n: number): Result<number, "LONG6"> => success(n + 6);
  const r7 = (n: number): Result<number, "LONG7"> => success(n * 7);

  let caughtError = "";
  const p = pipeline(r1, r2, r3, e4, r5, r6, r7);
  const result = p((res) => {
    caughtError = res.error;
    return success(-99);
  });

  assertEquals(caughtError, "LONG4");
  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, -99);
  }
});

// 異なる型でエラーが発生した場合のテスト
Deno.test("pipeline handles errors with different types", () => {
  const r1 = (): Result<number, "E1"> => success(5);
  const r2 = (n: number): Result<string, "E2"> => failure(n.toString(), "E2");
  const r3 = (s: string): Result<boolean, "E3"> => success(s.length > 10);

  let caughtError = "";
  const p = pipeline(r1, r2, r3);
  const result = p((res) => {
    caughtError = res.error;
    return success(false);
  });

  assertEquals(caughtError, "E2");
  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, false);
  }
});

// エラーハンドラがエラーを返す場合のテスト
Deno.test("pipeline handles error handler returning failure", () => {
  const r1 = (): Result<number, "E1"> => success(5);
  const e2 = (n: number): Result<string, "E2"> => failure(n.toString(), "E2");

  const p = pipeline(r1, e2);
  const result = p((_res) => {
    // エラーハンドラがエラーを返す
    return failure("error handler failure", "E2");
  });

  assertEquals(result.isSuccess, false);
  if (!result.isSuccess) {
    assertEquals(result.value, "error handler failure");
    assertEquals(result.error, "E2");
  }
});

// ================ 4. エッジケースのテスト ================

// 空のパイプラインのテスト
Deno.test("pipeline handles empty function chain", () => {
  const p = pipeline();
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, undefined);
  }
});

// 単一関数のパイプラインテスト
Deno.test("pipeline works with a single function", () => {
  const r1 = (): Result<string, "SINGLE"> => success("single function");

  const p = pipeline(r1);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, "single function");
  }
});

// undefined/nullの扱いテスト
Deno.test("pipeline handles undefined and null values", () => {
  const r1 = (): Result<number | undefined, "U1"> => success(undefined);
  const r2 = (n: number | undefined): Result<string | null, "U2"> =>
    success(n === undefined ? null : n.toString());
  const r3 = (s: string | null): Result<boolean, "U3"> => success(s === null);

  const p = pipeline(r1, r2, r3);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, true); // null === null is true
  }
});

// ================ 5. 非同期パイプラインのテスト ================

// 単純な非同期パイプラインのテスト
Deno.test({
  name: "pipeline handles async functions",
  async fn() {
    // 単純なPromiseをラップしたテスト関数
    const asyncR1 = (): Result<number, "ASYNC1"> =>
      Promise.resolve(success(1)) as unknown as Result<number, "ASYNC1">;

    const asyncR2 = (n: number): Result<number, "ASYNC2"> =>
      Promise.resolve(success(n * 2)) as unknown as Result<number, "ASYNC2">;

    const asyncR3 = (n: number): Result<number, "ASYNC3"> =>
      Promise.resolve(success(n + 3)) as unknown as Result<number, "ASYNC3">;

    const p = pipeline(asyncR1, asyncR2, asyncR3);
    const result = await p();

    assertEquals(result.isSuccess, true);
    if (result.isSuccess) {
      assertEquals(result.value, 5); // 1 * 2 + 3 = 5
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// 非同期パイプラインでエラーが発生するテスト
Deno.test({
  name: "pipeline handles error in async function",
  async fn() {
    const asyncR1 = (): Result<number, "ASYNC1"> =>
      Promise.resolve(success(1)) as unknown as Result<number, "ASYNC1">;

    const asyncE2 = (n: number): Result<number, "ASYNC2"> =>
      Promise.resolve(failure(n, "ASYNC2")) as unknown as Result<
        number,
        "ASYNC2"
      >;

    const asyncR3 = (n: number): Result<number, "ASYNC3"> =>
      Promise.resolve(success(n + 3)) as unknown as Result<number, "ASYNC3">;

    let caughtError: string | undefined;
    const p = pipeline(asyncR1, asyncE2, asyncR3);
    const result = await p((res) => {
      caughtError = res.error;
      return success(-10);
    });

    assertEquals(caughtError, "ASYNC2");
    assertEquals(result.isSuccess, true);
    if (result.isSuccess) {
      assertEquals(result.value, -10);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// 非同期エラーハンドラがエラーを返すテスト
Deno.test({
  name: "pipeline handles async error handler returning error",
  async fn() {
    const asyncR1 = (): Result<number, "ASYNC1"> =>
      Promise.resolve(success(1)) as unknown as Result<number, "ASYNC1">;

    const asyncE2 = (n: number): Result<number, "ASYNC2"> =>
      Promise.resolve(failure(n, "ASYNC2")) as unknown as Result<
        number,
        "ASYNC2"
      >;

    const p = pipeline(asyncR1, asyncE2);
    const result = await p((_res) => {
      // エラーハンドラはResultの型と一致する必要がある
      return failure(42, "ASYNC2");
    });

    assertEquals(result.isSuccess, false);
    if (!result.isSuccess) {
      assertEquals(result.value, 42);
      assertEquals(result.error, "ASYNC2");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// 長い非同期チェーンのテスト
Deno.test({
  name: "pipeline handles long async function chain",
  async fn() {
    const asyncR1 = (): Result<number, "AL1"> =>
      Promise.resolve(success(1)) as unknown as Result<number, "AL1">;
    const asyncR2 = (n: number): Result<number, "AL2"> =>
      Promise.resolve(success(n + 1)) as unknown as Result<number, "AL2">;
    const asyncR3 = (n: number): Result<number, "AL3"> =>
      Promise.resolve(success(n * 2)) as unknown as Result<number, "AL3">;
    const asyncR4 = (n: number): Result<number, "AL4"> =>
      Promise.resolve(success(n - 1)) as unknown as Result<number, "AL4">;
    const asyncR5 = (n: number): Result<number, "AL5"> =>
      Promise.resolve(success(n * 3)) as unknown as Result<number, "AL5">;

    const p = pipeline(asyncR1, asyncR2, asyncR3, asyncR4, asyncR5);
    const result = await p();

    assertEquals(result.isSuccess, true);
    if (result.isSuccess) {
      // 1 + 1 = 2, 2 * 2 = 4, 4 - 1 = 3, 3 * 3 = 9
      assertEquals(result.value, 9);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// 非同期エラーハンドラが非同期の結果を返すテスト
Deno.test({
  name: "pipeline handles async error handler returning async result",
  async fn() {
    const asyncR1 = (): Result<number, "AEH1"> =>
      Promise.resolve(success(1)) as unknown as Result<number, "AEH1">;

    const asyncE2 = (n: number): Result<number, "AEH2"> =>
      Promise.resolve(failure(n, "AEH2")) as unknown as Result<number, "AEH2">;

    const p = pipeline(asyncR1, asyncE2);
    const result = await p((_res) => {
      // 非同期処理を行うエラーハンドラだが、Promise<Result>ではなくResultを直接返す
      // TypeScriptの制限により、エラーハンドラは同期的にResultを返す必要がある
      return success(100);
    });

    assertEquals(result.isSuccess, true);
    if (result.isSuccess) {
      assertEquals(result.value, 100);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// ================ 6. 型推論のテスト ================

// 複雑なエラー型の型推論テスト
Deno.test({
  name: "pipeline correctly infers complex error types",
  async fn() {
    // 複雑な型エイリアスの定義
    type ErrorA = { code: number; message: string };
    type ErrorB = { status: number; detail: string };

    const asyncR1 = (): Result<number, ErrorA> =>
      Promise.resolve(success(42)) as unknown as Result<number, ErrorA>;

    const asyncR2 = (n: number): Result<string, ErrorB> =>
      Promise.resolve(success(`Value: ${n}`)) as unknown as Result<
        string,
        ErrorB
      >;

    // エラー型がErrorA | ErrorBに推論されるはず
    const p = pipeline(asyncR1, asyncR2);
    const result = await p();

    assertEquals(result.isSuccess, true);
    if (result.isSuccess) {
      assertEquals(result.value, "Value: 42");
    }

    // エラーケースをテスト
    const asyncE1 = (): Result<number, ErrorA> =>
      Promise.resolve(
        failure(0, { code: 500, message: "Server Error" }),
      ) as unknown as Result<number, ErrorA>;

    const pWithError = pipeline(asyncE1, asyncR2);
    const errorResult = await pWithError((res) => {
      // エラー型がErrorA | ErrorBになっていることを確認
      if ("code" in res.error) {
        assertEquals(res.error.code, 500);
        assertEquals(res.error.message, "Server Error");
      }
      return success("Handled");
    });

    assertEquals(errorResult.isSuccess, true);
    if (errorResult.isSuccess) {
      assertEquals(errorResult.value, "Handled");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// 複雑なオブジェクト構造での型推論テスト
Deno.test("pipeline infers types correctly with complex object structure", () => {
  interface ComplexObject {
    id: number;
    metadata: {
      created: Date;
      tags: string[];
    };
    values: Map<string, number>;
  }

  interface TransformedObject {
    identifier: string;
    createdAt: string;
    tagCount: number;
    total: number;
  }

  const now = new Date();
  const map = new Map<string, number>();
  map.set("a", 1);
  map.set("b", 2);

  const r1 = (): Result<ComplexObject, "COMPLEX1"> =>
    success({
      id: 123,
      metadata: {
        created: now,
        tags: ["important", "typescript"],
      },
      values: map,
    });

  const r2 = (obj: ComplexObject): Result<TransformedObject, "COMPLEX2"> =>
    success({
      identifier: `ID-${obj.id}`,
      createdAt: obj.metadata.created.toISOString(),
      tagCount: obj.metadata.tags.length,
      total: Array.from(obj.values.values()).reduce((sum, val) => sum + val, 0),
    });

  const p = pipeline(r1, r2);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value.identifier, "ID-123");
    assertEquals(result.value.tagCount, 2);
    assertEquals(result.value.total, 3); // 1 + 2 = 3
  }
});
