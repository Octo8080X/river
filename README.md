# River

A type-safe TypeScript pipeline library that provides composable function chains with built-in error handling and recovery mechanisms.

Like a river flowing through different landscapes, River allows your data to flow through a series of transformations, handling obstacles (errors) gracefully along the way.

## Features

- **Type-safe**: Full TypeScript support with proper type inference
- **Function definition**: `define` function for enhanced type safety and clearer function signatures
- **Error handling**: Built-in error propagation and recovery
- **System error handling**: Automatic exception catching with error capture
- **Async support**: Seamless mixing of synchronous and asynchronous functions
- **Composable**: Chain up to 10 functions in a single pipeline
- **Zero dependencies**: Lightweight and self-contained

## Installation

```ts
// Using Deno
import { pipeline, success, failure, isFailure, define, type Result } from "./mod.ts";
```

**Note**: The `SYSTEM_ERROR` type is automatically handled by the library and doesn't need to be explicitly imported.

## Quick Start

```typescript
import { pipeline, success, failure, define, type Result } from "./mod.ts";

// Define transformation functions that return Result types
const parseNumber = define<string, number, "PARSE_ERROR">((input: string): Result<number, "PARSE_ERROR"> => {
  const num = parseInt(input);
  return isNaN(num) ? failure(0, "PARSE_ERROR") : success(num); // Fixed: use 0 for failed value
});

const multiplyByTwo = define<number, number, "MULTIPLY_ERROR">((input: number): Result<number, "MULTIPLY_ERROR"> => {
  return success(input * 2);
});

const formatResult = define<number, string, "FORMAT_ERROR">((input: number): Result<string, "FORMAT_ERROR"> => {
  return success(`Result: ${input}`);
});

// Create a River pipeline - data flows from one function to the next
const processNumber = pipeline([
  define<undefined, number, "PARSE_ERROR">(() => parseNumber("42")),  // Start the flow
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
  errorCapture?: string; // Optional error capture for system errors
}
```

#### `SYSTEM_ERROR`

A special error type used for system-level errors such as uncaught exceptions.

```typescript
type SYSTEM_ERROR = "SYSTEM_ERROR";
```

### Functions

#### `success<T>(value: T): Result<T, never>`

Creates a successful result containing the given value.

```typescript
import { success } from "./mod.ts";

const result = success(42);
// { isSuccess: true, value: 42 }
```

#### `failure<T, E>(value: T, error: E, errorCapture?: string): Result<T, E>`

Creates a failed result with the given value and error. For system errors, the error capture will contain the actual Error object.

```typescript
import { failure } from "./mod.ts";

const result = failure("invalid input", "VALIDATION_ERROR");
// { isSuccess: false, value: "invalid input", error: "VALIDATION_ERROR" }

// System errors automatically capture the Error object
// When exceptions are thrown, errorCapture contains the Error instance
```

#### `isFailure<T, E>(result: Result<T, E>): result is ResultFailure<T, E>`

Type guard to check if a result is a failure.

```typescript
import { failure, isFailure } from "./mod.ts";

const result = failure(0, "ERROR");
if (isFailure(result)) {
  console.log(result.error); // "ERROR"
}
```

#### `define<I, T, E>(func: Function): Function`

Creates a type-safe function wrapper that enforces proper input/output types for pipeline functions. This function provides better type safety and clearer function signatures.

**Overloads:**
- For functions with no input: `define<undefined, T, E>(func: () => Result<T, E>): () => Result<T, E>`
- For functions with input: `define<I, T, E>(func: (input: I) => Result<T, E>): (input: I) => Result<T, E>`

```typescript
import { define, success, pipeline, type Result } from "./mod.ts";

// Define a type-safe transformation function
const addOne = define<number, number, "ADD_ERROR">((x: number): Result<number, "ADD_ERROR"> => {
  return success(x + 1);
});

// Define a source function (no input)
const createNumber = define<undefined, number, never>(() => success(42));

// Use in pipeline
const result = await pipeline([
  createNumber,
  addOne
])();
```

