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

export type Result<T,F> = ResultSuccess<T>| ResultFailure<T,F>;

// パイプライン関数: 複数の関数を連結してデータを順次処理する
// - n個の引数（関数）を受け取る形で定義（関数オーバーロード不使用）
// - ジェネリクスを活用して型安全性を確保
// - 各関数の入力型と出力型を明確に定義
// - 複数の型に対応できるようにジェネリクスを拡張
// - 内部ではany型を使用するが、外部からは型安全にアクセス可能
// - パイプライン関数から出力された関数の返り値は、Result<T, F> 型
export function pipeline<E extends string, TReturn = any>(
  first: () => Result<any, E>,
  ...rest: Array<(v: any) => Result<any, E>>
): (s?: (res: {isSuccess: false; error: E; value: never}) => Result<TReturn, E>) => Result<TReturn, E> {
  return (s?: (res: {isSuccess: false; error: E; value: never}) => Result<TReturn, E>): Result<TReturn, E> => {
    // 最初の関数を実行
    const initialResult = first();
    
    if (!initialResult.isSuccess) {
      // エラーが発生した場合は処理
      if (s) {
        return s({isSuccess: false, error: initialResult.error, value: undefined as never});
      }
      return failure(initialResult.value as TReturn, initialResult.error);
    }
    
    // 残りの関数を順番に実行
    let currentValue = initialResult.value;
    
    for (const fn of rest) {
      const result = fn(currentValue);
      
      if (!result.isSuccess) {
        // エラーが発生した場合は処理
        if (s) {
          return s({isSuccess: false, error: result.error, value: undefined as never});
        }
        return failure(result.value as TReturn, result.error);
      }
      
      currentValue = result.value;
    }
    
    return success(currentValue as TReturn);
  };
}
