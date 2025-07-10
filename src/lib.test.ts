import { failure, pipeline, type Result, success, isFailure } from "./lib.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async";

Deno.test("pipeline with synchronous functions", async () => {
  const fn1 = (): Result<number, "E1"> => success(1);
  const fn2 = (): Result<number, "E2"> => failure(2, "E2");
  const fn3 = (): Result<number, "E3"> => success(3);

  const result = await pipeline([fn1, fn2, fn3])();
  assertEquals(result, failure(2, "E2"));
});

Deno.test("pipeline with mixed synchronous and asynchronous functions", async () => {
  const fn4 = (): Result<number, "E4"> => success(1);
  const fn5 = async (): Promise<Result<number, "E5">> => {
    await delay(1000); // Simulate async operation
    return success(2);
  };
  const fn6 = (input: number): Result<string, "E6"> => success(input + "3");

  const result = await pipeline([fn4, fn5, fn6])();
  assertEquals(result, success("23"));
});

Deno.test("pipeline with empty function array", async () => {
  const result = await pipeline([])();
  assertEquals(result, success(null as any)); // Expect success with null value for empty pipeline
});

Deno.test("pipeline with recovery function", async () => {
  const fn7 = (): Result<number, "E7"> => failure(1, "E7");
  const fn8 = (input: number): Result<string, "E8"> => success(input + "2");

  const p = pipeline([fn7, fn8]);
  const result = await p(
    (error) => {
      if (error.error === "E8") {
        return failure(error.value, "E8");
      }
      return failure<false, "Recovered">(false, "Recovered");
    }
  );

  assertEquals(result, failure<false, "Recovered">(false, "Recovered"));
});

Deno.test("pipeline with recovery function that recovers", async () => {
  const fn1 = (): Result<number, "E1"> => success(1);
  const fn2 = (input: number): Result<number, "E2"> => failure(input + 100, "E2");
  const fn3 = (input: number): Result<string, "E3"> => success(input.toString());

  const result = await pipeline([fn1, fn2, fn3])(
    (error) => {
      if (error.error === "E2") {
        return success(999); // Recover with a different value
      }
      return failure(error.value, error.error);
    }
  );

  assertEquals(result, success(999));
});

Deno.test("success helper function", () => {
  const result = success(42);
  assertEquals(result.isSuccess, true);
  assertEquals(result.value, 42);
});

Deno.test("failure helper function", () => {
  const result = failure("error_value", "ERROR_TYPE");
  assertEquals(result.isSuccess, false);
  assertEquals(result.value, "error_value");
  if (isFailure(result)) {
    assertEquals(result.error, "ERROR_TYPE");
  }
});

Deno.test("isFailure utility function", () => {
  const successResult = success(42);
  const failureResult = failure("error_value", "ERROR_TYPE");

  assertEquals(isFailure(successResult), false);
  assertEquals(isFailure(failureResult), true);
});

Deno.test("pipeline with all successful functions", async () => {
  const fn1 = (): Result<number, "E1"> => success(1);
  const fn2 = (input: number): Result<number, "E2"> => success(input + 1);
  const fn3 = (input: number): Result<string, "E3"> => success(input.toString());

  const result = await pipeline([fn1, fn2, fn3])();
  assertEquals(result, success("2"));
});

Deno.test("pipeline with error in first function", async () => {
  const fn1 = (): Result<number, "E1"> => failure(0, "E1");
  const fn2 = (input: number): Result<number, "E2"> => success(input + 1);
  const fn3 = (input: number): Result<string, "E3"> => success(input.toString());

  const result = await pipeline([fn1, fn2, fn3])();
  assertEquals(result.isSuccess, false);
  // Cast to access error properties for testing
  const errorResult = result as any;
  assertEquals(errorResult.value, 0);
  assertEquals(errorResult.error, "E1");
});

