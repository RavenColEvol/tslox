import { Lox } from "./index";

enum TokenType {
  // Single-character tokens.
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  LEFT_BRACE = 'LEFT_BRACE',
  RIGHT_BRACE = 'RIGHT_BRACE',
  COMMA = 'COMMA',
  DOT = 'DOT',
  MINUS = 'MINUS',
  PLUS = 'PLUS',
  SEMICOLON = 'SEMICOLON',
  SLASH = 'SLASH',
  STAR = 'STAR',

  // One or two character tokens.
  BANG = 'BANG',
  BANG_EQUAL = 'BANG_EQUAL',
  EQUAL = 'EQUAL',
  EQUAL_EQUAL = 'EQUAL_EQUAL',
  GREATER = 'GREATER',
  GREATER_EQUAL = 'GREATER_EQUAL',
  LESS = 'LESS',
  LESS_EQUAL = 'LESS_EQUAL',

  // Literals.
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',

  // Keywords.
  AND = 'AND',
  CLASS = 'CLASS',
  ELSE = 'ELSE',
  FALSE = 'FALSE',
  FUN = 'FUN',
  FOR = 'FOR',
  IF = 'IF',
  NIL = 'NIL',
  OR = 'OR',
  PRINT = 'PRINT',
  RETURN = 'RETURN',
  SUPER = 'SUPER',
  THIS = 'THIS',
  TRUE = 'TRUE',
  VAR = 'VAR',
  WHILE = 'WHILE',

  EOF = 'EOF'
}

class Token {
  type: TokenType;
  lexeme: string;
  literal: unknown;
  line: number;

  constructor(type: TokenType, lexeme: string, literal: unknown, line: number) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  toString() {
    return this.type + ' ' + this.lexeme + ' ' + this.literal;
  }
}

const KEYWORDS: [string, TokenType][] = [
  ['and', TokenType.AND], 
  ['class', TokenType.CLASS], 
  ['else', TokenType.ELSE], 
  ['false', TokenType.FALSE], 
  ['for', TokenType.FOR], 
  ['fun', TokenType.FUN], 
  ['if', TokenType.IF], 
  ['nil', TokenType.NIL], 
  ['or', TokenType.OR], 
  ['print', TokenType.PRINT], 
  ['return', TokenType.RETURN], 
  ['super', TokenType.SUPER], 
  ['this', TokenType.THIS], 
  ['true', TokenType.TRUE], 
  ['var', TokenType.VAR], 
  ['while', TokenType.WHILE],
]

export class Scanner {
  source: string;
  tokens: Token[];

  start: number;
  current: number;
  line: number = 1;

  keywords: Map<string, TokenType>

  constructor(source: string) {
    this.source = source;
    this.keywords = new Map(KEYWORDS)
    this.tokens = []
    this.start = 0;
    this.current = 0;
  }

  scanTokens() {
    while(!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, '', null, this.line));
    return this.tokens;
  }

  isAtEnd() {
    return this.current >= this.source.length;
  }

  scanToken() {
    const c = this.advance();
    switch(c) {
      case '(': this.addToken(TokenType.LEFT_PAREN); break;
      case ')': this.addToken(TokenType.RIGHT_PAREN); break;
      case '{': this.addToken(TokenType.LEFT_BRACE); break;
      case '}': this.addToken(TokenType.RIGHT_BRACE); break;
      case ',': this.addToken(TokenType.COMMA); break;
      case '.': this.addToken(TokenType.DOT); break;
      case '-': this.addToken(TokenType.MINUS); break;
      case '+': this.addToken(TokenType.PLUS); break;
      case ';': this.addToken(TokenType.SEMICOLON); break;
      case '*': this.addToken(TokenType.STAR); break;
      case '!': {
        this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      }
      case '=': {
        this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
        break;
      }
      case '<': {
        this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      }
      case '>': {
        this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
        break;
      }
      case '/': {
        if (this.match('/')) {
          while(this.peek() != '\n' && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      }
      case ' ':
      case '\r':
      case '\t': {
        break;
      }
      case '\n': {
        this.line++;
        break;
      }
      case '"': {
        this.string();
        break;
      }
      default: {
        if (this.isDigit(c)) {
          this.number();
        } else if(this.isAlphaNumeric(this.peek())) {
          this.identifier();
        }else {
          Lox.error(this.line, "Unexpected character.");
        }
        break;
      }
    }
  }

  advance() {
    this.current++;
    return this.source[this.current - 1];
  }

  addToken(type: TokenType) {
    this.addTokenLiteral(type, null);
  }

  addTokenLiteral(type: TokenType, literal: unknown) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line));
  }

  private match(expected: string) {
    const { source, current } = this;
    if (this.isAtEnd()) return false;
    if (source[current] != expected) return false;
    this.current++
    return true;
  }

  private peek() {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  private string() {
    while(this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') this.line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      Lox.error(this.line, "Unterminated string.");
      return;
    }
    this.advance();
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addTokenLiteral(TokenType.STRING, value);
  }

  private isDigit(c: string) {
    return c >= '0' && c <= '9'
  }

  private number() {
    while(this.isDigit(this.peek())) this.advance();
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance();
      while(this.isDigit(this.peek())) this.advance();
    }

    this.addTokenLiteral(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)))
  }

  private peekNext() {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.current + 1);
  }

  private identifier() {
    while(this.isAlpha(this.peek())) this.advance();
    const text = this.source.substring(this.start, this.current);
    let type = this.keywords.get(text);
    if (!type) type = TokenType.IDENTIFIER
    this.addToken(type!);
  }

  private isAlpha(c: string) {
    return (c >= 'a' && c <= 'z') ||
          (c >= 'A' && c <= 'Z') ||
          c == '_'
  }

  private isAlphaNumeric(c: string) {
    return this.isAlpha(c) || this.isDigit(c)
  }
}