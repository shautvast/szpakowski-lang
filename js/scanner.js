export const scan = (source) => {
  const tokens = [];
  let start = 0;
  let current = 0;
  let line = 1;

  const scan_tokens = () => {
    while (!is_at_end()) {
      start = current;
      scan_token();
    }

    tokens.push({type: EOF, lexeme: "EOF", line: line});
    return tokens;
  };

  const is_at_end = () => {
    return current >= source.length;
  }

  const advance = () => {
    return source.charAt(current++);
  }

  const add_token = (type, literal) => {
    tokens.push({type: type, lexeme: source.substring(start, current), literal: literal, line: line});
  }

  const scan_token = () => {
    let c = advance();
    switch (c) {
      case '(':
        add_token(LEFT_PAREN);
        break;
      case ')':
        add_token(RIGHT_PAREN);
        break;
      case '{':
        add_token(LEFT_BRACE);
        break;
      case '}':
        add_token(RIGHT_BRACE);
        break;
      case ',':
        add_token(COMMA);
        break;
      case '.':
        add_token(DOT);
        break;
      case '-':
        add_token(MINUS);
        break;
      case '+':
        add_token(PLUS);
        break;
      case ';':
        add_token(SEMICOLON);
        break;
      case '*':
        add_token(STAR);
        break;
      case '!':
        add_token(match('=') ? BANG_EQUAL : BANG);
        break;
      case '=':
        add_token(match('=') ? EQUAL_EQUAL : EQUAL);
        break;
      case '<':
        add_token(match('=') ? LESS_EQUAL : LESS);
        break;
      case '>':
        add_token(match('=') ? GREATER_EQUAL : GREATER);
        break;
      case '/':
        if (match('/')) {
          while (peek() !== '\n' && !is_at_end()) {
            advance();
          }
        } else {
          add_token(SLASH);
        }
        break;
      case ' ':
      case '\r':
      case '\t':
        break;
      case '\n':
        line++;
        break;
      case '"':
        string();
        break;
      default:
        if (is_digit(c)) {
          number();
        } else if (is_alpha(c)) {
          identifier();
        } else {
          throw error(line, "Unexpected character");
        }
    }
  }

  const identifier = () => {
    while (is_alphaNumeric(peek())) {
      advance();
    }
    let text = source.substring(start, current);
    let type = keywords.get(text);
    if (type === undefined) {
      type = functions.get(text);
    }
    if (type === undefined) {
      type = IDENTIFIER;
    }
    add_token(type);
  }

  const is_alphaNumeric = (c) => {
    return is_alpha(c) || is_digit(c);
  }

  const is_alpha = (c) => {
    return typeof c === 'string' && (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  }

  const number = () => {
    while (is_digit(peek())) {
      advance();
    }

    if (peek() === '.' && is_digit(peekNext())) {
      advance();
    }

    while (is_digit(peek())) {
      advance();
    }

    add_token(NUMBER, source.substring(start, current));
  }

  const string = () => {
    while (peek() !== '"' && !is_at_end()) {
      if (peek() === '\n') {
        line++;
      }
      advance();
    }

    if (is_at_end()) {
      throw new Error(error(line, "Unterminated string"));
    }

    advance();

    let value = source.substring(start + 1, current - 1);
    // console.log("string " + value);
    add_token(STRING, value);
  }

  const peekNext = () => {
    return source.charAt(current + 1);
  }

  const is_digit = (c) => {
    return typeof c === 'string' && c >= '0' && c <= '9';
  }

  const peek = () => {
    if (is_at_end()) {
      return '\0';
    }
    return source.charAt(current);
  }

  const match = (expected) => {
    if (is_at_end()) {
      return false;
    }
    if (source.charAt(current) !== expected) {
      return false;
    }
    current++;
    return true;
  }

  return scan_tokens();
}

export const error = (token, message) => {
  if (token.type === EOF) {
    return report(token.line, " at end", message);
  } else {
    return report(token.line, "", message);
  }
}

export const report = (line, where, message) => {
  return ("[line " + line + "] Error" + where + ": " + message);
}

export const LEFT_PAREN = 1;
export const RIGHT_PAREN = 2;
export const LEFT_BRACE = 3;
export const RIGHT_BRACE = 4;
export const COMMA = 5;
export const DOT = 6;
export const MINUS = 7;
export const PLUS = 8;
export const SEMICOLON = 9;
export const SLASH = 10;
export const STAR = 11;
export const BANG = 12;
export const BANG_EQUAL = 13;
export const EQUAL = 14;
export const EQUAL_EQUAL = 15;
export const GREATER = 16;
export const GREATER_EQUAL = 17;
export const LESS = 18;
export const LESS_EQUAL = 19;
export const IDENTIFIER = 20;
export const STRING = 21;
export const NUMBER = 22;
export const AND = 23;
export const ELSE = 24;
export const FALSE = 25;
export const FUN = 26;
export const FOR = 27;
export const IF = 28;
export const OR = 30;
export const PRINT = 31;
export const RETURN = 32;
export const TRUE = 33;
export const VAR = 34;
export const WHILE = 35;
export const EOF = 36;
export const START = 37;
export const GO = 38;
export const TURN = 39;
export const LEFT = 40;
export const RIGHT = 41;
export const PILLARS = 42;
export const MOVING_PILLARS = 43;
export const STAIRCASE = 44;
export const REPEAT = 45;
export const RANDOM = 46;
export const COS = 47;
export const SIN = 48;
export const TAN = 49;
export const ATAN = 50;

export const keywords = new Map([
  ["and", AND],
  ["else", ELSE],
  ["false", FALSE],
  ["fun", FUN],
  ["for", FOR],
  ["if", IF],
  ["or", OR],
  ["print", PRINT],
  ["return", RETURN],
  ["true", TRUE],
  ["var", VAR],
  ["while", WHILE],
  ["start", START],
  ["go", GO],
  ["turn", TURN],
  ["left", LEFT],
  ["right", RIGHT],
  ["pillars", PILLARS],
  ["moving_pillars", MOVING_PILLARS],
  ["staircase", STAIRCASE],
  ["repeat", REPEAT],
  ["random", RANDOM],
]);

export const functions = new Map([
  ["random", RANDOM],
  ["cos", COS],
  ["sin", SIN],
  ["tan", TAN],
  ["atan", ATAN],
]);

