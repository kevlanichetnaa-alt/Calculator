/**
* script.js — Calculator Logic
*
* State machine approach:
* - firstOperand : the number entered before an operator
* - operator         : pending arithmetic operator (+, -, *, /)
 * - waitingForSecond : flag; true after operator pressed → next digit starts fresh
* - currentInput : string shown in the result display
* - expression       : string shown in the expression display (cosmetic)
* - justEvaluated : flag; true right after "=" so a new digit starts fresh
*/

/* ── DOM references ───────────────────────────────────────────── */
const resultEl     = document.getElementById('result');
const expressionEl = document.getElementById('expression');
const allButtons = document.querySelectorAll('.btn');
const opButtons      = document.querySelectorAll('.btn--operator');

/* ── Calculator state ─────────────────────────────────────────── */
let currentInput = '0';
let firstOperand     = null;
let operator       = null;
let waitingForSecond = false;
let justEvaluated = false;

/* ── Render helpers ───────────────────────────────────────────── */

/**
* Update the result display.
* Adjusts font size based on string length.
*/
function updateDisplay(value) {
 resultEl.textContent = value;

 // Remove size modifiers
 resultEl.classList.remove('small', 'xsmall', 'error');
    const len = String(value).replace('-', '').length;
    if (len > 12) resultEl.classList.add('xsmall');
    else if (len > 8) resultEl.classList.add('small');
}

/** Update the faint expression line above the result. */
function updateExpression(text) {
    expressionEl.textContent = text;
}

/** Flash the result display (called on "="). */
function flashResult() {
    resultEl.classList.remove('flash');
    // Force reflow so the animation re-triggers even when called repeatedly
    void resultEl.offsetWidth;
    resultEl.classList.add('flash');
}