#### `pipeline(functions: Array<Function>): PipelineFunction`

Creates a River pipeline from an array of functions. Like a river flowing through different landscapes, data flows from one function to the next, with each function transforming the data along the way.

**Function Signatures:**
- First function (source): `() => Result<T, E> | Promise<Result<T, E>>`
- Subsequent functions (transforms): `(input: T) => Result<U, E> | Promise<Result<U, E>>`

**Returns:** A pipeline function that executes the data flow and optionally accepts a recovery function for error handling.

```typescript
import { pipeline, success, define } from "./mod.ts";

const dataFlow = pipeline([
  define<undefined, number, never>(() => success(1)),                    // Source: start the flow
  define<number, number, never>((x: number) => success(x * 2)),       // Transform: multiply
  define<number, string, never>((x: number) => success(x.toString())) // Transform: convert to string
]);

const result = await dataFlow();
// { isSuccess: true, value: "2" }
```

## Usage Examples

### Basic Data Flow

```typescript
import { pipeline, success, define, type Result } from "./mod.ts";

const addOne = define<number, number, "ADD_ERROR">((x: number): Result<number, "ADD_ERROR"> => success(x + 1));
const multiply = define<number, number, "MULTIPLY_ERROR">((x: number): Result<number, "MULTIPLY_ERROR"> => success(x * 2));
const toString = define<number, string, "STRING_ERROR">((x: number): Result<string, "STRING_ERROR"> => success(x.toString()));

// Create a data flow: 5 → 6 → 12 → "12"
const dataFlow = pipeline([
  define<undefined, number, never>(() => success(5)),  // Start with 5
  addOne,           // Add 1: 5 → 6
  multiply,         // Multiply by 2: 6 → 12
  toString          // Convert to string: 12 → "12"
]);

const result = await dataFlow();
console.log(result); // { isSuccess: true, value: "12" }
```

### Error Handling

```typescript
import { pipeline, success, failure, define, type Result } from "./mod.ts";

const divide = define<number, number, "DIVIDE_ERROR">((x: number): Result<number, "DIVIDE_ERROR"> => {
  if (x === 0) {
    return failure(x, "DIVIDE_ERROR");
  }
  return success(10 / x);
});

const toString = define<number, string, "STRING_ERROR">((x: number): Result<string, "STRING_ERROR"> => success(x.toString()));

const result = await pipeline([
  define<undefined, number, never>(() => success(0)),
  divide,
  toString
])();

console.log(result); // { isSuccess: false, value: 0, error: "DIVIDE_ERROR" }
```

### System Error Handling

River automatically catches runtime exceptions and converts them to `SYSTEM_ERROR` results with error capture information:

```typescript
import { pipeline, success, define, type Result } from "./mod.ts";

const riskyFunction = define<number, number, "RISKY_ERROR">((x: number): Result<number, "RISKY_ERROR"> => {
  if (x > 0) {
    throw new Error("Something went wrong!"); // Runtime exception
  }
  return success(x + 1);
});

const toString = define<number, string, "STRING_ERROR">((x: number): Result<string, "STRING_ERROR"> => success(x.toString()));

const result = await pipeline([
  define<undefined, number, never>(() => success(5)),
  riskyFunction,
  toString
])();

console.log(result);
// {
//   isSuccess: false,
//   value: 5,
//   error: "SYSTEM_ERROR",
//   errorCapture: Error { message: "Something went wrong!" } // Error object, not string
// }

// Access error details
if (!result.isSuccess && result.error === "SYSTEM_ERROR" && result.errorCapture instanceof Error) {
    console.log("Error message:", result.errorCapture.message);
    console.log("Stack trace:", result.errorCapture.stack);
}
```

### Recovery Functions

