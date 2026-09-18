/**
 * Concept: JavaScript — Hoisting & The Temporal Dead Zone (TDZ)
 * 
 * In JavaScript, Hoisting is the behavior where variable, function, and class declarations
 * are allocated memory during the Compilation/Creation Phase, before code is executed.
 * 
 * Core Behaviors Demonstrated in this File:
 * 1. Function Declaration Hoisting (Lines 25-42):
 *    Function declarations are hoisted completely with their implementation body.
 *    They can be invoked BEFORE their lexical declaration statement in the source code.
 * 
 * 2. `var` Variable Hoisting (Lines 45-65):
 *    Variables declared with `var` are hoisted to the top of their function/global scope
 *    and initialized to `undefined`. Accessing them before assignment yields `undefined`.
 * 
 * 3. `let` and `const` Temporal Dead Zone (TDZ) (Lines 68-95):
 *    Variables declared with `let` and `const` are hoisted into their enclosing block scope,
 *    but are NOT initialized. The time between entering the scope and reaching the declaration
 *    is the Temporal Dead Zone (TDZ). Accessing the variable in the TDZ throws a `ReferenceError`.
 */

// 1. Function Declaration Hoisting Demonstration
export function testFunctionHoisting() {
  // Line 28: Function invocation occurs BEFORE the lexical declaration on line 35
  const invocationBefore = calculateIssuePriorityScore(8, 'beginner')

  // Line 32: Function Declaration — Hoisted with its entire body during the compile phase
  function calculateIssuePriorityScore(fitScore, complexity) {
    return `Calculated Priority: ${fitScore}/10 for ${complexity} complexity`
  }

  // Line 37: Invocation after lexical declaration
  const invocationAfter = calculateIssuePriorityScore(8, 'beginner')

  return {
    success: true,
    invokedBeforeDeclaration: invocationBefore,
    invokedAfterDeclaration: invocationAfter,
    explanation: 'Function declarations are fully hoisted with their body during compilation.',
  }
}

// 2. Variable Hoisting with `var` Demonstration
export function testVarHoisting() {
  let accessedValueBeforeAssignment
  let accessedValueAfterAssignment

  // Immediate execution scope
  ;(() => {
    // Line 54: Accessing 'cachedFilter' BEFORE its var declaration line
    // Memory is allocated, initialized to `undefined` during creation phase.
    accessedValueBeforeAssignment = cachedFilter // returns `undefined` (NOT a ReferenceError)

    // Line 58: Assignment occurs at runtime
    var cachedFilter = 'React'

    accessedValueAfterAssignment = cachedFilter // returns 'React'
  })()

  return {
    hoistedValue: accessedValueBeforeAssignment, // undefined
    assignedValue: accessedValueAfterAssignment, // 'React'
    explanation: 'var is hoisted and initialized to undefined in the creation phase.',
  }
}

// 3. Temporal Dead Zone (TDZ) Demonstration with `let` and `const`
export function testTemporalDeadZone() {
  let caughtError = null
  let tdzTriggered = false

  // Demonstrating the TDZ in a block scope
  try {
    ;(() => {
      // Line 77: Attempting to access 'pendingIssueId' BEFORE line 82
      // 'pendingIssueId' exists in the TDZ from block entrance until the let statement executes.
      // This MUST throw a ReferenceError at runtime:
      const readAttempt = pendingIssueId + 1

      // Line 82: The declaration statement initializes the variable
      let pendingIssueId = 404
      return readAttempt
    })()
  } catch (err) {
    tdzTriggered = true
    caughtError = {
      name: err.name, // "ReferenceError"
      message: err.message, // "Cannot access 'pendingIssueId' before initialization"
    }
  }

  return {
    tdzTriggered,
    caughtError,
    explanation:
      'let/const are hoisted but remain in the Temporal Dead Zone (TDZ). Accessing them throws ReferenceError.',
  }
}

// 4. Comprehensive Hoisting Diagnostics Suite
export function runHoistingDiagnostics() {
  const functionTest = testFunctionHoisting()
  const varTest = testVarHoisting()
  const tdzTest = testTemporalDeadZone()

  return {
    concept: 'JavaScript Hoisting & Execution Context Lifecycle',
    evidence: {
      functionHoisting: functionTest,
      varHoisting: varTest,
      temporalDeadZone: tdzTest,
    },
  }
}
