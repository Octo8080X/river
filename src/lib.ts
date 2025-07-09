interface ResultSuccess<T>{
  isSuccess: true;
  value: T;
}
interface ResultFailure<T, F>{
  isSuccess: false;
  value: T;
  error: F;
}

export function success<T>(value: T): Result<T, never> {
  return { isSuccess: true, value };
}

export function failure<T, F>(value: T, error: F): Result<T, F> {
  return { isSuccess: false, value, error };
}

export type Result<T, F> = ResultSuccess<T> | ResultFailure<T, F>;

// Type helpers for pipeline
type UnwrapResult<T> = T extends Result<infer U, any> ? U : never;
type UnwrapError<T> = T extends Result<any, infer E> ? E : never;

// 1. 0つの関数のケース
export function pipeline(): <T, E>() => Result<T, E>;

// 2. 1つの関数のケース
export function pipeline<A, E1>(
  fn1: () => Result<A, E1>
): (errorHandler?: (res: ResultFailure<any, E1>) => Result<A, E1>) => Result<A, E1>;

// 3. 2つの関数のケース
export function pipeline<A, B, E1, E2>(
  fn1: () => Result<A, E1>,
  fn2: (a: A) => Result<B, E2>
): (errorHandler?: (res: ResultFailure<any, E1 | E2>) => Result<B, E1 | E2>) => Result<B, E1 | E2>;

// 4. 3つの関数のケース
export function pipeline<A, B, C, E1, E2, E3>(
  fn1: () => Result<A, E1>,
  fn2: (a: A) => Result<B, E2>,
  fn3: (b: B) => Result<C, E3>
): (errorHandler?: (res: ResultFailure<any, E1 | E2 | E3>) => Result<C, E1 | E2 | E3>) => Result<C, E1 | E2 | E3>;

// 5. 4つの関数のケース
export function pipeline<A, B, C, D, E1, E2, E3, E4>(
  fn1: () => Result<A, E1>,
  fn2: (a: A) => Result<B, E2>,
  fn3: (b: B) => Result<C, E3>,
  fn4: (c: C) => Result<D, E4>
): (errorHandler?: (res: ResultFailure<any, E1 | E2 | E3 | E4>) => Result<D, E1 | E2 | E3 | E4>) => Result<D, E1 | E2 | E3 | E4>;

// 5. 5つの関数のケース
export function pipeline<A, B, C, D, F, E1, E2, E3, E4, E5>(
  fn1: () => Result<A, E1>,
  fn2: (a: A) => Result<B, E2>,
  fn3: (b: B) => Result<C, E3>,
  fn4: (c: C) => Result<D, E4>,
  fn5: (d: D) => Result<F, E5>
): (errorHandler?: (res: ResultFailure<any, E1 | E2 | E3 | E4 | E5>) => Result<F, E1 | E2 | E3 | E4 | E5>) => Result<F, E1 | E2 | E3 | E4 | E5>;

// パイプライン関数の実装: 複数の関数を連結してデータを順次処理する
export function pipeline(...fns: Array<(arg?: any) => Result<any, any>>): any {
  // 実際の実装
  return (errorHandler?: (res: ResultFailure<any, any>) => Result<any, any>): Result<any, any> => {
    if (fns.length === 0) {
      return success(undefined);
    }

    // 最初の関数を実行
    const first = fns[0];
    const currentResult = first();
    
    // 非同期の場合
    if (currentResult instanceof Promise) {
      return handleAsyncPipeline(fns, errorHandler) as any;
    }

    // 同期処理
    if (!currentResult.isSuccess) {
      return handleError(currentResult, errorHandler);
    }
    
    // 残りの関数を順番に実行
    let currentValue = currentResult.value;
    
    for (let i = 1; i < fns.length; i++) {
      const fn = fns[i];
      const result = fn(currentValue);
      
      if (!result.isSuccess) {
        return handleError(result, errorHandler);
      }
      
      currentValue = result.value;
    }
    
    return success(currentValue);
  };
}

// エラー処理用ヘルパー関数
function handleError<T, E>(
  result: ResultFailure<T, E>, 
  errorHandler?: (res: ResultFailure<any, E>) => Result<any, any>
): Result<any, E> {
  if (errorHandler) {
    return errorHandler(result);
  }
  return failure(result.value, result.error);
}

// 非同期パイプラインの処理
async function handleAsyncPipeline(
  fns: Array<(arg?: any) => Result<any, any> | Promise<Result<any, any>>>,
  errorHandler?: (res: ResultFailure<any, any>) => Result<any, any> | Promise<Result<any, any>>
): Promise<Result<any, any>> {
  try {
    // 最初の関数を実行
    const first = fns[0];
    const currentResult = await first();
    
    if (!currentResult.isSuccess) {
      return errorHandler 
        ? await Promise.resolve(errorHandler(currentResult))
        : failure(currentResult.value, currentResult.error);
    }
    
    // 残りの関数を順番に実行
    let currentValue = currentResult.value;
    
    for (let i = 1; i < fns.length; i++) {
      const fn = fns[i];
      const result = await fn(currentValue);
      
      if (!result.isSuccess) {
        return errorHandler 
          ? await Promise.resolve(errorHandler(result))
          : failure(result.value, result.error);
      }
      
      currentValue = result.value;
    }
    
    return success(currentValue);
  } catch (error) {
    // 予期せぬエラーの処理
    return failure(null, error as any);
  }
}
