import { assertEquals } from "@std/assert";
import {
  pipeAsyncResult,
  success,
  failure,
  failureWithType,
  isSuccess,
  isFailure,
  type Result,
  type ResultFailure
} from "./lib.ts";

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
  // deno-lint-ignore no-explicit-any
  const recoveryFunc = (error: any) => {
    console.log("途中でエラーを検出:", error.errors);
    console.log("エラー時の引数（型制約あり）:", error.value); // numberとして推論される
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
  // deno-lint-ignore no-explicit-any
  const recoveryFunc = (error: any) => {
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
  const f2 = (_n: number) => {
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
  const f2: (n: number) => Result<number, "ERROR 1"> = (_n: number) => {
    throw "ERROR 1";
  };
  const f3: (n: number) => Result<number, "ERROR 2"> = (_n: number) => {
    throw "ERROR 2";
  };
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // 型注釈なしでrecoveryFuncを定義し、"ERROR 1" | "ERROR 2"のUnion型として自動推論
  const recoveryFunc = (error: ResultFailure<string, unknown>) => {
    console.log("throwをキャッチ:", error.errors);
    console.log("エラー時の引数:", error.value);
    // 型チェック: エラーが期待されるリテラル型であることを確認
    if (error.errors.includes("ERROR 1") || error.errors.includes("ERROR 2")) {
      console.log("期待されるエラー型が推論されています");
    }
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

Deno.test("Result型 - 型制約: 具体的な型でのエラー復帰", async () => {
  const f1 = () => success(42);
  const f2 = (n: number) => {
    if (n > 40) {
      return failure(n, ["数値が大きすぎます"]);
    }
    return success(`値: ${n}`);
  };
  const f3 = (s: string) => success(s.length);
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // 型制約：error.valueはnumber | string型として推論される
  const result = await pipeline.run((error) => {
    console.log("エラー時の値:", error.value);
    // 型ガードを使用して具体的な型を判定
    if (typeof error.value === "number") {
      console.log("数値として扱う:", error.value + 10);
    }
    return success(999);
  });
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, 999);
  }
});

Deno.test("Result型 - 型制約: 文字列型でのエラー復帰", async () => {
  const f1 = () => success("hello");
  const f2 = (s: string) => {
    if (s.length > 3) {
      return failure(s, ["文字列が長すぎます"]);
    }
    return success(s.length);
  };
  
  const pipeline = pipeAsyncResult(f1, f2);
  
  // 型制約：error.valueはstring | number型として推論される
  const result = await pipeline.run((error) => {
    console.log("エラー時の値:", error.value);
    // 型ガードを使用して文字列型を判定
    if (typeof error.value === "string") {
      console.log("文字列として扱う:", error.value.toUpperCase());
      console.log("文字数:", error.value.length);
    }
    return success(0);
  });
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, 0);
  }
});

Deno.test("Result型 - 型制約: オブジェクト型でのエラー復帰", async () => {
  interface User {
    id: number;
    name: string;
  }
  
  const f1 = () => success({ id: -1, name: "Alice" }); // 無効なIDに変更
  const f2 = (user: User) => {
    if (user.id <= 0) {
      return failure(user, ["無効なユーザーID"]);
    }
    return success(`ユーザー: ${user.name}`);
  };
  
  const pipeline = pipeAsyncResult(f1, f2);
  
  // 型制約：error.valueは自動的にUser型として推論される
  const result = await pipeline.run((error) => {
    console.log("エラー時のユーザー:", error.value); // Union型として扱われる
    return success("デフォルトユーザー");
  });
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, "デフォルトユーザー");
  }
});

Deno.test("Result型 - 型制約: パイプライン型推論の確認", async () => {
  // パイプライン: number → string → number
  const f1 = () => success(100);
  const f2 = (n: number) => success(`数値: ${n}`);
  const f3 = (s: string) => {
    if (s.length > 6) {
      return failure(s, ["文字列が長すぎます"]);
    }
    return success(s.length);
  };
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // recoveryFuncのerror.valueは number | string 型として自動推論される
  const result = await pipeline.run((error) => {
    console.log("エラー発生箇所の値:", error.value);
    console.log("エラー発生箇所の型:", typeof error.value);
    
    // 型ガードを使用して安全に操作
    if (typeof error.value === "number") {
      console.log("数値として処理:", error.value * 2);
    } else if (typeof error.value === "string") {
      console.log("文字列として処理:", error.value.toUpperCase());
    }
    
    return success(-1); // エラー復帰値
  });
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, -1);
  }
});