```typescript
import { pipeline, success, failure, define, type Result } from "./mod.ts";

const divide = define<number, number, "DIVIDE_ERROR">((x: number): Result<number, "DIVIDE_ERROR"> => {
  if (x === 0) {
    return failure(x, "DIVIDE_ERROR");
  }
  return success(10 / x);
});

const toString = define<number, string, "STRING_ERROR">((x: number): Result<string, "STRING_ERROR"> => success(x.toString()));

const result = await pipeline([
  define<undefined, number, never>(() => success(0)),
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
import { pipeline, success, define, type Result } from "./mod.ts";

const addOne = define<number, number, "ADD_ERROR">((x: number): Result<number, "ADD_ERROR"> => success(x + 1));

const asyncMultiply = define<number, number, "ASYNC_ERROR">(async (x: number): Promise<Result<number, "ASYNC_ERROR">> => {
  // Simulating async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  return success(x * 3);
});

const toString = define<number, string, "STRING_ERROR">((x: number): Result<string, "STRING_ERROR"> => success(x.toString()));

const result = await pipeline([
  define<undefined, number, never>(() => success(5)),
  addOne,           // sync function
  asyncMultiply,    // async function
  toString          // sync function
])();

console.log(result); // { isSuccess: true, value: "18" }
```

### Complex Data Types

```typescript
import { pipeline, success, define, type Result } from "./mod.ts";

interface User {
  id: number;
  name: string;
}

interface UserWithEmail {
  id: number;
  name: string;
  email: string;
}

const createUser = define<undefined, User, "CREATE_ERROR">((): Result<User, "CREATE_ERROR"> => {
  return success({ id: 1, name: "John" });
});

const addEmail = define<User, UserWithEmail, "EMAIL_ERROR">((user: User): Result<UserWithEmail, "EMAIL_ERROR"> => {
  return success({ ...user, email: "john@example.com" });
});

const serializeUser = define<UserWithEmail, string, "SERIALIZE_ERROR">((user: UserWithEmail): Result<string, "SERIALIZE_ERROR"> => {
  return success(JSON.stringify(user));
});

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
import { pipeline } from "./mod.ts";

const result = await pipeline([])();
console.log(result); // { isSuccess: true, value: null }
```

## Error Handling Patterns

River provides several patterns for handling errors in your data flow:

### 1. Fail Fast (Default Behavior)

By default, River stops the flow at the first error encountered:

```typescript
import { pipeline, success, failure, define } from "./mod.ts";

const result = await pipeline([
  define<undefined, number, never>(() => success(1)),
  define<number, number, "ERROR_1">((x) => failure(x, "ERROR_1")),    // Flow stops here
  define<number, number, never>((x) => success(x * 2)),           // This won't execute
])();
// { isSuccess: false, value: 1, error: "ERROR_1" }
```

### 2. Recovery with Fallback Values

Use recovery functions to handle errors and continue the flow:

```typescript
import { pipeline, success, failure, define } from "./mod.ts";

const result = await pipeline([
  define<undefined, number, never>(() => success(1)),
  define<number, number, "ERROR_1">((x) => failure(x, "ERROR_1")),    // Error occurs
  define<number, number, never>((x) => success(x * 2)),           // This executes with recovered value
])(
  (error) => success(999) // Recovery: provide fallback value
);
// { isSuccess: true, value: 1998 } // 999 * 2 (flow continues)
```

### 3. Error Transformation

Transform errors into different error types:

```typescript
import { pipeline, success, failure, define } from "./mod.ts";

const result = await pipeline([
  define<undefined, number, never>(() => success(1)),
  define<number, number, "NETWORK_ERROR">((x) => failure(x, "NETWORK_ERROR")),
])(
  (error) => failure("Service unavailable", "SERVICE_ERROR")
);
// { isSuccess: false, value: "Service unavailable", error: "SERVICE_ERROR" }
```

### 4. System Error Recovery

Handle runtime exceptions that are automatically converted to `SYSTEM_ERROR`:

