import { assertEquals } from "@std/assert";
import {
  pipeAsyncResult,
  success,
  failure,
  failureWithLiteralType,
  isFailure,
  type Result,
  type ErrorLiteral
} from "./lib.ts";

Deno.test("Result型 - リテラル型のエラー", async () => {
  // 関数Aのパターンを活用した強力なリテラル型推論
  const f1 = () => success(100);
  
  // エラーリテラル型を使った関数
  const f2 = (n: number): Result<number, ErrorLiteral<"LITERAL_ERROR_1">> => {
    if (n > 50) {
      return failureWithLiteralType(n, "LITERAL_ERROR_1");
    }
    return success(n * 2);
  };
  
  const pipeline = pipeAsyncResult(f1, f2);
  
  // 実行してエラーを検証
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    const errorObj = result.errors[0];
    
    // ErrorLiteral型オブジェクトの検証
    if (typeof errorObj === 'object' && errorObj !== null && '__errorType' in errorObj) {
      // deno-lint-ignore no-explicit-any
      const literalType = (errorObj as any).__errorType;
      assertEquals(literalType, "LITERAL_ERROR_1");
      console.log("リテラル型が保持されています:", literalType);
    } else {
      throw new Error("エラーリテラル型が正しく保持されていません");
    }
  }
});

Deno.test("Result型 - 従来のエラーリテラル", async () => {
  // 従来の方法で文字列リテラル型を使った関数
  const f1 = () => success(10);
  
  // 明示的な型注釈で文字列リテラル型を指定
  const f2 = (n: number): Result<number, "TRADITIONAL_ERROR"> => {
    if (n < 20) {
      return failure(n, ["TRADITIONAL_ERROR"]);
    }
    return success(n * 2);
  };
  
  const pipeline = pipeAsyncResult(f1, f2);
  
  // 実行してエラーを検証
  const result = await pipeline.run();
  
  assertEquals(isFailure(result), true);
  if (isFailure(result)) {
    assertEquals(result.errors[0], "TRADITIONAL_ERROR");
    console.log("従来の方法でのリテラル型:", result.errors[0]);
  }
});
