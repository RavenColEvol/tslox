import { Assign, Binary, Call, Expr, ExprVisitor, Grouping, Literal, Logical, Unary, Variable } from "./expr";
import { Token, TokenType } from "./scanner";

export class AstPrinter implements ExprVisitor<string> {
  print(expr: Expr) {
    return expr.accept(this);
  }

  visitAssignExpr(expr: Assign) {
    return '';
  }
  visitBinaryExpr(expr: Binary) {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }
  visitCallExpr(expr: Call) {
    return ''
  }
  visitGroupingExpr(expr: Grouping) {
    return this.parenthesize('group', expr.expression);
  }
  visitLiteralExpr(expr: Literal) {
    if (!expr.value) return 'nil'
    return expr.value.toString();
  }
  visitLogicalExpr(expr: Logical) {
    return ''
  }
  visitUnaryExpr(expr: Unary) {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }
  visitVariableExpr(expr: Variable) {
    return ''
  }
  private parenthesize(name: string, ...exprs: Expr[]): string{
    return `(${name} ${exprs.map(exp => ` ${exp.accept(this)}`)})`
  }
}

// const expr = new Binary(
//   new Unary(
//     new Token(TokenType.MINUS, '-', null, 1),
//     new Literal(123),
//   ),
//   new Token(TokenType.STAR, '*', null, 1),
//   new Grouping(
//     new Literal(45.67)
//   )
// )

// console.log(new AstPrinter().print(expr));