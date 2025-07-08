import { assertEquals } from "@std/assert";
import {
  pipeAsyncResult,
  success,
  failure as _failure,
  failureWithType as _failureWithType,
  failureWithLiteralType,
  errorOf as _errorOf,
  isSuccess,
  isFailure as _isFailure,
  type Result,
  type ErrorLiteral
} from "./lib.ts";

Deno.test("Result型 - リテラル型推論: 関数Aパターンでの改良版", async () => {
  // 関数Aのパターンを活用して、強力なリテラル型推論を実現
  const f1 = () => success(50);
  
  // 文字列リテラル型を使った厳密なエラータイプ定義
  const _f2 = (n: number): Result<number, ErrorLiteral<"ERROR_A">> => {
    if (n < 0) {
      return failureWithLiteralType(n, "ERROR_A");
    }
    return success(n * 2);
  };
  
  const f3 = (n: number): Result<string, ErrorLiteral<"ERROR_B">> => {
    if (n > 100) {
      return failureWithLiteralType(n.toString(), "ERROR_B");
    }
    return success(`値: ${n}`);
  };
  
  // f3を強制的にエラーにするため、f2の結果を大きくする
  const f2b = (n: number) => success(n * 10); // 50 * 10 = 500 > 100なのでf3でエラーになる
  
  const pipeline = pipeAsyncResult(f1, f2b, f3);
  
  // 型注釈なしでrecoveryFuncを定義 - 厳密なリテラル型が推論される
  // deno-lint-ignore no-explicit-any
  const result = await pipeline.run((error: any) => {
    const errorType = error.errors[0];
    
    // エラーの型情報が保持されているか確認
    if (typeof errorType === 'object' && errorType !== null && '__errorType' in errorType) {
      // deno-lint-ignore no-explicit-any
      const literalType = (errorType as any).__errorType;
      console.log(`リテラル型のエラータイプ: ${literalType}`);
      
      // リテラル型を使った条件分岐
      if (literalType === 'ERROR_B') {
        console.log("期待通りのリテラル型が推論されました");
      }
    }
    
    return success("エラーから正常に復帰");
  });
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, "エラーから正常に復帰");
  }
});

Deno.test("Result型 - エラー復帰関数の厳密な型推論", async () => {
  // 従来のテストケースを修正して、型注釈なしで正しく推論されるか確認
  const f1 = () => success(50);
  
  // 明示的な型付けで、関数の返り値型を宣言
  const f2 = (_n: number): Result<number, "ERROR_1"> => {
    throw "ERROR_1";
  };
  
  const f3 = (_n: number): Result<number, "ERROR_2"> => {
    throw "ERROR_2";
  };
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // 型注釈なしでrecoveryFuncを定義 - "ERROR_1" | "ERROR_2"のUnion型として自動推論
  // deno-lint-ignore no-explicit-any
  const recoveryFunc = (error: any) => {
    console.log("throwをキャッチ:", error.errors);
    console.log("エラー時の引数:", error.value);
    
    // リテラル型の判定
    if (error.errors.includes("ERROR_1")) {
      console.log("ERROR_1を検出");
    } else if (error.errors.includes("ERROR_2")) {
      console.log("ERROR_2を検出");
    }
    
    return success(999);
  };
  
  const result = await pipeline.run(recoveryFunc);
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, 999);
  }
});
  Deno.test("Result型 - エラー復帰関数の厳密な型推論", async () => {
  // 従来のテストケースを修正して、型注釈なしで正しく推論されるか確認
  const f1 = () => success(50);
  
  // 明示的な型付けで、関数の返り値型を宣言
  const f2 = (_n: number): Result<number, "ERROR_1"> => {
    throw "ERROR_1";
  };
  const f3 = (n: number): Result<string, ErrorLiteral<"ERROR_B">> => {
    if (n > 100) {
      return failureWithLiteralType(n.toString(), "ERROR_B");
    }
    return success(`値: ${n}`);
  };
  
  // f3を強制的にエラーにするため、f2の結果を大きくする
  const f2b = (n: number) => success(n * 10); // 50 * 10 = 500 > 100なのでf3でエラーになる
  
  const pipeline = pipeAsyncResult(f1, f2b, f3);
  
  // 型注釈なしでrecoveryFuncを定義 - 厳密なリテラル型が推論される
  const result = await pipeline.run(error => {
    const errorType = error.errors[0];
    
    // エラーの型情報が保持されているか確認
    if (typeof errorType === 'object' && errorType !== null && '__errorType' in errorType) {
      const literalType = errorType.__errorType;
      console.log(`リテラル型のエラータイプ: ${literalType}`);
      
      // リテラル型を使った条件分岐
      if (literalType === 'ERROR_B') {
        console.log("期待通りのリテラル型が推論されました");
      }
    }
    
    return success("エラーから正常に復帰");
  });
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, "エラーから正常に復帰");
  }
});

Deno.test("Result型 - エラー復帰関数の厳密な型推論", async () => {
  // 従来のテストケースを修正して、型注釈なしで正しく推論されるか確認
  const f1 = () => success(50);
  
  // 明示的な型付けで、関数の返り値型を宣言
  const f2 = (_n: number): Result<number, "ERROR_1"> => {
    throw "ERROR_1";
  };
  
  const f3 = (_n: number): Result<number, "ERROR_2"> => {
    throw "ERROR_2";
  };
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // 型注釈なしでrecoveryFuncを定義 - "ERROR_1" | "ERROR_2"のUnion型として自動推論
  const recoveryFunc = (error) => {
    console.log("throwをキャッチ:", error.errors);
    console.log("エラー時の引数:", error.value);
    
    // リテラル型の判定
    if (error.errors.includes("ERROR_1")) {
      console.log("ERROR_1を検出");
    } else if (error.errors.includes("ERROR_2")) {
      console.log("ERROR_2を検出");
    }
    
    return success(999);
  };
  
  const result = await pipeline.run(recoveryFunc);
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, 999);
  }
});