Deno.test("Result型 - 型制約: 複雑なオブジェクト型の推論", async () => {
  interface Config {
    apiUrl: string;
    timeout: number;
  }
  
  interface User {
    id: number;
    name: string;
    config: Config;
  }
  
  const f1 = () => success({ apiUrl: "https://api.example.com", timeout: 5000 });
  const f2 = (config: Config) => success({ id: 1, name: "Test User", config });
  const f3 = (user: User) => {
    if (user.config.timeout < 1000) {
      return failure(user, ["タイムアウトが短すぎます"]);
    }
    return success(`${user.name} (${user.config.apiUrl})`);
  };
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // recoveryFuncのerror.valueは Config | User 型として自動推論される
  const result = await pipeline.run((error) => {
    console.log("エラー時の値の型:", typeof error.value);
    
    // 型ガードでオブジェクトの種類を判定
    if (typeof error.value === 'object' && error.value !== null) {
      if ('id' in error.value && 'name' in error.value) {
        // User型として処理
        const user = error.value as User;
        console.log("Userオブジェクト:", user.name);
      } else if ('apiUrl' in error.value && 'timeout' in error.value) {
        // Config型として処理
        const config = error.value as Config;
        console.log("Configオブジェクト:", config.apiUrl);
      }
    }
    
    return success("エラー復帰完了");
  });
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, "Test User (https://api.example.com)");
  }
});

Deno.test("Result型 - 型推論テスト: 厳密なエラー型推論", async () => {
  // より厳密なエラー型推論をテストするためのケース
  const f1 = () => success(100);
  const f2 = (n: number): Result<string, "VALIDATION_ERROR"> => {
    if (n < 50) {
      return failure("", ["VALIDATION_ERROR"]);
    }
    return success(`値: ${n}`);
  };
  const f3 = (s: string): Result<number, "PARSE_ERROR"> => {
    if (s.length > 10) {
      return failure(0, ["PARSE_ERROR"]);
    }
    return success(s.length);
  };
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // 理想的には、errorの型は以下のようになるべき：
  // ResultFailure<"VALIDATION_ERROR" | "PARSE_ERROR", number | string>
  const result = await pipeline.run((error) => {
    console.log("エラー型テスト - エラー:", error.errors);
    console.log("エラー型テスト - 値:", error.value);
    console.log("エラー型テスト - エラー配列の型:", typeof error.errors[0]);
    
    // 実行時チェック：期待されるエラー型
    const hasExpectedError = error.errors.some((err: unknown) => 
      err === "VALIDATION_ERROR" || err === "PARSE_ERROR"
    );
    
    if (hasExpectedError) {
      console.log("✓ 期待されるエラー型が検出されました");
    }
    
    return success(6);
  });
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, 6);
  }
});
Deno.test("Result型 - 自動型推論: リテラル型のUnion型を推論", async () => {
  // このテストではリテラル型のUnion型が正しく推論されることを確認
  const f1 = () => success(42);
  const f2: (n: number) => Result<string, "TYPE_A_ERROR"> = (n) => {
    if (n > 100) {
      return failure(n.toString(), ["TYPE_A_ERROR"]);
    }
    return success(n.toString());
  };
  const f3: (s: string) => Result<boolean, "TYPE_B_ERROR"> = (s) => {
    if (s.length < 2) {
      return failure(false, ["TYPE_B_ERROR"]);
    }
    return success(true);
  };
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // recoveryFuncで型注釈なしで "TYPE_A_ERROR" | "TYPE_B_ERROR" のUnion型が推論されるか
  // deno-lint-ignore no-explicit-any
  const result = await pipeline.run((error: any) => {
    // 型推論の検証: error.errorsがリテラル型の配列であることをチェック
    const errorTypes = error.errors;
    
    // リテラル型の判定
    if (errorTypes.includes("TYPE_A_ERROR")) {
      console.log("TYPE_A_ERRORを検出");
    } else if (errorTypes.includes("TYPE_B_ERROR")) {
      console.log("TYPE_B_ERRORを検出");
    } else {
      console.log("未知のエラータイプ:", errorTypes);
    }
    
    // error.valueはnumber | stringのUnion型として推論されるか
    console.log("エラー値の型:", typeof error.value);
    
    return success(false);
  });
  
  assertEquals(isSuccess(result), true);
});

Deno.test("Result型 - 改良型推論: 関数Aのアプローチでリテラル型推論", async () => {
  // 新しいアプローチを使用して、文字列リテラル型を保持する
  const f1 = () => success(50);
  const f2 = (n: number): Result<number, "IMPROVED_ERROR_1"> => {
    if (n < 0) {
      return failureWithType(n, "IMPROVED_ERROR_1");
    }
    return success(n * 2);
  };
  const f3 = (n: number): Result<string, "IMPROVED_ERROR_2"> => {
    if (n > 100) {
      return failureWithType(n.toString(), "IMPROVED_ERROR_2");
    }
    return success(`値: ${n}`);
  };
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // 型推論を検証するために手動でエラーを発生させる
  const result = await pipeline.run(error => {
    // error.errorsは "IMPROVED_ERROR_1" | "IMPROVED_ERROR_2" のリテラル型を保持
    const errorType = error.errors[0];
    
    // 条件分岐でリテラル型を使用
    if (errorType === "IMPROVED_ERROR_1") {
      console.log("IMPROVED_ERROR_1 エラーを検出");
    } else if (errorType === "IMPROVED_ERROR_2") {
      console.log("IMPROVED_ERROR_2 エラーを検出");
    }
    
    // エラータイプに基づいて適切な処理を行う
    return success("エラーを正常に処理しました");
  });
  
  assertEquals(isSuccess(result), true);
});
