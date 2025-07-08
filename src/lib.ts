type Awaitable<T> = T | Promise<T>;

type ResultFunc<I, O, E = string> = (input: I) => Awaitable<Result<O, E>>;
type FirstResultFunc<O, E = string> = () => Awaitable<Result<O, E>>;

// Promiseを除去
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type FirstFunc<O, E = string> = () => Awaitable<Result<O, E>>;

// Result型パイプラインの結果型を再帰的に計算
type PipeResultResult<T, Fns extends readonly unknown[], E = string> = 
  Fns extends readonly []
    ? T
    : Fns extends readonly [infer F, ...infer Rest]
    ? F extends ResultFunc<T, infer U, E>
      ? PipeResultResult<Awaited<U>, Rest, E>
      : T
    : T;

export interface ResultFailure<F> {
  errors: F[];
}

export interface ResultSuccess<T> {
  value: T;
}

type Result<T, F> = ResultSuccess<T> | ResultFailure<F>;

export function success<T>(value: T): ResultSuccess<T> {
  return { value };
}

export function failure<F>(errors: F[]): ResultFailure<F> {
  return { errors };
}

// Resultの型チェック用ヘルパー関数
export function isSuccess<T, F>(result: Result<T, F>): result is ResultSuccess<T> {
  return 'value' in result && !('errors' in result);
}

export function isFailure<T, F>(result: Result<T, F>): result is ResultFailure<F> {
  return 'errors' in result && !('value' in result);
}

interface ResultPipeline<T, E = string> {
  run: (recoveryFunc?: (error: ResultFailure<E>) => Result<T, E>) => Promise<Result<T, E>>;
}

// Result型を使用するパイプライン関数（n個の引数に対応）
// deno-lint-ignore ban-types
export function pipeAsyncResult<T, const Fns extends readonly Function[], E = string>(
  f1: FirstResultFunc<T, E>,
  ...fns: Fns
): ResultPipeline<PipeResultResult<Awaited<T>, Fns, E>, E> {
  return {
    run: async (recoveryFunc?: (error: ResultFailure<E>) => Result<PipeResultResult<Awaited<T>, Fns, E>, E>) => {
      let result: Result<unknown, E> = await f1();
      
      if (isFailure(result)) {
        if (recoveryFunc) {
          const recoveredResult = recoveryFunc(result);
          if (isSuccess(recoveredResult)) {
            result = recoveredResult;
          } else {
            return recoveredResult;
          }
        } else {
          return result;
        }
      }
      
      for (const fn of fns) {
          result = await (fn as ResultFunc<unknown, unknown, E>)(result.value);
          if (isFailure(result)) {
            if (recoveryFunc) {
              const recoveredResult = recoveryFunc(result);
              if (isSuccess(recoveredResult)) {
                result = recoveredResult;
              } else {
                return recoveredResult;
              }
            } else {
              return result;
            }
          }
      }
      
      return result as Result<PipeResultResult<Awaited<T>, Fns, E>, E>;
    }
  };
}

