import { assertEquals } from "@std/assert";
import { pipeAsyncResult, success, failure, isSuccess, isFailure, type ResultFailure } from "./lib.ts";

Deno.test("Result型 - 失敗ケース: 最初の関数で失敗", async () => {
  const f1 = () => failure(["初期エラー"]);
  const f2 = (n: number) => success(n * 2);

  const pipeline = pipeAsyncResult(f1, f2);
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["初期エラー"]);
  }
});

Deno.test("Result型 - 失敗ケース: 途中の関数で失敗", async () => {
  const f1 = () => success(10);
  const f2 = (n: number) => {
    if (n > 5) {
      return failure(["値が大きすぎます"]);
    }
    return success(n * 2);
  };
  const f3 = (n: number) => success(n + 5);

  const pipeline = pipeAsyncResult(f1, f2, f3);
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["値が大きすぎます"]);
  }
});

Deno.test("Result型 - 非同期関数の組み合わせ", async () => {
  const f1 = () => Promise.resolve(success(5));
  const f2 = (n: number) => Promise.resolve(success(`value: ${n}`));
  const f3 = (s: string) => Promise.resolve(success(s.length));
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  const result = await pipeline.run();
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, 8); // "value: 5".length = 8
  }
});

Deno.test("Result型 - 複雑な型変換パイプライン", async () => {
  const f1 = () => success("123");
  const f2 = (s: string) => {
    const num = parseInt(s);
    return isNaN(num) ? failure(["数値変換エラー"]) : success(num);
  };
  const f3 = (n: number) => success(n * 2);
  const f4 = (n: number) => success(`結果: ${n}`);
  
  const pipeline = pipeAsyncResult(f1, f2, f3, f4);
  const result = await pipeline.run();
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, "結果: 246");
  }
});

Deno.test("Result型 - 数値変換エラーケース", async () => {
  const f1 = () => success("abc");
  const f2 = (s: string) => {
    const num = parseInt(s);
    return isNaN(num) ? failure(["数値変換エラー"]) : success(num);
  };
  const f3 = (n: number) => success(n * 2);
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["数値変換エラー"]);
  }
});

Deno.test("Result型 - 15個の関数を使った長いパイプライン", async () => {
  const f1 = () => success(1);
  const f2 = (n: number) => success(n + 1);    // 2
  const f3 = (n: number) => success(n * 2);    // 4
  const f4 = (n: number) => success(n + 3);    // 7
  const f5 = (n: number) => success(n * 3);    // 21
  const f6 = (n: number) => success(n - 1);    // 20
  const f7 = (n: number) => success(n + 5);    // 25
  const f8 = (n: number) => success(n * 2);    // 50
  const f9 = (n: number) => success(n - 10);   // 40
  const f10 = (n: number) => success(n + 2);   // 42
  const f11 = (n: number) => success(n * 2);   // 84
  const f12 = (n: number) => success(n - 4);   // 80
  const f13 = (n: number) => success(n + 10);  // 90
  const f14 = (n: number) => success(n / 3);   // 30
  const f15 = (n: number) => success(n * 2);   // 60
  
  const pipeline = pipeAsyncResult(f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15);
  const result = await pipeline.run();
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, 60);
  }
});

Deno.test("Result型 - 20個の関数を使った超長いパイプライン", async () => {
  const f1 = () => success(10);
  const f2 = (n: number) => success(n + 5);    // 15
  const f3 = (n: number) => success(n * 2);    // 30
  const f4 = (n: number) => success(n - 5);    // 25
  const f5 = (n: number) => success(n + 10);   // 35
  const f6 = (n: number) => success(n * 3);    // 105
  const f7 = (n: number) => success(n - 5);    // 100
  const f8 = (n: number) => success(n / 10);   // 10
  const f9 = (n: number) => success(n + 20);   // 30
  const f10 = (n: number) => success(n * 2);   // 60
  const f11 = (n: number) => success(n - 10);  // 50
  const f12 = (n: number) => success(n + 5);   // 55
  const f13 = (n: number) => success(n * 2);   // 110
  const f14 = (n: number) => success(n - 10);  // 100
  const f15 = (n: number) => success(n / 5);   // 20
  const f16 = (n: number) => success(n + 30);  // 50
  const f17 = (n: number) => success(n * 2);   // 100
  const f18 = (n: number) => success(n - 20);  // 80
  const f19 = (n: number) => success(n + 10);  // 90
  const f20 = (n: number) => success(n / 3);   // 30
  
  const pipeline = pipeAsyncResult(
    f1, f2, f3, f4, f5, f6, f7, f8, f9, f10,
    f11, f12, f13, f14, f15, f16, f17, f18, f19, f20
  );
  const result = await pipeline.run();
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, 30);
  }
});

