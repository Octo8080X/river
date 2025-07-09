interface ResultSuccess<T> {
  isSuccess: true;
  value: T;
}
interface ResultFailure<T, F> {
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

/**
 * Pipeline function overloads
 * 
 * These overloads provide type-safety for pipelines with different numbers of functions.
 * Each overload handles a specific number of functions (from 0 to 10) and properly
 * tracks the type transformations and error union types through the pipeline.
 */

// Case with 0 functions
export function pipeline(): <T, E>() => Result<T, E>;

export function pipeline<A, E1>(
  fn1: () => Result<A, E1>,
): (
  errorHandler?: (res: ResultFailure<any, E1>) => Result<A, E1>,
) => Result<A, E1>;

export function pipeline<A, B, E1, E2>(
  fn1: () => Result<A, E1>,
  fn2: (a: A) => Result<B, E2>,
): (
  errorHandler?: (res: ResultFailure<any, E1 | E2>) => Result<B, E1 | E2>,
) => Result<B, E1 | E2>;

export function pipeline<A, B, C, E1, E2, E3>(
  fn1: () => Result<A, E1>,
  fn2: (a: A) => Result<B, E2>,
  fn3: (b: B) => Result<C, E3>,
): (
  errorHandler?: (
    res: ResultFailure<any, E1 | E2 | E3>,
  ) => Result<C, E1 | E2 | E3>,
) => Result<C, E1 | E2 | E3>;

export function pipeline<A, B, C, D, E1, E2, E3, E4>(
  fn1: () => Result<A, E1>,
  fn2: (a: A) => Result<B, E2>,
  fn3: (b: B) => Result<C, E3>,
  fn4: (c: C) => Result<D, E4>,
): (
  errorHandler?: (
    res: ResultFailure<any, E1 | E2 | E3 | E4>,
  ) => Result<D, E1 | E2 | E3 | E4>,
) => Result<D, E1 | E2 | E3 | E4>;

export function pipeline<A, B, C, D, E, E1, E2, E3, E4, E5>(
  fn1: () => Result<A, E1>,
  fn2: (a: A) => Result<B, E2>,
  fn3: (b: B) => Result<C, E3>,
  fn4: (c: C) => Result<D, E4>,
  fn5: (d: D) => Result<E, E5>,
): (
  errorHandler?: (
    res: ResultFailure<any, E1 | E2 | E3 | E4 | E5>,
  ) => Result<E, E1 | E2 | E3 | E4 | E5>,
) => Result<E, E1 | E2 | E3 | E4 | E5>;

export function pipeline<A, B, C, D, E, F, E1, E2, E3, E4, E5, E6>(
  fn1: () => Result<A, E1>,
  fn2: (a: A) => Result<B, E2>,
  fn3: (b: B) => Result<C, E3>,
  fn4: (c: C) => Result<D, E4>,
  fn5: (d: D) => Result<E, E5>,
  fn6: (e: E) => Result<F, E6>,
): (
  errorHandler?: (
    res: ResultFailure<any, E1 | E2 | E3 | E4 | E5 | E6>,
  ) => Result<F, E1 | E2 | E3 | E4 | E5 | E6>,
) => Result<F, E1 | E2 | E3 | E4 | E5 | E6>;

export function pipeline<A, B, C, D, E, F, G, E1, E2, E3, E4, E5, E6, E7>(
  fn1: () => Result<A, E1>,
  fn2: (a: A) => Result<B, E2>,
  fn3: (b: B) => Result<C, E3>,
  fn4: (c: C) => Result<D, E4>,
  fn5: (d: D) => Result<E, E5>,
  fn6: (e: E) => Result<F, E6>,
  fn7: (f: F) => Result<G, E7>,
): (
  errorHandler?: (
    res: ResultFailure<any, E1 | E2 | E3 | E4 | E5 | E6 | E7>,
  ) => Result<G, E1 | E2 | E3 | E4 | E5 | E6 | E7>,
) => Result<G, E1 | E2 | E3 | E4 | E5 | E6 | E7>;

export function pipeline<
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  E1,
  E2,
  E3,
  E4,
  E5,
  E6,
  E7,
  E8,
>(
  fn1: () => Result<A, E1>,
  fn2: (a: A) => Result<B, E2>,
  fn3: (b: B) => Result<C, E3>,
  fn4: (c: C) => Result<D, E4>,
  fn5: (d: D) => Result<E, E5>,
  fn6: (e: E) => Result<F, E6>,
  fn7: (f: F) => Result<G, E7>,
  fn8: (g: G) => Result<H, E8>,
): (
  errorHandler?: (
    res: ResultFailure<any, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8>,
  ) => Result<H, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8>,
) => Result<H, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8>;

export function pipeline<
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
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
  fn1: () => Result<A, E1>,
  fn2: (a: A) => Result<B, E2>,
  fn3: (b: B) => Result<C, E3>,
  fn4: (c: C) => Result<D, E4>,
  fn5: (d: D) => Result<E, E5>,
  fn6: (e: E) => Result<F, E6>,
  fn7: (f: F) => Result<G, E7>,
  fn8: (g: G) => Result<H, E8>,
  fn9: (h: H) => Result<I, E9>,
): (
  errorHandler?: (
    res: ResultFailure<any, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9>,
  ) => Result<I, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9>,
) => Result<I, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9>;

