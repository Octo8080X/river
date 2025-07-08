type Awaitable<T> = T | Promise<T>;
type ResultFunc<I, O, E = string> = (input: I) => Awaitable<Result<O, E>>;
type FirstResultFunc<O, E = string> = () => Awaitable<Result<O, E>>;
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

// 文字列リテラル型を明示的に取得するための制約
type StringLiteral<T> = T extends string
  ? string extends T
    ? never
    : T
  : never;

// リテラル型を推論可能にするためのヘルパータイプ
export type ErrorLiteral<E extends string> = {
  readonly __errorType: E;
  readonly __errorBrand: symbol;
};

// エラーリテラルを生成するヘルパー関数
export function createErrorLiteral<E extends string>(type: E): ErrorLiteral<E> {
  return { 
    __errorType: type,
    __errorBrand: Symbol()
  };
}

// 関数からリテラル型のエラーを抽出（改良版）
type ExtractExactErrorType<F> = 
  F extends (...args: unknown[]) => Awaitable<Result<unknown, infer E>>
    ? E extends ErrorLiteral<infer L> 
      ? L 
      : E extends string 
        ? StringLiteral<E>
        : string
    : F extends (...args: unknown[]) => unknown
      ? string
      : never;

// 最初の関数からリテラル型のエラーを抽出（改良版）
type ExtractFirstExactErrorType<F> = 
  F extends () => Awaitable<Result<unknown, infer E>>
    ? E extends ErrorLiteral<infer L> 
      ? L 
      : E extends string 
        ? StringLiteral<E> 
        : string
    : F extends () => unknown
      ? string
      : never;

// パイプライン全体の正確なエラー型の和集合を作成
type UnionOfExactErrorTypes<FirstFn, Fns extends readonly unknown[]> = 
  Fns extends readonly []
    ? ExtractFirstExactErrorType<FirstFn>
    : Fns extends readonly [infer F, ...infer Rest]
    ? ExtractFirstExactErrorType<FirstFn> | ExtractExactErrorType<F> | UnionOfExactErrorTypes<FirstFn, Rest>
    : ExtractFirstExactErrorType<FirstFn>;

type PipeResultResult<T, Fns extends readonly unknown[], E = string> = 
  Fns extends readonly []
    ? T
    : Fns extends readonly [infer F, ...infer Rest]
    ? F extends ResultFunc<T, infer U, E>
      ? PipeResultResult<Awaited<U>, Rest, E>
      : T
    : T;

// パイプラインの中間値の型を推論するためのヘルパー型
type PipelineIntermediateTypes<T, Fns extends readonly unknown[], E = string> = 
  Fns extends readonly []
    ? [T]
    : Fns extends readonly [infer F, ...infer Rest]
    ? F extends ResultFunc<T, infer U, E>
      ? [T, ...PipelineIntermediateTypes<Awaited<U>, Rest, E>]
      : [T]
    : [T];

// パイプラインの入力型の和集合を作成
type UnionOfPipelineInputs<T, Fns extends readonly unknown[], E = string> = 
  PipelineIntermediateTypes<T, Fns, E>[number];

export interface ResultFailure<F, T = unknown> {
  value: T;
  error: F;
}

export interface ResultSuccess<T> {
  value: T;
}

export type Result<T, F> = ResultSuccess<T> | ResultFailure<F, T>;

// 文字列リテラル型を保持するためのエラータイプエンコーダー
export function errorOf<E extends string>(errorType: E): ErrorLiteral<E> {
  return { 
    __errorType: errorType,
    __errorBrand: Symbol()
  };
}

// Result型関数のエラーをラップする拡張failure関数
export function failureWithType<E extends string, T = unknown>(value: T, errorType: E): ResultFailure<E, T> {
  return { value, error: errorType };
}

// エラーをリテラル型付きで作成
export function failureWithLiteralType<E extends string, T = unknown>(value: T, errorType: E): ResultFailure<ErrorLiteral<E>, T> {
  return { value, error: createErrorLiteral(errorType) };
}

export function success<T>(value: T): ResultSuccess<T> {
  return { value };
}

export function failure<F, T = unknown>(value: T, error: F): ResultFailure<F, T> {
  return { value, error };
}

// Resultの型チェック用ヘルパー関数
export function isSuccess<T, F>(result: Result<T, F>): result is ResultSuccess<T> {
  return 'value' in result && !('error' in result);
}

export function isFailure<T, F>(result: Result<T, F>): result is ResultFailure<F, T> {
  return 'error' in result;
}

interface ResultPipeline<T, Fns extends readonly unknown[], FirstFn, ErrorType = string> {
  run: (recoveryFunc?: (error: ResultFailure<ErrorType, UnionOfPipelineInputs<T, Fns>>) => Result<PipeResultResult<Awaited<T>, Fns>, ErrorType>) => Promise<Result<PipeResultResult<Awaited<T>, Fns>, ErrorType>>;
}

// Error型タプルを生成するヘルパー型
type ErrorTuple<E extends string> = { [K in E]: K };

// 関数からリテラルエラー型をタプルとして取得
type ExtractErrorTuple<F> = 
  F extends (...args: unknown[]) => Awaitable<Result<unknown, infer E>>
    ? E extends ErrorLiteral<infer L> ? { [K in L]: L } 
    : E extends string ? { [K in E]: E } 
    : never
    : never;

