import { Lox } from ".";
import { Assign, Binary, Call, Expr, ExprVisitor, Grouping, Literal, Logical, Unary, Variable } from "./expr";
import { Token, TokenType } from "./scanner";

export class Interpreter implements ExprVisitor<unknown> {
  interpret(expression: Expr) {
    try {
      const value = this.evaluate(expression);
      console.log(value);
    } catch(err) {
      Lox.runtimeError(err as RuntimeError);
    }
  }

  visitAssignExpr(expr: Assign): unknown {
    throw new Error("Method not implemented.");
  }
  visitBinaryExpr(expr: Binary): unknown {
    const left = this.evaluate<number>(expr.left);
    const right = this.evaluate<number>(expr.right);
    switch(expr.operator.type) {
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL:
        return this.isEqual(left, right);
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return left > right;
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return left >= right;
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return left < right;
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return left <= right;
      case TokenType.PLUS: {
        if (typeof left === 'number' && typeof right === 'number') {
          this.checkNumberOperands(expr.operator, left, right);
          return left + right;
        }
        if (typeof left === 'string' && typeof right === 'string') {
          return left + right;
        }
        throw new RuntimeError(expr.operator, "Operands must be either number or string")
        break;
      }
      case TokenType.MINUS:
        return left - right
      case TokenType.SLASH:
        return left / right;
      case TokenType.STAR:
        return left * right
    }

    return null;
  }
  visitCallExpr(expr: Call): unknown {
    throw new Error("Method not implemented.");
  }
  visitGroupingExpr(expr: Grouping): unknown {
    return this.evaluate(expr);
  }
  visitLiteralExpr(expr: Literal): unknown {
    return expr.value;
  }
  visitLogicalExpr(expr: Logical): unknown {
    throw new Error("Method not implemented.");
  }
  visitUnaryExpr(expr: Unary): unknown {
    const right = this.evaluate<number>(expr.right);
    switch(expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right)
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -right;
    }
    return null;
  }
  visitVariableExpr(expr: Variable): unknown {
    throw new Error("Method not implemented.");
  }

  private isTruthy(value: unknown): boolean {
    if (value === null) return false;
    if (typeof value === 'boolean') return value;
    return true;
  }

  private evaluate<T>(expr: Expr) {
    return expr.accept(this) as T;
  }

  private isEqual(a: unknown, b: unknown) {
    if (a === null && b === null) return true;
    if (a === null) return false;
    return a === b;
  }

  private checkNumberOperand(operator: Token, operand: unknown) {
    if (typeof operand == 'number') return;
    throw new RuntimeError(operator, "Operand must be a number");
  }

  private checkNumberOperands(operator: Token, a: unknown, b: unknown) {
    if (typeof a == 'number' && typeof b === 'number') return;
    throw new RuntimeError(operator, "Operands must be a number");
  }
}

export class RuntimeError {
  token: Token;
  message: string;
  constructor(token: Token, message: string) {
    this.token = token;
    this.message = message;
  }

  getMessage() {
    return this.message;
  }
}