```typescript
import { pipeline, success, failure, define } from "./mod.ts";

const result = await pipeline([
  define<undefined, number, never>(() => success(1)),
  define<number, number, never>((x) => {
    throw new Error("Unexpected error");
    return success(x);
  }),
  define<number, number, never>((x) => success(x * 2)),
])(
  (error) => {
    if (error.error === "SYSTEM_ERROR") {
      console.log("Caught system error:", error.errorCapture);
      return success(-1); // Fallback value
    }
    return failure(error.value, error.error);
  }
);
// { isSuccess: true, value: -1 } // -1 * 2 (flow continues after recovery)
```

## Type Safety

The library provides full type safety with proper type inference:

```typescript
import { pipeline, success, failure, define } from "./mod.ts";

// Types are automatically inferred
const pipeline1 = pipeline([
  define<undefined, number, never>(() => success(42)),        // Result<number, never>
  define<number, string, never>((x: number) => success(x.toString())), // Result<string, never>
]);
// pipeline1 returns: Promise<Result<string, never>>

// Error types are also tracked
const pipeline2 = pipeline([
  define<undefined, number, never>(() => success(42)),        // Result<number, never>
  define<number, number, "ERROR">((x: number) => failure(x, "ERROR" as const)), // Result<number, "ERROR">
]);
// pipeline2 returns: Promise<Result<number, "ERROR">>

// System errors are automatically handled
const pipeline3 = pipeline([
  define<undefined, number, never>(() => success(42)),
  define<number, number, never>((x: number) => {
    throw new Error("Runtime error"); // Automatically becomes SYSTEM_ERROR
    return success(x);
  }),
]);
// pipeline3 returns: Promise<Result<number, SYSTEM_ERROR>>
```

## Error Capture and Debugging

When runtime exceptions occur, River automatically captures the Error object for debugging:

```typescript
import { pipeline, success, define } from "./mod.ts";

const buggyPipeline = pipeline([
  define<undefined, string, never>(() => success("test")),
  define<string, string, never>((input: string) => {
    throw new Error(`Processing failed for: ${input}`);
    return success(input.toUpperCase());
  }),
]);

const result = await buggyPipeline();
if (!result.isSuccess && result.error === "SYSTEM_ERROR") {
  // errorCapture contains the actual Error object
  const error = result.errorCapture as Error;
  console.log("Error message:", error.message);
  // Output: "Error message: Processing failed for: test"
  console.log("Stack trace:", error.stack);
  console.log("Failed value:", result.value);
  // Output: "Failed value: test"
}
```

## Limitations

- Maximum of 10 functions per River pipeline (due to TypeScript tuple length limitations)
- All functions must return `Result<T, E>` or `Promise<Result<T, E>>` to maintain type safety
- Functions should be wrapped with `define` for optimal type safety and clarity
- Recovery functions receive the first error encountered and cannot inspect subsequent errors in the flow
- Runtime exceptions are automatically converted to `SYSTEM_ERROR` type with error capture information

## Testing

River includes comprehensive test coverage. Tests are located in the `tmp/` directory and demonstrate all library functionality.

```bash
# Run all tests
deno test --allow-all

# Run tests with coverage
deno test --allow-all --coverage

# Run specific test file
deno test tmp/quick_start.test.ts --allow-all
```

### Test Coverage

The test suite includes:
- ✅ Basic pipeline functionality (20 tests total)
- ✅ Error handling and propagation
- ✅ System error capture with Error objects
- ✅ Recovery function mechanisms
- ✅ Async/sync function mixing
- ✅ Type safety validation
- ✅ Complex data type transformations
- ✅ Edge cases (empty pipelines, etc.)

All tests pass and validate the library's behavior under various conditions.

## Contributing

Contributions are welcome! Please ensure all tests pass before submitting a pull request.

```bash
# Run tests
deno test --allow-all

# Run tests with coverage
deno test --allow-all --coverage
```

## License

MIT License
