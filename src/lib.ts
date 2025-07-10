interface ResultSuccess<T> {
  isSuccess: true;
  value: T;
}

interface ResultFailure<T, E> {
  isSuccess: false;
  value: T;
  error: E;
}

export type Result<T, E> = ResultSuccess<T> | ResultFailure<T, E>;

export type MaybePromise<T> = T | Promise<T>;

export function success<T>(value: T): Result<T, never> {
  return { isSuccess: true, value };
}

export function failure<T, E>(value: T, error: E): Result<T, E> {
  return { isSuccess: false, value, error };
}

export function isFailure<T, E>(
  result: Result<T, E>,
): result is ResultFailure<T, E> {
  return !result.isSuccess;
}

type ArrayOfLength<T, N extends number> = T[] & { length: N };

export function pipeline<T, E>(
  fns: ArrayOfLength<() => Result<T, E> | Promise<Result<T, E>>, 0>,
): <RecoveryT = never, RecoveryE = never>(
  recovery?: (error: ResultFailure<T, E>) => MaybePromise<Result<T, E>|Result<RecoveryT, RecoveryE>>,
) => Promise<Result<null, null>|Result<RecoveryT, RecoveryE>>;

export function pipeline<T0, E0>(
  fns: [() => Result<T0, E0> | Promise<Result<T0, E0>>],
): <RecoveryT = never, RecoveryE = never>(
  recovery?: (error: ResultFailure<T0, E0>) => MaybePromise<Result<T0, E0>|Result<RecoveryT, RecoveryE>>,
) => Promise<Result<T0, E0>|Result<RecoveryT, RecoveryE>>;

export function pipeline<T0, T1, E0, E1>(
  fns: [
    () => MaybePromise<Result<T0, E0>>,
    (input: T0) => MaybePromise<Result<T1, E1>>,
  ],
): <RecoveryT = never, RecoveryE = never>(
  recovery?: (
    error: ResultFailure<T0, E0>|ResultFailure<T1, E1>,
  ) => MaybePromise<Result<T0, E0>|Result<T1, E1>|Result<RecoveryT, RecoveryE>>,
) => Promise<Result<T0, E0>|Result<T1, E1>|Result<RecoveryT, RecoveryE>>;

export function pipeline<T0, T1, T2, E0, E1, E2>(
  fns: [
    () => MaybePromise<Result<T0, E0>>,
    (input: T0) => MaybePromise<Result<T1, E1>>,
    (input: T1) => MaybePromise<Result<T2, E2>>,
  ],
): <RecoveryT = never, RecoveryE = never>(
  recovery?: (
    error: ResultFailure<T0, E0>|ResultFailure<T1, E1>|ResultFailure<T2, E2>,
  ) => MaybePromise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<RecoveryT, RecoveryE>>,
) => Promise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<RecoveryT, RecoveryE>>;

export function pipeline<T0, T1, T2, T3, E0, E1, E2, E3>(
  fns: [
    () => MaybePromise<Result<T0, E0>>,
    (input: T0) => MaybePromise<Result<T1, E1>>,
    (input: T1) => MaybePromise<Result<T2, E2>>,
    (input: T2) => MaybePromise<Result<T3, E3>>,
  ],
): <RecoveryT = never, RecoveryE = never>(
  recovery?: (
    error: ResultFailure<T0, E0>|ResultFailure<T1, E1>|ResultFailure<T2, E2>|ResultFailure<T3, E3>,
  ) => MaybePromise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<RecoveryT, RecoveryE>>,
) => Promise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<RecoveryT, RecoveryE>>;

export function pipeline<T0, T1, T2, T3, T4, E0, E1, E2, E3, E4>(
  fns: [
    () => MaybePromise<Result<T0, E0>>,
    (input: T0) => MaybePromise<Result<T1, E1>>,
    (input: T1) => MaybePromise<Result<T2, E2>>,
    (input: T2) => MaybePromise<Result<T3, E3>>,
    (input: T3) => MaybePromise<Result<T4, E4>>,
  ],
): <RecoveryT = never, RecoveryE = never>(
  recovery?: (
    error: ResultFailure<T0, E0>|ResultFailure<T1, E1>|ResultFailure<T2, E2>|ResultFailure<T3, E3>|ResultFailure<T4, E4>,
  ) => MaybePromise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<RecoveryT, RecoveryE>>,
) => Promise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<RecoveryT, RecoveryE>>;

export function pipeline<T0, T1, T2, T3, T4, T5, E0, E1, E2, E3, E4, E5>(
  fns: [
    () => MaybePromise<Result<T0, E0>>,
    (input: T0) => MaybePromise<Result<T1, E1>>,
    (input: T1) => MaybePromise<Result<T2, E2>>,
    (input: T2) => MaybePromise<Result<T3, E3>>,
    (input: T3) => MaybePromise<Result<T4, E4>>,
    (input: T4) => MaybePromise<Result<T5, E5>>,
  ],
): <RecoveryT = never, RecoveryE = never>(
  recovery?: (
    error: ResultFailure<T0, E0>|ResultFailure<T1, E1>|ResultFailure<T2, E2>|ResultFailure<T3, E3>|ResultFailure<T4, E4>|ResultFailure<T5, E5>,
  ) => MaybePromise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<T5, E5>|Result<RecoveryT, RecoveryE>>,
) => Promise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<T5, E5>|Result<RecoveryT, RecoveryE>>;

