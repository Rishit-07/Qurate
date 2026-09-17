/**
 * Concept: JavaScript — async/await
 * 
 * Async/Await allows asynchronous, promise-based behavior to be written cleanly
 * without explicitly chaining promises.
 * 
 * Best Practices:
 * 1. Always encapsulate with `try...catch...finally` for deterministic error handling and cleanup.
 * 2. Parallelize independent asynchronous tasks using `Promise.all` or `Promise.allSettled` to avoid waterfalls.
 * 3. Provide resilient retry strategies for network operations.
 */

/**
 * 1. Safe async wrapper with error handling and fallback value
 */
export async function safeAsync(promiseOrAsyncFn, fallbackValue = null) {
  try {
    const fn = typeof promiseOrAsyncFn === 'function' ? promiseOrAsyncFn() : promiseOrAsyncFn
    const data = await fn
    return { data, error: null, success: true }
  } catch (error) {
    return { data: fallbackValue, error, success: false }
  }
}

/**
 * 2. Parallel Execution Wrapper using Promise.allSettled
 * Executes multiple async tasks concurrently without failing if a single task rejects.
 */
export async function fetchParallelSettled(taskMap) {
  const keys = Object.keys(taskMap)
  const promises = Object.values(taskMap).map((task) =>
    typeof task === 'function' ? task() : task
  )

  const results = await Promise.allSettled(promises)
  const output = {}

  keys.forEach((key, index) => {
    const result = results[index]
    if (result.status === 'fulfilled') {
      output[key] = { status: 'success', data: result.value }
    } else {
      output[key] = { status: 'error', error: result.reason?.message || 'Failed' }
    }
  })

  return output
}

/**
 * 3. Retry Async Operation with Exponential Backoff
 */
export async function retryWithBackoff(asyncFn, maxRetries = 3, initialDelayMs = 150) {
  let attempt = 0
  let delay = initialDelayMs

  while (attempt < maxRetries) {
    try {
      return await asyncFn()
    } catch (error) {
      attempt++
      if (attempt >= maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} attempts: ${error.message}`)
      }
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }
}

/**
 * 4. Demonstration of Sequential vs Parallel async/await performance
 */
export async function runAsyncAwaitBenchmark() {
  const mockTask = (ms) => new Promise((resolve) => setTimeout(() => resolve(`done-${ms}ms`), ms))

  // A. Sequential: Await one after the other (waterfall)
  const seqStart = performance.now()
  await mockTask(20)
  await mockTask(20)
  const seqDuration = (performance.now() - seqStart).toFixed(2)

  // B. Parallel: Concurrently awaiting both tasks
  const parStart = performance.now()
  await Promise.all([mockTask(20), mockTask(20)])
  const parDuration = (performance.now() - parStart).toFixed(2)

  return {
    sequential: `${seqDuration}ms (Task 1 + Task 2)`,
    parallel: `${parDuration}ms (Concurrent with Promise.all)`,
    lesson: 'Use Promise.all() or Promise.allSettled() when async tasks are independent to avoid serial network waterfalls.',
  }
}
