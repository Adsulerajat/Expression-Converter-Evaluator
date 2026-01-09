/**
 * Expression Converter & Evaluator
 * Implements stack-based algorithms for infix to postfix/prefix conversion and evaluation
 */

class ExpressionConverter {
    constructor() {
        this.operators = {
            '+': { precedence: 1, associativity: 'left' },
            '-': { precedence: 1, associativity: 'left' },
            '*': { precedence: 2, associativity: 'left' },
            '/': { precedence: 2, associativity: 'left' }
        };
        this.steps = [];
        this.initializeEventListeners();
        this.initializeTheme();
    }

    /**
     * Initialize event listeners for UI interactions
     */
    initializeEventListeners() {
        document.getElementById('convertBtn').addEventListener('click', () => this.handleConvert());
        document.getElementById('evaluatePostfixBtn').addEventListener('click', () => this.handleEvaluatePostfix());
        document.getElementById('evaluatePrefixBtn').addEventListener('click', () => this.handleEvaluatePrefix());
        document.getElementById('clearBtn').addEventListener('click', () => this.handleClear());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Allow Enter key to trigger conversion
        document.getElementById('infixInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleConvert();
            }
        });
    }

    /**
     * Initialize theme based on user preference
     */
    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Set the application theme
     * @param {string} theme - 'light' or 'dark'
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    /**
     * Handle convert button click
     */
    handleConvert() {
        try {
            this.hideError();
            const infix = this.getInputValue();
            
            if (!infix.trim()) {
                this.showError('Please enter an infix expression');
                return;
            }

            this.validateExpression(infix);
            
            this.steps = [];
            const postfix = this.infixToPostfix(infix);
            const prefix = this.infixToPrefix(infix);
            
            this.displayResult('postfixResult', postfix);
            this.displayResult('prefixResult', prefix);
            this.displaySteps();
            
            // Enable evaluation buttons
            document.getElementById('evaluatePostfixBtn').disabled = false;
            document.getElementById('evaluatePrefixBtn').disabled = false;
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Handle evaluate postfix button click
     */
    handleEvaluatePostfix() {
        try {
            this.hideError();
            const postfixElement = document.getElementById('postfixResult');
            const postfix = postfixElement.textContent.trim();
            
            if (!postfix || postfix === 'No conversion yet') {
                this.showError('Please convert an expression first');
                return;
            }

            const result = this.evaluatePostfix(postfix);
            this.displayResult('postfixEvalResult', `Result: ${result}`, true);
            
        } catch (error) {
            this.showError('Error evaluating postfix: ' + error.message);
        }
    }

    /**
     * Handle evaluate prefix button click
     */
    handleEvaluatePrefix() {
        try {
            this.hideError();
            const prefixElement = document.getElementById('prefixResult');
            const prefix = prefixElement.textContent.trim();
            
            if (!prefix || prefix === 'No conversion yet') {
                this.showError('Please convert an expression first');
                return;
            }

            const result = this.evaluatePrefix(prefix);
            this.displayResult('prefixEvalResult', `Result: ${result}`, true);
            
        } catch (error) {
            this.showError('Error evaluating prefix: ' + error.message);
        }
    }

    /**
     * Handle clear button click
     */
    handleClear() {
        document.getElementById('infixInput').value = '';
        this.displayResult('postfixResult', '<span class="text-muted">No conversion yet</span>');
        this.displayResult('prefixResult', '<span class="text-muted">No conversion yet</span>');
        this.displayResult('postfixEvalResult', '<span class="text-muted">No evaluation yet</span>');
        this.displayResult('prefixEvalResult', '<span class="text-muted">No evaluation yet</span>');
        document.getElementById('stepsContainer').innerHTML = '<span class="text-muted">Enter an expression and convert to see algorithm steps</span>';
        this.hideError();
        
        // Disable evaluation buttons
        document.getElementById('evaluatePostfixBtn').disabled = true;
        document.getElementById('evaluatePrefixBtn').disabled = true;
    }

    /**
     * Get and clean input value
     * @returns {string} Cleaned input value
     */
    getInputValue() {
        return document.getElementById('infixInput').value.trim().replace(/\s+/g, '');
    }

    /**
     * Validate infix expression
     * @param {string} expression - Expression to validate
     * @throws {Error} If expression is invalid
     */
    validateExpression(expression) {
        // Check for valid characters (letters, numbers, operators, parentheses)
        const validChars = /^[a-zA-Z0-9+\-*/().]+$/;
        if (!validChars.test(expression)) {
            throw new Error('Invalid characters in expression. Only letters (a-z), numbers (0-9), +, -, *, /, (, ) are allowed.');
        }

        // Check for balanced parentheses
        let balance = 0;
        for (const char of expression) {
            if (char === '(') balance++;
            else if (char === ')') balance--;
            if (balance < 0) {
                throw new Error('Unmatched closing parenthesis');
            }
        }
        if (balance !== 0) {
            throw new Error('Unmatched opening parenthesis');
        }

        // Check for consecutive operators
        if (/[+\-*/]{2,}/.test(expression)) {
            throw new Error('Consecutive operators are not allowed');
        }

        // Check for operator at start/end (except - at start)
        if (/[+*/]$/.test(expression) || /^[+*/]/.test(expression)) {
            throw new Error('Expression cannot start or end with +, *, or /');
        }

        // Check for empty parentheses
        if (/\(\)/.test(expression)) {
            throw new Error('Empty parentheses are not allowed');
        }
    }

    /**
     * Check if character is an operator
     * @param {string} char - Character to check
     * @returns {boolean} True if operator
     */
    isOperator(char) {
        return char in this.operators;
    }

    /**
     * Check if character is an operand (number or letter)
     * @param {string} char - Character to check
     * @returns {boolean} True if operand
     */
    isOperand(char) {
        return /[0-9a-zA-Z]/.test(char);
    }

    /**
     * Get operator precedence
     * @param {string} op - Operator
     * @returns {number} Precedence value
     */
    getPrecedence(op) {
        return this.operators[op]?.precedence || 0;
    }

    /**
     * Check if operator is left associative
     * @param {string} op - Operator
     * @returns {boolean} True if left associative
     */
    isLeftAssociative(op) {
        return this.operators[op]?.associativity === 'left';
    }

    /**
     * Convert infix expression to postfix using Shunting Yard algorithm
     * @param {string} infix - Infix expression
     * @returns {string} Postfix expression
     */
    infixToPostfix(infix) {
        const output = [];
        const operatorStack = [];
        this.steps.push('Converting to Postfix (Shunting Yard Algorithm):');
        
        for (let i = 0; i < infix.length; i++) {
            const char = infix[i];
            
            if (this.isOperand(char)) {
                // Handle multi-digit numbers or multi-letter variables
                let operand = '';
                while (i < infix.length && this.isOperand(infix[i])) {
                    operand += infix[i];
                    i++;
                }
                i--; // Adjust for the extra increment
                output.push(operand);
                this.steps.push(`Read operand '${operand}' → Output: [${output.join(', ')}]`);
                
            } else if (char === '(') {
                operatorStack.push(char);
                this.steps.push(`Read '(' → Push to stack: [${operatorStack.join(', ')}]`);
                
            } else if (char === ')') {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                    const op = operatorStack.pop();
                    output.push(op);
                    this.steps.push(`Read ')' → Pop '${op}' to output: [${output.join(', ')}]`);
                }
                if (operatorStack.length > 0) {
                    operatorStack.pop(); // Remove the '('
                    this.steps.push(`Remove '(' from stack: [${operatorStack.join(', ')}]`);
                }
                
            } else if (this.isOperator(char)) {
                while (operatorStack.length > 0 && 
                       operatorStack[operatorStack.length - 1] !== '(' &&
                       (this.getPrecedence(operatorStack[operatorStack.length - 1]) > this.getPrecedence(char) ||
                        (this.getPrecedence(operatorStack[operatorStack.length - 1]) === this.getPrecedence(char) && 
                         this.isLeftAssociative(char)))) {
                    const op = operatorStack.pop();
                    output.push(op);
                    this.steps.push(`Pop '${op}' (higher/equal precedence) to output: [${output.join(', ')}]`);
                }
                operatorStack.push(char);
                this.steps.push(`Push '${char}' to stack: [${operatorStack.join(', ')}]`);
            }
        }
        
        // Pop remaining operators
        while (operatorStack.length > 0) {
            const op = operatorStack.pop();
            output.push(op);
            this.steps.push(`Pop remaining '${op}' to output: [${output.join(', ')}]`);
        }
        
        const result = output.join(' ');
        this.steps.push(`Final Postfix: ${result}`);
        return result;
    }

    /**
     * Convert infix expression to prefix
     * @param {string} infix - Infix expression
     * @returns {string} Prefix expression
     */
    infixToPrefix(infix) {
        // Reverse the infix expression
        let reversed = infix.split('').reverse().join('');
        
        // Replace ( with ) and vice versa
        reversed = reversed.replace(/\(/g, 'TEMP').replace(/\)/g, '(').replace(/TEMP/g, ')');
        
        this.steps.push('\nConverting to Prefix:');
        this.steps.push(`1. Reverse infix: ${reversed}`);
        this.steps.push('2. Replace ( with ) and vice versa');
        
        // Convert to postfix
        const postfix = this.infixToPostfixForPrefix(reversed);
        this.steps.push(`3. Convert to postfix: ${postfix}`);
        
        // Reverse the result
        const prefix = postfix.split(' ').reverse().join(' ');
        this.steps.push(`4. Reverse result: ${prefix}`);
        
        return prefix;
    }

    /**
     * Helper method for prefix conversion
     * @param {string} infix - Modified infix expression
     * @returns {string} Postfix expression
     */
    infixToPostfixForPrefix(infix) {
        const output = [];
        const operatorStack = [];
        
        for (let i = 0; i < infix.length; i++) {
            const char = infix[i];
            
            if (this.isOperand(char)) {
                let operand = '';
                while (i < infix.length && this.isOperand(infix[i])) {
                    operand += infix[i];
                    i++;
                }
                i--;
                output.push(operand);
                
            } else if (char === '(') {
                operatorStack.push(char);
                
            } else if (char === ')') {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                    output.push(operatorStack.pop());
                }
                if (operatorStack.length > 0) {
                    operatorStack.pop();
                }
                
            } else if (this.isOperator(char)) {
                // For prefix conversion, use >= instead of > for right associativity
                while (operatorStack.length > 0 && 
                       operatorStack[operatorStack.length - 1] !== '(' &&
                       this.getPrecedence(operatorStack[operatorStack.length - 1]) >= this.getPrecedence(char)) {
                    output.push(operatorStack.pop());
                }
                operatorStack.push(char);
            }
        }
        
        while (operatorStack.length > 0) {
            output.push(operatorStack.pop());
        }
        
        return output.join(' ');
    }

    /**
     * Evaluate postfix expression using stack
     * @param {string} postfix - Postfix expression
     * @returns {number} Result of evaluation
     */
    evaluatePostfix(postfix) {
        const stack = [];
        const tokens = postfix.split(' ');
        
        for (const token of tokens) {
            if (this.isOperator(token)) {
                if (stack.length < 2) {
                    throw new Error('Invalid postfix expression: insufficient operands');
                }
                
                const operand2 = stack.pop();
                const operand1 = stack.pop();
                const result = this.performOperation(operand1, operand2, token);
                stack.push(result);
                
            } else if (!isNaN(parseFloat(token))) {
                stack.push(parseFloat(token));
            } else if (/^[a-zA-Z]+$/.test(token)) {
                // For variables, we can't evaluate without values
                throw new Error(`Cannot evaluate expression with variables. Variable '${token}' has no assigned value.`);
            }
        }
        
        if (stack.length !== 1) {
            throw new Error('Invalid postfix expression: incorrect number of operators');
        }
        
        return stack[0];
    }

    /**
     * Evaluate prefix expression using stack
     * @param {string} prefix - Prefix expression
     * @returns {number} Result of evaluation
     */
    evaluatePrefix(prefix) {
        const stack = [];
        const tokens = prefix.split(' ').reverse(); // Process from right to left
        
        for (const token of tokens) {
            if (this.isOperator(token)) {
                if (stack.length < 2) {
                    throw new Error('Invalid prefix expression: insufficient operands');
                }
                
                const operand1 = stack.pop();
                const operand2 = stack.pop();
                const result = this.performOperation(operand1, operand2, token);
                stack.push(result);
                
            } else if (!isNaN(parseFloat(token))) {
                stack.push(parseFloat(token));
            } else if (/^[a-zA-Z]+$/.test(token)) {
                // For variables, we can't evaluate without values
                throw new Error(`Cannot evaluate expression with variables. Variable '${token}' has no assigned value.`);
            }
        }
        
        if (stack.length !== 1) {
            throw new Error('Invalid prefix expression: incorrect number of operators');
        }
        
        return stack[0];
    }

    /**
     * Perform arithmetic operation
     * @param {number} operand1 - First operand
     * @param {number} operand2 - Second operand
     * @param {string} operator - Operator
     * @returns {number} Result of operation
     */
    performOperation(operand1, operand2, operator) {
        switch (operator) {
            case '+':
                return operand1 + operand2;
            case '-':
                return operand1 - operand2;
            case '*':
                return operand1 * operand2;
            case '/':
                if (operand2 === 0) {
                    throw new Error('Division by zero');
                }
                return operand1 / operand2;
            default:
                throw new Error(`Unknown operator: ${operator}`);
        }
    }

    /**
     * Display result in specified element
     * @param {string} elementId - ID of target element
     * @param {string} content - Content to display
     * @param {boolean} isEvaluation - Whether this is an evaluation result
     */
    displayResult(elementId, content, isEvaluation = false) {
        const element = document.getElementById(elementId);
        element.innerHTML = content;
        
        // Add visual feedback
        element.classList.remove('has-content');
        if (content && !content.includes('No conversion yet') && !content.includes('No evaluation yet')) {
            element.classList.add('has-content', 'fade-in');
            
            if (isEvaluation) {
                element.classList.add('pulse');
                setTimeout(() => element.classList.remove('pulse'), 500);
            }
        }
    }

    /**
     * Display algorithm steps
     */
    displaySteps() {
        const stepsContainer = document.getElementById('stepsContainer');
        const stepsHtml = this.steps.map((step, index) => {
            if (step.includes(':') && !step.includes('→')) {
                return `<div class="fw-bold mt-3 mb-2">${step}</div>`;
            }
            return `<div class="step-item">${index}. ${step}</div>`;
        }).join('');
        
        stepsContainer.innerHTML = stepsHtml;
        stepsContainer.classList.add('fade-in');
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorContainer.classList.remove('d-none');
        errorContainer.classList.add('fade-in');
        
        // Auto-hide error after 5 seconds
        setTimeout(() => this.hideError(), 5000);
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorContainer = document.getElementById('errorContainer');
        errorContainer.classList.add('d-none');
        errorContainer.classList.remove('fade-in');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new ExpressionConverter();
    console.log('Expression Converter & Evaluator initialized successfully');
});

// Add some sample expressions for quick testing (optional)
const sampleExpressions = [
    '(2 + 3) * 4',
    '10 + 2 * 6',
    '100 * 2 + 12',
    '(1 + 2) * (3 + 4)',
    '2 + 3 * 4 - 5',
    '(a + b) * c',
    'x + y * z',
    '(p + q) / (r - s)',
    'a * b + c * d'
];

// Add click handler for sample expressions (if you want to add a samples section)
function loadSample(expression) {
    document.getElementById('infixInput').value = expression;
}