export function pipeline<
  T0,
  T1,
  T2,
  T3,
  T4,
  T5,
  T6,
  E0,
  E1,
  E2,
  E3,
  E4,
  E5,
  E6,
>(
  fns: [
    () => MaybePromise<Result<T0, E0>>,
    (input: T0) => MaybePromise<Result<T1, E1>>,
    (input: T1) => MaybePromise<Result<T2, E2>>,
    (input: T2) => MaybePromise<Result<T3, E3>>,
    (input: T3) => MaybePromise<Result<T4, E4>>,
    (input: T4) => MaybePromise<Result<T5, E5>>,
    (input: T5) => MaybePromise<Result<T6, E6>>,
  ],
): <RecoveryT = never, RecoveryE = never>(
  recovery?: (
    error: ResultFailure<T0, E0>|ResultFailure<T1, E1>|ResultFailure<T2, E2>|ResultFailure<T3, E3>|ResultFailure<T4, E4>|ResultFailure<T5, E5>|ResultFailure<T6, E6>,
  ) => MaybePromise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<T5, E5>|Result<T6, E6>|Result<RecoveryT, RecoveryE>>,
) => Promise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<T5, E5>|Result<T6, E6>|Result<RecoveryT, RecoveryE>>;
export function pipeline<
  T0,
  T1,
  T2,
  T3,
  T4,
  T5,
  T6,
  T7,
  E0,
  E1,
  E2,
  E3,
  E4,
  E5,
  E6,
  E7,
>(
  fns: [
    () => MaybePromise<Result<T0, E0>>,
    (input: T0) => MaybePromise<Result<T1, E1>>,
    (input: T1) => MaybePromise<Result<T2, E2>>,
    (input: T2) => MaybePromise<Result<T3, E3>>,
    (input: T3) => MaybePromise<Result<T4, E4>>,
    (input: T4) => MaybePromise<Result<T5, E5>>,
    (input: T5) => MaybePromise<Result<T6, E6>>,
    (input: T6) => MaybePromise<Result<T7, E7>>,
  ],
): <RecoveryT = never, RecoveryE = never>(
  recovery?: (
    error: ResultFailure<T0, E0>|ResultFailure<T1, E1>|ResultFailure<T2, E2>|ResultFailure<T3, E3>|ResultFailure<T4, E4>|ResultFailure<T5, E5>|ResultFailure<T6, E6>|ResultFailure<T7, E7>,
  ) => MaybePromise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<T5, E5>|Result<T6, E6>|Result<T7, E7>|Result<RecoveryT, RecoveryE>>,
) => Promise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<T5, E5>|Result<T6, E6>|Result<T7, E7>|Result<RecoveryT, RecoveryE>>;

export function pipeline<
  T0,
  T1,
  T2,
  T3,
  T4,
  T5,
  T6,
  T7,
  T8,
  E0,
  E1,
  E2,
  E3,
  E4,
  E5,
  E6,
  E7,
  E8,
>(
  fns: [
    () => MaybePromise<Result<T0, E0>>,
    (input: T0) => MaybePromise<Result<T1, E1>>,
    (input: T1) => MaybePromise<Result<T2, E2>>,
    (input: T2) => MaybePromise<Result<T3, E3>>,
    (input: T3) => MaybePromise<Result<T4, E4>>,
    (input: T4) => MaybePromise<Result<T5, E5>>,
    (input: T5) => MaybePromise<Result<T6, E6>>,
    (input: T6) => MaybePromise<Result<T7, E7>>,
    (input: T7) => MaybePromise<Result<T8, E8>>,
  ],
): <RecoveryT = never, RecoveryE = never>(
  recovery?: (
    error: ResultFailure<T0, E0>|ResultFailure<T1, E1>|ResultFailure<T2, E2>|ResultFailure<T3, E3>|ResultFailure<T4, E4>|ResultFailure<T5, E5>|ResultFailure<T6, E6>|ResultFailure<T7, E7>|ResultFailure<T8, E8>,
  ) => MaybePromise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<T5, E5>|Result<T6, E6>|Result<T7, E7>|Result<T8, E8>|Result<RecoveryT, RecoveryE>>,
) => Promise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<T5, E5>|Result<T6, E6>|Result<T7, E7>|Result<T8, E8>|Result<RecoveryT, RecoveryE>>;

