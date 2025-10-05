import { Lox } from ".";
import { Assign, Binary, Expr, Grouping, Literal, Unary, Variable } from "./expr";
import { Token, TokenType } from "./scanner";
import { Block, Expression, Print, Stmt, Var } from "./stmt";

export class Parser {
  current: number;
  tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.current = 0;
  }

  parse() {
    const statements: Stmt[] = [];
    while(!this.isAtEnd()) {
      const declaration = this.declaration();
      if (declaration) {
        statements.push(declaration);
      }
    }
    return statements;
  }

  private declaration() {
    try {
      if (this.match(TokenType.VAR)) {
        return this.varDeclaration();
      }
      return this.statement();
    } catch(error) {
      this.synchronize();
      return null;
    }
  }

  private varDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

    let initializer = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration");
    return new Var(name, initializer);
  }

  private statement() {
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.LEFT_BRACE)) return this.block();
    return this.expressionStatement();
  }

  private block(): Stmt {
    const statements: Stmt[] = [];
    while(!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const declaration = this.declaration();
      if (!declaration) continue;
      statements.push(declaration);
    }
    this.consume(TokenType.RIGHT_BRACE, `Expect '}' after block.`);
    return new Block(statements);
  }

  private printStatement() {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Print(value);
  }

  private expressionStatement() {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Expression(expr);
  }

  private expression() {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.equality();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof Variable) {
        const name = expr.name;
        return new Assign(name, value);
      }
      this.error(equals, "Invalid assignment target.")
    }

    return expr;
  }

  private equality() {
    let expr = this.comparison();

    while(this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new Binary(expr, operator, right)
    }

    return expr;
  }

  private comparison() {
    let expr = this.term();

    while(this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.term();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private term() {
    let expr = this.factor();

    while(this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private factor() {
    let expr = this.unary();

    while(this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new Unary(operator, right);
    }
    return this.primary();
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) return new Literal(false);
    if (this.match(TokenType.TRUE)) return new Literal(true);
    if (this.match(TokenType.NIL)) return new Literal(null);
    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Literal(this.previous().literal);
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return new Variable(this.previous())
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression.")
      return new Grouping(expr);
    }

    throw this.error(this.peek(), "Expect expression")
  }

  private synchronize() {
    this.advance();

    while(!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;
      
      switch(this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string) {
    Lox.parseError(token, message);
    return new ParseError();
  }

  private match(...tokenTypes:TokenType[]) {
    for(const tokenType of tokenTypes) {
      if (this.check(tokenType)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  private previous() {
    return this.tokens[this.current - 1];
  }

  private peek() {
    return this.tokens[this.current];
  }
}

export class ParseError {

}