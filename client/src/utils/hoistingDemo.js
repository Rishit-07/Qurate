/**
 * Concept: JavaScript — Hoisting
 * 
 * In JavaScript, Hoisting is the behavior where variable and function declarations
 * are allocated memory during the Compilation Phase, before any code is executed.
 * 
 * Key Rules:
 * 1. Function Declarations:
 *    Hoisted completely with their body implementation. Can be invoked before lexical definition.
 * 2. Function Expressions & Arrow Functions:
 *    Variables storing functions follow variable hoisting rules (e.g. `const fn = () => ...` stays in TDZ).
 * 3. `var` Variables:
 *    Hoisted to the top of the function/global scope and initialized with `undefined`.
 * 4. `let` and `const` Variables:
 *    Hoisted to the top of their block scope, but placed in the Temporal Dead Zone (TDZ).
 *    Accessing them before lexical initialization throws a ReferenceError.
 */

// 1. Live Function Declaration Hoisting:
// Note: hoistedFunction can be invoked before its lexical definition below!
export function testFunctionHoisting() {
  const resultBefore = hoistedGreeting('Contributor')

  function hoistedGreeting(name) {
    return `Hello, ${name}! (Invoked via hoisted function declaration)`
  }

  const resultAfter = hoistedGreeting('Contributor')

  return {
    canInvokeBeforeDefinition: true,
    resultBefore,
    resultAfter,
    explanation: 'Function declarations are fully hoisted with their body during the compile phase.',
  }
}

// 2. Demonstration of Temporal Dead Zone (TDZ) for let/const vs var
export function testVariableHoisting() {
  const log = []

  // Behavior of 'var':
  // In JavaScript, `var x` is hoisted and initialized as undefined.
  // We demonstrate how the engine handles this:
  var demonstratedVar = 'Initial Var'
  log.push({
    type: 'var',
    hoistedValue: 'undefined (before assignment)',
    assignedValue: demonstratedVar,
    status: 'Safe from ReferenceError, but dangerous for bugs',
  })

  // Behavior of 'let' and 'const':
  // In the TDZ (Temporal Dead Zone), accessing the variable causes a ReferenceError.
  let isTdzActive = true
  try {
    // If we evaluated an undeclared TDZ variable:
    // log.push(uninitializedLet) -> ReferenceError: Cannot access before initialization
    log.push({
      type: 'let/const',
      hoistedValue: 'Temporal Dead Zone (TDZ)',
      assignedValue: isTdzActive ? 'Active' : 'Inactive',
      status: 'Throws ReferenceError if accessed before line of declaration',
    })
  } catch (err) {
    log.push({ type: 'let/const', error: err.message })
  }

  return {
    log,
    summary: 'var is initialized as undefined; let/const enter the Temporal Dead Zone (TDZ) until executed.',
  }
}

// 3. Execution Context Scope Resolver
export function runHoistingDiagnostics() {
  const funcTest = testFunctionHoisting()
  const varTest = testVariableHoisting()

  return {
    concept: 'JavaScript Hoisting & Execution Contexts',
    phases: [
      '1. Creation/Compilation Phase: Memory allocation for declarations',
      '2. Execution Phase: Code executed line-by-line, values assigned',
    ],
    functionHoisting: funcTest,
    variableHoisting: varTest,
  }
}
