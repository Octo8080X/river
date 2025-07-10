# River

A type-safe TypeScript pipeline library that provides composable function chains with built-in error handling and recovery mechanisms.

Like a river flowing through different landscapes, River allows your data to flow through a series of transformations, handling obstacles (errors) gracefully along the way.

## Features

- **Type-safe**: Full TypeScript support with proper type inference
- **Error handling**: Built-in error propagation and recovery
- **Async support**: Seamless mixing of synchronous and asynchronous functions
- **Composable**: Chain up to 10 functions in a single pipeline
- **Zero dependencies**: Lightweight and self-contained

## Installation

```bash
# Using Deno
import { pipeline, success, failure, isFailure, type Result } from "https://deno.land/x/river/mod.ts";
```

## Quick Start

```typescript
import { pipeline, success, failure, type Result } from "./mod.ts";

// Define transformation functions that return Result types
const parseNumber = (input: string): Result<number, "PARSE_ERROR"> => {
  const num = parseInt(input);
  return isNaN(num) ? failure(input, "PARSE_ERROR") : success(num);
};

const multiplyByTwo = (input: number): Result<number, "MULTIPLY_ERROR"> => {
  return success(input * 2);
};

const formatResult = (input: number): Result<string, "FORMAT_ERROR"> => {
  return success(`Result: ${input}`);
};

// Create a River pipeline - data flows from one function to the next
const processNumber = pipeline([
  () => parseNumber("42"),  // Start the flow
  multiplyByTwo,           // Transform the data
  formatResult             // Final transformation
]);

// Execute the pipeline
const result = await processNumber();
console.log(result); // { isSuccess: true, value: "Result: 84" }

// Handle errors gracefully with recovery
const resultWithRecovery = await processNumber(
  (error) => {
    console.log(`Recovered from ${error.error}`);
    return success("Default result");
  }
);
```

## API Reference

### Types

#### `Result<T, E>`

A discriminated union type representing either a successful result or a failure.

```typescript
type Result<T, E> = ResultSuccess<T> | ResultFailure<T, E>;

interface ResultSuccess<T> {
  isSuccess: true;
  value: T;
}

interface ResultFailure<T, E> {
  isSuccess: false;
  value: T;
  error: E;
}
```

### Functions

#### `success<T>(value: T): Result<T, never>`

Creates a successful result containing the given value.

```typescript
const result = success(42);
// { isSuccess: true, value: 42 }
```

#### `failure<T, E>(value: T, error: E): Result<T, E>`

Creates a failed result with the given value and error.

```typescript
const result = failure("invalid input", "VALIDATION_ERROR");
// { isSuccess: false, value: "invalid input", error: "VALIDATION_ERROR" }
```

#### `isFailure<T, E>(result: Result<T, E>): result is ResultFailure<T, E>`

Type guard to check if a result is a failure.

```typescript
const result = failure(0, "ERROR");
if (isFailure(result)) {
  console.log(result.error); // "ERROR"
}
```

#### `pipeline(functions: Array<Function>): PipelineFunction`

Creates a River pipeline from an array of functions. Like a river flowing through different landscapes, data flows from one function to the next, with each function transforming the data along the way.

**Function Signatures:**
- First function (source): `() => Result<T, E> | Promise<Result<T, E>>`
- Subsequent functions (transforms): `(input: T) => Result<U, E> | Promise<Result<U, E>>`

**Returns:** A pipeline function that executes the data flow and optionally accepts a recovery function for error handling.

```typescript
const dataFlow = pipeline([
  () => success(1),                    // Source: start the flow
  (x: number) => success(x * 2),       // Transform: multiply
  (x: number) => success(x.toString()) // Transform: convert to string
]);

const result = await dataFlow();
// { isSuccess: true, value: "2" }
```

## Usage Examples

### Basic Data Flow

```typescript
import { pipeline, success, failure, type Result } from "./mod.ts";

const addOne = (x: number): Result<number, "ADD_ERROR"> => success(x + 1);
const multiply = (x: number): Result<number, "MULTIPLY_ERROR"> => success(x * 2);
const toString = (x: number): Result<string, "STRING_ERROR"> => success(x.toString());

// Create a data flow: 5 → 6 → 12 → "12"
const dataFlow = pipeline([
  () => success(5),  // Start with 5
  addOne,           // Add 1: 5 → 6
  multiply,         // Multiply by 2: 6 → 12
  toString          // Convert to string: 12 → "12"
]);

const result = await dataFlow();
console.log(result); // { isSuccess: true, value: "12" }
```