export function pipeline<
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
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
  fn1: () => Result<A, E1>,
  fn2: (a: A) => Result<B, E2>,
  fn3: (b: B) => Result<C, E3>,
  fn4: (c: C) => Result<D, E4>,
  fn5: (d: D) => Result<E, E5>,
  fn6: (e: E) => Result<F, E6>,
  fn7: (f: F) => Result<G, E7>,
  fn8: (g: G) => Result<H, E8>,
  fn9: (h: H) => Result<I, E9>,
  fn10: (i: I) => Result<J, E10>,
): (
  errorHandler?: (
    res: ResultFailure<any, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10>,
  ) => Result<J, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10>,
) => Result<J, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10>;

// Pipeline function implementation: Connects multiple functions to process data sequentially
export function pipeline(...fns: Array<(arg?: any) => Result<any, any>>): any {
  // Actual implementation
  return (
    errorHandler?: (res: ResultFailure<any, any>) => Result<any, any>,
  ): Result<any, any> => {
    if (fns.length === 0) {
      return success(undefined);
    }

    // Execute the first function
    const first = fns[0];
    const currentResult = first();

    // Handle asynchronous case
    if (currentResult instanceof Promise) {
      return handleAsyncPipeline(fns, errorHandler) as any;
    }

    // Synchronous processing
    if (!currentResult.isSuccess) {
      return handleError(currentResult, errorHandler);
    }

    // Execute the remaining functions in sequence
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

// Helper function for error handling
function handleError<T, E>(
  result: ResultFailure<T, E>,
  errorHandler?: (res: ResultFailure<any, E>) => Result<any, any>,
): Result<any, E> {
  if (errorHandler) {
    return errorHandler(result);
  }
  return failure(result.value, result.error);
}

// Handling asynchronous pipeline
async function handleAsyncPipeline(
  fns: Array<(arg?: any) => Result<any, any> | Promise<Result<any, any>>>,
  errorHandler?: (
    res: ResultFailure<any, any>,
  ) => Result<any, any> | Promise<Result<any, any>>,
): Promise<Result<any, any>> {
  try {
    // Execute the first function
    const first = fns[0];
    const currentResult = await first();

    if (!currentResult.isSuccess) {
      return errorHandler
        ? await Promise.resolve(errorHandler(currentResult))
        : failure(currentResult.value, currentResult.error);
    }

    // Execute the remaining functions in sequence
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
    // Handle unexpected errors
    return failure(null, error as any);
  }
}
