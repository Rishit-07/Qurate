/**
 * Concept: JavaScript — Event Loop
 * 
 * The JavaScript runtime operates on a single-threaded Event Loop architecture composed of:
 * 1. Call Stack: Synchronous frame execution (LIFO)
 * 2. Microtask Queue: Highest priority queue drained after the current script run and before rendering/macrotasks (Promises, queueMicrotask, MutationObserver)
 * 3. Macrotask Queue (Task Queue): Executed in separate loop ticks (setTimeout, setInterval, setImmediate, I/O, UI events)
 * 4. Render Phase: Browser layout, paint, and composition occurring between ticks
 */

/**
 * 1. Queue a high-priority microtask that runs immediately after the current call stack clears.
 */
export function scheduleMicrotask(taskFn) {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(taskFn)
  } else {
    Promise.resolve().then(taskFn)
  }
}

/**
 * 2. Queue a macrotask that yields to the event loop, allowing UI render & user input processing.
 */
export function scheduleMacrotask(taskFn, delay = 0) {
  return setTimeout(taskFn, delay)
}

/**
 * 3. Non-blocking Chunked Batch Processor with Promise Chaining
 * 
 * Implements explicit Promise Chaining to process large collections (e.g. issues, search results)
 * without blocking the JavaScript main thread.
 * 
 * Architecture & Event Loop Flow:
 * - Microtasks vs Macrotasks distinction:
 *   1. Macrotasks (`setTimeout(..., 0)`): Yield control back to the browser event loop, allowing UI rendering,
 *      style recalculation, and user interactions to execute between chunks.
 *   2. Microtasks (`Promise.then()` callbacks): Execute immediately after the current macrotask tick finishes,
 *      before any subsequent macrotask is dequeued.
 * 
 * - Promise Chaining & Error Handling:
 *   Instead of nested callback recursion, each chunk is chained sequentially using `.then()`.
 *   If an error occurs in any chunk processing function, the entire Promise chain short-circuits
 *   and propagates directly down to the terminal `.catch()` handler, ensuring clean centralized error recovery.
 * 
 * @param {Array} items Array of items to process
 * @param {Function} processItemFn Worker function applied to each item
 * @param {number} chunkSize Number of items processed per chunk before yielding
 * @param {Function} onProgress Optional callback (processedCount, total)
 * @returns {Promise<Array>} Chained Promise resolving to all processed items
 */
export function processInChunksNonBlocking(items, processItemFn, chunkSize = 25, onProgress) {
  if (!Array.isArray(items) || items.length === 0) {
    return Promise.resolve([])
  }

  const results = []
  const totalChunks = Math.ceil(items.length / chunkSize)

  // Initialize the Promise chain with an anchor resolved Promise
  let chunkChain = Promise.resolve()

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize
    const end = Math.min(start + chunkSize, items.length)

    // Step A: Chain a macrotask yield using setTimeout so the event loop can repaint and handle UI input
    chunkChain = chunkChain
      .then(() => {
        return new Promise((resolveDelay) => {
          setTimeout(resolveDelay, 0)
        })
      })
      // Step B: Chain the microtask execution step to process the current chunk slice
      .then(() => {
        for (let i = start; i < end; i++) {
          results.push(processItemFn(items[i], i))
        }

        if (typeof onProgress === 'function') {
          onProgress(end, items.length)
        }

        return results
      })
  }

  // Step C: Terminal catch block for centralized error handling across the entire Promise chain
  return chunkChain
    .then(() => results)
    .catch((error) => {
      console.error('Error during non-blocking chunk processing chain:', error)
      throw error // Re-throw to propagate error to the caller's catch block
    })
}


/**
 * 4. Measure Event Loop Lag
 * Measures the time drift between scheduled setTimeout and actual execution,
 * quantifying event loop congestion or main thread blocking.
 */
export function measureEventLoopLag(callback) {
  const start = performance.now()
  setTimeout(() => {
    const elapsed = performance.now() - start
    const lag = Math.max(0, elapsed - 0) // expected ~0-4ms in modern browsers
    callback(lag)
  }, 0)
}

/**
 * 5. Event Loop Execution Order Demonstration
 * Verifies the exact execution sequence: Call Stack -> Microtask Queue -> Macrotask Queue
 */
export function runEventLoopDemonstration() {
  const executionLog = []

  executionLog.push('1. Call Stack: Synchronous Start')

  // Macrotask (Task Queue)
  setTimeout(() => {
    executionLog.push('5. Macrotask: setTimeout callback executed')
  }, 0)

  // Microtask (Microtask Queue)
  Promise.resolve().then(() => {
    executionLog.push('3. Microtask: Promise.then executed')
  })

  // Microtask explicitly queued
  queueMicrotask(() => {
    executionLog.push('4. Microtask: queueMicrotask executed')
  })

  executionLog.push('2. Call Stack: Synchronous End')

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(executionLog)
    }, 20)
  })
}
