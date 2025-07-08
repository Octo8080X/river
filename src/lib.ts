type Awaitable<T> = T | Promise<T>;

type Func<I, O> = (input: I) => Awaitable<O>;
type FirstFunc<O> = () => Awaitable<O>;

// Promiseを除去
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

// 再帰的にパイプラインの結果型を計算
type PipeResult<T, Fns extends readonly unknown[]> = 
  Fns extends readonly []
    ? T
    : Fns extends readonly [infer F, ...infer Rest]
    ? F extends Func<T, infer U>
      ? PipeResult<Awaited<U>, Rest>
      : T
    : T;

// n個の関数に対応するパイプライン関数
export function pipeAsync<T, const Fns extends readonly unknown[]>(
  f1: FirstFunc<T>,
  ...fns: Fns
): { run: () => Promise<PipeResult<Awaited<T>, Fns>> } {
  return {
    run: async () => {
      let result: unknown = await f1();
      for (const fn of fns) {
        if (typeof fn === 'function') {
          result = await fn(result);
        }
      }
      return result as PipeResult<Awaited<T>, Fns>;
    }
  };
}