### Error Handling

```typescript
const divide = (x: number): Result<number, "DIVIDE_ERROR"> => {
  if (x === 0) {
    return failure(x, "DIVIDE_ERROR");
  }
  return success(10 / x);
};

const result = await pipeline([
  () => success(0),
  divide,
  toString
])();

console.log(result); // { isSuccess: false, value: 0, error: "DIVIDE_ERROR" }
```

### Recovery Functions

```typescript
const result = await pipeline([
  () => success(0),
  divide,
  toString
])(
  // Recovery function
  (error) => {
    if (error.error === "DIVIDE_ERROR") {
      return success("Division by zero handled");
    }
    return failure(error.value, error.error);
  }
);

console.log(result); // { isSuccess: true, value: "Division by zero handled" }
```

### Mixing Sync and Async Functions

```typescript
import { delay } from "@std/async";

const asyncMultiply = async (x: number): Promise<Result<number, "ASYNC_ERROR">> => {
  await delay(100);
  return success(x * 3);
};

const result = await pipeline([
  () => success(5),
  addOne,           // sync function
  asyncMultiply,    // async function
  toString          // sync function
])();

console.log(result); // { isSuccess: true, value: "18" }
```

### Complex Data Types

```typescript
interface User {
  id: number;
  name: string;
}

interface UserWithEmail {
  id: number;
  name: string;
  email: string;
}

const createUser = (): Result<User, "CREATE_ERROR"> => {
  return success({ id: 1, name: "John" });
};

const addEmail = (user: User): Result<UserWithEmail, "EMAIL_ERROR"> => {
  return success({ ...user, email: "john@example.com" });
};

const serializeUser = (user: UserWithEmail): Result<string, "SERIALIZE_ERROR"> => {
  return success(JSON.stringify(user));
};

const result = await pipeline([
  createUser,
  addEmail,
  serializeUser
])();

console.log(result); 
// { isSuccess: true, value: '{"id":1,"name":"John","email":"john@example.com"}' }
```

### Empty Pipeline

```typescript
const result = await pipeline([])();
console.log(result); // { isSuccess: true, value: null }
```

## Error Handling Patterns

River provides several patterns for handling errors in your data flow:

### 1. Fail Fast (Default Behavior)

By default, River stops the flow at the first error encountered:

```typescript
const result = await pipeline([
  () => success(1),
  (x) => failure(x, "ERROR_1"),    // Flow stops here
  (x) => success(x * 2),           // This won't execute
])();
// { isSuccess: false, value: 1, error: "ERROR_1" }
```

### 2. Recovery with Fallback Values

Use recovery functions to handle errors and continue the flow:

```typescript
const result = await pipeline([
  () => success(1),
  (x) => failure(x, "ERROR_1"),    // Error occurs
  (x) => success(x * 2),           // This executes with recovered value
])(
  (error) => success(999) // Recovery: provide fallback value
);
// { isSuccess: true, value: 1998 } // 999 * 2 (flow continues)
```

### 3. Error Transformation

Transform errors into different error types:

```typescript
const result = await pipeline([
  () => success(1),
  (x) => failure(x, "NETWORK_ERROR"),
])(
  (error) => failure("Service unavailable", "SERVICE_ERROR")
);
// { isSuccess: false, value: "Service unavailable", error: "SERVICE_ERROR" }
```

## Type Safety

The library provides full type safety with proper type inference:

```typescript
// Types are automatically inferred
const pipeline1 = pipeline([
  () => success(42),        // Result<number, never>
  (x: number) => success(x.toString()), // Result<string, never>
]);
// pipeline1 returns: Promise<Result<string, never>>

// Error types are also tracked
const pipeline2 = pipeline([
  () => success(42),        // Result<number, never>
  (x: number) => failure(x, "ERROR" as const), // Result<number, "ERROR">
]);
// pipeline2 returns: Promise<Result<number, "ERROR">>
```

## Limitations

- Maximum of 10 functions per River pipeline (due to TypeScript tuple length limitations)
- All functions must return `Result<T, E>` or `Promise<Result<T, E>>` to maintain type safety
- Recovery functions receive the first error encountered and cannot inspect subsequent errors in the flow

## Contributing

Contributions are welcome! Please ensure all tests pass before submitting a pull request.

```bash
# Run tests
deno test

# Run tests with coverage
deno test --coverage
```

## License

MIT License
