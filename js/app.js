"use strict";
import {interpret} from "./interpreter.js";

(function () {
  const command_input_element = document.getElementById('command_input');
  const canvas_element = document.getElementById('canvas');
  const canvas = canvas_element.getContext('2d');
  const width = canvas_element.width = window.innerWidth;
  const height = canvas_element.height = window.innerHeight;
  canvas.fillStyle = 'white';
  canvas.strokeStyle = 'black';
  canvas.lineWidth = 2;

  const help_element = document.getElementById('help');
  let script;

  document.body.onkeydown = function (event) {
    if (event.key === 'Tab') {
      event.preventDefault();
    }
  }

  const help = [
    {v1: "start(x,y)", v2: "start(0,0);"},
    {v1: "go(distance)", v2: "go(1);"},
    {v1: "turn(angle)", v2: "turn(90);"},
    {v1: "left(angle)", v2: "left(90);"},
    {v1: "right(angle)", v2: "right(90);"},
    {v1: "pillars(number, length, shift = 0, direction = UP)", v2: "pillars(3, 10, 0, DOWN);"},
    {v1: "moving_pillars(number, length, shift = 0, direction = DOWN)", v2: "moving_pillars(3, 10, 0, DOWN);"},
    {v1: "staircase(number, size, direction = DOWN)", v2: "staircase(3, 1, DOWN);"},
    {v1: "repeat([start], end){...}", v2: "repeat(5){\n}"},
  ];
  const slices = {};
  for (let i = 0; i < help.length; i++) {
    for (let j = 1; j < help[i].v1.length; j++) {
      const sub = help[i].v1.substring(0, j);
      if (!slices[sub]) {
        slices[sub] = [];
      }
      slices[sub].push(help[i]);
    }
    slices[help[i].v1] = [help[i]];
  }

  let tx = 0;
  let ty = 0;
  let tangle = 0;

  document.onkeyup = function (event) {
    if (event.key === 'Tab') {
      const script = command_input_element.value;
      event.preventDefault();
      const cursor_position = command_input_element.selectionStart;
      const textUpToCursor = script.slice(0, cursor_position);
      const startOfLine = textUpToCursor.lastIndexOf('\n') + 1;
      const endOfLine = script.indexOf('\n', cursor_position);
      const lineEndPosition = endOfLine === -1 ? script.length : endOfLine;
      const currentLineText = script.slice(startOfLine, lineEndPosition).trim();

      if (slices[currentLineText]) {
        const helpOptions = slices[currentLineText].map(x => x.v2);
        const firstOption = helpOptions[0];

        command_input_element.value = script.slice(0, startOfLine) + firstOption + script.slice(lineEndPosition);
        command_input_element.setSelectionRange(startOfLine + firstOption.length, startOfLine + firstOption.length);
        command_input_element.focus();
        help_element.style.visibility = 'hidden';
        refresh();
      }
    }
  };

  function refresh() {
    script = command_input_element.value;

    try {
      canvas.clearRect(0, 0, width, height);
      interpret({canvas: canvas, x: tx, y: ty, angle: tangle, unit: 10, width:width, height:height}, script);
    } catch (Exception) {
    }
  }

  command_input_element.onkeyup = function handle_key_input(event) {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      script = command_input_element.value;

      help_element.style.visibility = 'hidden';
      const cursor_position = command_input_element.selectionStart;
      const textUpToCursor = script.slice(0, cursor_position);
      const startOfLine = textUpToCursor.lastIndexOf('\n') + 1;

      const endOfLine = script.indexOf('\n', cursor_position);
      const lineEndPosition = endOfLine === -1 ? script.length : endOfLine;

      const currentLineText = script.slice(startOfLine, lineEndPosition);
      if (currentLineText.length > 0) {
        const command = currentLineText.trim();
        if (slices[command]) {
          const help = slices[command].map(x => x.v1);
          const help_text = help.join('\n');

          const computedStyle = window.getComputedStyle(command_input_element);
          const fontSize = parseFloat(computedStyle.fontSize);
          const lineHeight = computedStyle.lineHeight === 'normal' ? fontSize * 1.2 : parseFloat(computedStyle.lineHeight);

          const textBounding = command_input_element.getBoundingClientRect();
          const topPosition = textBounding.top + window.scrollY;// + (cursor_position - startOfLine) * lineHeight/ script.split('\n').length;

          help_element.style.visibility = 'visible';
          help_element.style.left = `${textBounding.left + window.scrollX}px`;
          help_element.style.top = `${topPosition - help_element.offsetHeight}px`;
          help_element.innerHTML = help_text;
          help_element.style.display = 'block';
        }
      }
      refresh();
    }
  };

  refresh();
})();