/** Highlight the active operator button. */
function highlightOperator(op) {
    opButtons.forEach(btn => btn.classList.remove('active'));
    if (op) {
  const activeBtn = document.querySelector(`.btn--operator[data-operator="${op}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

/* ── Core calculator operations ───────────────────────────────── */

/**
* Perform arithmetic on two numbers.
* Returns a number or throws for division-by-zero.
*/
function calculate(a, op, b) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/':
         if (b === 0) throw new Error('Division by zero');
         return a / b;
        default:
         throw new Error('Unknown operator');
    }
}

/**
* Format a number for display:
* - Limit to 10 significant digits to avoid floating-point artefacts
* - Remove trailing zeros after the decimal point
*/
function formatNumber(n) {
    if (!isFinite(n)) return 'Error';
 // Use toPrecision to cap significant digits, then parseFloat to strip trailing zeros
    let formatted = parseFloat(n.toPrecision(10)).toString();
    return formatted;
}

/* ── Input handlers ───────────────────────────────────────────── */

/** Handle a digit (0-9) button press. */
function handleDigit(digit) {
    // After "=" or when waiting for the second operand, start fresh
    if (justEvaluated || waitingForSecond) {
        currentInput         = digit === '0' ? '0' : digit;
        waitingForSecond = false;
        justEvaluated        = false;
    } else {
        // Prevent leading zeros (e.g., "007" → "7")
        if (currentInput === '0' && digit !== '.') {
            currentInput = digit;
        } else {
            // Cap input length at 15 characters
            if (currentInput.length < 15) {
                currentInput += digit;
            }
        }
    }
    updateDisplay(currentInput);
}

/** Handle the decimal point button. */
function handleDecimal() {
    // Start new number if after "=" or waiting for second operand
    if (justEvaluated || waitingForSecond) {
        currentInput    = '0.';
        waitingForSecond = false;
        justEvaluated   = false;
        updateDisplay(currentInput);
        return;
    }
    // Prevent duplicate decimal points
    if (!currentInput.includes('.')) {
        currentInput += '.';
        updateDisplay(currentInput);
    }
}

/** Handle an operator (+, -, *, /) button press. */
function handleOperator(nextOp) {
    const inputValue = parseFloat(currentInput);

    // If there's already a pending operation AND we're NOT just waiting
    // (i.e. two operands are ready), evaluate immediately (chaining)
    if (operator && !waitingForSecond && !justEvaluated) {
        try {
            const result = calculate(firstOperand, operator, inputValue);
            const formatted = formatNumber(result);
            updateDisplay(formatted);
   updateExpression(`${firstOperand} ${displayOperator(operator)} ${inputValue} ${displayOperator(nextOp)}`);
            firstOperand = parseFloat(formatted);
            currentInput = formatted;
        } catch (err) {
            showError(err.message);
            return;
        }
    } else {
        firstOperand = justEvaluated ? parseFloat(currentInput) : inputValue;
        updateExpression(`${firstOperand} ${displayOperator(nextOp)}`);
    }

    operator           = nextOp;
    waitingForSecond = true;
    justEvaluated         = false;

    highlightOperator(nextOp);
    updateExpression(`${firstOperand} ${displayOperator(nextOp)}`);
}

/** Handle the equals (=) button. */
function handleEquals() {
    if (operator === null || waitingForSecond) return; // Nothing to evaluate

    const inputValue = parseFloat(currentInput);

    try {
        const result = calculate(firstOperand, operator, inputValue);
        const formatted = formatNumber(result);

        // Show full expression in the expression line
   updateExpression(`${firstOperand} ${displayOperator(operator)} ${inputValue} =`);
        updateDisplay(formatted);
        flashResult();

        // Reset state; keep result in currentInput for chaining
        currentInput = formatted;
        firstOperand = null;
        operator      = null;
        justEvaluated = true;
        waitingForSecond = false;
        highlightOperator(null);

    } catch (err) {
        showError(err.message);
    }
}

/** Handle the clear (C) button — full reset. */
function handleClear() {
    currentInput         = '0';
    firstOperand         = null;
    operator         = null;
    waitingForSecond = false;
    justEvaluated        = false;

    updateDisplay('0');
    updateExpression('');
    highlightOperator(null);
    resultEl.classList.remove('error');
}

/** Handle the delete (⌫) button — remove the last character. */
function handleDelete() {
    // Nothing to delete after evaluation or on error
    if (justEvaluated || resultEl.classList.contains('error')) {
        handleClear();
        return;
    }

    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = '0';
    }
    updateDisplay(currentInput);
}

/* ── Error display ────────────────────────────────────────────── */
function showError(message) {
    const label = message === 'Division by zero' ? 'Can\'t ÷ by 0' : 'Error';
    resultEl.textContent = label;
    resultEl.classList.add('error');
    updateExpression('');

    // Auto-reset after 1.5 s
    setTimeout(handleClear, 1500);
}

/* ── Utility: display-friendly operator symbol ───────────────── */
function displayOperator(op) {
    const map = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    return map[op] || op;
}

/* ── Event delegation: button clicks ─────────────────────────── */
document.querySelector('.grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const { action, digit, operator: op } = btn.dataset;

    if (digit !== undefined) handleDigit(digit);
 if (op      !== undefined) handleOperator(op);
 if (action === 'equals') handleEquals();
 if (action === 'clear')       handleClear();
 if (action === 'delete') handleDelete();
 if (action === 'decimal') handleDecimal();
});

/* ── Keyboard support ─────────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
 // Prevent page scroll on Space/Enter
 if ([' ', 'Enter'].includes(e.key)) e.preventDefault();

 if (e.key >= '0' && e.key <= '9') {
     handleDigit(e.key);
     animateKey(e.key);
 } else if (e.key === '.') {
     handleDecimal();
 } else if (['+', '-', '*', '/'].includes(e.key)) {
     handleOperator(e.key);
 } else if (e.key === 'Enter' || e.key === '=') {
     handleEquals();
 } else if (e.key === 'Backspace') {
     handleDelete();
 } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
     handleClear();
 }
});

/** Briefly animate the matching button on keyboard press. */
function animateKey(key) {
    const btn = document.querySelector(`[data-digit="${key}"]`);
    if (!btn) return;
    btn.style.transform = 'scale(0.92)';
    setTimeout(() => { btn.style.transform = ''; }, 120);
}