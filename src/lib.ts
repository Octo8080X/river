interface ResultSuccess<T>{
  v: T;
}
interface ResultFailure<T, F>{
  v: T;
  e: F;
}
type Result<T,F> = ResultSuccess<T>| ResultFailure<T,F>;

// 複数のエラー型を処理できるpipeline関数
function pipeline<F1 extends string, F2 extends string, F3 extends string>(
  r1: () => Result<number, F1>,
  r2: (v: number) => Result<number, F2>,
  r3: (v: number) => Result<number, F3>
): ((s: ((res: ResultFailure<never, F1 | F2 | F3>) => number) | undefined) => number) {
  // FFFFは全てのエラー型の和集合
  type FFFF = F1 | F2 | F3;

  return (s?: ((res: ResultFailure<never, FFFF>) => number)): number => {
    const res = r1();
  
    if(res && 'e' in res) {
      // エラーが発生した場合はそのまま返す
      if (s) {
        // s が定義されている場合は、s を呼び出して結果を返す
        return s({e: res.e, v: undefined as never} as ResultFailure<never, FFFF>);
      }
      return res.v;
    }

    const res2 = r2(res.v);
    if(res2 && 'e' in res2) {
      if (s) {
        return s({e: res2.e, v: undefined as never} as ResultFailure<never, FFFF>);
      }
      return res2.v;
    }

    const res3 = r3(res2.v);
    if(res3 && 'e' in res3) {
      if (s) {
        return s({e: res3.e, v: undefined as never} as ResultFailure<never, FFFF>);
      }
      return res3.v;
    }

    return res3.v;
  }

}

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

// エラーハンドラの実装
//const errorHandler = (res: ResFail<never, "EEE1" | "EEE2" | "EEE3">): number => {
//  console.log(`Error caught: ${res.e}`);
//  return -1;
//};

const b = pipeline(e1, e2, e3);
const bb = b((res) => {
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

})
console.log("Error handler result:", bb);