Deno.test("pipeline with error in middle function", async () => {
  const fn1 = (): Result<number, "E1"> => success(1);
  const fn2 = (input: number): Result<number, "E2"> => failure(input + 100, "E2");
  const fn3 = (input: number): Result<string, "E3"> => success(input.toString());

  const result = await pipeline([fn1, fn2, fn3])();
  assertEquals(result.isSuccess, false);
  const errorResult = result as any;
  assertEquals(errorResult.value, 101);
  assertEquals(errorResult.error, "E2");
});

Deno.test("pipeline with single function", async () => {
  const fn1 = (): Result<string, "E1"> => success("single");

  const result = await pipeline([fn1])();
  assertEquals(result, success("single"));
});

Deno.test("pipeline with async function that fails", async () => {
  const fn1 = (): Result<number, "E1"> => success(1);
  const fn2 = async (input: number): Promise<Result<number, "E2">> => {
    await delay(100);
    return failure(input + 100, "E2");
  };
  const fn3 = (input: number): Result<string, "E3"> => success(input.toString());

  const result = await pipeline([fn1, fn2, fn3])();
  assertEquals(result.isSuccess, false);
  const errorResult = result as any;
  assertEquals(errorResult.value, 101);
  assertEquals(errorResult.error, "E2");
});

Deno.test("pipeline with complex data types", async () => {
  const fn1 = (): Result<{ id: number; name: string }, "E1"> => success({ id: 1, name: "test" });
  const fn2 = (input: { id: number; name: string }): Result<{ id: number; name: string; processed: boolean }, "E2"> => 
    success({ ...input, processed: true });
  const fn3 = (input: { id: number; name: string; processed: boolean }): Result<string, "E3"> => 
    success(JSON.stringify(input));

  const result = await pipeline([fn1, fn2, fn3])();
  assertEquals(result, success(JSON.stringify({ id: 1, name: "test", processed: true })));
});

Deno.test("pipeline with multiple async functions", async () => {
  const fn1 = async (): Promise<Result<number, "E1">> => {
    await delay(50);
    return success(10);
  };
  const fn2 = async (input: number): Promise<Result<number, "E2">> => {
    await delay(50);
    return success(input * 2);
  };
  const fn3 = async (input: number): Promise<Result<string, "E3">> => {
    await delay(50);
    return success(`Result: ${input}`);
  };

  const result = await pipeline([fn1, fn2, fn3])();
  assertEquals(result, success("Result: 20"));
});

Deno.test("pipeline with recovery function for different error types", async () => {
  const fn1 = (): Result<number, "E1"> => success(1);
  const fn2 = (input: number): Result<number, "E2"> => failure(input + 100, "E2");
  const fn3 = (input: number): Result<string, "E3"> => success(input.toString());

  const result = await pipeline([fn1, fn2, fn3])(
    (error) => {
      if (error.error === "E2") {
        return success(500); // Recover with default value
      }
      if (error.error === "E3") {
        return success("fallback");
      }
      return failure(error.value, error.error);
    }
  );

  assertEquals(result, success(500));
});

Deno.test("pipeline with function handling undefined/null input", async () => {
  const fn1 = (): Result<null, "E1"> => success(null);
  const fn2 = (input: null): Result<string, "E2"> => 
    input === null ? success("null processed") : failure("not null", "E2");
  const fn3 = (input: string): Result<string, "E3"> => success(input.toUpperCase());

  const result = await pipeline([fn1, fn2, fn3])();
  assertEquals(result, success("NULL PROCESSED"));
});

Deno.test("pipeline with long chain of functions", async () => {
  const fn1 = (): Result<number, "E1"> => success(1);
  const fn2 = (input: number): Result<number, "E2"> => success(input + 1);
  const fn3 = (input: number): Result<number, "E3"> => success(input * 2);
  const fn4 = (input: number): Result<number, "E4"> => success(input + 10);
  const fn5 = (input: number): Result<string, "E5"> => success(input.toString());

  const result = await pipeline([fn1, fn2, fn3, fn4, fn5])();
  assertEquals(result, success("14")); // ((1 + 1) * 2) + 10 = 14
});
