import { failure, pipeline, type Result, success } from "./lib.ts";
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
    (error): Result<number, "E7">|Result<string, "E8">|Result<boolean, "Recovered"> => {
        if(error.error === "E8") {
            return failure(error.value, "E8");
        }
        return failure<boolean, "Recovered">(false, "Recovered");
        
    }
  );

  assertEquals(result, failure<boolean, "Recovered">(false, "Recovered"));
});
