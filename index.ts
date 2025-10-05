import { Parser } from "./parser";
import { Scanner, Token, TokenType } from "./scanner";
import { readFileSync } from 'fs';
export class Lox {
  static hadError = false;

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
    this.run(source);
    if (Lox.hadError) {
      process.exit(65);
    }
  }

  runPrompt() {

  }

  run(source: string) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    return tokens
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

  static report(line: number, where: string, message: string) {
    console.log(
      `[line ${line}] Error ${where}: ${message}`
    )
    Lox.hadError = true;
  }
}

const lox = new Lox();
const tokens = lox.run('1 * 2 / 3');
const scanner = new Parser(tokens);
const expression = scanner.parse();
console.log(expression);