/**
 * Concept: JavaScript — Promises vs Callbacks
 * 
 * Evolution of Asynchronous JavaScript:
 * 1. Callbacks: Early async pattern using error-first callbacks: `function(err, data)`.
 *    - Drawbacks: Inversion of control, difficult error handling, Callback Hell (Pyramid of Doom).
 * 2. Promises (ES6): Objects representing the eventual completion (or failure) of an async operation.
 *    - States: pending, fulfilled, rejected.
 *    - Benefits: Composable with `.then()` / `.catch()` / `.finally()`, flat chaining, standardized error propagation.
 * 3. Async/Await (ES8): Syntactic sugar over Promises providing synchronous-looking asynchronous code.
 */

/**
 * Custom implementation of `promisify`
 * Converts any standard error-first callback function `(arg1, arg2, ..., callback)` into a Promise-returning function.
 */
export function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }
}

/**
 * 1. Simulating a legacy callback-based async function (e.g. simulated DB or file lookup)
 */
export function legacyAsyncFetchCallback(id, callback) {
  setTimeout(() => {
    if (!id) {
      return callback(new Error('Invalid ID provided to callback operation'))
    }
    callback(null, { id, title: `Open Source Issue #${id}`, status: 'resolved_via_callback' })
  }, 10)
}

/**
 * 2. Converted to Promise via our custom `promisify` utility
 */
export const promisifiedFetch = promisify(legacyAsyncFetchCallback)

/**
 * 3. Promisifying Browser FileReader API (for avatar and file uploads)
 * Bridges callback events (onload, onerror) into a modern clean Promise.
 */
export function readFileAsDataURLPromise(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided for reading'))
    }

    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

/**
 * 4. Comparison Demonstrator: Callback Hell vs Promise Chain vs Async/Await
 */
export async function runPromiseVsCallbackComparison() {
  const log = []

  // A. Callback execution
  const callbackStart = performance.now()
  const callbackResult = await new Promise((done) => {
    legacyAsyncFetchCallback(101, (err, data) => {
      const elapsed = (performance.now() - callbackStart).toFixed(2)
      log.push({
        paradigm: 'Callback (Error-First)',
        data,
        elapsed: `${elapsed}ms`,
        readability: 'Requires nested closures; error handling must be duplicated in each callback.',
      })
      done(data)
    })
  })

  // B. Promise execution via Promisified function
  const promiseStart = performance.now()
  try {
    const promiseData = await promisifiedFetch(102)
    const elapsed = (performance.now() - promiseStart).toFixed(2)
    log.push({
      paradigm: 'Promise (.then / await)',
      data: promiseData,
      elapsed: `${elapsed}ms`,
      readability: 'Clean linear chaining, central .catch() error propagation, composable with Promise.all().',
    })
  } catch (error) {
    log.push({ paradigm: 'Promise', error: error.message })
  }

  return {
    summary: 'Promises eliminate Callback Hell, restore return values and throw semantics, and enable async/await.',
    comparisonLog: log,
  }
}
