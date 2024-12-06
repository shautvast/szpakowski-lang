import "./scanner";
import {
  scan, error,
  BANG, BANG_EQUAL, EOF,
  EQUAL, EQUAL_EQUAL,
  FALSE, GREATER,
  GREATER_EQUAL, IDENTIFIER,
  LEFT_BRACE, LEFT_PAREN, LESS,
  LESS_EQUAL, MINUS, NUMBER, PLUS,
  PRINT, RIGHT_BRACE, RIGHT_PAREN,
  SEMICOLON, SLASH, STAR, STRING, TRUE, VAR, START, COMMA, GO, STAIRCASE, PILLARS, MOVING_PILLARS, LEFT, RIGHT, TURN
} from "./scanner";

export function parse(code) {
  const tokens = scan(code);
  // console.log(tokens);
  let current = 0;

  const parse = () => {
    let statements = [];
    while (!is_at_end()) {
      statements.push(declaration());
    }
    return statements;
  }

  const declaration = () => {
    if (match(VAR)) {
      return varDeclaration();
    }
    return statement();
  }

  const varDeclaration = () => {
    const name = consume(IDENTIFIER, "Expected a variable name");
    let initializer;
    if (match(EQUAL)) {
      initializer = expression();
    }
    consume(SEMICOLON, "Expected semicolon");
    return {accept: (visitor) => visitor.visitVariableStatement(name, initializer)};
  }

  const statement = () => {
    if (match(PRINT)) {
      return printStatement();
    }
    if (match(START)) {
      return callStatement("start");
    }
    if (match(GO)) {
      return callStatement("go");
    }
    if (match(LEFT)) {
      return callStatement("left");
    }
    if (match(RIGHT)) {
      return callStatement("right");
    }
    if (match(TURN)) {
      return callStatement("turn");
    }
    if (match(STAIRCASE)) {
      return callStatement("staircase");
    }
    if (match(PILLARS)) {
      return callStatement("pillars");
    }
    if (match(MOVING_PILLARS)) {
      return callStatement("moving_pillars");
    }
    if (match(LEFT_BRACE)) {
      return {accept: (visitor) => visitor.visitBlockStatement(block())};
    }

    return expressionStatement();
  }

  const expression = () => {
    return assignment();
  }

  const expressions = () => {
    consume(LEFT_PAREN, "Expect '('");
    let exprs = [expression()];
    while (match(COMMA)) {
      exprs.push(expression());
    }
    consume(RIGHT_PAREN, "Expect ')'");
    return exprs;
  }

  const assignment = () => {
    let expr = equality();
    if (match(EQUAL)) {
      let equals = previous();
      let value = assignment();

      if (expr.class === 'Variable') {
        let name = expr.name;
        return {accept: (visitor) => visitor.visitAssignExpr(name, value)};
      }

      throw error(equals, "Invalid assignment target.");
    }
    return expr;
  }

  const printStatement = () => {
    const value = expression();
    consume(SEMICOLON, "Expected semicolon");
    return {accept: (visitor) => visitor.visitPrintStatement(value)};
  }

  const callStatement = (name) => {
    const values = expressions();
    consume(SEMICOLON, "Expected semicolon");
    return {accept: (visitor) => visitor.visitCallStatement(name, values)};
  }

  const expressionStatement = () => {
    const value = expression();
    consume(SEMICOLON, "Expected semicolon");
    return {accept: (visitor) => visitor.visitExpressionStatement(value)};
  }

  const block = () => {
    let statements = [];
    while (!check(RIGHT_BRACE) && !is_at_end()) {
      statements.push(declaration());
    }
    consume(RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  const equality = () => {
    let expr = comparison();
    while (match(BANG_EQUAL, EQUAL_EQUAL)) {
      let operator = previous();
      let right = comparison();
      expr = {accept: (visitor) => visitor.visitBinaryExpr(operator, expr, right)};
    }
    return expr;
  }

  const comparison = () => {
    let expr = term();
    while (match(GREATER, GREATER_EQUAL, LESS, LESS_EQUAL)) {
      let operator = previous();
      let right = term();
      expr = {accept: (visitor) => visitor.visitBinaryExpr(operator, expr, right)};
    }
    return expr;
  }

  const term = () => {
    let expr = factor();
    while (match(MINUS, PLUS)) {
      let operator = previous();
      let right = factor();
      expr = {accept: (visitor) => visitor.visitBinaryExpr(operator, expr, right)};
    }
    return expr;
  }

  const factor = () => {
    let expr = unary();
    while (match(SLASH, STAR)) {
      let operator = previous();
      let right = unary();
      expr = {accept: (visitor) => visitor.visitBinaryExpr(operator, expr, right)};
    }
    return expr;
  }

  const unary = () => {
    if (match(BANG, MINUS)) {
      let operator = previous();
      let right = unary();
      return {accept: (visitor) => visitor.visitUnaryExpr(operator, right)};
    }
    return primary();
  }

  const primary = () => {
    if (match(FALSE)) {
      return {accept: (visitor) => visitor.visitLiteralExpr(false)};
    }
    if (match(TRUE)) {
      return {accept: (visitor) => visitor.visitLiteralExpr(true)};
    }
    if (check(NUMBER)) {
      advance();
      let number = parseFloat(previous().literal);
      return {accept: (visitor) => visitor.visitLiteralExpr(number)};
    }
    if (check(STRING)) {
      advance();
      let string = previous().literal;
      return {accept: (visitor) => visitor.visitLiteralExpr(string)};
    }
    if (match(IDENTIFIER)) {
      let identifier = previous();
      return {class: "Variable", accept: (visitor) => visitor.visitVariableExpr(identifier)};
    }
    if (match(LEFT_PAREN)) {
      let expr = expression();
      consume(RIGHT_PAREN, "Expect ')' after expression.");
      return {accept: (visitor) => visitor.visitGroupingExpr(expr)};
    }
    throw error(peek(), "Expect expression.");
  }

  const consume = (type, message) => {
    if (check(type)) {
      return advance();
    }
    throw error(peek(), message);
  }

  const match = (...types) => {
    for (let i = 0; i < types.length; i++) {
      if (check(types[i])) {
        advance();
        return true;
      }
    }
    return false;
  }

  const check = (type) => {
    if (is_at_end()) {
      return false;
    }
    return peek().type === type;
  }

  const advance = () => {
    if (!is_at_end()) {
      current++;
    }
    return previous();
  }

  const is_at_end = () => {
    return peek().type === EOF;
  }

  const peek = () => {
    return tokens[current];
  }

  const previous = () => {
    return tokens[current - 1];
  }

  return parse();
}