export function pipeline<
  T0,
  T1,
  T2,
  T3,
  T4,
  T5,
  T6,
  T7,
  T8,
  T9,
  E0,
  E1,
  E2,
  E3,
  E4,
  E5,
  E6,
  E7,
  E8,
  E9,
>(
  fns: [
    () => MaybePromise<Result<T0, E0>>,
    (input: T0) => MaybePromise<Result<T1, E1>>,
    (input: T1) => MaybePromise<Result<T2, E2>>,
    (input: T2) => MaybePromise<Result<T3, E3>>,
    (input: T3) => MaybePromise<Result<T4, E4>>,
    (input: T4) => MaybePromise<Result<T5, E5>>,
    (input: T5) => MaybePromise<Result<T6, E6>>,
    (input: T6) => MaybePromise<Result<T7, E7>>,
    (input: T7) => MaybePromise<Result<T8, E8>>,
    (input: T8) => MaybePromise<Result<T9, E9>>,
  ],
): <RecoveryT = never, RecoveryE = never>(
  recovery?: (
    error: ResultFailure<T0, E0>|ResultFailure<T1, E1>|ResultFailure<T2, E2>|ResultFailure<T3, E3>|ResultFailure<T4, E4>|ResultFailure<T5, E5>|ResultFailure<T6, E6>|ResultFailure<T7, E7>|ResultFailure<T8, E8>|ResultFailure<T9, E9>,
  ) => MaybePromise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<T5, E5>|Result<T6, E6>|Result<T7, E7>|Result<T8, E8>|Result<T9, E9>|Result<RecoveryT, RecoveryE>>,
) => Promise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<T5, E5>|Result<T6, E6>|Result<T7, E7>|Result<T8, E8>|Result<T9, E9>|Result<RecoveryT, RecoveryE>>;

export function pipeline<
  T0,
  T1,
  T2,
  T3,
  T4,
  T5,
  T6,
  T7,
  T8,
  T9,
  T10,
  E0,
  E1,
  E2,
  E3,
  E4,
  E5,
  E6,
  E7,
  E8,
  E9,
  E10,
>(
  fns: [
    () => MaybePromise<Result<T0, E0>>,
    (input: T0) => MaybePromise<Result<T1, E1>>,
    (input: T1) => MaybePromise<Result<T2, E2>>,
    (input: T2) => MaybePromise<Result<T3, E3>>,
    (input: T3) => MaybePromise<Result<T4, E4>>,
    (input: T4) => MaybePromise<Result<T5, E5>>,
    (input: T5) => MaybePromise<Result<T6, E6>>,
    (input: T6) => MaybePromise<Result<T7, E7>>,
    (input: T7) => MaybePromise<Result<T8, E8>>,
    (input: T8) => MaybePromise<Result<T9, E9>>,
    (input: T9) => MaybePromise<Result<T10, E10>>,
  ],
): <RecoveryT = never, RecoveryE = never>(
  recovery?: (
    error: ResultFailure<T0, E0>|ResultFailure<T1, E1>|ResultFailure<T2, E2>|ResultFailure<T3, E3>|ResultFailure<T4, E4>|ResultFailure<T5, E5>|ResultFailure<T6, E6>|ResultFailure<T7, E7>|ResultFailure<T8, E8>|ResultFailure<T9, E9>|ResultFailure<T10, E10>,
  ) => MaybePromise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<T5, E5>|Result<T6, E6>|Result<T7, E7>|Result<T8, E8>|Result<T9, E9>|Result<T10, E10>|Result<RecoveryT, RecoveryE>>,
) => Promise<Result<T0, E0>|Result<T1, E1>|Result<T2, E2>|Result<T3, E3>|Result<T4, E4>|Result<T5, E5>|Result<T6, E6>|Result<T7, E7>|Result<T8, E8>|Result<T9, E9>|Result<T10, E10>|Result<RecoveryT, RecoveryE>>;

export function pipeline<T, E>(
  fns: Array<(input?: any) => Result<T, E> | Promise<Result<T, E>>>,
): <RecoveryT = never, RecoveryE = never>(
  recovery?: (error: ResultFailure<T, E>) => MaybePromise<Result<T, E>|Result<RecoveryT, RecoveryE>>,
) => Promise<Result<T, E>|Result<RecoveryT, RecoveryE>> {
  return async <RecoveryT = never, RecoveryE = never>(
    recovery?: (error: ResultFailure<T, E>) => MaybePromise<Result<T, E>|Result<RecoveryT, RecoveryE>>,
  ): Promise<Result<T, E>|Result<RecoveryT, RecoveryE>> => {
    let result: Result<T, E> | undefined;

    if (fns.length === 0) {
      return success(null as any); // Return a success with null value for empty pipeline
    }

    for (const fn of fns) {
      const res = await fn(result?.value);
      if (res.isSuccess) {
        result = res;
      } else {
        if (recovery) {
          return recovery(res);
        }
        return res; // Return the first failure
      }
    }

    return result as Result<T, E>;
  };
}
