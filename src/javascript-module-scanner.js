export function scanJavaScriptModule(source) {
  if (typeof source !== "string") throw new TypeError("JavaScript module source must be a string.");
  const commentFree = [...source];
  const tokens = [];
  const lineStarts = buildLineStarts(source);
  const state = { source, commentFree, tokens, index: 0, lineStarts };
  scanCode(state, false, 0);

  const staticModuleSpecifiers = [];
  const dynamicImportSpecifiers = [];
  const requireSpecifiers = [];
  const nonLiteralDynamicImports = [];
  const nonLiteralRequires = [];
  const commonJsLoaderUsages = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const previous = tokens[index - 1];
    const commonJsKind = commonJsLoaderKind(tokens, index);
    if (commonJsKind !== null) commonJsLoaderUsages.push(loadFinding(commonJsKind, token, lineStarts));
    if (token.type === "identifier" && token.value === "import" && previous?.value !== ".") {
      const next = tokens[index + 1];
      if (next?.value === ".") continue;
      if (next?.value === "(") {
        const argument = tokens[index + 2];
        const following = tokens[index + 3];
        if (isStringLike(argument) && (following?.value === ")" || following?.value === ",")) {
          dynamicImportSpecifiers.push(argument.value);
        } else {
          nonLiteralDynamicImports.push(loadFinding("dynamic-import", token, lineStarts));
        }
        continue;
      }
      const specifier = firstStaticImportSpecifier(tokens, index + 1);
      if (specifier !== null) staticModuleSpecifiers.push(specifier);
      continue;
    }
    if (token.type === "identifier" && token.value === "export") {
      const specifier = firstStaticExportSpecifier(tokens, index + 1);
      if (specifier !== null) staticModuleSpecifiers.push(specifier);
      continue;
    }
    if (token.type === "identifier" && token.value === "require" && previous?.value !== "." && tokens[index + 1]?.value === "(") {
      const argument = tokens[index + 2];
      const following = tokens[index + 3];
      if (isStringLike(argument) && following?.value === ")") requireSpecifiers.push(argument.value);
      else nonLiteralRequires.push(loadFinding("require", token, lineStarts));
    }
  }

  const sortedStatic = sortedUnique(staticModuleSpecifiers);
  const sortedDynamic = sortedUnique(dynamicImportSpecifiers);
  const sortedRequires = sortedUnique(requireSpecifiers);
  return {
    staticModuleSpecifiers: sortedStatic,
    dynamicImportSpecifiers: sortedDynamic,
    requireSpecifiers: sortedRequires,
    moduleSpecifiers: sortedUnique([...sortedStatic, ...sortedDynamic, ...sortedRequires]),
    nonLiteralDynamicImports,
    nonLiteralRequires,
    nonLiteralLoads: [...nonLiteralDynamicImports, ...nonLiteralRequires].sort((left, right) => left.index - right.index),
    commonJsLoaderUsages,
    stringLiterals: sortedUnique(tokens.filter(isStringLike).map((token) => token.value)),
    tokens,
    commentFreeSource: commentFree.join("")
  };
}

function commonJsLoaderKind(tokens, index) {
  const current = tokens[index];
  const previous = tokens[index - 1];
  const next = tokens[index + 1];
  const afterNext = tokens[index + 2];
  if (current.type === "identifier" && current.value === "createRequire") return "create-require";
  if (current.type === "identifier" && current.value === "require") {
    const propertyAccess = previous?.value === "." || previous?.value === "?.";
    const owner = propertyAccess ? tokens[index - 2]?.value : null;
    const prefix = owner === "module" ? "module-require" : propertyAccess ? "property-require" : "require";
    if (next?.value === "?." && afterNext?.value === "(") return `${prefix}-optional-call`;
    if (next?.value === "(") return prefix;
    return `${prefix}-reference`;
  }
  if (isStringLike(current) && previous?.value === "[" && next?.value === "]") {
    if (current.value === "require") return "computed-require-reference";
    if (current.value === "createRequire") return "computed-create-require-reference";
  }
  return null;
}

function scanCode(state, stopAtTemplateBrace, contextTokenStart) {
  let braceDepth = 0;
  while (state.index < state.source.length) {
    const start = state.index;
    const char = state.source[start];
    const next = state.source[start + 1];
    if (stopAtTemplateBrace && char === "}" && braceDepth === 0) {
      state.index += 1;
      return;
    }
    if (/\s/.test(char)) {
      state.index += 1;
      continue;
    }
    if (char === "/" && next === "/") {
      let end = start + 2;
      while (end < state.source.length && state.source[end] !== "\n" && state.source[end] !== "\r") end += 1;
      maskComment(state.commentFree, start, end);
      state.index = end;
      continue;
    }
    if (char === "/" && next === "*") {
      let end = start + 2;
      while (end < state.source.length && !(state.source[end] === "*" && state.source[end + 1] === "/")) end += 1;
      end = Math.min(state.source.length, end + 2);
      maskComment(state.commentFree, start, end);
      state.index = end;
      continue;
    }
    const previous = state.tokens.length === contextTokenStart ? null : state.tokens.at(-1);
    if (char === "/" && canStartRegex(previous)) {
      state.index = readRegexLiteral(state.source, start);
      continue;
    }
    if (char === "\"" || char === "'") {
      const parsed = readQuotedString(state.source, start, char);
      state.tokens.push(token("string", parsed.value, start, parsed.end));
      state.index = parsed.end;
      continue;
    }
    if (char === "`") {
      scanTemplate(state);
      continue;
    }
    if (/[A-Za-z_$]/.test(char)) {
      let end = start + 1;
      while (end < state.source.length && /[A-Za-z0-9_$]/.test(state.source[end])) end += 1;
      state.tokens.push(token("identifier", state.source.slice(start, end), start, end));
      state.index = end;
      continue;
    }
    if (/[0-9]/.test(char)) {
      let end = start + 1;
      while (end < state.source.length && /[0-9A-Fa-f_xXn.eE+-]/.test(state.source[end])) end += 1;
      state.tokens.push(token("number", state.source.slice(start, end), start, end));
      state.index = end;
      continue;
    }
    const operator = ["===", "!==", "=>", "==", "!=", "?.", "&&", "||", "??"].find((value) => state.source.startsWith(value, start));
    const value = operator || char;
    state.tokens.push(token("punctuator", value, start, start + value.length));
    state.index += value.length;
    if (char === "{") braceDepth += 1;
    else if (char === "}" && braceDepth > 0) braceDepth -= 1;
  }
}