Deno.test("Result型 - 途中でエラーが発生する長いパイプライン", async () => {
  const f1 = () => success(100);
  const f2 = (n: number) => success(n / 2);    // 50
  const f3 = (n: number) => success(n - 10);   // 40
  const f4 = (n: number) => success(n + 5);    // 45
  const f5 = (n: number) => {
    if (n > 40) {
      return failure(["値が40を超えています"]);
    }
    return success(n * 2);
  };
  const f6 = (n: number) => success(n + 100);  // この関数は実行されない
  const f7 = (n: number) => success(n * 3);    // この関数は実行されない
  
  const pipeline = pipeAsyncResult(f1, f2, f3, f4, f5, f6, f7);
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["値が40を超えています"]);
  }
});

Deno.test("Result型 - エラー復帰機能: 最初の関数のエラーから復帰", async () => {
  const f1 = () => failure(["初期エラー"]);
  const f2 = (n: number) => success(n * 2);
  const f3 = (n: number) => success(n + 10);
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // 復帰関数: エラーが発生したらデフォルト値5を返す
  const recoveryFunc = (error: ResultFailure<string>) => {
    console.log("エラーを検出:", error.errors);
    return success(5);
  };
  
  const result = await pipeline.run(recoveryFunc);
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    // f1 エラー → 復帰で5 → f2(5) → 10 → f3(10) → 20
    assertEquals(result.value, 20);
  }
});

Deno.test("Result型 - エラー復帰機能: 途中の関数のエラーから復帰", async () => {
  const f1 = () => success(100);
  const f2 = (n: number) => {
    if (n > 50) {
      return failure(["値が大きすぎます"]);
    }
    return success(n * 2);
  };
  const f3 = (n: number) => success(n + 5);
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // 復帰関数: エラーが発生したら30を返す
  const recoveryFunc = (error: ResultFailure<string>) => {
    console.log("途中でエラーを検出:", error.errors);
    return success(30);
  };
  
  const result = await pipeline.run(recoveryFunc);
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    // f1(100) → f2 エラー → 復帰で30 → f3(30) → 35
    assertEquals(result.value, 35);
  }
});

Deno.test("Result型 - エラー復帰機能: 復帰関数もエラーを返す場合", async () => {
  const f1 = () => failure(["初期エラー"]);
  const f2 = (n: number) => success(n * 2);
  
  const pipeline = pipeAsyncResult(f1, f2);
  
  // 復帰関数自体もエラーを返す
  const recoveryFunc = (error: ResultFailure<string>) => {
    console.log("復帰処理中にもエラー:", error.errors);
    return failure(["復帰処理に失敗"]);
  };
  
  const result = await pipeline.run(recoveryFunc);
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["復帰処理に失敗"]);
  }
});

Deno.test("Result型 - エラー復帰機能: 複数回のエラーと復帰", async () => {
  const f1 = () => failure(["エラー1"]);
  const f2 = (n: number) => {
    if (n === 10) {
      return failure(["エラー2"]);
    }
    return success(n * 2);
  };
  const f3 = (n: number) => success(n + 100);
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  let recoveryCount = 0;
  const recoveryFunc = (error: ResultFailure<string>) => {
    recoveryCount++;
    console.log(`復帰処理 ${recoveryCount}回目:`, error.errors);
    if (recoveryCount === 1) {
      return success(10); // 最初のエラーは10で復帰
    } else {
      return success(20); // 2回目のエラーは20で復帰
    }
  };
  
  const result = await pipeline.run(recoveryFunc);
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    // f1 エラー → 復帰で10 → f2(10) エラー → 復帰で20 → f3(20) → 120
    assertEquals(result.value, 120);
  }
  assertEquals(recoveryCount, 2);
});

Deno.test("Result型 - エラー復帰機能なし: 従来通りの動作", async () => {
  const f1 = () => success(5);
  const f2 = (_n: number) => failure(["途中エラー"]);
  const f3 = (n: number) => success(n + 10);
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // 復帰関数を指定しない
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["途中エラー"]);
  }
});