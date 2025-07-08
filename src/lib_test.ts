import { assertEquals } from "@std/assert";
import { pipeAsyncResult, success, failure, isSuccess, isFailure, type ResultFailure } from "./lib.ts";

Deno.test("Result型 - 失敗ケース: 最初の関数で失敗", async () => {
  const f1 = () => failure(null, ["初期エラー"]);
  const f2 = (n: number) => success(n * 2);

  const pipeline = pipeAsyncResult(f1, f2);
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["初期エラー"]);
    assertEquals(result.value, null);
  }
});

Deno.test("Result型 - 失敗ケース: 途中の関数で失敗", async () => {
  const f1 = () => success(10);
  const f2 = (n: number) => {
    if (n > 5) {
      return failure(n, ["値が大きすぎます"]);
    }
    return success(n * 2);
  };
  const f3 = (n: number) => success(n + 5);

  const pipeline = pipeAsyncResult(f1, f2, f3);
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["値が大きすぎます"]);
    assertEquals(result.value, 10); // エラー時の引数内容
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
    return isNaN(num) ? failure(s, ["数値変換エラー"]) : success(num);
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
    return isNaN(num) ? failure(s, ["数値変換エラー"]) : success(num);
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
      return failure(n, ["値が40を超えています"]);
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

Deno.test("Result型 - エラー復帰機能: エラー時の引数内容確認", async () => {
  const f1 = () => success(100);
  const f2 = (n: number) => {
    if (n > 50) {
      return failure(n, ["値が大きすぎます"]);
    }
    return success(n * 2);
  };
  
  const pipeline = pipeAsyncResult(f1, f2);
  
  // エラー復帰なしでテスト
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["値が大きすぎます"]);
    assertEquals(result.value, 100); // エラー時の引数内容が保持されている
  }
});

Deno.test("Result型 - エラー復帰機能: 途中の関数のエラーから復帰", async () => {
  const f1 = () => success(100);
  const f2 = (n: number) => {
    if (n > 50) {
      return failure(n, ["値が大きすぎます"]);
    }
    return success(n * 2);
  };
  const f3 = (n: number) => success(n + 5);
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // 復帰関数: エラーが発生したら最終的な値を返す（パイプライン処理は終了）
  const recoveryFunc = (error: ResultFailure<string>) => {
    console.log("途中でエラーを検出:", error.errors);
    return success(200); // エラー復帰時の最終値
  };
  
  const result = await pipeline.run(recoveryFunc);
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    // f1(100) → f2 エラー → 復帰で200（ここで終了、f3は実行されない）
    assertEquals(result.value, 200);
  }
});

Deno.test("Result型 - エラー復帰機能: エラー時の引数内容を使った復帰", async () => {
  const f1 = () => success("invalid_number");
  const f2 = (s: string) => {
    const num = parseInt(s);
    if (isNaN(num)) {
      return failure(s, ["数値変換エラー"]);
    }
    return success(num);
  };
  
  const pipeline = pipeAsyncResult(f1, f2);
  
  // エラー復帰なしでテスト
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["数値変換エラー"]);
    assertEquals(result.value, "invalid_number"); // エラー時の引数内容
  }
});

Deno.test("Result型 - エラー復帰機能: エラーが発生しない場合は通常処理", async () => {
  const f1 = () => success(10);
  const f2 = (n: number) => success(n * 2);
  const f3 = (n: number) => success(n + 5);
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  let recoveryCallCount = 0;
  const recoveryFunc = (error: ResultFailure<string>) => {
    recoveryCallCount++;
    console.log("復帰処理が呼ばれました:", error.errors);
    return success(999);
  };
  
  const result = await pipeline.run(recoveryFunc);
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    // f1(10) → f2(10*2=20) → f3(20+5=25) 正常にパイプライン処理
    assertEquals(result.value, 25);
  }
  // エラーが発生していないので復帰関数は呼ばれない
  assertEquals(recoveryCallCount, 0);
});

Deno.test("Result型 - エラー復帰機能なし: 従来通りの動作", async () => {
  const f1 = () => success(5);
  const f2 = (_n: number) => failure(0, ["途中エラー"]);
  const f3 = (n: number) => success(n + 10);
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // 復帰関数を指定しない
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["途中エラー"]);
  }
});

Deno.test("test with throw", async () => {
  const f1 = () => success(1);
  const f2 = (n: number) => {
    throw new Error("Test error");
  };
  const f3 = (n: number) => success(n * 2);    // この関数は実行されない
  const tee = (n: number) => {
    console.log("Tee function called with:", n);
    return success(n);
  };

  const pipeline = pipeAsyncResult(f1, f2, tee, f3);
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["Test error"]);
    assertEquals(result.value, 1); // f2の引数として渡された値
  }
});

Deno.test("Result型 - throw処理: 最初の関数でthrow", async () => {
  const f1 = () => {
    throw new Error("初期関数でエラー");
  };
  const f2 = (n: number) => success(n * 2);
  
  const pipeline = pipeAsyncResult(f1, f2);
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["初期関数でエラー"]);
    assertEquals(result.value, null);
  }
});

Deno.test("Result型 - throw処理: 途中の関数でthrow", async () => {
  const f1 = () => success(100);
  const f2 = (n: number) => {
    if (n > 50) {
      throw new Error("値が大きすぎます");
    }
    return success(n * 2);
  };
  const f3 = (n: number) => success(n + 10);
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["値が大きすぎます"]);
    assertEquals(result.value, 100); // throw時の引数内容
  }
});

Deno.test("Result型 - throw処理: 非同期関数でthrow", async () => {
  const f1 = () => success("test");
  const f2 = async (s: string) => {
    await new Promise(resolve => setTimeout(resolve, 1));
    throw new Error(`非同期エラー: ${s}`);
  };
  const f3 = (s: string) => success(s.length);
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["非同期エラー: test"]);
    assertEquals(result.value, "test");
  }
});

Deno.test("Result型 - throw処理: 文字列をthrow", async () => {
  const f1 = () => success(10);
  const f2 = (_n: number) => {
    throw "文字列エラー";
  };
  
  const pipeline = pipeAsyncResult(f1, f2);
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["文字列エラー"]);
    assertEquals(result.value, 10);
  }
});

Deno.test("Result型 - throw処理: エラー復帰機能と組み合わせ", async () => {
  const f1 = () => success(50);
  const f2 = (_n: number) => {
    throw new Error("計算エラー");
  };
  const f3 = (n: number) => success(n + 100);
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  const recoveryFunc = (error: ResultFailure<string, unknown>) => {
    console.log("throwをキャッチ:", error.errors);
    console.log("エラー時の引数:", error.value);
    return success(999); // 復帰値
  };
  
  const result = await pipeline.run(recoveryFunc);
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, 999);
  }
});

Deno.test("Result型 - throw処理: Result型とthrowの混在", async () => {
  const f1 = () => success(5);
  const f2 = (n: number) => {
    if (n < 10) {
      return failure(n, ["Result型エラー"]);
    }
    return success(n * 2);
  };
  const f3 = (_n: number) => {
    throw new Error("throw型エラー");
  };
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  const result = await pipeline.run();
  
  // f2でResult型エラーが発生するため、f3は実行されない
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors, ["Result型エラー"]);
    assertEquals(result.value, 5);
  }
});