// パイプライン全体のエラータプルを結合
type UnionOfErrorTuples<FirstFn, Fns extends readonly unknown[]> = 
  Fns extends readonly []
    ? ExtractErrorTuple<FirstFn>
    : Fns extends readonly [infer F, ...infer Rest]
    ? ExtractErrorTuple<FirstFn> & ExtractErrorTuple<F> & UnionOfErrorTuples<FirstFn, Rest>
    : ExtractErrorTuple<FirstFn>;

// Result型を使用するパイプライン関数（n個の引数に対応）
export function pipeAsyncResult<
  T,
  // deno-lint-ignore no-explicit-any
  const F1 extends FirstResultFunc<T, any>,
  // deno-lint-ignore no-explicit-any
  const Fns extends readonly ((...args: any[]) => any)[]
>(
  f1: F1,
  ...fns: Fns
): {
  run: <R = PipeResultResult<Awaited<T>, typeof fns>>(
    recoveryFunc?: (
      error: ResultFailure<
        UnionOfExactErrorTypes<typeof f1, typeof fns>, 
        UnionOfPipelineInputs<T, typeof fns>
      >
    ) => Result<R, UnionOfExactErrorTypes<typeof f1, typeof fns>>
  ) => Promise<Result<R | PipeResultResult<Awaited<T>, typeof fns>, UnionOfExactErrorTypes<typeof f1, typeof fns>>>;
} {
  return {
    run: async <R = PipeResultResult<Awaited<T>, typeof fns>>(
      recoveryFunc?: (
        error: ResultFailure<
          UnionOfExactErrorTypes<typeof f1, typeof fns>, 
          UnionOfPipelineInputs<T, typeof fns>
        >
      ) => Result<R, UnionOfExactErrorTypes<typeof f1, typeof fns>>
    ) => {
      type ErrorType = UnionOfExactErrorTypes<typeof f1, typeof fns>;
      let result: Result<unknown, ErrorType>;
      
      // 最初の関数でのthrowをキャッチ
      try {
        result = await f1();
      } catch (error) {
        const thrownError: ResultFailure<ErrorType, UnionOfPipelineInputs<T, typeof fns>> = {
          value: null as UnionOfPipelineInputs<T, typeof fns>,
          error: (error instanceof Error ? error.message : String(error)) as ErrorType
        };
        if (recoveryFunc) {
          return recoveryFunc(thrownError);
        } else {
          return thrownError as Result<PipeResultResult<Awaited<T>, typeof fns>, ErrorType>;
        }
      }
      
      if (isFailure(result)) {
        const typedError: ResultFailure<ErrorType, UnionOfPipelineInputs<T, typeof fns>> = {
          value: result.value as UnionOfPipelineInputs<T, typeof fns>,
          error: result.error as ErrorType
        };
        if (recoveryFunc) {
          return recoveryFunc(typedError);
        } else {
          return typedError as Result<PipeResultResult<Awaited<T>, typeof fns>, ErrorType>;
        }
      }
      
      for (const fn of fns) {
          const currentValue: unknown = result.value;
          
          // 各関数でのthrowをキャッチ
          try {
            // deno-lint-ignore no-explicit-any
            result = await (fn as any)(currentValue);
          } catch (error) {
            const thrownError: ResultFailure<ErrorType, UnionOfPipelineInputs<T, typeof fns>> = {
              value: currentValue as UnionOfPipelineInputs<T, typeof fns>,
              error: (error instanceof Error ? error.message : String(error)) as ErrorType
            };
            if (recoveryFunc) {
              return recoveryFunc(thrownError);
            } else {
              return thrownError as Result<PipeResultResult<Awaited<T>, typeof fns>, ErrorType>;
            }
          }
          
          if (isFailure(result)) {
            // エラー時に引数内容も含める
            const errorWithInput: ResultFailure<ErrorType, UnionOfPipelineInputs<T, typeof fns>> = {
              value: currentValue as UnionOfPipelineInputs<T, typeof fns>,
              error: result.error as ErrorType
            };
            if (recoveryFunc) {
              return recoveryFunc(errorWithInput);
            } else {
              return errorWithInput as Result<PipeResultResult<Awaited<T>, typeof fns>, ErrorType>;
            }
          }
      }
      
      return result as Result<PipeResultResult<Awaited<T>, typeof fns>, ErrorType>;
    }
  };
}


interface ResSuc<T>{
  v: T;
}
interface ResFail<T, F>{
  v: T;
  e: F;
}
type Res<T,F> = ResSuc<T>| ResFail<T,F>;

function A<T, F>(r1: () => Res<T, F>, ...rn: Array<(s: Res<T,F>) => Res<T,F>>) {

  return (s: T): Res<T, F> => {

    let res: Res<T, F> = r1();
  
    for (const fn of rn) {
      res = fn(res);
    }
    return res;
  }

}

const r1 = (): Res<number, "EEE1"> => ({v: 1});
const r2 = (s: Res<number, "EEE1">): Res<number, "EEE2"> => ({v: s.v + 1});
const r3 = (s: Res<number, "EEE2">): Res<number, "EEE3"> => ({v: s.v + 2});

const a = A((): Res<number, "EEE1"> => ({v: 1}), (s): Res<number, "EEE2"> => ({v: s.v + 1}), (s): Res<number, "EEE3"> => ({v: s.v + 2}));
const aa = a(0);
console.log(aa);