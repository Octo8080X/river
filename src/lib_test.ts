import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { pipeline, Result } from "./lib.ts";

// 1. 最もシンプルな成功ケース（number型のみ、3つの関数）
Deno.test("pipeline handles successful execution", () => {
  const r1 = (): Result<number, "EEE1"> => ({v: 1});
  const r2 = (s:number): Result<number, "EEE2"> => ({v: s + 1});
  const r3 = (s:number): Result<number, "EEE3"> => ({v: s + 2});

  // 型推論によってエラー型は "EEE1" | "EEE2" | "EEE3" になる
  const a = pipeline(r1, r2, r3);
  const result = a();

  assertEquals(result, 4); // 1 + 1 + 2 = 4
});

// 2. 文字列型を使ったテスト（単一型、3つの関数）
Deno.test("pipeline works with string type", () => {
  const r1 = (): Result<string, "STR1"> => ({v: "hello"});
  const r2 = (s:string): Result<string, "STR2"> => ({v: s + " world"});
  const r3 = (s:string): Result<string, "STR3"> => ({v: s + "!"});

  const p = pipeline(r1, r2, r3);
  const result = p();

  assertEquals(result, "hello world!");
});

// 3. 長いチェーンの成功ケース（5つの関数）
Deno.test("pipeline handles longer successful chain", () => {
  const r1 = (): Result<number, "EEE1"> => ({v: 1});
  const r2 = (s:number): Result<number, "EEE2"> => ({v: s + 1});
  const r3 = (s:number): Result<number, "EEE3"> => ({v: s + 2});
  const r4 = (s:number): Result<number, "EEE4"> => ({v: s * 2});
  const r5 = (s:number): Result<number, "EEE5"> => ({v: s - 1});

  const p = pipeline(r1, r2, r3, r4, r5);
  const result = p();
  assertEquals(result, 7); // (1 + 1 + 2) * 2 - 1 = 7
});

// 4. 複数の型が混ざるケース（number -> string -> boolean）
Deno.test("pipeline handles mixed types", () => {
  const r1 = (): Result<number, "EEE1"> => ({v: 1});
  const r2 = (s:number): Result<string, "EEE2"> => ({v: `Value: ${s + 1}`});
  const r3 = (s:string): Result<boolean, "EEE3"> => ({v: s.length > 10});

  // 型推論によってエラー型は "EEE1" | "EEE2" | "EEE3" になる
  const a = pipeline(r1, r2, r3);
  const result = a();

  assertEquals(result, false); // "Value: 2".length > 10 = false
});

// 5. さらに複雑な型変換（number -> string -> number -> boolean）
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

// 6. オブジェクト型を使ったテスト
Deno.test("pipeline works with object type", () => {
  type User = { name: string, age: number };
  
  const r1 = (): Result<User, "USER1"> => ({v: {name: "John", age: 30}});
  const r2 = (u:User): Result<User, "USER2"> => ({v: {...u, age: u.age + 1}});
  const r3 = (u:User): Result<User, "USER3"> => ({v: {...u, name: u.name + " Doe"}});

  const p = pipeline(r1, r2, r3);
  const result = p();

  assertEquals(result, {name: "John Doe", age: 31});
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
// 8. エラーハンドラなしの場合のテスト（最もシンプルなエラーケース）
Deno.test("pipeline returns original value when error occurs without handler", () => {
  const e1 = (): Result<number, "EEE1"> => ({v: 999, e: "EEE1"});
  const r2 = (s:number): Result<number, "EEE2"> => ({v: s + 1});
  const r3 = (s:number): Result<number, "EEE3"> => ({v: s + 2});

  const p = pipeline(e1, r2, r3);
  const result = p(); // エラーハンドラなし
  
  assertEquals(result, 999); // エラー発生時に元の値が返る
});

// 9. 最初の関数でエラーが発生した場合のテスト（エラーハンドラあり）
Deno.test("pipeline handles error in first function", () => {
  const e1 = (): Result<number, "EEE1"> => ({v: 1, e: "EEE1"});
  const r2 = (s:number): Result<number, "EEE2"> => ({v: s + 1});
  const r3 = (s:number): Result<number, "EEE3"> => ({v: s + 2});

  let caughtError = "";
  const b = pipeline(e1, r2, r3);
  const result = b((res) => {
    caughtError = res.e;
    
    // エラーハンドラのテスト
    switch (res.e) {
      case "EEE1":
        return -1;
      case "EEE2":
        return -2;      
      case "EEE3":
        return -3;  
      default:
        return -999;
    } 
  });
  
  assertEquals(caughtError, "EEE1");
  assertEquals(result, -1);
});

// 10. 真ん中の関数でエラーが発生した場合のテスト
Deno.test("pipeline handles error in middle function", () => {
  const r1 = (): Result<number, "EEE1"> => ({v: 1});
  const e2 = (s:number): Result<number, "EEE2"> => ({v: s + 1, e: "EEE2"});
  const r3 = (s:number): Result<number, "EEE3"> => ({v: s + 2});

  let caughtError = "";
  const p = pipeline(r1, e2, r3);
  const result = p((res) => {
    caughtError = res.e;
    return -2;
  });
  
  assertEquals(caughtError, "EEE2");
  assertEquals(result, -2);
});

// 11. 長いチェーンの関数でエラーが発生した場合のテスト
Deno.test("pipeline handles error in fifth function", () => {
  const r1 = (): Result<number, "EEE1"> => ({v: 1});
  const r2 = (s:number): Result<number, "EEE2"> => ({v: s + 1});
  const r3 = (s:number): Result<number, "EEE3"> => ({v: s + 2});
  const r4 = (s:number): Result<number, "EEE4"> => ({v: s * 2});
  const e5 = (s:number): Result<number, "EEE5"> => ({v: s - 1, e: "EEE5"});

  let caughtError = "";
  const d = pipeline(r1, r2, r3, r4, e5);
  const result = d((res) => {
    caughtError = res.e;
    
    // エラーハンドラのテスト
    switch (res.e) {
      case "EEE1":
        return -1;
      case "EEE2":
        return -2;      
      case "EEE3":
        return -3;
      case "EEE4":
        return -4;
      case "EEE5":
        return -5;
      default:
        return -999;
    } 
  });
  
  assertEquals(caughtError, "EEE5");
  assertEquals(result, -5);
});

// 12. 異なる型でエラーが発生した場合のテスト（最も複雑）
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
