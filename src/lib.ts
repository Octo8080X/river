type Awaitable<T> = T | Promise<T>;

type ResultFunc<I, O, E = string> = (input: I) => Awaitable<Result<O, E>>;
type FirstResultFunc<O, E = string> = () => Awaitable<Result<O, E>>;

type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type PipeResultResult<T, Fns extends readonly unknown[], E = string> = 
  Fns extends readonly []
    ? T
    : Fns extends readonly [infer F, ...infer Rest]
    ? F extends ResultFunc<T, infer U, E>
      ? PipeResultResult<Awaited<U>, Rest, E>
      : T
    : T;

export interface ResultFailure<F, T = unknown> {
  value: T;
  errors: F[];
}

export interface ResultSuccess<T> {
  value: T;
}

type Result<T, F> = ResultSuccess<T> | ResultFailure<F, T>;

export function success<T>(value: T): ResultSuccess<T> {
  return { value };
}

export function failure<F, T = unknown>(value: T, errors: F[]): ResultFailure<F, T> {
  return { value, errors };
}

// Resultの型チェック用ヘルパー関数
export function isSuccess<T, F>(result: Result<T, F>): result is ResultSuccess<T> {
  return 'value' in result && !('errors' in result);
}

export function isFailure<T, F>(result: Result<T, F>): result is ResultFailure<F, T> {
  return 'errors' in result;
}

interface ResultPipeline<T, E = string> {
  run: (recoveryFunc?: (error: ResultFailure<E, unknown>) => Result<T, E>) => Promise<Result<T, E>>;
}

// Result型を使用するパイプライン関数（n個の引数に対応）
// deno-lint-ignore ban-types
export function pipeAsyncResult<T, const Fns extends readonly Function[], E = string>(
  f1: FirstResultFunc<T, E>,
  ...fns: Fns
): ResultPipeline<PipeResultResult<Awaited<T>, Fns, E>, E> {
  return {
    run: async (recoveryFunc?: (error: ResultFailure<E, unknown>) => Result<PipeResultResult<Awaited<T>, Fns, E>, E>) => {
      let result: Result<unknown, E>;
      
      // 最初の関数でのthrowをキャッチ
      try {
        result = await f1();
      } catch (error) {
        const thrownError: ResultFailure<E, unknown> = {
          value: null,
          errors: [error instanceof Error ? error.message : String(error)] as E[]
        };
        if (recoveryFunc) {
          return recoveryFunc(thrownError);
        } else {
          return thrownError as Result<PipeResultResult<Awaited<T>, Fns, E>, E>;
        }
      }
      
      if (isFailure(result)) {
        if (recoveryFunc) {
          return recoveryFunc(result);
        } else {
          return result as Result<PipeResultResult<Awaited<T>, Fns, E>, E>;
        }
      }
      
      for (const fn of fns) {
          const currentValue = result.value;
          
          // 各関数でのthrowをキャッチ
          try {
            result = await (fn as ResultFunc<unknown, unknown, E>)(currentValue);
          } catch (error) {
            const thrownError: ResultFailure<E, unknown> = {
              value: currentValue,
              errors: [error instanceof Error ? error.message : String(error)] as E[]
            };
            if (recoveryFunc) {
              return recoveryFunc(thrownError);
            } else {
              return thrownError as Result<PipeResultResult<Awaited<T>, Fns, E>, E>;
            }
          }
          
          if (isFailure(result)) {
            // エラー時に引数内容も含める
            const errorWithInput: ResultFailure<E, unknown> = {
              value: currentValue,
              errors: result.errors
            };
            if (recoveryFunc) {
              return recoveryFunc(errorWithInput);
            } else {
              return errorWithInput as Result<PipeResultResult<Awaited<T>, Fns, E>, E>;
            }
          }
      }
      
      return result as Result<PipeResultResult<Awaited<T>, Fns, E>, E>;
    }
  };
}

