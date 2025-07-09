import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { pipeline, Result } from "./lib.ts";

// ベーシックな成功ケースのテスト
Deno.test("pipeline handles successful execution", () => {
  const r1 = (): Result<number, "EEE1"> => ({v: 1});
  const r2 = (s:number): Result<number, "EEE2"> => ({v: s + 1});
  const r3 = (s:number): Result<number, "EEE3"> => ({v: s + 2});

  // 型推論によってエラー型は "EEE1" | "EEE2" | "EEE3" になる
  const a = pipeline(r1, r2, r3);
  const result = a();

  assertEquals(result, 4); // 1 + 1 + 2 = 4
});

// 最初の関数でエラーが発生した場合のテスト
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

// 長いチェーンの成功ケースのテスト
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

// エラーハンドラなしの場合のテスト
Deno.test("pipeline returns original value when error occurs without handler", () => {
  const e1 = (): Result<number, "EEE1"> => ({v: 999, e: "EEE1"});
  const r2 = (s:number): Result<number, "EEE2"> => ({v: s + 1});
  const r3 = (s:number): Result<number, "EEE3"> => ({v: s + 2});

  const p = pipeline(e1, r2, r3);
  const result = p(); // エラーハンドラなし
  
  assertEquals(result, 999); // エラー発生時に元の値が返る
});

// 真ん中の関数でエラーが発生した場合のテスト
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

// 文字列型を使ったテスト
Deno.test("pipeline works with string type", () => {
  const r1 = (): Result<string, "STR1"> => ({v: "hello"});
  const r2 = (s:string): Result<string, "STR2"> => ({v: s + " world"});
  const r3 = (s:string): Result<string, "STR3"> => ({v: s + "!"});

  const p = pipeline(r1, r2, r3);
  const result = p();

  assertEquals(result, "hello world!");
});

// オブジェクト型を使ったテスト
Deno.test("pipeline works with object type", () => {
  type User = { name: string, age: number };
  
  const r1 = (): Result<User, "USER1"> => ({v: {name: "John", age: 30}});
  const r2 = (u:User): Result<User, "USER2"> => ({v: {...u, age: u.age + 1}});
  const r3 = (u:User): Result<User, "USER3"> => ({v: {...u, name: u.name + " Doe"}});

  const p = pipeline(r1, r2, r3);
  const result = p();

  assertEquals(result, {name: "John Doe", age: 31});
});

// 長いチェーンの関数でエラーが発生した場合のテスト
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
