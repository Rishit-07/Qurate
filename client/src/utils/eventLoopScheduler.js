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
 * 3. Non-blocking Chunked Batch Processor
 * Processes large arrays of items (e.g. issues, search embeddings) without freezing the UI.
 * Yields back to the event loop after each chunk, keeping the browser responsive at 60fps.
 * 
 * @param {Array} items Array of items to process
 * @param {Function} processItemFn Worker function applied to each item
 * @param {number} chunkSize Number of items processed synchronously before yielding
 * @param {Function} onProgress Optional callback (processedCount, total)
 * @returns {Promise<Array>} Results collected asynchronously
 */
export async function processInChunksNonBlocking(items, processItemFn, chunkSize = 25, onProgress) {
  const results = []
  let index = 0

  return new Promise((resolve, reject) => {
    function processNextChunk() {
      try {
        const chunkEnd = Math.min(index + chunkSize, items.length)

        for (; index < chunkEnd; index++) {
          results.push(processItemFn(items[index], index))
        }

        if (onProgress) {
          onProgress(index, items.length)
        }

        if (index < items.length) {
          // Yield to event loop macrotask queue so UI renders and user interactions are not blocked
          setTimeout(processNextChunk, 0)
        } else {
          resolve(results)
        }
      } catch (err) {
        reject(err)
      }
    }

    // Start processing
    processNextChunk()
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
