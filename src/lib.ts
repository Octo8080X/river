interface ResultSuccess<T>{
  v: T;
}
interface ResultFailure<T, F>{
  v: T;
  e: F;
}
export type Result<T,F> = ResultSuccess<T>| ResultFailure<T,F>;

// パイプライン関数: 複数の関数を連結してデータを順次処理する
// 複数の型に対応できるようにジェネリクスを拡張
export function pipeline<A, B, E extends string>(
  first: () => Result<A, E>,
  second: (v: A) => Result<B, E>
): ((s?: ((res: ResultFailure<never, E>) => B)) => B);

export function pipeline<A, B, C, E extends string>(
  first: () => Result<A, E>,
  second: (v: A) => Result<B, E>,
  third: (v: B) => Result<C, E>
): ((s?: ((res: ResultFailure<never, E>) => C)) => C);

export function pipeline<A, B, C, D, E extends string>(
  first: () => Result<A, E>,
  second: (v: A) => Result<B, E>,
  third: (v: B) => Result<C, E>,
  fourth: (v: C) => Result<D, E>
): ((s?: ((res: ResultFailure<never, E>) => D)) => D);

export function pipeline<A, B, C, D, F, E extends string>(
  first: () => Result<A, E>,
  second: (v: A) => Result<B, E>,
  third: (v: B) => Result<C, E>,
  fourth: (v: C) => Result<D, E>,
  fifth: (v: D) => Result<F, E>
): ((s?: ((res: ResultFailure<never, E>) => F)) => F);

// 実装
export function pipeline<T, E extends string>(
  first: () => Result<unknown, E>,
  ...rest: Array<(v: unknown) => Result<unknown, E>>
): ((s?: ((res: ResultFailure<never, E>) => unknown)) => unknown) {
  // エラーハンドラの型
  return (s?: ((res: ResultFailure<never, E>) => unknown)): unknown => {
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
