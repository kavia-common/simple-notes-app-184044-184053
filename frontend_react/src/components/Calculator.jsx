import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const CALC_STORAGE_KEY = 'notesApp:calc:current';

/**
 * A tiny, safe evaluator for simple binary operations using JS number arithmetic.
 * Supports +, -, ×, ÷ with sequential chaining and equals repeat.
 * We avoid eval by explicitly parsing and operating on numbers.
 */

// PUBLIC_INTERFACE
export default function Calculator({ id = 'calculator-panel' }) {
  /**
   * PUBLIC_INTERFACE
   * Compact calculator panel with:
   * - Operators: +, -, ×, ÷
   * - Digits: 0-9, decimal .
   * - Controls: C (clear), ⌫ (backspace), = (evaluate)
   * - Keyboard: Enter (=), Backspace (⌫), Escape (C), digits/operators, . for decimal
   * - Accessibility: role, aria labels, focus management, roving tabindex for buttons
   * - Persistence: current display value saved to localStorage
   */
  const [display, setDisplay] = useState(() => {
    if (typeof window === 'undefined') return '0';
    const raw = window.localStorage.getItem(CALC_STORAGE_KEY);
    return raw && !Number.isNaN(Number(raw)) ? String(raw) : '0';
  });
  const [accumulator, setAccumulator] = useState(null); // number | null
  const [pendingOp, setPendingOp] = useState(null); // '+', '-', '*', '/', or null
  const [lastInputType, setLastInputType] = useState('init'); // 'digit' | 'op' | 'equals' | 'init' | 'clear'
  const [lastOperand, setLastOperand] = useState(null); // for repeating equals

  const rootRef = useRef(null);

  useEffect(() => {
    // Persist the current display
    try {
      window.localStorage.setItem(CALC_STORAGE_KEY, display);
    } catch {
      // ignore
    }
  }, [display]);

  const clearAll = useCallback(() => {
    setDisplay('0');
    setAccumulator(null);
    setPendingOp(null);
    setLastOperand(null);
    setLastInputType('clear');
  }, []);

  const backspace = useCallback(() => {
    setDisplay((prev) => {
      if (lastInputType === 'equals') {
        // If last action was equals, start new entry by clearing
        return '0';
      }
      if (prev.length <= 1) return '0';
      const next = prev.slice(0, -1);
      return next === '-' || next === '' ? '0' : next;
    });
    setLastInputType('digit');
  }, [lastInputType]);

  const inputDigit = useCallback((d) => {
    setDisplay((prev) => {
      if (lastInputType === 'op' || lastInputType === 'equals' || prev === '0') {
        setLastInputType('digit');
        return String(d);
      }
      setLastInputType('digit');
      return prev + String(d);
    });
  }, [lastInputType]);

  const inputDecimal = useCallback(() => {
    setDisplay((prev) => {
      if (lastInputType === 'op' || lastInputType === 'equals') {
        setLastInputType('digit');
        return '0.';
      }
      if (prev.includes('.')) return prev;
      setLastInputType('digit');
      return prev + '.';
    });
  }, [lastInputType]);

  const toNumber = (s) => {
    const n = Number(s);
    if (Number.isNaN(n)) return 0;
    return n;
  };

  const operate = (a, b, op) => {
    // Handle divide by zero gracefully: return 'Error'
    if (op === '/' && b === 0) return 'Error';
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      default: return b;
    }
  };

  const setOp = useCallback((op) => {
    setLastInputType('op');
    setPendingOp((prevOp) => {
      const current = toNumber(display);
      if (accumulator === null) {
        // First operator press: store current as accumulator
        setAccumulator(current);
      } else if (prevOp && lastInputType !== 'op') {
        // Chain: compute previous operation
        const result = operate(accumulator, current, prevOp);
        if (result === 'Error') {
          setDisplay('Error');
          setAccumulator(null);
          setPendingOp(null);
          setLastOperand(null);
          return null;
        }
        setAccumulator(result);
        setDisplay(String(result));
      }
      return op;
    });
  }, [display, accumulator, lastInputType]);

  const equals = useCallback(() => {
    const current = toNumber(display);

    // Repeat equals support:
    // If equals pressed consecutively, reuse lastOperand with pendingOp
    let b = current;
    if (lastInputType === 'equals' && lastOperand != null) {
      b = lastOperand;
    }

    if (pendingOp == null) {
      // No op pending: keep display as is
      setLastInputType('equals');
      setLastOperand(b);
      return;
    }

    const a = accumulator == null ? current : accumulator;
    const result = operate(a, b, pendingOp);
    if (result === 'Error') {
      setDisplay('Error');
      setAccumulator(null);
      setPendingOp(null);
      setLastInputType('equals');
      setLastOperand(null);
      return;
    }

    setDisplay(String(result));
    setAccumulator(result);
    setLastOperand(b);
    setLastInputType('equals');
  }, [accumulator, display, pendingOp, lastInputType, lastOperand]);

  const onKeyDown = useCallback((e) => {
    const { key } = e;
    if (key === 'Escape') {
      e.preventDefault();
      clearAll();
      return;
    }
    if (key === 'Backspace') {
      e.preventDefault();
      backspace();
      return;
    }
    if (key === 'Enter' || key === '=') {
      e.preventDefault();
      equals();
      return;
    }
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      inputDigit(key);
      return;
    }
    if (key === '.') {
      e.preventDefault();
      inputDecimal();
      return;
    }
    if (key === '+' || key === '-') {
      e.preventDefault();
      setOp(key);
      return;
    }
    if (key === '*' || key === 'x' || key === 'X') {
      e.preventDefault();
      setOp('*');
      return;
    }
    if (key === '/' || key === '÷') {
      e.preventDefault();
      setOp('/');
      return;
    }
  }, [backspace, clearAll, equals, inputDecimal, inputDigit, setOp]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  const safeDisplay = useMemo(() => {
    if (display === 'Error') return 'Cannot divide by zero';
    return display;
  }, [display]);

  const focusFirstButton = () => {
    const btn = rootRef.current?.querySelector('button');
    btn?.focus();
  };

  const btn = (label, onClick, opts = {}) => {
    const { aria, variant = 'secondary' } = opts;
    const ariaLabel = aria || label;
    const className = `calc-btn btn btn-${variant} light-sweep`;
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {label}
      </button>
    );
  };

  return (
    <section
      id={id}
      ref={rootRef}
      className="calculator glass sheen-top highlight-corner"
      role="region"
      aria-label="Calculator"
      tabIndex={0} /* make the panel focusable for keyboard input */
      onFocus={(e) => {
        // if the focus came to the panel itself, move to first interactive control for convenience
        if (e.target === e.currentTarget) {
          focusFirstButton();
        }
      }}
    >
      <div className="calc-display" role="status" aria-live="polite">
        {safeDisplay}
      </div>

      <div className="calc-grid" role="group" aria-label="Calculator keys">
        {/* Row 1 */}
        {btn('C', clearAll, { aria: 'Clear', variant: 'ghost' })}
        {btn('⌫', backspace, { aria: 'Delete', variant: 'ghost' })}
        {btn('÷', () => setOp('/'), { aria: 'Divide', variant: 'secondary' })}

        {/* Row 2 */}
        {btn('7', () => inputDigit(7))}
        {btn('8', () => inputDigit(8))}
        {btn('9', () => inputDigit(9))}
        {btn('×', () => setOp('*'), { aria: 'Multiply', variant: 'secondary' })}

        {/* Row 3 */}
        {btn('4', () => inputDigit(4))}
        {btn('5', () => inputDigit(5))}
        {btn('6', () => inputDigit(6))}
        {btn('−', () => setOp('-'), { aria: 'Subtract', variant: 'secondary' })}

        {/* Row 4 */}
        {btn('1', () => inputDigit(1))}
        {btn('2', () => inputDigit(2))}
        {btn('3', () => inputDigit(3))}
        {btn('+', () => setOp('+'), { aria: 'Add', variant: 'secondary' })}

        {/* Row 5 */}
        {btn('0', () => inputDigit(0))}
        {btn('.', () => inputDecimal(), { aria: 'Decimal point' })}
        {btn('=', () => equals(), { aria: 'Equals', variant: 'primary' })}
      </div>

      <p className="calc-help" aria-hidden="false">
        Keyboard: Enter =, Backspace ⌫, Esc C
      </p>
    </section>
  );
}
