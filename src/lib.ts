interface ResultSuccess<T>{
  v: T;
}
interface ResultFailure<T, F>{
  v: T;
  e: F;
}
type Result<T,F> = ResultSuccess<T>| ResultFailure<T,F>;

// 複数のエラー型を処理できるpipeline関数（n個対応）
function pipeline<T, E extends string>(
  first: () => Result<T, E>,
  ...rest: Array<(v: T) => Result<T, E>>
): ((s: ((res: ResultFailure<never, E>) => T) | undefined) => T) {
  // エラーハンドラの型
  return (s?: ((res: ResultFailure<never, E>) => T)): T => {
    // 最初の関数を実行
    const initialResult = first();
    
    if (initialResult && 'e' in initialResult) {
      // エラーが発生した場合は処理
      if (s) {
        return s({e: initialResult.e, v: undefined as never} as ResultFailure<never, E>);
      }
      return initialResult.v;
    }
    
    // 残りの関数を順番に実行
    let currentValue = initialResult.v;
    
    for (const fn of rest) {
      const result = fn(currentValue);
      
      if (result && 'e' in result) {
        // エラーが発生した場合は処理
        if (s) {
          return s({e: result.e, v: undefined as never} as ResultFailure<never, E>);
        }
        return result.v;
      }
      
      currentValue = result.v;
    }
    
    return currentValue;
  };
}

// 関数の配列からエラー型を抽出するユーティリティ型は必要なくなりました

const r1 = (): Result<number, "EEE1"> => ({v: 1});
const r2 = (s:number): Result<number, "EEE2"> => ({v: s + 1});
const r3 = (s:number): Result<number, "EEE3"> => ({v: s + 2});

// 型推論によってFFFFは "EEE1" | "EEE2" | "EEE3" になる
const a = pipeline(r1, r2, r3);
const aa = a(undefined);
console.log(aa);

// エラーケースのテスト
const e1 = (): Result<number, "EEE1"> => ({v: 1, e: "EEE1"});
const e2 = (s:number): Result<number, "EEE2"> => ({v: s + 1});
const e3 = (s:number): Result<number, "EEE3"> => ({v: s + 2});

const b = pipeline(e1, e2, e3);
const bb = b((res) => {
  // No type assertion needed now, the error type is properly inferred
  switch (res.e) {
    case "EEE1":
      console.log("Caught EEE1 error");
      return -1;
    case "EEE2":
      console.log("Caught EEE2 error");
      return -2;      
    case "EEE3":
      console.log("Caught EEE3 error");
      return -3;  
    default:
      console.log("Caught unknown error");
      return -999;
  } 
});
console.log("Error handler result:", bb);

// 4つ目と5つ目の関数定義
const r4 = (s:number): Result<number, "EEE4"> => ({v: s * 2});
const _r5 = (s:number): Result<number, "EEE5"> => ({v: s - 1});

// エラーケースのテスト（4つ目と5つ目の関数でのエラー）
const e4 = (s:number): Result<number, "EEE4"> => ({v: s * 2, e: "EEE4"});
const e5 = (s:number): Result<number, "EEE5"> => ({v: s - 1, e: "EEE5"});

// 4つ目の関数でのエラー
const c = pipeline(r1, r2, r3, e4);
const cc = c((res) => {
  // エラーハンドラがすべてのエラー型を適切に処理できるか確認
  switch (res.e) {
    case "EEE1":
      console.log("Caught EEE1 error");
      return -1;
    case "EEE2":
      console.log("Caught EEE2 error");
      return -2;      
    case "EEE3":
      console.log("Caught EEE3 error");
      return -3;
    case "EEE4":
      console.log("Caught EEE4 error");
      return -4;
    default:
      console.log("Caught unknown error");
      return -999;
  } 
});
console.log("Error handler result for e4:", cc);

// 5つ目の関数でのエラー
const d = pipeline(r1, r2, r3, r4, e5);
const dd = d((res) => {
  // エラーハンドラがすべてのエラー型を適切に処理できるか確認
  switch (res.e) {
    case "EEE1":
      console.log("Caught EEE1 error");
      return -1;
    case "EEE2":
      console.log("Caught EEE2 error");
      return -2;      
    case "EEE3":
      console.log("Caught EEE3 error");
      return -3;
    case "EEE4":
      console.log("Caught EEE4 error");
      return -4;
    case "EEE5":
      console.log("Caught EEE5 error");
      return -5;
    default:
      console.log("Caught unknown error");
      return -999;
  } 
});
console.log("Error handler result for e5:", dd);
