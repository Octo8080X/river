import { assertEquals } from "@std/assert";
import { pipeline, Result,success, failure } from './lib.ts';

// 1. 最もシンプルな成功ケース（number型のみ、3つの関数）
Deno.test("pipeline handles successful execution", () => {
  const r1 = (): Result<number, "EEE1"> => (success(1));
  const r2 = (s:number): Result<number, "EEE2"> => (success(s + 1));
  const r3 = (s:number): Result<number, "EEE3"> => (success(s + 2));

  // 型推論によってエラー型は "EEE1" | "EEE2" | "EEE3" になる
  const a = pipeline(r1, r2, r3);
  const result = a();

  if(! result.isSuccess) {
    assertEquals(result.error, "EEE1");
  }

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, 4); // 1 + 1 + 2 = 4
  }
});

// 2. 文字列型を使ったテスト（単一型、3つの関数）
Deno.test("pipeline works with string type", () => {
  const r1 = (): Result<string, "STR1"> => (success("hello"));
  const r2 = (s:string): Result<string, "STR2"> => (success(s + " world"));
  const r3 = (s:string): Result<string, "STR3"> => (success(s + "!"));

  const p = pipeline(r1, r2, r3);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, "hello world!");
  }
});

// 3. 長いチェーンの成功ケース（5つの関数）
Deno.test("pipeline handles longer successful chain", () => {
  const r1 = (): Result<number, "EEE1"> => success(1);
  const r2 = (s:number): Result<number, "EEE2"> => success(s + 1);
  const r3 = (s:number): Result<number, "EEE3"> => success(s + 2);
  const r4 = (s:number): Result<number, "EEE4"> => success(s * 2);
  const r5 = (s:number): Result<number, "EEE5"> => success(s - 1);

  const p = pipeline(r1, r2, r3, r4, r5);
  const result = p();
  
  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, 7); // (1 + 1 + 2) * 2 - 1 = 7
  }
});

// 4. 複数の型が混ざるケース（number -> string -> boolean）
Deno.test("pipeline handles mixed types", () => {
  const r1 = (): Result<number, "EEE1"> => success(1);
  const r2 = (s:number): Result<string, "EEE2"> => success(`Value: ${s + 1}`);
  const r3 = (s:string): Result<boolean, "EEE3"> => success(s.length > 10);

  // 型推論によってエラー型は "EEE1" | "EEE2" | "EEE3" になる
  const a = pipeline(r1, r2, r3);
  const result = a();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, false); // "Value: 2".length > 10 = false
  }
});

// 5. さらに複雑な型変換（number -> string -> number -> boolean）
Deno.test("pipeline handles different input/output types", () => {
  // number -> string -> number -> boolean の変換
  const r1 = (): Result<number, "E1"> => success(10);
  const r2 = (n: number): Result<string, "E2"> => success(n.toString() + " converted");
  const r3 = (s: string): Result<number, "E3"> => success(s.length);
  const r4 = (n: number): Result<boolean, "E4"> => success(n > 15);

  const p = pipeline(r1, r2, r3, r4);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, false); // "10 converted" の文字列長は11なので、11 > 15 は false
  }
});

// 6. オブジェクト型を使ったテスト
Deno.test("pipeline works with object type", () => {
  type User = { name: string, age: number };
  
  const r1 = (): Result<User, "USER1"> => success({name: "John", age: 30});
  const r2 = (u:User): Result<User, "USER2"> => success({...u, age: u.age + 1});
  const r3 = (u:User): Result<User, "USER3"> => success({...u, name: u.name + " Doe"});

  const p = pipeline(r1, r2, r3);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value, {name: "John Doe", age: 31});
  }
});

// 7. 複雑なオブジェクト型の変換テスト
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

  const r1 = (): Result<User, "EU1"> => success({id: 123, name: "John Doe"});
  const r2 = (user: User): Result<ProcessedUser, "EU2"> => success({
    userId: `user-${user.id}`, displayName: user.name.toUpperCase()
  });
  const r3 = (processed: ProcessedUser): Result<FinalResult, "EU3"> => success({
    success: true, message: `Processed ${processed.displayName} with ID ${processed.userId}`
  });

  const p = pipeline(r1, r2, r3);
  const result = p();

  assertEquals(result.isSuccess, true);
  if (result.isSuccess) {
    assertEquals(result.value.success, true);
    assertEquals(result.value.message, "Processed JOHN DOE with ID user-123");
  }
});
// 8. エラーハンドラなしの場合のテスト（最もシンプルなエラーケース）
Deno.test("pipeline returns original value when error occurs without handler", () => {
  const e1 = (): Result<number, "EEE1"> => failure(999, "EEE1");
  const r2 = (s:number): Result<number, "EEE2"> => success(s + 1);
  const r3 = (s:number): Result<number, "EEE3"> => success(s + 2);

  const p = pipeline(e1, r2, r3);
  const result = p(); // エラーハンドラなし
  
  assertEquals(result.isSuccess, false);
  if (!result.isSuccess) {
    assertEquals(result.value, 999); // エラー発生時に元の値が返る
    assertEquals(result.error, "EEE1");
  }
});

// 9. 最初の関数でエラーが発生した場合のテスト（エラーハンドラあり）
Deno.test("pipeline handles error in first function", () => {
  const e1 = (): Result<number, "EEE1"> => failure(1, "EEE1");
  const r2 = (s:number): Result<number, "EEE2"> => success(s + 1);
  const r3 = (s:number): Result<number, "EEE3"> => success(s + 2);

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

// 10. 真ん中の関数でエラーが発生した場合のテスト
Deno.test("pipeline handles error in middle function", () => {
  const r1 = (): Result<number, "EEE1"> => success(1);
  const e2 = (s:number): Result<number, "EEE2"> => failure(s + 1, "EEE2");
  const r3 = (s:number): Result<number, "EEE3"> => success(s + 2);

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

// 11. 長いチェーンの関数でエラーが発生した場合のテスト
Deno.test("pipeline handles error in fifth function", () => {
  const r1 = (): Result<number, "EEE1"> => success(1);
  const r2 = (s:number): Result<number, "EEE2"> => success(s + 1);
  const r3 = (s:number): Result<number, "EEE3"> => success(s + 2);
  const r4 = (s:number): Result<number, "EEE4"> => success(s * 2);
  const e5 = (s:number): Result<number, "EEE5"> => failure(s - 1, "EEE5");

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

// 12. 異なる型でエラーが発生した場合のテスト（最も複雑）
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