function scanTemplate(state) {
  const start = state.index;
  const placeholderIndex = state.tokens.length;
  state.tokens.push(token("dynamic-template", "", start, start + 1));
  let index = start + 1;
  let value = "";
  let isStatic = true;
  while (index < state.source.length) {
    const char = state.source[index];
    if (char === "\\") {
      const decoded = decodeEscape(state.source, index + 1);
      value += decoded.value;
      index = decoded.end;
      continue;
    }
    if (char === "`") {
      state.index = index + 1;
      state.tokens[placeholderIndex] = token(isStatic ? "template" : "dynamic-template", value, start, state.index);
      return;
    }
    if (char === "$" && state.source[index + 1] === "{") {
      isStatic = false;
      state.index = index + 2;
      scanCode(state, true, state.tokens.length);
      index = state.index;
      continue;
    }
    value += char;
    index += 1;
  }
  state.index = index;
}

function firstStaticImportSpecifier(tokens, start) {
  for (let index = start; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.value === ";" || token.type === "identifier" && ["import", "export"].includes(token.value)) return null;
    if (isStringLike(token)) return token.value;
  }
  return null;
}

function firstStaticExportSpecifier(tokens, start) {
  for (let index = start; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.value === ";" || token.type === "identifier" && ["import", "export"].includes(token.value)) return null;
    if (token.type === "identifier" && token.value === "from" && isStringLike(tokens[index + 1])) return tokens[index + 1].value;
  }
  return null;
}

function readQuotedString(source, start, quote) {
  let index = start + 1;
  let value = "";
  while (index < source.length) {
    const char = source[index];
    if (char === quote) return { value, end: index + 1 };
    if (char === "\\") {
      const decoded = decodeEscape(source, index + 1);
      value += decoded.value;
      index = decoded.end;
      continue;
    }
    value += char;
    index += 1;
  }
  return { value, end: index };
}

function readRegexLiteral(source, start) {
  let index = start + 1;
  let characterClass = false;
  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      index += 2;
      continue;
    }
    if (char === "[") characterClass = true;
    else if (char === "]") characterClass = false;
    else if (char === "/" && !characterClass) {
      index += 1;
      while (index < source.length && /[a-z]/i.test(source[index])) index += 1;
      return index;
    }
    if (char === "\n" || char === "\r") return index;
    index += 1;
  }
  return index;
}

function decodeEscape(source, escapedIndex) {
  const char = source[escapedIndex];
  const simple = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", "0": "\0" };
  if (Object.prototype.hasOwnProperty.call(simple, char)) return { value: simple[char], end: escapedIndex + 1 };
  if (char === "x" && /^[0-9a-fA-F]{2}$/.test(source.slice(escapedIndex + 1, escapedIndex + 3))) {
    return { value: String.fromCodePoint(Number.parseInt(source.slice(escapedIndex + 1, escapedIndex + 3), 16)), end: escapedIndex + 3 };
  }
  if (char === "u") {
    const match = source.slice(escapedIndex + 1).match(/^\{([0-9a-fA-F]+)\}|^([0-9a-fA-F]{4})/);
    if (match) return { value: String.fromCodePoint(Number.parseInt(match[1] || match[2], 16)), end: escapedIndex + 1 + match[0].length };
  }
  return { value: char || "", end: escapedIndex + 1 };
}

function canStartRegex(previous) {
  if (!previous) return true;
  if (previous.type === "identifier") return ["case", "delete", "in", "instanceof", "return", "throw", "typeof", "void", "yield"].includes(previous.value);
  return ["(", "[", "{", ",", ";", ":", "=", "==", "===", "!=", "!==", "!", "?", "=>", "&&", "||", "??"].includes(previous.value);
}

function loadFinding(kind, tokenValue, lineStarts) {
  const location = locationAt(tokenValue.start, lineStarts);
  return { kind, index: tokenValue.start, line: location.line, column: location.column };
}

function locationAt(index, lineStarts) {
  let low = 0;
  let high = lineStarts.length;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (lineStarts[middle] <= index) low = middle;
    else high = middle;
  }
  return { line: low + 1, column: index - lineStarts[low] + 1 };
}

function buildLineStarts(source) {
  const starts = [0];
  for (let index = 0; index < source.length; index += 1) if (source[index] === "\n") starts.push(index + 1);
  return starts;
}

function maskComment(chars, start, end) {
  for (let index = start; index < end; index += 1) {
    if (chars[index] !== "\n" && chars[index] !== "\r") chars[index] = " ";
  }
}

function token(type, value, start, end) {
  return { type, value, start, end };
}

function isStringLike(tokenValue) {
  return tokenValue?.type === "string" || tokenValue?.type === "template";
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}
