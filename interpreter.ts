import { Lox } from ".";
import { Environment } from "./environment";
import { Assign, Binary, Call, Expr, ExprVisitor, Grouping, Literal, Logical, Unary, Variable } from "./expr";
import { Token, TokenType } from "./scanner";
import { Block, Expression, Function, If, Print, Return, Stmt, StmtVisitor, Var, While } from "./stmt";

export class Interpreter implements ExprVisitor<unknown>, StmtVisitor<unknown> {
  environment: Environment = new Environment();
  interpret(statements: Stmt[]) {
    try {
      for(const statement of statements) {
        this.execute(statement);
      }
    } catch(err) {
      Lox.runtimeError(err as RuntimeError);
    }
  }

  private execute(statement: Stmt) {
    statement.accept(this);
  }

  private executeBlock(statements: Stmt[], environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;
      for(const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  visitAssignExpr(expr: Assign): unknown {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
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
    const left = this.evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
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
    return this.environment.get(expr.name);
  }

  visitBlockStmt(statement: Block): unknown {
    this.executeBlock(statement.statements, new Environment(this.environment));
    return null;
  }

  visitExpressionStmt(stmt: Expression): unknown {
    this.evaluate(stmt.expression);
    return null;
  }
  visitFunctionStmt(expr: Function): unknown {
    throw new Error("Method not implemented.");
  }
  visitIfStmt(stmt: If): unknown {
    if (this.evaluate(stmt.condition)) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch != null) {
      this.execute(stmt.elseBranch);
    }
    return null;
  }
  visitPrintStmt(stmt: Print): unknown {
    const value = this.evaluate(stmt.expression);
    console.log(value);
    return null;
  }
  visitReturnStmt(expr: Return): unknown {
    throw new Error("Method not implemented.");
  }
  visitVarStmt(stmt: Var): unknown {
    let value = null;
    if (stmt.initializer != null) {
      value = this.evaluate(stmt.initializer);
    }
    this.environment.define(stmt.name.lexeme, value);
    return null;
  }
  visitWhileStmt(stmt: While): unknown {
    while(this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
    return null;
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