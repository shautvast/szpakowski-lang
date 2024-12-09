import {parse} from "./parser";
import {
  BANG,
  BANG_EQUAL,
  EQUAL_EQUAL,
  GREATER,
  GREATER_EQUAL,
  LESS,
  LESS_EQUAL,
  MINUS,
  PLUS,
  SLASH,
  STAR
} from "./scanner";
import {atan, cos, random, sin, tan} from "./functions";

export function interpret(init_env, code) {
  const log_console = document.getElementById("log");
  let {canvas, tx, ty, tangle, unit, width, height} = init_env;
  init_env.PI = Math.PI;
  const UP = "UP";
  const DOWN = "DOWN";
  const LEFT = "LEFT";
  const RIGHT = "RIGHT";
  const BOTH = "BOTH";

  Object.assign(init_env, {UP, DOWN, LEFT, RIGHT, BOTH});
  const x0 = width / 2;
  const y0 = height / 4;

  let THIS = {
    current_environment: init_env,

    execute: (statement) => {
      statement.accept(THIS);
    },

    visitBlockStatement: (statements) => {
      THIS.executeBlock(statements, {enclosing: THIS.current_environment});
    },

    visitParametrizedBlock: (argList, statements) => {
      let args = argList.map(THIS.evaluate);
      let start, end;
      if (args.length === 2) {
        start = args[0];
        end = args[1];
      } else {
        start = 0;
        end = args[0];
      }
      let previous = THIS.current_environment;
      THIS.current_environment = {enclosing: previous};
      try {
        for (let i = start; i < end; i++) {
          THIS.current_environment.it = i;
          for (let i = 0; i < statements.length; i++) {
            THIS.execute(statements[i]);
          }
        }
      } finally {
        THIS.current_environment = previous;
      }
    },

    visitExpressionStatement: (expression) => {
      THIS.evaluate(expression);
    },

    visitVariableStatement: (name, initializer) => {
      let value = undefined;
      if (initializer) {
        value = THIS.evaluate(initializer);
      }
      THIS.current_environment[name.lexeme] = value;
    },

    visitPrintStatement: (expression) => {
      let value = THIS.evaluate(expression);
      log_console.innerText = THIS.stringify(value);
    },

    visitCallStatement: (fun, argList) => {
      let args = argList.map(THIS.evaluate);
      switch (fun) {
        case "start":
          THIS.start(...args);
          break;
        case "go":
          THIS.go(...args);
          break;
        case "turn":
          THIS.turn(...args);
          break;
        case "left":
          THIS.left(...args);
          break;
        case "right":
          THIS.right(...args);
          break;
        case "pillars":
          THIS.pillars(...args);
          break;
        case "moving_pillars":
          THIS.moving_pillars(...args);
          break;
        case "staircase":
          THIS.staircase(...args);
          break;
        default:
          throw "Unknown function: " + fun;
      }
    },

    visitCallFunction: (name, argList) => {
      let args = argList.map(THIS.evaluate);
      switch (name) {
        case "random":
          return random(...args);
        case "cos":
          return cos(...args);
        case "sin":
          return sin(...args);
        case "tan":
          return tan(...args);
        case "atan":
          return atan(...args);
      }
    },

    start: (x, y) => {
      tx = x * unit;
      ty = y * unit;
      tangle = 0;
      canvas.beginPath();
      canvas.moveTo(x0 + tx, y0 + ty);
    },

    go: (distance) => {
      tx += distance * unit * Math.cos(tangle);
      ty += distance * unit * Math.sin(tangle);
      canvas.lineTo(x0 + tx, y0 + ty);
      canvas.stroke();
    },

    turn: (degrees) => {
      tangle += degrees * Math.PI / 180;
    },

    left: (degrees) => {
      THIS.turn(-degrees);
    },

    right: (degrees) => {
      THIS.turn(degrees);
    },

    pillars: (number, length, shift = 0, direction = UP) => {
      for (let i = 0; i < number; i++) {
        THIS.turn(-90);
        THIS.go(direction === DOWN ? -length : length);
        THIS.turn(90);
        THIS.go(1);
        THIS.turn(90);
        if (direction === BOTH) {
          length += shift;
        }
        THIS.go(direction === DOWN ? -length : length);
        THIS.turn(-90);
        THIS.go(1);
        length += shift;
      }
    },

    moving_pillars: (n, length, shift = 0, direction = DOWN) => {
      let length2 = length;
      length += shift;
      for (let i = 0; i < n; i++) {
        THIS.turn(-90);
        THIS.go(direction === UP ? -length2 : length2);
        THIS.turn(90);
        THIS.go(1);
        THIS.turn(90);
        THIS.go(direction === UP ? -length : length);
        THIS.turn(-90);
        THIS.go(1);
      }
    },

    staircase: (number_of_steps, size, direction = DOWN) => {
      const angle = direction === DOWN ? 90 : -90;
      for (let i = 0; i < number_of_steps; i++) {
        THIS.go(size);
        THIS.turn(angle);
        THIS.go(size);
        THIS.turn(-angle);
      }
    },

    executeBlock: (statements, environment) => {
      let previous = THIS.current_environment;
      try {
        THIS.current_environment = environment;
        for (let i = 0; i < statements.length; i++) {
          THIS.execute(statements[i]);
        }
      } finally {
        THIS.current_environment = previous;
      }
    },

    visitBinaryExpr: (operator, l, r) => {
      let left = THIS.evaluate(l);
      let right = THIS.evaluate(r);

      switch (operator.type) {
        case MINUS:
          return left - right;
        case SLASH:
          return left / right;
        case STAR:
          return left * right;
        case PLUS:
          if (typeof left === 'number' && typeof right === 'number') {
            return left + right;
          } else {
            return THIS.stringify(left) + THIS.stringify(right);
          }
        case GREATER:
          return left > right;
        case GREATER_EQUAL:
          return left >= right;
        case LESS:
          return left < right;
        case LESS_EQUAL:
          return left <= right;
        case BANG_EQUAL:
          return left !== right;
        case EQUAL_EQUAL:
          return left === right;
      }
      throw "?";
    },

    visitGroupingExpr: (expr) => {
      return THIS.evaluate(expr);
    },

    visitLiteralExpr: (value) => {
      return value;
    },

    visitUnaryExpr: (operator, right_expr) => {
      let right = THIS.evaluate(right_expr);

      switch (operator.type) {
        case MINUS:
          return -right;
        case BANG:
          return !right;
        default:
          return undefined;
      }
    },

    visitVariableExpr: (name) => {
      return THIS.current_environment[name.lexeme];
    },

    visitAssignExpr: (name, value_expr) => {
      let value = THIS.evaluate(value_expr);
      THIS.current_environment[name] = value;
      return value;
    },

    evaluate: (expr) => {
      return expr.accept(THIS);
    },

    stringify: (value) => {
      if (value === undefined || value === null) {
        return "nil";
      }
      return value.toString();
    }
  };

  const statements = parse(code);
  for (let i = 0; i < statements.length; i++) {
    // console.log(statements[i]);
    THIS.execute(statements[i]);
  }
}

