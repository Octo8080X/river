interface ResultSuccess<T>{
  v: T;
}
interface ResultFailure<T, F>{
  v: T;
  e: F;
}
export type Result<T,F> = ResultSuccess<T>| ResultFailure<T,F>;

// 複数のエラー型を処理できるpipeline関数（n個対応）
export function pipeline<T, E extends string>(
  first: () => Result<T, E>,
  ...rest: Array<(v: T) => Result<T, E>>
): ((s?: ((res: ResultFailure<never, E>) => T)) => T) {
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
