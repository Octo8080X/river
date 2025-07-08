import { assertEquals } from "@std/assert";
import {
  pipeAsyncResult,
  success,
  failure,
  failureWithType,
  errorOf,
  isSuccess,
  isFailure,
  type Result
} from "./lib.ts";

// 関数Aパターンを活用した改良されたパイプラインテスト
Deno.test("リテラルエラー型推論の改良版", async () => {
  const f1 = () => success(50);
  
  // 明示的な型宣言でリテラル型を指定
  const f2: (n: number) => Result<number, "ERROR_CODE_1"> = (_n: number) => {
    throw "ERROR_CODE_1"; // throwでもリテラル型が保持される
  };
  
  const f3: (n: number) => Result<number, "ERROR_CODE_2"> = (_n: number) => {
    return failureWithType(_n, "ERROR_CODE_2"); // failureWithTypeでリテラル型を保持
  };
  
  const pipeline = pipeAsyncResult(f1, f2, f3);
  
  // 型注釈なしでリテラル型を推論
  const result = await pipeline.run(error => {
    console.log("エラータイプ:", error.errors);
    
    // リテラル型の比較が可能
    if (error.errors.includes("ERROR_CODE_1")) {
      console.log("ERROR_CODE_1 を検出");
    } else if (error.errors.includes("ERROR_CODE_2")) {
      console.log("ERROR_CODE_2 を検出");
    }
    
    return success(999);
  });
  
  assertEquals(isSuccess(result), true);
  if (isSuccess(result)) {
    assertEquals(result.value, 999);
  }
});
