import { Interpreter, RuntimeError } from "./interpreter";
import { Parser } from "./parser";
import { Scanner, Token, TokenType } from "./scanner";
import { readFileSync } from 'fs';
export class Lox {
  static hadError = false;
  static hadRuntimeError = false;

  constructor(...args: string[]) {
    const { runFile, runPrompt } = this;
    if (args.length > 1) {
      console.log('Usage: tslox');
      process.exit(64);
    } else if (args.length === 1) {
      runFile(args[0])
    } else {
      runPrompt();
    }
  }

  runFile(path: string) {
    const source = readFileSync(path, {
      encoding: 'utf-8'
    });
    const tokens = this.run(source);
    if (Lox.hadError) {
      process.exit(65);
    }
    if (Lox.hadRuntimeError) {
      process.exit(70);
    }
  }

  runPrompt() {

  }

  run(source: string) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();
    const statements = new Parser(tokens).parse();
    if (!statements) return;
    const interpreter = new Interpreter();
    interpreter.interpret(statements)
  }

  static error(line: number, message: string) {
    Lox.report(line, "", message);
  }

  static parseError(token: Token, message: string) {
    if (token.type === TokenType.EOF) {
      Lox.report(token.line, "at end", message);
    } else {
      Lox.report(token.line, "at '" + token.lexeme + "'", message);
    }
  }

  static runtimeError(err: RuntimeError) {
    console.log(err.getMessage() + `\n[line ${err.token.line}]`)
    Lox.hadRuntimeError = true;
  }

  static report(line: number, where: string, message: string) {
    console.log(
      `[line ${line}] Error ${where}: ${message}`
    )
    Lox.hadError = true;
  }
}

const lox = new Lox();
lox.run(`
var a = 0;
var temp;
for (var b = 1; a < 10000; b = temp + b) {
  print a;
  temp = a;
  a = b;
}
`);