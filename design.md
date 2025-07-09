# Pipeline Function Design

- Pipeline functions are designed to connect multiple functions and process data
  sequentially.
- Each function receives an input and returns an output.
- By incorporating error handling, proper processing can be performed even if an
  error occurs midway.
- **Pipeline functions are defined to accept n arguments.**
- Each function clearly defines input and output types to ensure type safety.
- Pipeline functions work by passing the output of each function as input to the
  next function.
- Pipeline functions can handle multiple types
- The return value from a pipeline function must be of type `Result<T, F>`.
- Functions can return Promises to handle asynchronous operations.
- We don't separate pipeline functions for synchronous and asynchronous use.
- The return value from a pipeline function must be of type `Result<T, F>`,
  where T is the type of the output of the last function passed to the pipeline,
  or the return type of the passed function.
- The return value from a pipeline function is of type `Result<T, F>`, where F
  is the union of error types from the functions passed to the pipeline.

# Rules

- Utilize generics to ensure type safety
- The pipeline function can use any type internally, but must provide type-safe
  access externally.
