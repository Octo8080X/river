interface ResultSuccess<T>{
  v: T;
}
interface ResultFailure<T, F>{
  v: T;
  e: F;
}
export type Result<T,F> = ResultSuccess<T>| ResultFailure<T,F>;

// パイプライン関数: 複数の関数を連結してデータを順次処理する
// - n個の引数（関数）を受け取る形で定義（関数オーバーロード不使用）
// - ジェネリクスを活用して型安全性を確保
// - 各関数の入力型と出力型を明確に定義
// - 複数の型に対応できるようにジェネリクスを拡張
// - 内部ではany型を使用するが、外部からは型安全にアクセス可能
export function pipeline<E extends string, TReturn = any>(
  first: () => Result<any, E>,
  ...rest: Array<(v: any) => Result<any, E>>
): (s?: (res: ResultFailure<never, E>) => TReturn) => TReturn {
  return (s?: (res: ResultFailure<never, E>) => TReturn): TReturn => {
    // 最初の関数を実行
    const initialResult = first();
    
    if (initialResult && 'e' in initialResult) {
      // エラーが発生した場合は処理
      if (s) {
        return s({e: initialResult.e, v: undefined as never} as ResultFailure<never, E>);
      }
      return initialResult.v as TReturn;
    }
    
    // 残りの関数を順番に実行
    let currentValue = (initialResult as ResultSuccess<any>).v;
    
    for (const fn of rest) {
      const result = fn(currentValue);
      
      if (result && 'e' in result) {
        // エラーが発生した場合は処理
        if (s) {
          return s({e: result.e, v: undefined as never} as ResultFailure<never, E>);
        }
        return result.v as TReturn;
      }
      
      currentValue = (result as ResultSuccess<any>).v;
    }
    
    return currentValue as TReturn;
  };
}
