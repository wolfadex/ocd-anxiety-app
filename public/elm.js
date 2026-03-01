// elm-watch hot {"version":"2.0.0-beta.12","targetName":"My app","webSocketConnection":59032,"webSocketToken":"8e54da5d-fa1a-4582-b841-43e95f4652cd"}
"use strict";
(() => {
  // node_modules/tiny-decoders/index.mjs
  var CodecJSON = {
    parse(codec, jsonString) {
      let json;
      try {
        json = JSON.parse(jsonString);
      } catch (unknownError) {
        const error = unknownError;
        return {
          tag: "DecoderError",
          error: {
            tag: "custom",
            message: `${error.name}: ${error.message}`,
            path: []
          }
        };
      }
      return codec.decoder(json);
    },
    stringify(codec, value, space) {
      return JSON.stringify(codec.encoder(value), null, space) ?? "null";
    }
  };
  function identity(value) {
    return value;
  }
  var unknown = {
    decoder: (value) => ({ tag: "Valid", value }),
    encoder: identity
  };
  var boolean = {
    decoder: (value) => typeof value === "boolean" ? { tag: "Valid", value } : {
      tag: "DecoderError",
      error: { tag: "boolean", got: value, path: [] }
    },
    encoder: identity
  };
  var number = {
    decoder: (value) => typeof value === "number" ? { tag: "Valid", value } : {
      tag: "DecoderError",
      error: { tag: "number", got: value, path: [] }
    },
    encoder: identity
  };
  var string = {
    decoder: (value) => typeof value === "string" ? { tag: "Valid", value } : {
      tag: "DecoderError",
      error: { tag: "string", got: value, path: [] }
    },
    encoder: identity
  };
  function primitiveUnion(variants) {
    return {
      decoder: (value) => variants.includes(value) ? { tag: "Valid", value } : {
        tag: "DecoderError",
        error: {
          tag: "unknown primitiveUnion variant",
          knownVariants: variants,
          got: value,
          path: []
        }
      },
      encoder: identity
    };
  }
  function unknownArray(value) {
    return Array.isArray(value) ? { tag: "Valid", value } : {
      tag: "DecoderError",
      error: { tag: "array", got: value, path: [] }
    };
  }
  function unknownRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value) ? { tag: "Valid", value } : {
      tag: "DecoderError",
      error: { tag: "object", got: value, path: [] }
    };
  }
  function array(codec) {
    return {
      decoder: (value) => {
        const arrResult = unknownArray(value);
        if (arrResult.tag === "DecoderError") {
          return arrResult;
        }
        const arr = arrResult.value;
        const result = [];
        for (let index = 0; index < arr.length; index++) {
          const decoderResult = codec.decoder(arr[index]);
          switch (decoderResult.tag) {
            case "DecoderError":
              return {
                tag: "DecoderError",
                error: {
                  ...decoderResult.error,
                  path: [index, ...decoderResult.error.path]
                }
              };
            case "Valid":
              result.push(decoderResult.value);
              break;
          }
        }
        return { tag: "Valid", value: result };
      },
      encoder: (arr) => {
        const result = [];
        for (const item of arr) {
          result.push(codec.encoder(item));
        }
        return result;
      }
    };
  }
  function fields(mapping, { allowExtraFields = true } = {}) {
    return {
      decoder: (value) => {
        const objectResult = unknownRecord(value);
        if (objectResult.tag === "DecoderError") {
          return objectResult;
        }
        const object = objectResult.value;
        const knownFields = /* @__PURE__ */ new Set();
        const result = {};
        for (const [key, fieldOrCodec] of Object.entries(mapping)) {
          if (key === "__proto__") {
            continue;
          }
          const field_ = "codec" in fieldOrCodec ? fieldOrCodec : { codec: fieldOrCodec };
          const { codec: { decoder }, renameFrom: encodedFieldName = key, optional: isOptional = false } = field_;
          if (encodedFieldName === "__proto__") {
            continue;
          }
          knownFields.add(encodedFieldName);
          if (!(encodedFieldName in object)) {
            if (!isOptional) {
              return {
                tag: "DecoderError",
                error: {
                  tag: "missing field",
                  field: encodedFieldName,
                  got: object,
                  path: []
                }
              };
            }
            continue;
          }
          const decoderResult = decoder(object[encodedFieldName]);
          switch (decoderResult.tag) {
            case "DecoderError":
              return {
                tag: "DecoderError",
                error: {
                  ...decoderResult.error,
                  path: [encodedFieldName, ...decoderResult.error.path]
                }
              };
            case "Valid":
              result[key] = decoderResult.value;
              break;
          }
        }
        if (!allowExtraFields) {
          const unknownFields = Object.keys(object).filter((key) => !knownFields.has(key));
          if (unknownFields.length > 0) {
            return {
              tag: "DecoderError",
              error: {
                tag: "exact fields",
                knownFields: Array.from(knownFields),
                got: unknownFields,
                path: []
              }
            };
          }
        }
        return { tag: "Valid", value: result };
      },
      encoder: (object) => {
        const result = {};
        for (const [key, fieldOrCodec] of Object.entries(mapping)) {
          if (key === "__proto__") {
            continue;
          }
          const field_ = "codec" in fieldOrCodec ? fieldOrCodec : { codec: fieldOrCodec };
          const { codec: { encoder }, renameFrom: encodedFieldName = key, optional: isOptional = false } = field_;
          if (encodedFieldName === "__proto__" || isOptional && !(key in object)) {
            continue;
          }
          const value = object[key];
          result[encodedFieldName] = encoder(value);
        }
        return result;
      }
    };
  }
  function field(codec, meta) {
    return {
      codec,
      ...meta
    };
  }
  function taggedUnion(decodedCommonField, variants, { allowExtraFields = true } = {}) {
    if (decodedCommonField === "__proto__") {
      throw new Error("taggedUnion: decoded common field cannot be __proto__");
    }
    const decoderMap = /* @__PURE__ */ new Map();
    const encoderMap = /* @__PURE__ */ new Map();
    let maybeEncodedCommonField = void 0;
    for (const [index, variant] of variants.entries()) {
      const field_ = variant[decodedCommonField];
      const { renameFrom: encodedFieldName = decodedCommonField } = field_;
      if (maybeEncodedCommonField === void 0) {
        maybeEncodedCommonField = encodedFieldName;
      } else if (maybeEncodedCommonField !== encodedFieldName) {
        throw new Error(`taggedUnion: Variant at index ${index}: Key ${JSON.stringify(decodedCommonField)}: Got a different encoded field name (${JSON.stringify(encodedFieldName)}) than before (${JSON.stringify(maybeEncodedCommonField)}).`);
      }
      const fullCodec = fields(variant, { allowExtraFields });
      decoderMap.set(field_.tag.encoded, fullCodec.decoder);
      encoderMap.set(field_.tag.decoded, fullCodec.encoder);
    }
    if (typeof maybeEncodedCommonField !== "string") {
      throw new Error(`taggedUnion: Got unusable encoded common field: ${repr(maybeEncodedCommonField)}`);
    }
    const encodedCommonField = maybeEncodedCommonField;
    return {
      decoder: (value) => {
        const encodedNameResult = fields({
          [encodedCommonField]: unknown
        }).decoder(value);
        if (encodedNameResult.tag === "DecoderError") {
          return encodedNameResult;
        }
        const encodedName = encodedNameResult.value[encodedCommonField];
        const decoder = decoderMap.get(encodedName);
        if (decoder === void 0) {
          return {
            tag: "DecoderError",
            error: {
              tag: "unknown taggedUnion tag",
              knownTags: Array.from(decoderMap.keys()),
              got: encodedName,
              path: [encodedCommonField]
            }
          };
        }
        return decoder(value);
      },
      encoder: (value) => {
        const decodedName = value[decodedCommonField];
        const encoder = encoderMap.get(decodedName);
        if (encoder === void 0) {
          throw new Error(`taggedUnion: Unexpectedly found no encoder for decoded variant name: ${JSON.stringify(decodedName)} at key ${JSON.stringify(decodedCommonField)}`);
        }
        return encoder(value);
      }
    };
  }
  function tag(decoded, options = {}) {
    const encoded = "renameTagFrom" in options ? options.renameTagFrom : decoded;
    return {
      codec: {
        decoder: (value) => value === encoded ? { tag: "Valid", value: decoded } : {
          tag: "DecoderError",
          error: {
            tag: "wrong tag",
            expected: encoded,
            got: value,
            path: []
          }
        },
        encoder: () => encoded
      },
      renameFrom: options.renameFieldFrom,
      tag: { decoded, encoded }
    };
  }
  function flatMap(codec, transform) {
    return {
      decoder: (value) => {
        const decoderResult = codec.decoder(value);
        switch (decoderResult.tag) {
          case "DecoderError":
            return decoderResult;
          case "Valid":
            return transform.decoder(decoderResult.value);
        }
      },
      encoder: (value) => codec.encoder(transform.encoder(value))
    };
  }
  function format(error, options) {
    const path = error.path.map((part) => `[${JSON.stringify(part)}]`).join("");
    const variant = formatDecoderErrorVariant(error, options);
    const orExpected = error.orExpected === void 0 ? "" : `
Or expected: ${error.orExpected}`;
    return `At root${path}:
${variant}${orExpected}`;
  }
  function formatDecoderErrorVariant(variant, options) {
    const formatGot = (value) => {
      const formatted = repr(value, options);
      return options?.sensitive === true ? `${formatted}
(Actual values are hidden in sensitive mode.)` : formatted;
    };
    const removeBrackets = (formatted) => formatted.replace(/^\[|\s*\]$/g, "");
    const primitiveList = (strings) => strings.length === 0 ? " (none)" : removeBrackets(repr(strings, {
      maxLength: Infinity,
      maxArrayChildren: Infinity,
      indent: options?.indent
    }));
    switch (variant.tag) {
      case "boolean":
      case "number":
      case "bigint":
      case "string":
        return `Expected a ${variant.tag}
Got: ${formatGot(variant.got)}`;
      case "array":
      case "object":
        return `Expected an ${variant.tag}
Got: ${formatGot(variant.got)}`;
      case "unknown multi type":
        return `Expected one of these types: ${variant.knownTypes.length === 0 ? "never" : variant.knownTypes.join(", ")}
Got: ${formatGot(variant.got)}`;
      case "unknown taggedUnion tag":
        return `Expected one of these tags:${primitiveList(variant.knownTags)}
Got: ${formatGot(variant.got)}`;
      case "unknown primitiveUnion variant":
        return `Expected one of these variants:${primitiveList(variant.knownVariants)}
Got: ${formatGot(variant.got)}`;
      case "missing field":
        return `Expected an object with a field called: ${JSON.stringify(variant.field)}
Got: ${formatGot(variant.got)}`;
      case "wrong tag":
        return `Expected this string: ${JSON.stringify(variant.expected)}
Got: ${formatGot(variant.got)}`;
      case "exact fields":
        return `Expected only these fields:${primitiveList(variant.knownFields)}
Found extra fields:${removeBrackets(formatGot(variant.got))}`;
      case "tuple size":
        return `Expected ${variant.expected} items
Got: ${variant.got}`;
      case "custom":
        return "got" in variant ? `${variant.message}
Got: ${formatGot(variant.got)}` : variant.message;
    }
  }
  function repr(value, { depth = 0, indent = "  ", maxArrayChildren = 5, maxObjectChildren = 5, maxLength = 100, sensitive = false } = {}) {
    return reprHelper(value, {
      depth,
      maxArrayChildren,
      maxObjectChildren,
      maxLength,
      indent,
      sensitive
    }, 0, []);
  }
  function reprHelper(value, options, level, seen) {
    const { indent, maxLength, sensitive } = options;
    const type = typeof value;
    const toStringType = Object.prototype.toString.call(value).replace(/^\[object\s+(.+)\]$/, "$1");
    try {
      if (value == null || type === "number" || type === "bigint" || type === "boolean" || type === "symbol" || toStringType === "RegExp") {
        return sensitive ? toStringType.toLowerCase() : truncate(String(value) + (type === "bigint" ? "n" : ""), maxLength);
      }
      if (type === "string") {
        return sensitive ? type : truncate(JSON.stringify(value), maxLength);
      }
      if (typeof value === "function") {
        return `function ${truncate(JSON.stringify(value.name), maxLength)}`;
      }
      if (Array.isArray(value)) {
        const arr = value;
        if (arr.length === 0) {
          return "[]";
        }
        if (seen.includes(arr)) {
          return `circular ${toStringType}(${arr.length})`;
        }
        if (options.depth < level) {
          return `${toStringType}(${arr.length})`;
        }
        const lastIndex = arr.length - 1;
        const items = [];
        const end = Math.min(options.maxArrayChildren - 1, lastIndex);
        for (let index = 0; index <= end; index++) {
          const item = index in arr ? reprHelper(arr[index], options, level + 1, [...seen, arr]) : "<empty>";
          items.push(item);
        }
        if (end < lastIndex) {
          items.push(`(${lastIndex - end} more)`);
        }
        return `[
${indent.repeat(level + 1)}${items.join(`,
${indent.repeat(level + 1)}`)}
${indent.repeat(level)}]`;
      }
      if (toStringType === "Object") {
        const object = value;
        const keys = Object.keys(object);
        const { name } = object.constructor;
        const prefix = name === "Object" ? "" : `${name} `;
        if (keys.length === 0) {
          return `${prefix}{}`;
        }
        if (seen.includes(object)) {
          return `circular ${name}(${keys.length})`;
        }
        if (options.depth < level) {
          return `${name}(${keys.length})`;
        }
        const numHidden = Math.max(0, keys.length - options.maxObjectChildren);
        const items = keys.slice(0, options.maxObjectChildren).map((key2) => {
          const truncatedKey = truncate(JSON.stringify(key2), maxLength);
          const valueRepr = reprHelper(object[key2], options, level + 1, [
            ...seen,
            object
          ]);
          const separator = valueRepr.includes("\n") || truncatedKey.length + valueRepr.length + 2 <= maxLength ? " " : `
${indent.repeat(level + 2)}`;
          return `${truncatedKey}:${separator}${valueRepr}`;
        }).concat(numHidden > 0 ? `(${numHidden} more)` : []);
        return `${prefix}{
${indent.repeat(level + 1)}${items.join(`,
${indent.repeat(level + 1)}`)}
${indent.repeat(level)}}`;
      }
      return toStringType;
    } catch (_error) {
      return toStringType;
    }
  }
  function truncate(str, maxLength) {
    const half = Math.floor(maxLength / 2);
    return str.length <= maxLength ? str : `${str.slice(0, half)}\u2026${str.slice(-half)}`;
  }

  // src/Helpers.ts
  function pad(number2) {
    return number2.toString().padStart(2, "0");
  }
  function formatDate(date) {
    return [
      pad(date.getFullYear()),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join("-");
  }
  function formatTime(date) {
    return [
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds())
    ].join(":");
  }

  // src/TeaProgram.ts
  async function runTeaProgram(options) {
    return new Promise((resolve, reject) => {
      const [initialModel, initialCmds] = options.init;
      let model = initialModel;
      const msgQueue = [];
      let killed = false;
      const dispatch = (dispatchedMsg) => {
        if (killed) {
          return;
        }
        const alreadyRunning = msgQueue.length > 0;
        msgQueue.push(dispatchedMsg);
        if (alreadyRunning) {
          return;
        }
        for (const msg of msgQueue) {
          const [newModel, cmds] = options.update(msg, model);
          model = newModel;
          runCmds(cmds);
        }
        msgQueue.length = 0;
      };
      const runCmds = (cmds) => {
        for (const cmd of cmds) {
          options.runCmd(
            cmd,
            mutable,
            dispatch,
            (result) => {
              cmds.length = 0;
              killed = true;
              resolve(result);
            },
            /* v8 ignore start */
            (error) => {
              cmds.length = 0;
              killed = true;
              reject(error);
            }
            /* v8 ignore stop */
          );
          if (killed) {
            break;
          }
        }
      };
      const mutable = options.initMutable(
        dispatch,
        (result) => {
          killed = true;
          resolve(result);
        },
        /* v8 ignore start */
        (error) => {
          killed = true;
          reject(error);
        }
        /* v8 ignore stop */
      );
      runCmds(initialCmds);
    });
  }

  // src/Types.ts
  function brand() {
    return string;
  }
  var AbsolutePath = brand();
  var CompilationMode = primitiveUnion([
    "debug",
    "standard",
    "optimize"
  ]);
  var BrowserUiPosition = primitiveUnion([
    "TopLeft",
    "TopRight",
    "BottomLeft",
    "BottomRight"
  ]);
  var TargetName = brand();
  var WebSocketToken = brand();

  // client/css.ts
  async function reloadAllCssIfNeeded(originalStyles) {
    const results = await Promise.allSettled(
      Array.from(
        document.styleSheets,
        (styleSheet) => reloadCssIfNeeded(originalStyles, styleSheet)
      )
    );
    return results.some(
      (result) => result.status === "fulfilled" && result.value
    );
  }
  async function reloadCssIfNeeded(originalStyles, styleSheet) {
    if (styleSheet.href === null) {
      return false;
    }
    const url = makeUrl(styleSheet.href);
    if (url === void 0 || url.host !== window.location.host) {
      return false;
    }
    const response = await fetch(url, { cache: "reload" });
    if (!response.ok) {
      return false;
    }
    const newCss = await response.text();
    if (isFirefox() && /@import\b/i.test(newCss)) {
      console.warn(
        "elm-watch: In Firefox, @import:ed CSS files are not hot reloaded due to over eager caching by Firefox. Style sheet:",
        url.href
      );
    }
    const importUrls = isFirefox() ? [] : getAllCssImports(url, styleSheet);
    await Promise.allSettled(
      importUrls.map((importUrl) => fetch(importUrl, { cache: "reload" }))
    );
    const newStyleSheet = await parseCssWithImports(url, newCss);
    return newStyleSheet === void 0 ? false : updateStyleSheetIfNeeded(originalStyles, styleSheet, newStyleSheet);
  }
  async function parseCssWithImports(styleSheetUrl, css) {
    return new Promise((resolve) => {
      const style = document.createElement("style");
      style.media = "print";
      style.textContent = css;
      const base = document.createElement("base");
      base.href = styleSheetUrl.href;
      style.onerror = style.onload = () => {
        resolve(style.sheet ?? void 0);
        base.remove();
        style.remove();
      };
      document.head.prepend(base, style);
    });
  }
  function makeUrl(urlString, base) {
    try {
      return new URL(urlString, base);
    } catch {
      return void 0;
    }
  }
  function getAllCssImports(styleSheetUrl, styleSheet) {
    return Array.from(styleSheet.cssRules).flatMap((rule) => {
      if (rule instanceof CSSImportRule && rule.styleSheet !== null) {
        const url = makeUrl(rule.href, styleSheetUrl);
        if (url !== void 0 && url.host === styleSheetUrl.host) {
          return [url, ...getAllCssImports(url, rule.styleSheet)];
        }
      }
      return [];
    });
  }
  function updateStyleSheetIfNeeded(originalStyles, oldStyleSheet, newStyleSheet) {
    let changed = false;
    const length = Math.min(
      oldStyleSheet.cssRules.length,
      newStyleSheet.cssRules.length
    );
    let index = 0;
    for (; index < length; index++) {
      const oldRule = oldStyleSheet.cssRules[index];
      const newRule = newStyleSheet.cssRules[index];
      if (oldRule instanceof CSSStyleRule && newRule instanceof CSSStyleRule) {
        if (oldRule.selectorText !== newRule.selectorText) {
          oldRule.selectorText = newRule.selectorText;
          changed = true;
        }
        let originals = originalStyles.get(oldRule);
        if (originals === void 0) {
          originals = oldRule.style.cssText;
          originalStyles.set(oldRule, originals);
        }
        if (originals !== newRule.style.cssText) {
          oldStyleSheet.deleteRule(index);
          oldStyleSheet.insertRule(newRule.cssText, index);
          originalStyles.set(
            oldStyleSheet.cssRules[index],
            newRule.style.cssText
          );
          changed = true;
        } else {
          const nestedChanged = updateStyleSheetIfNeeded(
            originalStyles,
            oldRule,
            newRule
          );
          if (nestedChanged) {
            changed = true;
            oldRule.selectorText = oldRule.selectorText;
          }
        }
      } else if (oldRule instanceof CSSImportRule && newRule instanceof CSSImportRule && oldRule.cssText === newRule.cssText && // Exclude Firefox since imported style sheets often returned old, cached versions.
      !isFirefox()) {
        const nestedChanged = oldRule.styleSheet !== null && newRule.styleSheet !== null ? updateStyleSheetIfNeeded(
          originalStyles,
          oldRule.styleSheet,
          newRule.styleSheet
        ) : !(oldRule.styleSheet === null && newRule.styleSheet === null);
        if (nestedChanged) {
          changed = true;
          oldRule.media = oldRule.media;
        }
      } else if (
        // @media, @supports and @container:
        oldRule instanceof CSSConditionRule && newRule instanceof CSSConditionRule && oldRule.conditionText === newRule.conditionText || // @layer:
        oldRule instanceof CSSLayerBlockRule && newRule instanceof CSSLayerBlockRule && oldRule.name === newRule.name || // @page:
        oldRule instanceof CSSPageRule && newRule instanceof CSSPageRule && oldRule.selectorText === newRule.selectorText
      ) {
        const nestedChanged = updateStyleSheetIfNeeded(
          originalStyles,
          oldRule,
          newRule
        );
        if (nestedChanged) {
          changed = true;
        }
      } else if (oldRule.cssText !== newRule.cssText) {
        oldStyleSheet.deleteRule(index);
        oldStyleSheet.insertRule(newRule.cssText, index);
        changed = true;
      }
    }
    while (index < oldStyleSheet.cssRules.length) {
      oldStyleSheet.deleteRule(index);
      changed = true;
    }
    for (; index < newStyleSheet.cssRules.length; index++) {
      const newRule = newStyleSheet.cssRules[index];
      oldStyleSheet.insertRule(newRule.cssText, index);
      changed = true;
    }
    return changed;
  }
  function isFirefox() {
    return typeof window.scrollMaxX === "number";
  }

  // src/NonEmptyArray.ts
  function NonEmptyArray(decoder) {
    return flatMap(array(decoder), {
      decoder: (array2) => isNonEmptyArray(array2) ? { tag: "Valid", value: array2 } : {
        tag: "DecoderError",
        error: {
          tag: "custom",
          message: "Expected a non-empty array",
          got: array2,
          path: []
        }
      },
      encoder: (array2) => array2
    });
  }
  function isNonEmptyArray(array2) {
    return array2.length >= 1;
  }

  // client/WebSocketMessages.ts
  var nonNegativeIntCodec = flatMap(number, {
    decoder: (value) => Number.isInteger(value) && value >= 0 ? { tag: "Valid", value } : {
      tag: "DecoderError",
      error: {
        tag: "custom",
        path: [],
        message: "Expected a non-negative integer",
        got: value
      }
    },
    encoder: (value) => value
  });
  var OpenEditorError = taggedUnion("tag", [
    {
      tag: tag("EnvNotSet")
    },
    {
      tag: tag("InvalidFilePath"),
      message: string
    },
    {
      tag: tag("CommandFailed"),
      message: string
    }
  ]);
  var ErrorLocation = taggedUnion("tag", [
    {
      tag: tag("FileOnly"),
      file: AbsolutePath
    },
    {
      tag: tag("FileWithLineAndColumn"),
      file: AbsolutePath,
      line: number,
      column: number
    },
    {
      tag: tag("Target"),
      targetName: string
    }
  ]);
  var CompileError = fields({
    title: string,
    location: field(ErrorLocation, { optional: true }),
    htmlContent: string
  });
  var StatusChange = taggedUnion("tag", [
    {
      tag: tag("AlreadyUpToDate"),
      compilationMode: CompilationMode,
      browserUiPosition: BrowserUiPosition
    },
    {
      tag: tag("Busy"),
      compilationMode: CompilationMode,
      browserUiPosition: BrowserUiPosition
    },
    {
      tag: tag("CompileError"),
      compilationMode: CompilationMode,
      browserUiPosition: BrowserUiPosition,
      openErrorOverlay: boolean,
      errors: array(CompileError),
      foregroundColor: string,
      backgroundColor: string
    },
    {
      tag: tag("ElmJsonError"),
      error: string
    },
    {
      tag: tag("ClientError"),
      message: string
    }
  ]);
  var SuccessfullyCompiledFields = {
    code: string,
    elmCompiledTimestamp: number,
    compilationMode: CompilationMode,
    browserUiPosition: BrowserUiPosition
  };
  var SuccessfullyCompiled = taggedUnion("tag", [
    {
      tag: tag("SuccessfullyCompiled"),
      ...SuccessfullyCompiledFields
    }
  ]);
  var WebSocketToClientMessage = taggedUnion("tag", [
    {
      tag: tag("FocusedTabAcknowledged")
    },
    {
      tag: tag("OpenEditorFailed"),
      error: OpenEditorError
    },
    {
      tag: tag("StaticFilesChanged"),
      changedFileUrlPaths: NonEmptyArray(string)
    },
    {
      tag: tag("StaticFilesMayHaveChangedWhileDisconnected")
    },
    {
      tag: tag("StatusChanged"),
      status: StatusChange
    },
    {
      tag: tag("SuccessfullyCompiled"),
      ...SuccessfullyCompiledFields
    },
    {
      tag: tag("SuccessfullyCompiledButRecordFieldsChanged")
    }
  ]);
  var WebSocketToServerMessage = taggedUnion("tag", [
    {
      tag: tag("ChangedCompilationMode"),
      compilationMode: CompilationMode
    },
    {
      tag: tag("ChangedBrowserUiPosition"),
      browserUiPosition: BrowserUiPosition
    },
    {
      tag: tag("ChangedOpenErrorOverlay"),
      openErrorOverlay: boolean
    },
    {
      tag: tag("FocusedTab")
    },
    {
      tag: tag("PressedOpenEditor"),
      file: AbsolutePath,
      // Disallow negative numbers since they might be parsed as command line flags
      // in the user’s command, potentially causing something unwanted.
      line: nonNegativeIntCodec,
      column: nonNegativeIntCodec
    }
  ]);
  function decodeWebSocketToClientMessage(data) {
    const messageResult = string.decoder(data);
    if (messageResult.tag === "DecoderError") {
      return messageResult;
    }
    const message = messageResult.value;
    if (message.startsWith("//")) {
      const newlineIndexRaw = message.indexOf("\n");
      const newlineIndex = newlineIndexRaw === -1 ? message.length : newlineIndexRaw;
      const jsonString = message.slice(2, newlineIndex);
      const parseResult = CodecJSON.parse(SuccessfullyCompiled, jsonString);
      switch (parseResult.tag) {
        case "DecoderError":
          return parseResult;
        case "Valid":
          return { tag: "Valid", value: { ...parseResult.value, code: message } };
      }
    } else {
      return CodecJSON.parse(WebSocketToClientMessage, message);
    }
  }

  // client/client.ts
  var window2 = globalThis;
  var HAS_WINDOW = window2.window !== void 0;
  var RELOAD_MESSAGE_KEY = "__elmWatchReloadMessage";
  var RELOAD_TARGET_NAME_KEY_PREFIX = "__elmWatchReloadTarget__";
  var DEFAULT_ELM_WATCH = {
    MOCKED_TIMINGS: false,
    // In a browser on the same computer, sending a message and receiving a reply
    // takes around 2-4 ms. In iOS Safari via WiFi, I’ve seen it take up to 120 ms.
    // So 1 second should be plenty above the threshold, while not taking too long.
    WEBSOCKET_TIMEOUT: 1e3,
    ON_RENDER: () => {
    },
    ON_REACHED_IDLE_STATE: () => {
    },
    CHANGED_CSS: /* @__PURE__ */ new Date(0),
    CHANGED_FILE_URL_PATHS: { timestamp: /* @__PURE__ */ new Date(0), changed: /* @__PURE__ */ new Set() },
    ORIGINAL_STYLES: /* @__PURE__ */ new WeakMap(),
    RELOAD_STATUSES: /* @__PURE__ */ new Map(),
    RELOAD_PAGE: (message) => {
      if (message !== void 0) {
        try {
          window2.sessionStorage.setItem(RELOAD_MESSAGE_KEY, message);
        } catch {
        }
      }
      if (typeof window2.ELM_WATCH_FULL_RELOAD === "function") {
        window2.ELM_WATCH_FULL_RELOAD();
      } else if (HAS_WINDOW) {
        window2.location.reload();
      } else {
        if (message !== void 0) {
          console.info(message);
        }
        const why = message === void 0 ? "because a hot reload was not possible" : "see above";
        const info = `elm-watch: A full reload or restart of the program running your Elm code is needed (${why}). In a web browser page, I would have reloaded the page. You need to do this manually, or define a \`globalThis.ELM_WATCH_FULL_RELOAD\` function.`;
        console.error(info);
      }
    },
    TARGET_DATA: /* @__PURE__ */ new Map(),
    SOME_TARGET_IS_PROXY: false,
    IS_REGISTERING: true,
    REGISTER: () => {
    },
    HOT_RELOAD: () => {
    },
    SHOULD_SKIP_INIT_CMDS: () => false,
    KILL_MATCHING: () => Promise.resolve(),
    DISCONNECT: () => {
    },
    LOG_DEBUG: (
      // eslint-disable-next-line no-console
      console.debug
    )
  };
  var { __ELM_WATCH } = window2;
  if (typeof __ELM_WATCH !== "object" || __ELM_WATCH === null) {
    __ELM_WATCH = {};
    Object.defineProperty(window2, "__ELM_WATCH", { value: __ELM_WATCH });
  }
  for (const [key, value] of Object.entries(DEFAULT_ELM_WATCH)) {
    if (__ELM_WATCH[key] === void 0) {
      __ELM_WATCH[key] = value;
    }
  }
  var VERSION = "2.0.0-beta.12";
  var WEBSOCKET_TOKEN = "8e54da5d-fa1a-4582-b841-43e95f4652cd";
  var TARGET_NAME = "My app";
  var INITIAL_ELM_COMPILED_TIMESTAMP = Number(
    "1772406595738"
  );
  var ORIGINAL_COMPILATION_MODE = "standard";
  var ORIGINAL_BROWSER_UI_POSITION = "BottomLeft";
  var WEBSOCKET_CONNECTION = "59032";
  var CONTAINER_ID = "elm-watch";
  var DEBUG = String("false") === "true";
  var ELM_WATCH_CHANGED_FILE_URL_PATHS_EVENT = "elm-watch:changed-file-url-paths";
  var BROWSER_UI_MOVED_EVENT = "BROWSER_UI_MOVED_EVENT";
  var CLOSE_ALL_ERROR_OVERLAYS_EVENT = "CLOSE_ALL_ERROR_OVERLAYS_EVENT";
  var ELM_WATCH_CHANGED_FILE_URL_BATCH_TIME = 10;
  var JUST_CHANGED_BROWSER_UI_POSITION_TIMEOUT = 2e3;
  __ELM_WATCH.SOME_TARGET_IS_PROXY ||= ORIGINAL_COMPILATION_MODE === "proxy";
  __ELM_WATCH.IS_REGISTERING = true;
  var SEND_KEY_DO_NOT_USE_ALL_THE_TIME = Symbol(
    "This value is supposed to only be obtained via `Status`."
  );
  function logDebug(...args) {
    if (DEBUG) {
      __ELM_WATCH.LOG_DEBUG(...args);
    }
  }
  function BrowserUiPositionWithFallback(value) {
    const decoderResult = BrowserUiPosition.decoder(value);
    switch (decoderResult.tag) {
      case "DecoderError":
        return ORIGINAL_BROWSER_UI_POSITION;
      case "Valid":
        return decoderResult.value;
    }
  }
  function removeElmWatchIndexHtmlComment() {
    const node = document.firstChild;
    if (node instanceof Comment && node.data.trimStart().startsWith("elm-watch debug information:")) {
      node.remove();
    }
  }
  function run() {
    let elmCompiledTimestampBeforeReload = void 0;
    try {
      const message = window2.sessionStorage.getItem(RELOAD_MESSAGE_KEY);
      if (message !== null) {
        console.info(message);
        window2.sessionStorage.removeItem(RELOAD_MESSAGE_KEY);
      }
      const key = RELOAD_TARGET_NAME_KEY_PREFIX + TARGET_NAME;
      const previous = window2.sessionStorage.getItem(key);
      if (previous !== null) {
        const number2 = Number(previous);
        if (Number.isFinite(number2)) {
          elmCompiledTimestampBeforeReload = number2;
        }
        window2.sessionStorage.removeItem(key);
      }
    } catch {
    }
    const elements = HAS_WINDOW ? getOrCreateTargetRoot() : void 0;
    const browserUiPosition = elements === void 0 ? ORIGINAL_BROWSER_UI_POSITION : BrowserUiPositionWithFallback(elements.container.dataset["position"]);
    const getNow = () => /* @__PURE__ */ new Date();
    if (HAS_WINDOW) {
      removeElmWatchIndexHtmlComment();
    }
    runTeaProgram({
      initMutable: initMutable(getNow, elements),
      init: init(getNow(), browserUiPosition, elmCompiledTimestampBeforeReload),
      update: (msg, model) => {
        const [updatedModel, cmds] = update(msg, model);
        const modelChanged = updatedModel !== model;
        const reloadTrouble = model.status.tag !== updatedModel.status.tag && updatedModel.status.tag === "WaitingForReload" && updatedModel.elmCompiledTimestamp === updatedModel.elmCompiledTimestampBeforeReload;
        const newModel = modelChanged ? {
          ...updatedModel,
          uiExpanded: reloadTrouble ? true : updatedModel.uiExpanded
        } : model;
        const oldErrorOverlay = getErrorOverlay(model.status);
        const newErrorOverlay = getErrorOverlay(newModel.status);
        const statusType = statusToStatusType(newModel.status.tag);
        const statusTypeChanged = statusType !== statusToStatusType(model.status.tag);
        const statusFlashType = getStatusFlashType({
          statusType,
          statusTypeChanged,
          hasReceivedHotReload: newModel.elmCompiledTimestamp !== INITIAL_ELM_COMPILED_TIMESTAMP,
          uiRelatedUpdate: msg.tag === "UiMsg",
          errorOverlayVisible: elements !== void 0 && !elements.overlay.hidden
        });
        const flashCmd = statusFlashType === void 0 || cmds.some((cmd) => cmd.tag === "Flash") ? [] : [{ tag: "Flash", flashType: statusFlashType }];
        const allCmds = modelChanged ? [
          ...cmds,
          {
            tag: "UpdateGlobalStatus",
            reloadStatus: statusToReloadStatus(newModel),
            elmCompiledTimestamp: newModel.elmCompiledTimestamp
          },
          // This needs to be done before Render, since it depends on whether
          // the error overlay is visible or not.
          newModel.status.tag === model.status.tag && oldErrorOverlay?.openErrorOverlay === newErrorOverlay?.openErrorOverlay ? { tag: "NoCmd" } : {
            tag: "UpdateErrorOverlay",
            errors: (
              // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
              newErrorOverlay === void 0 || !newErrorOverlay.openErrorOverlay ? /* @__PURE__ */ new Map() : newErrorOverlay.errors
            ),
            sendKey: statusToSpecialCaseSendKey(newModel.status)
          },
          ...elements !== void 0 || newModel.status.tag !== model.status.tag ? [
            {
              tag: "Render",
              model: newModel,
              manageFocus: msg.tag === "UiMsg"
            }
          ] : [],
          ...flashCmd,
          model.browserUiPosition === newModel.browserUiPosition ? { tag: "NoCmd" } : {
            tag: "SetBrowserUiPosition",
            browserUiPosition: newModel.browserUiPosition
          },
          reloadTrouble ? { tag: "TriggerReachedIdleState", reason: "ReloadTrouble" } : { tag: "NoCmd" }
        ] : [...cmds, ...flashCmd];
        logDebug(`${msg.tag} (${TARGET_NAME})`, msg, newModel, allCmds);
        return [newModel, allCmds];
      },
      runCmd: runCmd(getNow, elements)
    }).catch((error) => {
      console.error("elm-watch: Unexpectedly exited with error:", error);
    });
  }
  function getErrorOverlay(status) {
    return "errorOverlay" in status ? status.errorOverlay : void 0;
  }
  function statusToReloadStatus(model) {
    switch (model.status.tag) {
      case "Busy":
      case "Connecting":
        return { tag: "MightWantToReload" };
      case "CompileError":
      case "ElmJsonError":
      case "EvalError":
      case "Idle":
      case "SleepingBeforeReconnect":
      case "UnexpectedError":
        return { tag: "NoReloadWanted" };
      case "WaitingForReload":
        return model.elmCompiledTimestamp === model.elmCompiledTimestampBeforeReload ? { tag: "NoReloadWanted" } : { tag: "ReloadRequested", reasons: model.status.reasons };
    }
  }
  function statusToStatusType(statusTag) {
    switch (statusTag) {
      case "Idle":
        return "Success";
      case "Busy":
      case "Connecting":
      case "SleepingBeforeReconnect":
      case "WaitingForReload":
        return "Waiting";
      case "CompileError":
      case "ElmJsonError":
      case "EvalError":
      case "UnexpectedError":
        return "Error";
    }
  }
  function statusToSpecialCaseSendKey(status) {
    switch (status.tag) {
      case "CompileError":
      case "Idle":
        return status.sendKey;
      // It works well moving the browser UI while already busy.
      // It works well clicking an error location to open it in an editor while busy.
      case "Busy":
        return SEND_KEY_DO_NOT_USE_ALL_THE_TIME;
      // We can’t send messages about anything if we don’t have a connection.
      case "Connecting":
      case "SleepingBeforeReconnect":
      case "WaitingForReload":
      // We can’t really send messages if there are elm.json errors.
      case "ElmJsonError":
      // These two _might_ work, but it’s unclear. They’re not supposed to happen
      // anyway.
      case "EvalError":
      case "UnexpectedError":
        return void 0;
    }
  }
  function getOrCreateContainer() {
    const existing = document.getElementById(CONTAINER_ID);
    if (existing !== null) {
      return existing;
    }
    const container = h(
      typeof HTMLDialogElement === "function" ? HTMLDialogElement : HTMLDivElement,
      { id: CONTAINER_ID }
    );
    container.style.all = "initial";
    const containerInner = h(HTMLDivElement, {});
    containerInner.style.all = "initial";
    containerInner.style.position = "fixed";
    containerInner.style.zIndex = "2147483647";
    containerInner.popover = "manual";
    const shadowRoot = containerInner.attachShadow({ mode: "open" });
    shadowRoot.append(h(HTMLStyleElement, {}, CSS));
    container.append(containerInner);
    document.documentElement.append(container);
    return container;
  }
  function getOrCreateTargetRoot() {
    const container = getOrCreateContainer();
    const containerInner = container.firstElementChild;
    if (containerInner === null) {
      throw new Error(
        `elm-watch: Cannot set up hot reload, because an element with ID ${CONTAINER_ID} exists, but \`.firstElementChild\` is null!`
      );
    }
    const { shadowRoot } = containerInner;
    if (shadowRoot === null) {
      throw new Error(
        `elm-watch: Cannot set up hot reload, because an element with ID ${CONTAINER_ID} exists, but \`.shadowRoot\` is null!`
      );
    }
    let overlay = shadowRoot.querySelector(`.${CLASS.overlay}`);
    if (overlay === null) {
      overlay = h(HTMLDivElement, {
        className: CLASS.overlay,
        attrs: { "data-test-id": "Overlay" },
        hidden: true
      });
      shadowRoot.append(overlay);
    }
    let overlayCloseButton = shadowRoot.querySelector(
      `.${CLASS.overlayCloseButton}`
    );
    if (overlayCloseButton === null) {
      const closeAllErrorOverlays = () => {
        shadowRoot.dispatchEvent(new CustomEvent(CLOSE_ALL_ERROR_OVERLAYS_EVENT));
      };
      overlayCloseButton = h(HTMLButtonElement, {
        className: CLASS.overlayCloseButton,
        attrs: {
          "aria-label": "Close error overlay",
          "data-test-id": "OverlayCloseButton"
        },
        onclick: closeAllErrorOverlays
      });
      shadowRoot.append(overlayCloseButton);
      const overlayNonNull = overlay;
      window2.addEventListener(
        "keydown",
        (event) => {
          if (overlayNonNull.hasChildNodes() && event.key === "Escape") {
            event.preventDefault();
            event.stopImmediatePropagation();
            closeAllErrorOverlays();
          }
        },
        true
      );
    }
    let root = shadowRoot.querySelector(`.${CLASS.root}`);
    if (root === null) {
      root = h(HTMLDivElement, { className: CLASS.root });
      shadowRoot.append(root);
    }
    const targetRoot = createTargetRoot(TARGET_NAME);
    root.append(targetRoot);
    const elements = {
      container,
      containerInner,
      shadowRoot,
      overlay,
      overlayCloseButton,
      root,
      targetRoot
    };
    setBrowserUiPosition(ORIGINAL_BROWSER_UI_POSITION, elements);
    return elements;
  }
  function createTargetRoot(targetName) {
    return h(HTMLDivElement, {
      className: CLASS.targetRoot,
      attrs: { "data-target": targetName }
    });
  }
  function browserUiPositionToCss(browserUiPosition) {
    switch (browserUiPosition) {
      case "TopLeft":
        return { top: "-1px", bottom: "auto", left: "-1px", right: "auto" };
      case "TopRight":
        return { top: "-1px", bottom: "auto", left: "auto", right: "-1px" };
      case "BottomLeft":
        return { top: "auto", bottom: "-1px", left: "-1px", right: "auto" };
      case "BottomRight":
        return { top: "auto", bottom: "-1px", left: "auto", right: "-1px" };
    }
  }
  function browserUiPositionToCssForChooser(browserUiPosition) {
    switch (browserUiPosition) {
      case "TopLeft":
        return { top: "auto", bottom: "0", left: "auto", right: "0" };
      case "TopRight":
        return { top: "auto", bottom: "0", left: "0", right: "auto" };
      case "BottomLeft":
        return { top: "0", bottom: "auto", left: "auto", right: "0" };
      case "BottomRight":
        return { top: "0", bottom: "auto", left: "0", right: "auto" };
    }
  }
  function setBrowserUiPosition(browserUiPosition, elements) {
    const isFirstTargetRoot = elements.targetRoot.previousElementSibling === null;
    if (!isFirstTargetRoot) {
      return;
    }
    elements.container.dataset["position"] = browserUiPosition;
    for (const [key, value] of Object.entries(
      browserUiPositionToCss(browserUiPosition)
    )) {
      elements.containerInner.style.setProperty(key, value);
    }
    const isInBottomHalf = browserUiPosition === "BottomLeft" || browserUiPosition === "BottomRight";
    elements.root.classList.toggle(CLASS.rootBottomHalf, isInBottomHalf);
    elements.shadowRoot.dispatchEvent(
      new CustomEvent(BROWSER_UI_MOVED_EVENT, { detail: browserUiPosition })
    );
  }
  function flattenElmExports(elmExports) {
    return flattenElmExportsHelper("Elm", elmExports);
  }
  function flattenElmExportsHelper(moduleName, module) {
    return Object.entries(module).flatMap(
      ([key, value]) => key === "init" ? [[moduleName, module]] : flattenElmExportsHelper(`${moduleName}.${key}`, value)
    );
  }
  var initMutable = (getNow, elements) => (dispatch, resolvePromise) => {
    let removeListeners = [];
    const mutable = {
      shouldSkipInitCmds: true,
      removeListeners: () => {
        for (const removeListener of removeListeners) {
          removeListener();
        }
      },
      webSocket: initWebSocket(
        getNow,
        INITIAL_ELM_COMPILED_TIMESTAMP,
        dispatch
      ),
      webSocketTimeoutId: void 0
    };
    if (elements !== void 0) {
      mutable.webSocket.addEventListener(
        "open",
        () => {
          removeListeners = [
            addEventListener(window2, "focus", (event) => {
              if (event instanceof CustomEvent && event.detail !== TARGET_NAME) {
                return;
              }
              dispatch({ tag: "FocusedTab" });
            }),
            addEventListener(window2, "visibilitychange", () => {
              if (document.visibilityState === "visible") {
                dispatch({
                  tag: "PageVisibilityChangedToVisible",
                  date: getNow()
                });
              }
            }),
            addEventListener(
              elements.shadowRoot,
              BROWSER_UI_MOVED_EVENT,
              (event) => {
                dispatch({
                  tag: "BrowserUiMoved",
                  browserUiPosition: BrowserUiPositionWithFallback(
                    event.detail
                  )
                });
              }
            ),
            addEventListener(
              elements.shadowRoot,
              CLOSE_ALL_ERROR_OVERLAYS_EVENT,
              () => {
                dispatch({
                  tag: "UiMsg",
                  date: getNow(),
                  msg: {
                    tag: "ChangedOpenErrorOverlay",
                    openErrorOverlay: false
                  }
                });
              }
            )
          ];
        },
        { once: true }
      );
    }
    __ELM_WATCH.RELOAD_STATUSES.set(TARGET_NAME, {
      tag: "MightWantToReload"
    });
    const wrapElmAppInit = (initializedElmApps, moduleName, module, init2) => {
      module.init = (...args) => {
        const app = init2(...args);
        const apps = initializedElmApps.get(moduleName);
        if (apps === void 0) {
          initializedElmApps.set(moduleName, [app]);
        } else {
          apps.push(app);
        }
        dispatch({ tag: "AppInit" });
        return app;
      };
    };
    const originalRegister = __ELM_WATCH.REGISTER;
    __ELM_WATCH.REGISTER = (targetName, elmExports) => {
      originalRegister(targetName, elmExports);
      if (targetName !== TARGET_NAME) {
        return;
      }
      __ELM_WATCH.IS_REGISTERING = false;
      if (__ELM_WATCH.TARGET_DATA.has(TARGET_NAME)) {
        throw new Error(
          `elm-watch: This target is already registered! Maybe a duplicate script is being loaded accidentally? Target: ${TARGET_NAME}`
        );
      }
      const initializedElmApps = /* @__PURE__ */ new Map();
      const flattenedElmExports = flattenElmExports(elmExports);
      for (const [moduleName, module] of flattenedElmExports) {
        wrapElmAppInit(initializedElmApps, moduleName, module, module.init);
      }
      __ELM_WATCH.TARGET_DATA.set(TARGET_NAME, {
        originalFlattenedElmExports: new Map(flattenedElmExports),
        initializedElmApps
      });
    };
    const originalHotReload = __ELM_WATCH.HOT_RELOAD;
    __ELM_WATCH.HOT_RELOAD = (targetName, elmExports) => {
      originalHotReload(targetName, elmExports);
      if (targetName !== TARGET_NAME) {
        return;
      }
      const targetData = __ELM_WATCH.TARGET_DATA.get(TARGET_NAME);
      if (targetData === void 0) {
        return;
      }
      const reloadReasons = [];
      for (const [moduleName, module] of flattenElmExports(elmExports)) {
        const originalElmModule = targetData.originalFlattenedElmExports.get(moduleName);
        if (originalElmModule !== void 0) {
          wrapElmAppInit(
            targetData.initializedElmApps,
            moduleName,
            originalElmModule,
            module.init
          );
        }
        const apps = targetData.initializedElmApps.get(moduleName) ?? [];
        for (const app of apps) {
          const data = module.init(
            "__elmWatchReturnData"
          );
          if (app.__elmWatchProgramType !== data.programType) {
            reloadReasons.push({
              tag: "ProgramTypeChanged",
              previousProgramType: app.__elmWatchProgramType,
              newProgramType: data.programType,
              moduleName
            });
          } else {
            try {
              const innerReasons = app.__elmWatchHotReload(data);
              for (const innerReason of innerReasons) {
                reloadReasons.push({ ...innerReason, moduleName });
              }
            } catch (error) {
              reloadReasons.push({
                tag: "HotReloadCaughtError",
                caughtError: error,
                moduleName
              });
            }
          }
        }
      }
      mutable.shouldSkipInitCmds = false;
      if (reloadReasons.length === 0) {
        dispatch({
          tag: "EvalSucceeded",
          date: getNow()
        });
      } else {
        dispatch({
          tag: "EvalNeedsReload",
          date: getNow(),
          reasons: reloadReasons
        });
      }
    };
    const originalShouldSkipInitCmds = __ELM_WATCH.SHOULD_SKIP_INIT_CMDS;
    __ELM_WATCH.SHOULD_SKIP_INIT_CMDS = (targetName) => originalShouldSkipInitCmds(targetName) || targetName === TARGET_NAME && mutable.shouldSkipInitCmds;
    const originalKillMatching = __ELM_WATCH.KILL_MATCHING;
    __ELM_WATCH.KILL_MATCHING = (targetName) => new Promise((resolve, reject) => {
      if (targetName.test(TARGET_NAME)) {
        const needsToCloseWebSocket = mutable.webSocket.readyState !== WebSocket.CLOSED;
        if (needsToCloseWebSocket) {
          mutable.webSocket.addEventListener("close", () => {
            originalKillMatching(targetName).then(resolve).catch(reject);
          });
          mutable.webSocket.close();
        }
        mutable.removeListeners();
        if (mutable.webSocketTimeoutId !== void 0) {
          clearTimeout(mutable.webSocketTimeoutId);
          mutable.webSocketTimeoutId = void 0;
        }
        elements?.targetRoot.remove();
        resolvePromise(void 0);
        if (!needsToCloseWebSocket) {
          originalKillMatching(targetName).then(resolve).catch(reject);
        }
      } else {
        originalKillMatching(targetName).then(resolve).catch(reject);
      }
    });
    const originalDisconnect = __ELM_WATCH.DISCONNECT;
    __ELM_WATCH.DISCONNECT = (targetName) => {
      if (targetName.test(TARGET_NAME) && mutable.webSocket.readyState !== WebSocket.CLOSED) {
        mutable.webSocket.close();
      } else {
        originalDisconnect(targetName);
      }
    };
    return mutable;
  };
  function addEventListener(target, eventName, listener) {
    target.addEventListener(eventName, listener);
    return () => {
      target.removeEventListener(eventName, listener);
    };
  }
  function initWebSocket(getNow, elmCompiledTimestamp, dispatch) {
    const [hostname, protocol] = (
      // Browser: `window.location` always exists.
      // Web Worker: `window` has been set to `globalThis` at the top, which has `.location`.
      // Node.js: `window.location` does not exist.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      window2.location === void 0 ? ["localhost", "ws"] : [
        window2.location.hostname === "" ? "localhost" : window2.location.hostname,
        window2.location.protocol === "https:" ? "wss" : "ws"
      ]
    );
    const url = new URL(
      /^\d+$/.test(WEBSOCKET_CONNECTION) ? `${protocol}://${hostname}:${WEBSOCKET_CONNECTION}/elm-watch` : WEBSOCKET_CONNECTION
    );
    url.searchParams.set("elmWatchVersion", VERSION);
    url.searchParams.set("webSocketToken", WEBSOCKET_TOKEN);
    url.searchParams.set("targetName", TARGET_NAME);
    url.searchParams.set("elmCompiledTimestamp", elmCompiledTimestamp.toString());
    const webSocket = new WebSocket(url);
    webSocket.addEventListener("open", () => {
      dispatch({ tag: "WebSocketConnected", date: getNow() });
    });
    webSocket.addEventListener("close", () => {
      dispatch({
        tag: "WebSocketClosed",
        date: getNow()
      });
    });
    webSocket.addEventListener("error", () => {
      dispatch({
        tag: "WebSocketClosed",
        date: getNow()
      });
    });
    webSocket.addEventListener("message", (event) => {
      dispatch({
        tag: "WebSocketMessageReceived",
        date: getNow(),
        data: event.data
      });
    });
    return webSocket;
  }
  var init = (date, browserUiPosition, elmCompiledTimestampBeforeReload) => {
    const model = {
      status: { tag: "Connecting", date, attemptNumber: 1 },
      compilationMode: ORIGINAL_COMPILATION_MODE,
      browserUiPosition,
      lastBrowserUiPositionChangeDate: void 0,
      elmCompiledTimestamp: INITIAL_ELM_COMPILED_TIMESTAMP,
      elmCompiledTimestampBeforeReload,
      uiExpanded: false
    };
    return [model, [{ tag: "Render", model, manageFocus: false }]];
  };
  function update(msg, model) {
    switch (msg.tag) {
      case "AppInit":
        return [{ ...model }, []];
      case "BrowserUiMoved":
        return [{ ...model, browserUiPosition: msg.browserUiPosition }, []];
      case "EvalErrored":
        return [
          {
            ...model,
            status: { tag: "EvalError", date: msg.date },
            uiExpanded: true
          },
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "EvalErrored"
            }
          ]
        ];
      case "EvalNeedsReload":
        return [
          {
            ...model,
            status: {
              tag: "WaitingForReload",
              date: msg.date,
              reasons: Array.from(new Set(msg.reasons.map(reloadReasonToString)))
            }
          },
          []
        ];
      case "EvalSucceeded":
        return [
          {
            ...model,
            status: {
              tag: "Idle",
              date: msg.date,
              sendKey: SEND_KEY_DO_NOT_USE_ALL_THE_TIME
            }
          },
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "EvalSucceeded"
            }
          ]
        ];
      case "FocusedTab":
        return [
          model,
          [
            // Replay the error animation.
            ...statusToStatusType(model.status.tag) === "Error" ? [{ tag: "Flash", flashType: "error" }] : [],
            // Send these commands regardless of current status: We want to prioritize the target
            // due to the focus no matter what, and after waking up on iOS we need to check the
            // WebSocket connection no matter what as well. For example, it’s possible to lock
            // the phone while Busy, and then we miss the “done” message, which makes us still
            // have the Busy status when unlocking the phone.
            {
              tag: "SendMessage",
              message: { tag: "FocusedTab" },
              sendKey: SEND_KEY_DO_NOT_USE_ALL_THE_TIME
            },
            {
              tag: "WebSocketTimeoutBegin"
            }
          ]
        ];
      case "PageVisibilityChangedToVisible":
        return reconnect(model, msg.date, { force: true });
      case "ReloadAllCssDone":
        return [
          model,
          msg.didChange ? [{ tag: "Flash", flashType: "success" }] : []
        ];
      case "SleepBeforeReconnectDone":
        return reconnect(model, msg.date, { force: false });
      case "UiMsg":
        return onUiMsg(msg.date, msg.msg, model);
      case "WebSocketClosed":
        if (model.status.tag === "SleepingBeforeReconnect") {
          return [model, []];
        } else {
          const attemptNumber = "attemptNumber" in model.status ? model.status.attemptNumber + 1 : 1;
          return [
            {
              ...model,
              status: {
                tag: "SleepingBeforeReconnect",
                date: msg.date,
                attemptNumber
              }
            },
            [{ tag: "SleepBeforeReconnect", attemptNumber }]
          ];
        }
      case "WebSocketConnected":
        return [
          {
            ...model,
            status: { tag: "Busy", date: msg.date, errorOverlay: void 0 }
          },
          []
        ];
      case "WebSocketMessageReceived": {
        const result = parseWebSocketMessageData(msg.data);
        switch (result.tag) {
          case "Success":
            return onWebSocketToClientMessage(msg.date, result.message, model);
          case "Error":
            return [
              {
                ...model,
                status: {
                  tag: "UnexpectedError",
                  date: msg.date,
                  message: result.message
                },
                uiExpanded: true
              },
              []
            ];
        }
      }
    }
  }
  function onUiMsg(date, msg, model) {
    switch (msg.tag) {
      case "ChangedBrowserUiPosition":
        return [
          {
            ...model,
            browserUiPosition: msg.browserUiPosition,
            lastBrowserUiPositionChangeDate: date
          },
          [
            {
              tag: "SendMessage",
              message: {
                tag: "ChangedBrowserUiPosition",
                browserUiPosition: msg.browserUiPosition
              },
              sendKey: msg.sendKey
            }
          ]
        ];
      case "ChangedCompilationMode":
        return [
          {
            ...model,
            status: {
              tag: "Busy",
              date,
              errorOverlay: getErrorOverlay(model.status)
            },
            compilationMode: msg.compilationMode
          },
          [
            {
              tag: "SendMessage",
              message: {
                tag: "ChangedCompilationMode",
                compilationMode: msg.compilationMode
              },
              sendKey: msg.sendKey
            }
          ]
        ];
      case "ChangedOpenErrorOverlay":
        return "errorOverlay" in model.status && model.status.errorOverlay !== void 0 ? [
          {
            ...model,
            status: {
              ...model.status,
              errorOverlay: {
                ...model.status.errorOverlay,
                openErrorOverlay: msg.openErrorOverlay
              }
            },
            uiExpanded: false
          },
          [
            {
              tag: "SendMessage",
              message: {
                tag: "ChangedOpenErrorOverlay",
                openErrorOverlay: msg.openErrorOverlay
              },
              sendKey: (
                // It works well clicking an error location to open it in an editor while busy.
                model.status.tag === "Busy" ? SEND_KEY_DO_NOT_USE_ALL_THE_TIME : model.status.sendKey
              )
            }
          ]
        ] : [model, []];
      case "PressedChevron":
        return [{ ...model, uiExpanded: !model.uiExpanded }, []];
      case "PressedOpenEditor":
        return [
          model,
          [
            {
              tag: "SendMessage",
              message: {
                tag: "PressedOpenEditor",
                file: msg.file,
                line: msg.line,
                column: msg.column
              },
              sendKey: msg.sendKey
            }
          ]
        ];
      case "PressedReconnectNow":
        return reconnect(model, date, { force: true });
    }
  }
  function onWebSocketToClientMessage(date, msg, model) {
    switch (msg.tag) {
      case "FocusedTabAcknowledged":
        return [model, [{ tag: "WebSocketTimeoutClear" }]];
      case "OpenEditorFailed":
        return [
          model.status.tag === "CompileError" ? {
            ...model,
            status: { ...model.status, openEditorError: msg.error },
            uiExpanded: true
          } : model,
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "OpenEditorFailed"
            }
          ]
        ];
      case "StaticFilesChanged":
        return [
          { ...model, status: { ...model.status, date } },
          [
            {
              tag: "HandleStaticFilesChanged",
              changedFileUrlPaths: msg.changedFileUrlPaths
            }
          ]
        ];
      case "StaticFilesMayHaveChangedWhileDisconnected":
        return [
          { ...model, status: { ...model.status, date } },
          [
            {
              tag: "HandleStaticFilesChanged",
              changedFileUrlPaths: "AnyFileMayHaveChanged"
            }
          ]
        ];
      case "StatusChanged":
        return statusChanged(date, msg.status, model);
      case "SuccessfullyCompiled": {
        const justChangedBrowserUiPosition = model.lastBrowserUiPositionChangeDate !== void 0 && date.getTime() - model.lastBrowserUiPositionChangeDate.getTime() < JUST_CHANGED_BROWSER_UI_POSITION_TIMEOUT;
        return msg.compilationMode !== ORIGINAL_COMPILATION_MODE ? [
          {
            ...model,
            status: {
              tag: "WaitingForReload",
              date,
              reasons: ORIGINAL_COMPILATION_MODE === "proxy" ? [] : [
                `compilation mode changed from ${ORIGINAL_COMPILATION_MODE} to ${msg.compilationMode}.`
              ]
            },
            compilationMode: msg.compilationMode
          },
          []
        ] : [
          {
            ...model,
            compilationMode: msg.compilationMode,
            elmCompiledTimestamp: msg.elmCompiledTimestamp,
            browserUiPosition: msg.browserUiPosition,
            lastBrowserUiPositionChangeDate: void 0
          },
          [
            { tag: "Eval", code: msg.code },
            // This isn’t strictly necessary, but has the side effect of
            // getting rid of the success animation.
            justChangedBrowserUiPosition ? {
              tag: "SetBrowserUiPosition",
              browserUiPosition: msg.browserUiPosition
            } : { tag: "NoCmd" }
          ]
        ];
      }
      case "SuccessfullyCompiledButRecordFieldsChanged":
        return [
          {
            ...model,
            status: {
              tag: "WaitingForReload",
              date,
              reasons: [
                `record field mangling in optimize mode was different than last time.`
              ]
            }
          },
          []
        ];
    }
  }
  function statusChanged(date, status, model) {
    switch (status.tag) {
      case "AlreadyUpToDate":
        return [
          {
            ...model,
            status: {
              tag: "Idle",
              date,
              sendKey: SEND_KEY_DO_NOT_USE_ALL_THE_TIME
            },
            compilationMode: status.compilationMode,
            browserUiPosition: status.browserUiPosition
          },
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "AlreadyUpToDate"
            }
          ]
        ];
      case "Busy":
        return [
          {
            ...model,
            status: {
              tag: "Busy",
              date,
              errorOverlay: getErrorOverlay(model.status)
            },
            compilationMode: status.compilationMode,
            browserUiPosition: status.browserUiPosition
          },
          []
        ];
      case "ClientError":
        return [
          {
            ...model,
            status: { tag: "UnexpectedError", date, message: status.message },
            uiExpanded: true
          },
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "ClientError"
            }
          ]
        ];
      case "CompileError":
        return [
          {
            ...model,
            status: {
              tag: "CompileError",
              date,
              sendKey: SEND_KEY_DO_NOT_USE_ALL_THE_TIME,
              errorOverlay: {
                errors: new Map(
                  status.errors.map((error) => {
                    const overlayError = {
                      title: error.title,
                      location: error.location,
                      htmlContent: error.htmlContent,
                      foregroundColor: status.foregroundColor,
                      backgroundColor: status.backgroundColor
                    };
                    const id = CodecJSON.stringify(unknown, overlayError);
                    return [id, overlayError];
                  })
                ),
                openErrorOverlay: status.openErrorOverlay
              },
              openEditorError: void 0
            },
            compilationMode: status.compilationMode,
            browserUiPosition: status.browserUiPosition
          },
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "CompileError"
            }
          ]
        ];
      case "ElmJsonError":
        return [
          {
            ...model,
            status: { tag: "ElmJsonError", date, error: status.error }
          },
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "ElmJsonError"
            }
          ]
        ];
    }
  }
  function reconnect(model, date, { force }) {
    return model.status.tag === "SleepingBeforeReconnect" && (date.getTime() - model.status.date.getTime() >= retryWaitMs(model.status.attemptNumber) || force) ? [
      {
        ...model,
        status: {
          tag: "Connecting",
          date,
          attemptNumber: model.status.attemptNumber
        }
      },
      [
        {
          tag: "Reconnect",
          elmCompiledTimestamp: model.elmCompiledTimestamp
        }
      ]
    ] : [model, []];
  }
  function retryWaitMs(attemptNumber) {
    return Math.min(1e3 + 10 * attemptNumber ** 2, 1e3 * 60);
  }
  function printRetryWaitMs(attemptNumber) {
    return `${retryWaitMs(attemptNumber) / 1e3} seconds`;
  }
  var runCmd = (getNow, elements) => (cmd, mutable, dispatch, _resolvePromise, rejectPromise) => {
    switch (cmd.tag) {
      case "Eval":
        evalWithBackwardsCompatibility(cmd.code).catch((unknownError) => {
          void Promise.reject(unknownError);
          dispatch({ tag: "EvalErrored", date: getNow() });
        });
        return;
      case "Flash":
        if (elements !== void 0) {
          flash(elements, cmd.flashType);
        }
        return;
      case "HandleStaticFilesChanged": {
        const now = getNow();
        let shouldReloadCss = false;
        if (cmd.changedFileUrlPaths === "AnyFileMayHaveChanged") {
          shouldReloadCss = true;
        } else {
          if (now.getTime() - __ELM_WATCH.CHANGED_FILE_URL_PATHS.timestamp.getTime() > ELM_WATCH_CHANGED_FILE_URL_BATCH_TIME) {
            __ELM_WATCH.CHANGED_FILE_URL_PATHS = {
              timestamp: now,
              changed: /* @__PURE__ */ new Set()
            };
          }
          const justChangedFileUrlPaths = /* @__PURE__ */ new Set();
          for (const path of cmd.changedFileUrlPaths) {
            if (path.toLowerCase().endsWith(".css")) {
              shouldReloadCss = true;
            } else if (!__ELM_WATCH.CHANGED_FILE_URL_PATHS.changed.has(path)) {
              justChangedFileUrlPaths.add(path);
            }
          }
          if (justChangedFileUrlPaths.size > 0) {
            for (const path of justChangedFileUrlPaths) {
              __ELM_WATCH.CHANGED_FILE_URL_PATHS.changed.add(path);
            }
            window2.dispatchEvent(
              new CustomEvent(ELM_WATCH_CHANGED_FILE_URL_PATHS_EVENT, {
                detail: justChangedFileUrlPaths
              })
            );
          }
        }
        if (shouldReloadCss && now.getTime() - __ELM_WATCH.CHANGED_CSS.getTime() > ELM_WATCH_CHANGED_FILE_URL_BATCH_TIME && HAS_WINDOW) {
          __ELM_WATCH.CHANGED_CSS = now;
          reloadAllCssIfNeeded(__ELM_WATCH.ORIGINAL_STYLES).then((didChange) => {
            dispatch({ tag: "ReloadAllCssDone", didChange });
          }).catch(rejectPromise);
        }
        return;
      }
      case "NoCmd":
        return;
      case "Reconnect":
        mutable.webSocket = initWebSocket(
          getNow,
          cmd.elmCompiledTimestamp,
          dispatch
        );
        return;
      case "Render": {
        const { model } = cmd;
        const info = {
          version: VERSION,
          webSocketUrl: new URL(mutable.webSocket.url),
          targetName: TARGET_NAME,
          originalCompilationMode: ORIGINAL_COMPILATION_MODE,
          debugModeToggled: getDebugModeToggled()
        };
        if (elements === void 0) {
          const isError = statusToStatusType(model.status.tag) === "Error";
          const isWebWorker = typeof window2.WorkerGlobalScope !== "undefined" && !isError;
          const consoleMethodName = (
            // `console.info` looks nicer in the browser console for Web Workers.
            // On Node.js, we want to always print to stderr.
            isError || !isWebWorker ? "error" : "info"
          );
          const consoleMethod = console[consoleMethodName];
          consoleMethod(renderWithoutDomElements(model, info));
        } else {
          const { targetRoot } = elements;
          render(getNow, targetRoot, dispatch, model, info, cmd.manageFocus);
          if (typeof elements.container.close === "function" && typeof elements.container.showModal === "function" && // Support users removing elm-watch’s UI (`.showModal()` throws an error in that case).
          elements.container.isConnected) {
            if (elements.overlay.hidden) {
              elements.container.close();
            } else {
              elements.container.showModal();
            }
          }
          if (typeof elements.containerInner.hidePopover === "function" && typeof elements.containerInner.showPopover === "function" && // Support users removing elm-watch’s UI (`.showPopover()` throws an error in that case).
          elements.containerInner.isConnected) {
            elements.containerInner.hidePopover();
            elements.containerInner.showPopover();
          }
        }
        return;
      }
      case "SendMessage": {
        const json = CodecJSON.stringify(
          WebSocketToServerMessage,
          cmd.message
        );
        try {
          mutable.webSocket.send(json);
        } catch (error) {
          console.error("elm-watch: Failed to send WebSocket message:", error);
        }
        return;
      }
      case "SetBrowserUiPosition":
        if (elements !== void 0) {
          setBrowserUiPosition(cmd.browserUiPosition, elements);
        }
        return;
      case "SleepBeforeReconnect":
        runInitCmds(mutable);
        setTimeout(() => {
          if (typeof document === "undefined" || document.visibilityState === "visible") {
            dispatch({ tag: "SleepBeforeReconnectDone", date: getNow() });
          }
        }, retryWaitMs(cmd.attemptNumber));
        return;
      case "TriggerReachedIdleState":
        runInitCmds(mutable);
        Promise.resolve().then(() => {
          __ELM_WATCH.ON_REACHED_IDLE_STATE(cmd.reason);
        }).catch(rejectPromise);
        return;
      case "UpdateErrorOverlay":
        if (elements !== void 0) {
          updateErrorOverlay(
            TARGET_NAME,
            (msg) => {
              dispatch({ tag: "UiMsg", date: getNow(), msg });
            },
            cmd.sendKey,
            cmd.errors,
            elements.overlay,
            elements.overlayCloseButton
          );
        }
        return;
      case "UpdateGlobalStatus":
        __ELM_WATCH.RELOAD_STATUSES.set(TARGET_NAME, cmd.reloadStatus);
        switch (cmd.reloadStatus.tag) {
          case "NoReloadWanted":
          case "MightWantToReload":
            break;
          case "ReloadRequested":
            try {
              window2.sessionStorage.setItem(
                RELOAD_TARGET_NAME_KEY_PREFIX + TARGET_NAME,
                cmd.elmCompiledTimestamp.toString()
              );
            } catch {
            }
        }
        reloadPageIfNeeded();
        return;
      // On iOS, if you lock the phone and wait a couple of seconds, the Web
      // Socket disconnects (check the “web socket connections: X” counter in
      // the terminal). Same thing if you just go to the home screen.  When you
      // go back to the tab, I’ve ended up in a state where the WebSocket
      // appears connected, but you don’t receive any messages and when I tried
      // to switch compilation mode the server never got any message. Apparently
      // “broken connections” is a thing with WebSockets and the way you detect
      // them is by sending a ping-pong pair with a timeout:
      // https://github.com/websockets/ws/tree/975382178f8a9355a5a564bb29cb1566889da9ba#how-to-detect-and-close-broken-connections
      // In our case, the window "focus" event occurs when returning to the page
      // after unlocking the phone, or switching from another tab or app, and we
      // already send a `FocusedTab` message then. That’s the perfect ping, and
      // `FocusedTabAcknowledged` is the pong.
      case "WebSocketTimeoutBegin":
        if (mutable.webSocketTimeoutId === void 0) {
          mutable.webSocketTimeoutId = setTimeout(() => {
            mutable.webSocketTimeoutId = void 0;
            mutable.webSocket.close();
            dispatch({
              tag: "WebSocketClosed",
              date: getNow()
            });
          }, __ELM_WATCH.WEBSOCKET_TIMEOUT);
        }
        return;
      case "WebSocketTimeoutClear":
        if (mutable.webSocketTimeoutId !== void 0) {
          clearTimeout(mutable.webSocketTimeoutId);
          mutable.webSocketTimeoutId = void 0;
        }
        return;
    }
  };
  function runInitCmds(mutable) {
    if (!mutable.shouldSkipInitCmds) {
      return;
    }
    const targetData = __ELM_WATCH.TARGET_DATA.get(TARGET_NAME);
    if (targetData !== void 0) {
      for (const apps of targetData.initializedElmApps.values()) {
        for (const app of apps) {
          app.__elmWatchRunInitCmds();
        }
      }
    }
    mutable.shouldSkipInitCmds = false;
  }
  async function evalAsModuleViaBlob(code) {
    const objectURL = URL.createObjectURL(
      new Blob([code], { type: "text/javascript" })
    );
    await import(objectURL);
    URL.revokeObjectURL(objectURL);
  }
  async function evalAsModuleViaDataUri(code) {
    await import(`data:text/javascript,${encodeURIComponent(code)}`);
  }
  var evalAsModule = evalAsModuleViaDataUri;
  evalAsModuleViaBlob("").then(() => {
    evalAsModule = evalAsModuleViaBlob;
  }).catch(() => {
  });
  var evalWithBackwardsCompatibility = async (code) => {
    let f;
    try {
      f = new Function(code);
    } catch (scriptError) {
      try {
        await evalAsModule(code);
      } catch (moduleError) {
        throw new Error(
          `Error when evaluated as a module:

${unknownErrorToString(moduleError)}

Error when evaluated as a script:

${unknownErrorToString(scriptError)}`
        );
      }
      [evalWithBackwardsCompatibility, evalWithBackwardsCompatibility2] = [
        evalWithBackwardsCompatibility2,
        evalWithBackwardsCompatibility
      ];
      return;
    }
    f();
  };
  var evalWithBackwardsCompatibility2 = async (code) => {
    try {
      await evalAsModule(code);
    } catch (moduleError) {
      try {
        const f = new Function(code);
        f();
      } catch (scriptError) {
        throw new Error(
          `Error when evaluated as a module:

${unknownErrorToString(moduleError)}

Error when evaluated as a script:

${unknownErrorToString(scriptError)}`
        );
      }
      [evalWithBackwardsCompatibility, evalWithBackwardsCompatibility2] = [
        evalWithBackwardsCompatibility2,
        evalWithBackwardsCompatibility
      ];
    }
  };
  function parseWebSocketMessageData(data) {
    const decoderResult = decodeWebSocketToClientMessage(data);
    switch (decoderResult.tag) {
      case "DecoderError":
        return {
          tag: "Error",
          message: `Failed to decode web socket message sent from the server:
${format(
            decoderResult.error
          )}`
        };
      case "Valid":
        return {
          tag: "Success",
          message: decoderResult.value
        };
    }
  }
  function getDebugModeToggled() {
    if (__ELM_WATCH.SOME_TARGET_IS_PROXY) {
      return {
        tag: "Disabled",
        reason: noDebuggerYetReason
      };
    }
    const targetData = __ELM_WATCH.TARGET_DATA.get(TARGET_NAME);
    const programTypes = targetData === void 0 ? [] : Array.from(targetData.initializedElmApps.values()).flatMap(
      (apps) => apps.map((app) => app.__elmWatchProgramType)
    );
    if (programTypes.length === 0) {
      return {
        tag: "Disabled",
        reason: noDebuggerNoAppsReason
      };
    }
    const noDebugger = programTypes.filter((programType) => {
      switch (programType) {
        case "Platform.worker":
        case "Html":
          return true;
        case "Browser.sandbox":
        case "Browser.element":
        case "Browser.document":
        case "Browser.application":
          return false;
      }
    });
    return noDebugger.length === programTypes.length ? {
      tag: "Disabled",
      reason: noDebuggerReason(new Set(noDebugger))
    } : { tag: "Enabled" };
  }
  function reloadPageIfNeeded() {
    let shouldReload = false;
    const reasons = [];
    for (const [
      targetName,
      reloadStatus
    ] of __ELM_WATCH.RELOAD_STATUSES.entries()) {
      switch (reloadStatus.tag) {
        case "MightWantToReload":
          return;
        case "NoReloadWanted":
          break;
        case "ReloadRequested":
          shouldReload = true;
          if (reloadStatus.reasons.length > 0) {
            reasons.push([targetName, reloadStatus.reasons]);
          }
          break;
      }
    }
    if (!shouldReload) {
      return;
    }
    const first = reasons[0];
    const [separator, reasonString] = reasons.length === 1 && first !== void 0 && first[1].length === 1 ? [" ", `${first[1].join("")}
(target: ${first[0]})`] : [
      ":\n\n",
      reasons.map(
        ([targetName, subReasons]) => [
          targetName,
          ...subReasons.map((subReason) => `- ${subReason}`)
        ].join("\n")
      ).join("\n\n")
    ];
    const message = reasons.length === 0 ? void 0 : `elm-watch: I did a full page reload because${separator}${reasonString}`;
    __ELM_WATCH.RELOAD_STATUSES = /* @__PURE__ */ new Map();
    __ELM_WATCH.RELOAD_PAGE(message);
  }
  function h(t, {
    attrs,
    style,
    localName,
    ...props
  }, ...children) {
    const element = document.createElement(
      localName ?? t.name.replace(/^HTML(\w+)Element$/, "$1").replace("Anchor", "a").replace("Paragraph", "p").replace(/^([DOU])List$/, "$1l").toLowerCase()
    );
    Object.assign(element, props);
    if (attrs !== void 0) {
      for (const [key, value] of Object.entries(attrs)) {
        element.setAttribute(key, value);
      }
    }
    if (style !== void 0) {
      for (const [key, value] of Object.entries(style)) {
        element.style[key] = value;
      }
    }
    for (const child of children) {
      if (child !== void 0) {
        element.append(
          typeof child === "string" ? document.createTextNode(child) : child
        );
      }
    }
    return element;
  }
  function renderWithoutDomElements(model, info) {
    const statusData = statusIconAndText(model);
    return `${statusData.icon} elm-watch: ${statusData.status} ${formatTime(
      model.status.date
    )} (${info.targetName})`;
  }
  function render(getNow, targetRoot, dispatch, model, info, manageFocus) {
    targetRoot.replaceChildren(
      view(
        (msg) => {
          dispatch({ tag: "UiMsg", date: getNow(), msg });
        },
        model,
        info
      )
    );
    const firstFocusableElement = targetRoot.querySelector(`button, [tabindex]`);
    if (manageFocus && firstFocusableElement instanceof HTMLElement) {
      firstFocusableElement.focus();
    }
    __ELM_WATCH.ON_RENDER(TARGET_NAME);
  }
  var CLASS = {
    browserUiPositionButton: "browserUiPositionButton",
    browserUiPositionChooser: "browserUiPositionChooser",
    chevronButton: "chevronButton",
    compilationModeWithIcon: "compilationModeWithIcon",
    container: "container",
    debugModeIcon: "debugModeIcon",
    envNotSet: "envNotSet",
    errorLocationButton: "errorLocationButton",
    errorTitle: "errorTitle",
    expandedUiContainer: "expandedUiContainer",
    flash: "flash",
    overlay: "overlay",
    overlayCloseButton: "overlayCloseButton",
    root: "root",
    rootBottomHalf: "rootBottomHalf",
    shortStatusContainer: "shortStatusContainer",
    targetName: "targetName",
    targetRoot: "targetRoot"
  };
  function getStatusFlashType({
    statusType,
    statusTypeChanged,
    hasReceivedHotReload,
    uiRelatedUpdate,
    errorOverlayVisible
  }) {
    switch (statusType) {
      case "Success":
        return statusTypeChanged && hasReceivedHotReload ? "success" : void 0;
      case "Error":
        return errorOverlayVisible ? statusTypeChanged && hasReceivedHotReload ? "error" : void 0 : uiRelatedUpdate ? void 0 : "error";
      case "Waiting":
        return void 0;
    }
  }
  function flash(elements, flashType) {
    for (const element of elements.targetRoot.querySelectorAll(
      `.${CLASS.flash}`
    )) {
      element.setAttribute("data-flash", flashType);
    }
  }
  var CHEVRON_UP = "\u25B2";
  var CHEVRON_DOWN = "\u25BC";
  var CSS = `
input,
button,
select,
textarea {
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  color: inherit;
  margin: 0;
}

fieldset {
  display: grid;
  gap: 0.25em;
  margin: 0;
  border: 1px solid var(--grey);
  padding: 0.25em 0.75em 0.5em;
}

fieldset:disabled {
  color: var(--grey);
}

p,
dd {
  margin: 0;
}

dl {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0.25em 1em;
  margin: 0;
  white-space: nowrap;
}

dt {
  text-align: right;
  color: var(--grey);
}

time {
  display: inline-grid;
  overflow: hidden;
}

time::after {
  content: attr(data-format);
  visibility: hidden;
  height: 0;
}

.${CLASS.overlay} {
  position: fixed;
  z-index: -2;
  inset: 0;
  overflow-y: auto;
  padding: 2ch 0;
  user-select: text;
}

.${CLASS.overlayCloseButton} {
  position: fixed;
  z-index: -1;
  top: 0;
  right: 0;
  appearance: none;
  padding: 1em;
  border: none;
  border-radius: 0;
  background: none;
  cursor: pointer;
  font-size: 1.25em;
  filter: drop-shadow(0 0 0.125em var(--backgroundColor));
}

.${CLASS.overlayCloseButton}::before,
.${CLASS.overlayCloseButton}::after {
  content: "";
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.125em;
  height: 1em;
  background-color: var(--foregroundColor);
  transform: translate(-50%, -50%) rotate(45deg);
}

.${CLASS.overlayCloseButton}::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.${CLASS.overlay},
.${CLASS.overlay} pre {
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
}

.${CLASS.overlay} details {
  --border-thickness: 0.125em;
  border-top: var(--border-thickness) solid;
  margin: 2ch 0;
}

.${CLASS.overlay} summary {
  cursor: pointer;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 2ch;
  word-break: break-word;
}

.${CLASS.overlay} summary::-webkit-details-marker {
  display: none;
}

.${CLASS.overlay} summary::marker {
  content: none;
}

.${CLASS.overlay} summary > * {
  pointer-events: auto;
}

.${CLASS.errorTitle} {
  display: inline-block;
  font-weight: bold;
  --padding: 1ch;
  padding: 0 var(--padding);
  transform: translate(calc(var(--padding) * -1), calc(-50% - var(--border-thickness) / 2));
}

.${CLASS.errorTitle}::before {
  content: "${CHEVRON_DOWN}";
  display: inline-block;
  margin-right: 1ch;
  transform: translateY(-0.0625em);
}

details[open] > summary > .${CLASS.errorTitle}::before {
  content: "${CHEVRON_UP}";
}

.${CLASS.errorLocationButton} {
  appearance: none;
  padding: 0;
  border: none;
  border-radius: 0;
  background: none;
  text-align: left;
  text-decoration: underline;
  cursor: pointer;
}

.${CLASS.overlay} pre {
  margin: 0;
  padding: 2ch;
  overflow-x: auto;
}

.${CLASS.root} {
  all: initial;
  --grey: #767676;
  display: flex;
  align-items: start;
  overflow: auto;
  max-height: 100vh;
  max-width: 100vw;
  color: black;
  font-family: system-ui;
}

.${CLASS.rootBottomHalf} {
  align-items: end;
}

.${CLASS.targetRoot} + .${CLASS.targetRoot} {
  margin-left: -1px;
}

.${CLASS.targetRoot}:only-of-type .${CLASS.debugModeIcon},
.${CLASS.targetRoot}:only-of-type .${CLASS.targetName} {
  display: none;
}

.${CLASS.container} {
  display: flex;
  flex-direction: column-reverse;
  background-color: white;
  border: 1px solid var(--grey);
}

.${CLASS.rootBottomHalf} .${CLASS.container} {
  flex-direction: column;
}

.${CLASS.envNotSet} {
  display: grid;
  gap: 0.75em;
  margin: 2em 0;
}

.${CLASS.envNotSet},
.${CLASS.root} pre {
  border-left: 0.25em solid var(--grey);
  padding-left: 0.5em;
}

.${CLASS.root} pre {
  margin: 0;
  white-space: pre-wrap;
}

.${CLASS.expandedUiContainer} {
  padding: 1em;
  padding-top: 0.75em;
  display: grid;
  gap: 0.75em;
  outline: none;
  contain: paint;
}

.${CLASS.rootBottomHalf} .${CLASS.expandedUiContainer} {
  padding-bottom: 0.75em;
}

.${CLASS.expandedUiContainer}:is(.length0, .length1) {
  grid-template-columns: min-content;
}

.${CLASS.expandedUiContainer} > dl {
  justify-self: start;
}

.${CLASS.expandedUiContainer} label {
  display: grid;
  grid-template-columns: min-content auto;
  align-items: center;
  gap: 0.25em;
}

.${CLASS.expandedUiContainer} label.Disabled {
  color: var(--grey);
}

.${CLASS.expandedUiContainer} label > small {
  grid-column: 2;
}

.${CLASS.compilationModeWithIcon} {
  display: flex;
  align-items: center;
  gap: 0.25em;
}

.${CLASS.browserUiPositionChooser} {
  position: absolute;
  display: grid;
  grid-template-columns: min-content min-content;
  pointer-events: none;
}

.${CLASS.browserUiPositionButton} {
  appearance: none;
  padding: 0;
  border: none;
  background: none;
  border-radius: none;
  pointer-events: auto;
  width: 1em;
  height: 1em;
  text-align: center;
  line-height: 1em;
}

.${CLASS.browserUiPositionButton}:hover {
  background-color: rgba(0, 0, 0, 0.25);
}

.${CLASS.targetRoot}:not(:first-child) .${CLASS.browserUiPositionChooser} {
  display: none;
}

.${CLASS.shortStatusContainer} {
  line-height: 1;
  padding: 0.25em;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.25em;
}

[data-flash]::before {
  content: "";
  position: absolute;
  margin-top: 0.5em;
  margin-left: 0.5em;
  --size: min(500px, 100vmin);
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  animation: flash 0.7s 0.05s ease-out both;
  pointer-events: none;
}

[data-flash="error"]::before {
  background-color: #eb0000;
}

[data-flash="success"]::before {
  background-color: #00b600;
}

@keyframes flash {
  from {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.9;
  }

  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

@keyframes nudge {
  from {
    opacity: 0;
  }

  to {
    opacity: 0.8;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-flash]::before {
    transform: translate(-50%, -50%);
    width: 2em;
    height: 2em;
    animation: nudge 0.25s ease-in-out 4 alternate forwards;
  }
}

.${CLASS.chevronButton} {
  appearance: none;
  border: none;
  border-radius: 0;
  background: none;
  padding: 0;
  cursor: pointer;
}
`;
  function view(dispatch, passedModel, info) {
    const model = __ELM_WATCH.MOCKED_TIMINGS ? {
      ...passedModel,
      status: {
        ...passedModel.status,
        date: /* @__PURE__ */ new Date("2022-02-05T13:10:05Z")
      }
    } : passedModel;
    const statusData = {
      ...statusIconAndText(model),
      ...viewStatus(dispatch, model, info)
    };
    return h(
      HTMLDivElement,
      { className: CLASS.container },
      model.uiExpanded ? viewExpandedUi(
        model.status,
        statusData,
        info,
        model.browserUiPosition,
        dispatch
      ) : void 0,
      h(
        HTMLDivElement,
        {
          className: CLASS.shortStatusContainer,
          // Placed on the div to increase clickable area.
          onclick: () => {
            dispatch({ tag: "PressedChevron" });
          }
        },
        h(
          HTMLButtonElement,
          {
            className: CLASS.chevronButton,
            attrs: { "aria-expanded": model.uiExpanded.toString() }
          },
          icon(
            model.uiExpanded ? CHEVRON_UP : CHEVRON_DOWN,
            model.uiExpanded ? "Collapse elm-watch" : "Expand elm-watch"
          )
        ),
        compilationModeIcon(model.compilationMode),
        icon(statusData.icon, statusData.status, {
          className: CLASS.flash,
          onanimationend: (event) => {
            if (event.currentTarget instanceof HTMLElement) {
              event.currentTarget.removeAttribute("data-flash");
            }
          }
        }),
        h(
          HTMLTimeElement,
          { dateTime: model.status.date.toISOString() },
          formatTime(model.status.date)
        ),
        h(HTMLSpanElement, { className: CLASS.targetName }, TARGET_NAME)
      )
    );
  }
  function icon(emoji, alt, props) {
    return h(
      HTMLSpanElement,
      { attrs: { "aria-label": alt }, ...props },
      h(HTMLSpanElement, { attrs: { "aria-hidden": "true" } }, emoji)
    );
  }
  function viewExpandedUi(status, statusData, info, browserUiPosition, dispatch) {
    const items = [
      ["target", info.targetName],
      ["elm-watch", info.version],
      ["web socket", printWebSocketUrl(info.webSocketUrl)],
      [
        "updated",
        h(
          HTMLTimeElement,
          {
            dateTime: status.date.toISOString(),
            attrs: { "data-format": "2044-04-30 04:44:44" }
          },
          `${formatDate(status.date)} ${formatTime(status.date)}`
        )
      ],
      ["status", statusData.status],
      ...statusData.dl
    ];
    const browserUiPositionSendKey = statusToSpecialCaseSendKey(status);
    return h(
      HTMLDivElement,
      {
        className: `${CLASS.expandedUiContainer} length${statusData.content.length}`,
        attrs: {
          // Using the attribute instead of the property so that it can be
          // selected with `querySelector`.
          tabindex: "-1"
        }
      },
      h(
        HTMLDListElement,
        {},
        ...items.flatMap(([key, value]) => [
          h(HTMLElement, { localName: "dt" }, key),
          h(HTMLElement, { localName: "dd" }, value)
        ])
      ),
      ...statusData.content,
      browserUiPositionSendKey === void 0 ? void 0 : viewBrowserUiPositionChooser(
        browserUiPosition,
        dispatch,
        browserUiPositionSendKey
      )
    );
  }
  var allBrowserUiPositionsInOrder = [
    "TopLeft",
    "TopRight",
    "BottomLeft",
    "BottomRight"
  ];
  function viewBrowserUiPositionChooser(currentPosition, dispatch, sendKey) {
    const arrows = getBrowserUiPositionArrows(currentPosition);
    return h(
      HTMLDivElement,
      {
        className: CLASS.browserUiPositionChooser,
        style: browserUiPositionToCssForChooser(currentPosition)
      },
      ...allBrowserUiPositionsInOrder.map((position) => {
        const arrow = arrows[position];
        return arrow === void 0 ? h(HTMLDivElement, { style: { visibility: "hidden" } }, "\xB7") : h(
          HTMLButtonElement,
          {
            className: CLASS.browserUiPositionButton,
            attrs: { "data-position": position },
            onclick: () => {
              dispatch({
                tag: "ChangedBrowserUiPosition",
                browserUiPosition: position,
                sendKey
              });
            }
          },
          arrow
        );
      })
    );
  }
  var ARROW_UP = "\u2191";
  var ARROW_DOWN = "\u2193";
  var ARROW_LEFT = "\u2190";
  var ARROW_RIGHT = "\u2192";
  var ARROW_UP_LEFT = "\u2196";
  var ARROW_UP_RIGHT = "\u2197";
  var ARROW_DOWN_LEFT = "\u2199";
  var ARROW_DOWN_RIGHT = "\u2198";
  function getBrowserUiPositionArrows(browserUiPosition) {
    switch (browserUiPosition) {
      case "TopLeft":
        return {
          TopLeft: void 0,
          TopRight: ARROW_RIGHT,
          BottomLeft: ARROW_DOWN,
          BottomRight: ARROW_DOWN_RIGHT
        };
      case "TopRight":
        return {
          TopLeft: ARROW_LEFT,
          TopRight: void 0,
          BottomLeft: ARROW_DOWN_LEFT,
          BottomRight: ARROW_DOWN
        };
      case "BottomLeft":
        return {
          TopLeft: ARROW_UP,
          TopRight: ARROW_UP_RIGHT,
          BottomLeft: void 0,
          BottomRight: ARROW_RIGHT
        };
      case "BottomRight":
        return {
          TopLeft: ARROW_UP_LEFT,
          TopRight: ARROW_UP,
          BottomLeft: ARROW_LEFT,
          BottomRight: void 0
        };
    }
  }
  function statusIconAndText(model) {
    switch (model.status.tag) {
      case "Busy":
        return {
          icon: "\u23F3",
          status: "Waiting for compilation"
        };
      case "CompileError":
        return {
          icon: "\u{1F6A8}",
          status: "Compilation error"
        };
      case "Connecting":
        return {
          icon: "\u{1F50C}",
          status: "Connecting"
        };
      case "ElmJsonError":
        return {
          icon: "\u{1F6A8}",
          status: "elm.json or inputs error"
        };
      case "EvalError":
        return {
          icon: "\u26D4\uFE0F",
          status: "Eval error"
        };
      case "Idle":
        return {
          icon: "\u2705",
          status: "Successfully compiled"
        };
      case "SleepingBeforeReconnect":
        return {
          icon: "\u{1F50C}",
          status: "Sleeping"
        };
      case "UnexpectedError":
        return {
          icon: "\u274C",
          status: "Unexpected error"
        };
      case "WaitingForReload":
        return model.elmCompiledTimestamp === model.elmCompiledTimestampBeforeReload ? {
          icon: "\u274C",
          status: "Reload trouble"
        } : {
          icon: "\u23F3",
          status: "Waiting for reload"
        };
    }
  }
  function viewStatus(dispatch, model, info) {
    const { status, compilationMode } = model;
    switch (status.tag) {
      case "Busy":
        return {
          dl: [],
          content: [
            ...viewCompilationModeChooser({
              dispatch,
              sendKey: void 0,
              compilationMode,
              // Avoid the warning flashing by when switching modes (which is usually very fast).
              warnAboutCompilationModeMismatch: false,
              info
            }),
            ...status.errorOverlay === void 0 ? [] : [viewErrorOverlayToggleButton(dispatch, status.errorOverlay)]
          ]
        };
      case "CompileError":
        return {
          dl: [],
          content: [
            ...viewCompilationModeChooser({
              dispatch,
              sendKey: status.sendKey,
              compilationMode,
              warnAboutCompilationModeMismatch: true,
              info
            }),
            viewErrorOverlayToggleButton(dispatch, status.errorOverlay),
            ...status.openEditorError === void 0 ? [] : viewOpenEditorError(status.openEditorError)
          ]
        };
      case "Connecting":
        return {
          dl: [
            ["attempt", status.attemptNumber.toString()],
            ["sleep", printRetryWaitMs(status.attemptNumber)]
          ],
          content: [
            ...viewHttpsInfo(info.webSocketUrl),
            h(HTMLButtonElement, { disabled: true }, "Connecting web socket\u2026")
          ]
        };
      case "ElmJsonError":
        return {
          dl: [],
          content: [
            h(HTMLPreElement, { style: { minWidth: "80ch" } }, status.error)
          ]
        };
      case "EvalError":
        return {
          dl: [],
          content: [
            h(
              HTMLParagraphElement,
              {},
              "Check the console in the browser developer tools to see errors!"
            )
          ]
        };
      case "Idle":
        return {
          dl: [],
          content: viewCompilationModeChooser({
            dispatch,
            sendKey: status.sendKey,
            compilationMode,
            warnAboutCompilationModeMismatch: true,
            info
          })
        };
      case "SleepingBeforeReconnect":
        return {
          dl: [
            ["attempt", status.attemptNumber.toString()],
            ["sleep", printRetryWaitMs(status.attemptNumber)]
          ],
          content: [
            ...viewHttpsInfo(info.webSocketUrl),
            h(
              HTMLButtonElement,
              {
                onclick: () => {
                  dispatch({ tag: "PressedReconnectNow" });
                }
              },
              "Reconnect web socket now"
            )
          ]
        };
      case "UnexpectedError":
        return {
          dl: [],
          content: [
            h(
              HTMLParagraphElement,
              {},
              "I ran into an unexpected error! This is the error message:"
            ),
            h(HTMLPreElement, {}, status.message)
          ]
        };
      case "WaitingForReload":
        return {
          dl: [],
          content: model.elmCompiledTimestamp === model.elmCompiledTimestampBeforeReload ? [
            "A while ago I reloaded the page to get new compiled JavaScript.",
            "But it looks like after the last page reload I got the same JavaScript as before, instead of new stuff!",
            `The old JavaScript was compiled ${new Date(
              model.elmCompiledTimestamp
            ).toLocaleString()}, and so was the JavaScript currently running.`,
            "I currently need to reload the page again, but fear a reload loop if I try.",
            "Do you have accidental HTTP caching enabled maybe?",
            "Try hard refreshing the page and see if that helps, and consider disabling HTTP caching during development."
          ].map((text) => h(HTMLParagraphElement, {}, text)) : [h(HTMLParagraphElement, {}, "Waiting for other targets\u2026")]
        };
    }
  }
  function viewErrorOverlayToggleButton(dispatch, errorOverlay) {
    return h(
      HTMLButtonElement,
      {
        attrs: {
          "data-test-id": errorOverlay.openErrorOverlay ? "HideErrorOverlayButton" : "ShowErrorOverlayButton"
        },
        onclick: () => {
          dispatch({
            tag: "ChangedOpenErrorOverlay",
            openErrorOverlay: !errorOverlay.openErrorOverlay
          });
        }
      },
      errorOverlay.openErrorOverlay ? "Hide errors" : "Show errors"
    );
  }
  function viewOpenEditorError(error) {
    switch (error.tag) {
      case "EnvNotSet":
        return [
          h(
            HTMLDivElement,
            { className: CLASS.envNotSet },
            h(
              HTMLParagraphElement,
              {},
              "\u2139\uFE0F Clicking error locations only works if you set it up."
            ),
            h(
              HTMLParagraphElement,
              {},
              "Check this out: ",
              h(
                HTMLAnchorElement,
                {
                  href: "https://lydell.github.io/elm-watch/browser-ui/#clickable-error-locations",
                  target: "_blank",
                  rel: "noreferrer"
                },
                h(
                  HTMLElement,
                  { localName: "strong" },
                  "Clickable error locations"
                )
              )
            )
          )
        ];
      case "InvalidFilePath":
      case "CommandFailed":
        return [
          h(
            HTMLParagraphElement,
            {},
            h(
              HTMLElement,
              { localName: "strong" },
              "Opening the location in your editor failed!"
            )
          ),
          h(HTMLPreElement, {}, error.message)
        ];
    }
  }
  function compilationModeIcon(compilationMode) {
    switch (compilationMode) {
      case "proxy":
        return void 0;
      case "debug":
        return icon("\u{1F41B}", "Debug mode", { className: CLASS.debugModeIcon });
      case "standard":
        return void 0;
      case "optimize":
        return icon("\u{1F680}", "Optimize mode");
    }
  }
  function printWebSocketUrl(url) {
    const hostname = url.hostname.endsWith(".localhost") ? "localhost" : url.hostname;
    return `${url.protocol}//${hostname}:${url.port}${url.pathname}`;
  }
  function viewHttpsInfo(webSocketUrl) {
    return webSocketUrl.protocol === "wss:" ? [
      h(
        HTMLParagraphElement,
        {},
        h(HTMLElement, { localName: "strong" }, "Having trouble connecting?")
      ),
      h(HTMLParagraphElement, {}, "Setting up HTTPS can be a bit tricky."),
      h(
        HTMLParagraphElement,
        {},
        "Read all about ",
        h(
          HTMLAnchorElement,
          {
            href: "https://lydell.github.io/elm-watch/https/",
            target: "_blank",
            rel: "noreferrer"
          },
          "HTTPS with elm-watch"
        ),
        "."
      )
    ] : [];
  }
  var noDebuggerYetReason = "The Elm debugger isn't available at this point.";
  var noDebuggerNoAppsReason = "The Elm debugger cannot be enabled until at least one Elm app has been initialized. (Check the browser console for errors if you expected an Elm app to be initialized by now.)";
  function noDebuggerReason(noDebuggerProgramTypes) {
    return `The Elm debugger isn't supported by ${humanList(
      Array.from(noDebuggerProgramTypes, (programType) => `\`${programType}\``),
      "and"
    )} programs.`;
  }
  function reloadReasonToString(reason) {
    switch (reason.tag) {
      case "FlagsTypeChanged":
        return `the flags type in \`${reason.moduleName}\` changed and now the passed flags aren't correct anymore. The idea is to try to run with new flags!
This is the error:
${reason.jsonErrorMessage}`;
      case "HotReloadCaughtError":
        return `hot reload for \`${reason.moduleName}\` failed, probably because of incompatible model changes.
This is the error:
${unknownErrorToString(reason.caughtError)}`;
      case "InitReturnValueChanged":
        return `\`${reason.moduleName}.init\` returned something different than last time. Let's start fresh!`;
      case "MessageTypeChangedInDebugMode":
        return `the message type in \`${reason.moduleName}\` changed in debug mode ("debug metadata" changed).`;
      case "NewPortAdded":
        return `a new port '${reason.name}' was added. The idea is to give JavaScript code a chance to set it up!`;
      case "ProgramTypeChanged":
        return `\`${reason.moduleName}.main\` changed from \`${reason.previousProgramType}\` to \`${reason.newProgramType}\`.`;
    }
  }
  function unknownErrorToString(error) {
    return error instanceof Error ? error.stack !== void 0 ? (
      // In Chrome (V8), `.stack` looks like this: `${errorConstructorName}: ${message}\n${stack}`.
      // In Firefox and Safari, `.stack` is only the stacktrace (does not contain the message).
      error.stack.includes(error.message) ? error.stack : `${error.message}
${error.stack}`
    ) : error.message : repr(error);
  }
  function humanList(list, joinWord) {
    const { length } = list;
    return length <= 1 ? list.join("") : length === 2 ? list.join(` ${joinWord} `) : `${list.slice(0, length - 2).join(", ")}, ${list.slice(-2).join(` ${joinWord} `)}`;
  }
  function viewCompilationModeChooser({
    dispatch,
    sendKey,
    compilationMode: selectedMode,
    warnAboutCompilationModeMismatch,
    info
  }) {
    const compilationModes = [
      { mode: "debug", name: "Debug", toggled: info.debugModeToggled },
      { mode: "standard", name: "Standard", toggled: { tag: "Enabled" } },
      { mode: "optimize", name: "Optimize", toggled: { tag: "Enabled" } }
    ];
    return [
      h(
        HTMLFieldSetElement,
        { disabled: sendKey === void 0 },
        h(HTMLLegendElement, {}, "Compilation mode"),
        ...compilationModes.map(({ mode, name, toggled: status }) => {
          const nameWithIcon = h(
            HTMLSpanElement,
            { className: CLASS.compilationModeWithIcon },
            name,
            mode === selectedMode ? compilationModeIcon(mode) : void 0
          );
          return h(
            HTMLLabelElement,
            { className: status.tag },
            h(HTMLInputElement, {
              type: "radio",
              name: `CompilationMode-${info.targetName}`,
              value: mode,
              checked: mode === selectedMode,
              disabled: sendKey === void 0 || status.tag === "Disabled",
              onchange: sendKey === void 0 ? null : () => {
                dispatch({
                  tag: "ChangedCompilationMode",
                  compilationMode: mode,
                  sendKey
                });
              }
            }),
            ...status.tag === "Enabled" ? [
              nameWithIcon,
              warnAboutCompilationModeMismatch && mode === selectedMode && selectedMode !== info.originalCompilationMode && info.originalCompilationMode !== "proxy" ? h(
                HTMLElement,
                { localName: "small" },
                `Note: The code currently running is in ${ORIGINAL_COMPILATION_MODE} mode.`
              ) : void 0
            ] : [
              nameWithIcon,
              h(HTMLElement, { localName: "small" }, status.reason)
            ]
          );
        })
      )
    ];
  }
  var DATA_TARGET_NAMES = "data-target-names";
  function updateErrorOverlay(targetName, dispatch, sendKey, errors, overlay, overlayCloseButton) {
    const existingErrorElements = new Map(
      Array.from(overlay.children, (element) => [
        element.id,
        {
          targetNames: new Set(
            // Newline is not a valid target name character.
            (element.getAttribute(DATA_TARGET_NAMES) ?? "").split("\n")
          ),
          element
        }
      ])
    );
    for (const [id, { targetNames, element }] of existingErrorElements) {
      if (targetNames.has(targetName) && !errors.has(id)) {
        targetNames.delete(targetName);
        if (targetNames.size === 0) {
          element.remove();
        } else {
          element.setAttribute(DATA_TARGET_NAMES, [...targetNames].join("\n"));
        }
      }
    }
    let previousElement = void 0;
    for (const [id, error] of errors) {
      const maybeExisting = existingErrorElements.get(id);
      if (maybeExisting === void 0) {
        const element = viewOverlayError(
          targetName,
          dispatch,
          sendKey,
          id,
          error
        );
        if (previousElement === void 0) {
          overlay.prepend(element);
        } else {
          previousElement.after(element);
        }
        overlay.style.backgroundColor = error.backgroundColor;
        overlayCloseButton.style.setProperty(
          "--foregroundColor",
          error.foregroundColor
        );
        overlayCloseButton.style.setProperty(
          "--backgroundColor",
          error.backgroundColor
        );
        previousElement = element;
      } else {
        if (!maybeExisting.targetNames.has(targetName)) {
          maybeExisting.element.setAttribute(
            DATA_TARGET_NAMES,
            [...maybeExisting.targetNames, targetName].join("\n")
          );
        }
        previousElement = maybeExisting.element;
      }
    }
    const hidden = !overlay.hasChildNodes();
    overlay.hidden = hidden;
    overlayCloseButton.hidden = hidden;
    overlayCloseButton.style.right = `${overlay.offsetWidth - overlay.clientWidth}px`;
  }
  function viewOverlayError(targetName, dispatch, sendKey, id, error) {
    return h(
      HTMLDetailsElement,
      {
        open: true,
        id,
        style: {
          backgroundColor: error.backgroundColor,
          color: error.foregroundColor
        },
        attrs: {
          [DATA_TARGET_NAMES]: targetName
        }
      },
      h(
        HTMLElement,
        { localName: "summary" },
        h(
          HTMLSpanElement,
          {
            className: CLASS.errorTitle,
            style: {
              backgroundColor: error.backgroundColor
            }
          },
          error.title
        ),
        error.location === void 0 ? void 0 : h(
          HTMLParagraphElement,
          {},
          viewErrorLocation(dispatch, sendKey, error.location)
        )
      ),
      h(HTMLPreElement, { innerHTML: error.htmlContent })
    );
  }
  function viewErrorLocation(dispatch, sendKey, location) {
    switch (location.tag) {
      case "FileOnly":
        return viewErrorLocationButton(
          dispatch,
          sendKey,
          {
            file: location.file,
            line: 1,
            column: 1
          },
          location.file
        );
      case "FileWithLineAndColumn": {
        return viewErrorLocationButton(
          dispatch,
          sendKey,
          location,
          `${location.file}:${location.line}:${location.column}`
        );
      }
      case "Target":
        return `Target: ${location.targetName}`;
    }
  }
  function viewErrorLocationButton(dispatch, sendKey, location, text) {
    return sendKey === void 0 ? text : h(
      HTMLButtonElement,
      {
        className: CLASS.errorLocationButton,
        onclick: () => {
          dispatch({
            tag: "PressedOpenEditor",
            file: location.file,
            line: location.line,
            column: location.column,
            sendKey
          });
        }
      },
      text
    );
  }
  if (typeof WebSocket !== "undefined") {
    run();
  }
})();
(function(scope){
'use strict';

var _Platform_effectManagers = {}, _Scheduler_enqueue; // added by elm-watch

function F(arity, fun, wrapper) {
  wrapper.a = arity;
  wrapper.f = fun;
  return wrapper;
}

function F2(fun) {
  return F(2, fun, function(a) { return function(b) { return fun(a,b); }; })
}
function F3(fun) {
  return F(3, fun, function(a) {
    return function(b) { return function(c) { return fun(a, b, c); }; };
  });
}
function F4(fun) {
  return F(4, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return fun(a, b, c, d); }; }; };
  });
}
function F5(fun) {
  return F(5, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return fun(a, b, c, d, e); }; }; }; };
  });
}
function F6(fun) {
  return F(6, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return fun(a, b, c, d, e, f); }; }; }; }; };
  });
}
function F7(fun) {
  return F(7, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return fun(a, b, c, d, e, f, g); }; }; }; }; }; };
  });
}
function F8(fun) {
  return F(8, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) {
    return fun(a, b, c, d, e, f, g, h); }; }; }; }; }; }; };
  });
}
function F9(fun) {
  return F(9, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) { return function(i) {
    return fun(a, b, c, d, e, f, g, h, i); }; }; }; }; }; }; }; };
  });
}

function A2(fun, a, b) {
  return fun.a === 2 ? fun.f(a, b) : fun(a)(b);
}
function A3(fun, a, b, c) {
  return fun.a === 3 ? fun.f(a, b, c) : fun(a)(b)(c);
}
function A4(fun, a, b, c, d) {
  return fun.a === 4 ? fun.f(a, b, c, d) : fun(a)(b)(c)(d);
}
function A5(fun, a, b, c, d, e) {
  return fun.a === 5 ? fun.f(a, b, c, d, e) : fun(a)(b)(c)(d)(e);
}
function A6(fun, a, b, c, d, e, f) {
  return fun.a === 6 ? fun.f(a, b, c, d, e, f) : fun(a)(b)(c)(d)(e)(f);
}
function A7(fun, a, b, c, d, e, f, g) {
  return fun.a === 7 ? fun.f(a, b, c, d, e, f, g) : fun(a)(b)(c)(d)(e)(f)(g);
}
function A8(fun, a, b, c, d, e, f, g, h) {
  return fun.a === 8 ? fun.f(a, b, c, d, e, f, g, h) : fun(a)(b)(c)(d)(e)(f)(g)(h);
}
function A9(fun, a, b, c, d, e, f, g, h, i) {
  return fun.a === 9 ? fun.f(a, b, c, d, e, f, g, h, i) : fun(a)(b)(c)(d)(e)(f)(g)(h)(i);
}

console.warn('Compiled in DEV mode. Follow the advice at https://elm-lang.org/0.19.1/optimize for better performance and smaller assets.');


var _JsArray_empty = [];

function _JsArray_singleton(value)
{
    return [value];
}

function _JsArray_length(array)
{
    return array.length;
}

var _JsArray_initialize = F3(function(size, offset, func)
{
    var result = new Array(size);

    for (var i = 0; i < size; i++)
    {
        result[i] = func(offset + i);
    }

    return result;
});

var _JsArray_initializeFromList = F2(function (max, ls)
{
    var result = new Array(max);

    for (var i = 0; i < max && ls.b; i++)
    {
        result[i] = ls.a;
        ls = ls.b;
    }

    result.length = i;
    return _Utils_Tuple2(result, ls);
});

var _JsArray_unsafeGet = F2(function(index, array)
{
    return array[index];
});

var _JsArray_unsafeSet = F3(function(index, value, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[index] = value;
    return result;
});

var _JsArray_push = F2(function(value, array)
{
    var length = array.length;
    var result = new Array(length + 1);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[length] = value;
    return result;
});

var _JsArray_foldl = F3(function(func, acc, array)
{
    var length = array.length;

    for (var i = 0; i < length; i++)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_foldr = F3(function(func, acc, array)
{
    for (var i = array.length - 1; i >= 0; i--)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_map = F2(function(func, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = func(array[i]);
    }

    return result;
});

var _JsArray_indexedMap = F3(function(func, offset, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = A2(func, offset + i, array[i]);
    }

    return result;
});

var _JsArray_slice = F3(function(from, to, array)
{
    return array.slice(from, to);
});

var _JsArray_appendN = F3(function(n, dest, source)
{
    var destLen = dest.length;
    var itemsToCopy = n - destLen;

    if (itemsToCopy > source.length)
    {
        itemsToCopy = source.length;
    }

    var size = destLen + itemsToCopy;
    var result = new Array(size);

    for (var i = 0; i < destLen; i++)
    {
        result[i] = dest[i];
    }

    for (var i = 0; i < itemsToCopy; i++)
    {
        result[i + destLen] = source[i];
    }

    return result;
});



// LOG

var _Debug_log_UNUSED = F2(function(tag, value)
{
	return value;
});

var _Debug_log = F2(function(tag, value)
{
	console.log(tag + ': ' + _Debug_toString(value));
	return value;
});


// TODOS

function _Debug_todo(moduleName, region)
{
	return function(message) {
		_Debug_crash(8, moduleName, region, message);
	};
}

function _Debug_todoCase(moduleName, region, value)
{
	return function(message) {
		_Debug_crash(9, moduleName, region, value, message);
	};
}


// TO STRING

function _Debug_toString_UNUSED(value)
{
	return '<internals>';
}

function _Debug_toString(value)
{
	return _Debug_toAnsiString(false, value);
}

function _Debug_toAnsiString(ansi, value)
{
	if (typeof value === 'function')
	{
		return _Debug_internalColor(ansi, '<function>');
	}

	if (typeof value === 'boolean')
	{
		return _Debug_ctorColor(ansi, value ? 'True' : 'False');
	}

	if (typeof value === 'number')
	{
		return _Debug_numberColor(ansi, value + '');
	}

	if (value instanceof String)
	{
		return _Debug_charColor(ansi, "'" + _Debug_addSlashes(value, true) + "'");
	}

	if (typeof value === 'string')
	{
		return _Debug_stringColor(ansi, '"' + _Debug_addSlashes(value, false) + '"');
	}

	if (typeof value === 'object' && '$' in value)
	{
		var tag = value.$;

		if (typeof tag === 'number')
		{
			return _Debug_internalColor(ansi, '<internals>');
		}

		if (tag[0] === '#')
		{
			var output = [];
			for (var k in value)
			{
				if (k === '$') continue;
				output.push(_Debug_toAnsiString(ansi, value[k]));
			}
			return '(' + output.join(',') + ')';
		}

		if (tag === 'Set_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Set')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Set$toList(value));
		}

		if (tag === 'RBNode_elm_builtin' || tag === 'RBEmpty_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Dict')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Dict$toList(value));
		}

		if (tag === 'Array_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Array')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Array$toList(value));
		}

		if (tag === '::' || tag === '[]')
		{
			var output = '[';

			value.b && (output += _Debug_toAnsiString(ansi, value.a), value = value.b)

			for (; value.b; value = value.b) // WHILE_CONS
			{
				output += ',' + _Debug_toAnsiString(ansi, value.a);
			}
			return output + ']';
		}

		var output = '';
		for (var i in value)
		{
			if (i === '$') continue;
			var str = _Debug_toAnsiString(ansi, value[i]);
			var c0 = str[0];
			var parenless = c0 === '{' || c0 === '(' || c0 === '[' || c0 === '<' || c0 === '"' || str.indexOf(' ') < 0;
			output += ' ' + (parenless ? str : '(' + str + ')');
		}
		return _Debug_ctorColor(ansi, tag) + output;
	}

	if (typeof DataView === 'function' && value instanceof DataView)
	{
		return _Debug_stringColor(ansi, '<' + value.byteLength + ' bytes>');
	}

	if (typeof File !== 'undefined' && value instanceof File)
	{
		return _Debug_internalColor(ansi, '<' + value.name + '>');
	}

	if (typeof value === 'object')
	{
		var output = [];
		for (var key in value)
		{
			var field = key[0] === '_' ? key.slice(1) : key;
			output.push(_Debug_fadeColor(ansi, field) + ' = ' + _Debug_toAnsiString(ansi, value[key]));
		}
		if (output.length === 0)
		{
			return '{}';
		}
		return '{ ' + output.join(', ') + ' }';
	}

	return _Debug_internalColor(ansi, '<internals>');
}

function _Debug_addSlashes(str, isChar)
{
	var s = str
		.replace(/\\/g, '\\\\')
		.replace(/\n/g, '\\n')
		.replace(/\t/g, '\\t')
		.replace(/\r/g, '\\r')
		.replace(/\v/g, '\\v')
		.replace(/\0/g, '\\0');

	if (isChar)
	{
		return s.replace(/\'/g, '\\\'');
	}
	else
	{
		return s.replace(/\"/g, '\\"');
	}
}

function _Debug_ctorColor(ansi, string)
{
	return ansi ? '\x1b[96m' + string + '\x1b[0m' : string;
}

function _Debug_numberColor(ansi, string)
{
	return ansi ? '\x1b[95m' + string + '\x1b[0m' : string;
}

function _Debug_stringColor(ansi, string)
{
	return ansi ? '\x1b[93m' + string + '\x1b[0m' : string;
}

function _Debug_charColor(ansi, string)
{
	return ansi ? '\x1b[92m' + string + '\x1b[0m' : string;
}

function _Debug_fadeColor(ansi, string)
{
	return ansi ? '\x1b[37m' + string + '\x1b[0m' : string;
}

function _Debug_internalColor(ansi, string)
{
	return ansi ? '\x1b[36m' + string + '\x1b[0m' : string;
}

function _Debug_toHexDigit(n)
{
	return String.fromCharCode(n < 10 ? 48 + n : 55 + n);
}


// CRASH


function _Debug_crash_UNUSED(identifier)
{
	throw new Error('https://github.com/elm/core/blob/1.0.0/hints/' + identifier + '.md');
}


function _Debug_crash(identifier, fact1, fact2, fact3, fact4)
{
	switch(identifier)
	{
		case 0:
			throw new Error('What node should I take over? In JavaScript I need something like:\n\n    Elm.Main.init({\n        node: document.getElementById("elm-node")\n    })\n\nYou need to do this with any Browser.sandbox or Browser.element program.');

		case 1:
			throw new Error('Browser.application programs cannot handle URLs like this:\n\n    ' + document.location.href + '\n\nWhat is the root? The root of your file system? Try looking at this program with `elm reactor` or some other server.');

		case 2:
			var jsonErrorString = fact1;
			throw new Error('Problem with the flags given to your Elm program on initialization.\n\n' + jsonErrorString);

		case 3:
			var portName = fact1;
			throw new Error('There can only be one port named `' + portName + '`, but your program has multiple.');

		case 4:
			var portName = fact1;
			var problem = fact2;
			throw new Error('Trying to send an unexpected type of value through port `' + portName + '`:\n' + problem);

		case 5:
			throw new Error('Trying to use `(==)` on functions.\nThere is no way to know if functions are "the same" in the Elm sense.\nRead more about this at https://package.elm-lang.org/packages/elm/core/latest/Basics#== which describes why it is this way and what the better version will look like.');

		case 6:
			var moduleName = fact1;
			throw new Error('Your page is loading multiple Elm scripts with a module named ' + moduleName + '. Maybe a duplicate script is getting loaded accidentally? If not, rename one of them so I know which is which!');

		case 8:
			var moduleName = fact1;
			var region = fact2;
			var message = fact3;
			throw new Error('TODO in module `' + moduleName + '` ' + _Debug_regionToString(region) + '\n\n' + message);

		case 9:
			var moduleName = fact1;
			var region = fact2;
			var value = fact3;
			var message = fact4;
			throw new Error(
				'TODO in module `' + moduleName + '` from the `case` expression '
				+ _Debug_regionToString(region) + '\n\nIt received the following value:\n\n    '
				+ _Debug_toString(value).replace('\n', '\n    ')
				+ '\n\nBut the branch that handles it says:\n\n    ' + message.replace('\n', '\n    ')
			);

		case 10:
			throw new Error('Bug in https://github.com/elm/virtual-dom/issues');

		case 11:
			throw new Error('Cannot perform mod 0. Division by zero error.');
	}
}

function _Debug_regionToString(region)
{
	if (region.start.line === region.end.line)
	{
		return 'on line ' + region.start.line;
	}
	return 'on lines ' + region.start.line + ' through ' + region.end.line;
}



// EQUALITY

function _Utils_eq(x, y)
{
	for (
		var pair, stack = [], isEqual = _Utils_eqHelp(x, y, 0, stack);
		isEqual && (pair = stack.pop());
		isEqual = _Utils_eqHelp(pair.a, pair.b, 0, stack)
		)
	{}

	return isEqual;
}

function _Utils_eqHelp(x, y, depth, stack)
{
	if (x === y)
	{
		return true;
	}

	if (typeof x !== 'object' || x === null || y === null)
	{
		typeof x === 'function' && _Debug_crash(5);
		return false;
	}

	if (depth > 100)
	{
		stack.push(_Utils_Tuple2(x,y));
		return true;
	}

	/**/
	if (x.$ === 'Set_elm_builtin')
	{
		x = $elm$core$Set$toList(x);
		y = $elm$core$Set$toList(y);
	}
	if (x.$ === 'RBNode_elm_builtin' || x.$ === 'RBEmpty_elm_builtin')
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	/**_UNUSED/
	if (x.$ < 0)
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	for (var key in x)
	{
		if (!_Utils_eqHelp(x[key], y[key], depth + 1, stack))
		{
			return false;
		}
	}
	return true;
}

var _Utils_equal = F2(_Utils_eq);
var _Utils_notEqual = F2(function(a, b) { return !_Utils_eq(a,b); });



// COMPARISONS

// Code in Generate/JavaScript.hs, Basics.js, and List.js depends on
// the particular integer values assigned to LT, EQ, and GT.

function _Utils_cmp(x, y, ord)
{
	if (typeof x !== 'object')
	{
		return x === y ? /*EQ*/ 0 : x < y ? /*LT*/ -1 : /*GT*/ 1;
	}

	/**/
	if (x instanceof String)
	{
		var a = x.valueOf();
		var b = y.valueOf();
		return a === b ? 0 : a < b ? -1 : 1;
	}
	//*/

	/**_UNUSED/
	if (typeof x.$ === 'undefined')
	//*/
	/**/
	if (x.$[0] === '#')
	//*/
	{
		return (ord = _Utils_cmp(x.a, y.a))
			? ord
			: (ord = _Utils_cmp(x.b, y.b))
				? ord
				: _Utils_cmp(x.c, y.c);
	}

	// traverse conses until end of a list or a mismatch
	for (; x.b && y.b && !(ord = _Utils_cmp(x.a, y.a)); x = x.b, y = y.b) {} // WHILE_CONSES
	return ord || (x.b ? /*GT*/ 1 : y.b ? /*LT*/ -1 : /*EQ*/ 0);
}

var _Utils_lt = F2(function(a, b) { return _Utils_cmp(a, b) < 0; });
var _Utils_le = F2(function(a, b) { return _Utils_cmp(a, b) < 1; });
var _Utils_gt = F2(function(a, b) { return _Utils_cmp(a, b) > 0; });
var _Utils_ge = F2(function(a, b) { return _Utils_cmp(a, b) >= 0; });

var _Utils_compare = F2(function(x, y)
{
	var n = _Utils_cmp(x, y);
	return n < 0 ? $elm$core$Basics$LT : n ? $elm$core$Basics$GT : $elm$core$Basics$EQ;
});


// COMMON VALUES

var _Utils_Tuple0_UNUSED = 0;
var _Utils_Tuple0 = { $: '#0' };

function _Utils_Tuple2_UNUSED(a, b) { return { a: a, b: b }; }
function _Utils_Tuple2(a, b) { return { $: '#2', a: a, b: b }; }

function _Utils_Tuple3_UNUSED(a, b, c) { return { a: a, b: b, c: c }; }
function _Utils_Tuple3(a, b, c) { return { $: '#3', a: a, b: b, c: c }; }

function _Utils_chr_UNUSED(c) { return c; }
function _Utils_chr(c) { return new String(c); }


// RECORDS

function _Utils_update(oldRecord, updatedFields)
{
	var newRecord = {};

	for (var key in oldRecord)
	{
		newRecord[key] = oldRecord[key];
	}

	for (var key in updatedFields)
	{
		newRecord[key] = updatedFields[key];
	}

	return newRecord;
}


// APPEND

var _Utils_append = F2(_Utils_ap);

function _Utils_ap(xs, ys)
{
	// append Strings
	if (typeof xs === 'string')
	{
		return xs + ys;
	}

	// append Lists
	if (!xs.b)
	{
		return ys;
	}
	var root = _List_Cons(xs.a, ys);
	xs = xs.b
	for (var curr = root; xs.b; xs = xs.b) // WHILE_CONS
	{
		curr = curr.b = _List_Cons(xs.a, ys);
	}
	return root;
}



var _List_Nil_UNUSED = { $: 0 };
var _List_Nil = { $: '[]' };

function _List_Cons_UNUSED(hd, tl) { return { $: 1, a: hd, b: tl }; }
function _List_Cons(hd, tl) { return { $: '::', a: hd, b: tl }; }


var _List_cons = F2(_List_Cons);

function _List_fromArray(arr)
{
	var out = _List_Nil;
	for (var i = arr.length; i--; )
	{
		out = _List_Cons(arr[i], out);
	}
	return out;
}

function _List_toArray(xs)
{
	for (var out = []; xs.b; xs = xs.b) // WHILE_CONS
	{
		out.push(xs.a);
	}
	return out;
}

var _List_map2 = F3(function(f, xs, ys)
{
	for (var arr = []; xs.b && ys.b; xs = xs.b, ys = ys.b) // WHILE_CONSES
	{
		arr.push(A2(f, xs.a, ys.a));
	}
	return _List_fromArray(arr);
});

var _List_map3 = F4(function(f, xs, ys, zs)
{
	for (var arr = []; xs.b && ys.b && zs.b; xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A3(f, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map4 = F5(function(f, ws, xs, ys, zs)
{
	for (var arr = []; ws.b && xs.b && ys.b && zs.b; ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A4(f, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map5 = F6(function(f, vs, ws, xs, ys, zs)
{
	for (var arr = []; vs.b && ws.b && xs.b && ys.b && zs.b; vs = vs.b, ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A5(f, vs.a, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_sortBy = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		return _Utils_cmp(f(a), f(b));
	}));
});

var _List_sortWith = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		var ord = A2(f, a, b);
		return ord === $elm$core$Basics$EQ ? 0 : ord === $elm$core$Basics$LT ? -1 : 1;
	}));
});



// MATH

var _Basics_add = F2(function(a, b) { return a + b; });
var _Basics_sub = F2(function(a, b) { return a - b; });
var _Basics_mul = F2(function(a, b) { return a * b; });
var _Basics_fdiv = F2(function(a, b) { return a / b; });
var _Basics_idiv = F2(function(a, b) { return (a / b) | 0; });
var _Basics_pow = F2(Math.pow);

var _Basics_remainderBy = F2(function(b, a) { return a % b; });

// https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/divmodnote-letter.pdf
var _Basics_modBy = F2(function(modulus, x)
{
	var answer = x % modulus;
	return modulus === 0
		? _Debug_crash(11)
		:
	((answer > 0 && modulus < 0) || (answer < 0 && modulus > 0))
		? answer + modulus
		: answer;
});


// TRIGONOMETRY

var _Basics_pi = Math.PI;
var _Basics_e = Math.E;
var _Basics_cos = Math.cos;
var _Basics_sin = Math.sin;
var _Basics_tan = Math.tan;
var _Basics_acos = Math.acos;
var _Basics_asin = Math.asin;
var _Basics_atan = Math.atan;
var _Basics_atan2 = F2(Math.atan2);


// MORE MATH

function _Basics_toFloat(x) { return x; }
function _Basics_truncate(n) { return n | 0; }
function _Basics_isInfinite(n) { return n === Infinity || n === -Infinity; }

var _Basics_ceiling = Math.ceil;
var _Basics_floor = Math.floor;
var _Basics_round = Math.round;
var _Basics_sqrt = Math.sqrt;
var _Basics_log = Math.log;
var _Basics_isNaN = isNaN;


// BOOLEANS

function _Basics_not(bool) { return !bool; }
var _Basics_and = F2(function(a, b) { return a && b; });
var _Basics_or  = F2(function(a, b) { return a || b; });
var _Basics_xor = F2(function(a, b) { return a !== b; });



var _String_cons = F2(function(chr, str)
{
	return chr + str;
});

function _String_uncons(string)
{
	var word = string.charCodeAt(0);
	return !isNaN(word)
		? $elm$core$Maybe$Just(
			0xD800 <= word && word <= 0xDBFF
				? _Utils_Tuple2(_Utils_chr(string[0] + string[1]), string.slice(2))
				: _Utils_Tuple2(_Utils_chr(string[0]), string.slice(1))
		)
		: $elm$core$Maybe$Nothing;
}

var _String_append = F2(function(a, b)
{
	return a + b;
});

function _String_length(str)
{
	return str.length;
}

var _String_map = F2(function(func, string)
{
	var len = string.length;
	var array = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = string.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			array[i] = func(_Utils_chr(string[i] + string[i+1]));
			i += 2;
			continue;
		}
		array[i] = func(_Utils_chr(string[i]));
		i++;
	}
	return array.join('');
});

var _String_filter = F2(function(isGood, str)
{
	var arr = [];
	var len = str.length;
	var i = 0;
	while (i < len)
	{
		var char = str[i];
		var word = str.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += str[i];
			i++;
		}

		if (isGood(_Utils_chr(char)))
		{
			arr.push(char);
		}
	}
	return arr.join('');
});

function _String_reverse(str)
{
	var len = str.length;
	var arr = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = str.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			arr[len - i] = str[i + 1];
			i++;
			arr[len - i] = str[i - 1];
			i++;
		}
		else
		{
			arr[len - i] = str[i];
			i++;
		}
	}
	return arr.join('');
}

var _String_foldl = F3(function(func, state, string)
{
	var len = string.length;
	var i = 0;
	while (i < len)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += string[i];
			i++;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_foldr = F3(function(func, state, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_split = F2(function(sep, str)
{
	return str.split(sep);
});

var _String_join = F2(function(sep, strs)
{
	return strs.join(sep);
});

var _String_slice = F3(function(start, end, str) {
	return str.slice(start, end);
});

function _String_trim(str)
{
	return str.trim();
}

function _String_trimLeft(str)
{
	return str.replace(/^\s+/, '');
}

function _String_trimRight(str)
{
	return str.replace(/\s+$/, '');
}

function _String_words(str)
{
	return _List_fromArray(str.trim().split(/\s+/g));
}

function _String_lines(str)
{
	return _List_fromArray(str.split(/\r\n|\r|\n/g));
}

function _String_toUpper(str)
{
	return str.toUpperCase();
}

function _String_toLower(str)
{
	return str.toLowerCase();
}

var _String_any = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (isGood(_Utils_chr(char)))
		{
			return true;
		}
	}
	return false;
});

var _String_all = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (!isGood(_Utils_chr(char)))
		{
			return false;
		}
	}
	return true;
});

var _String_contains = F2(function(sub, str)
{
	return str.indexOf(sub) > -1;
});

var _String_startsWith = F2(function(sub, str)
{
	return str.indexOf(sub) === 0;
});

var _String_endsWith = F2(function(sub, str)
{
	return str.length >= sub.length &&
		str.lastIndexOf(sub) === str.length - sub.length;
});

var _String_indexes = F2(function(sub, str)
{
	var subLen = sub.length;

	if (subLen < 1)
	{
		return _List_Nil;
	}

	var i = 0;
	var is = [];

	while ((i = str.indexOf(sub, i)) > -1)
	{
		is.push(i);
		i = i + subLen;
	}

	return _List_fromArray(is);
});


// TO STRING

function _String_fromNumber(number)
{
	return number + '';
}


// INT CONVERSIONS

function _String_toInt(str)
{
	var total = 0;
	var code0 = str.charCodeAt(0);
	var start = code0 == 0x2B /* + */ || code0 == 0x2D /* - */ ? 1 : 0;

	for (var i = start; i < str.length; ++i)
	{
		var code = str.charCodeAt(i);
		if (code < 0x30 || 0x39 < code)
		{
			return $elm$core$Maybe$Nothing;
		}
		total = 10 * total + code - 0x30;
	}

	return i == start
		? $elm$core$Maybe$Nothing
		: $elm$core$Maybe$Just(code0 == 0x2D ? -total : total);
}


// FLOAT CONVERSIONS

function _String_toFloat(s)
{
	// check if it is a hex, octal, or binary number
	if (s.length === 0 || /[\sxbo]/.test(s))
	{
		return $elm$core$Maybe$Nothing;
	}
	var n = +s;
	// faster isNaN check
	return n === n ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
}

function _String_fromList(chars)
{
	return _List_toArray(chars).join('');
}




function _Char_toCode(char)
{
	var code = char.charCodeAt(0);
	if (0xD800 <= code && code <= 0xDBFF)
	{
		return (code - 0xD800) * 0x400 + char.charCodeAt(1) - 0xDC00 + 0x10000
	}
	return code;
}

function _Char_fromCode(code)
{
	return _Utils_chr(
		(code < 0 || 0x10FFFF < code)
			? '\uFFFD'
			:
		(code <= 0xFFFF)
			? String.fromCharCode(code)
			:
		(code -= 0x10000,
			String.fromCharCode(Math.floor(code / 0x400) + 0xD800, code % 0x400 + 0xDC00)
		)
	);
}

function _Char_toUpper(char)
{
	return _Utils_chr(char.toUpperCase());
}

function _Char_toLower(char)
{
	return _Utils_chr(char.toLowerCase());
}

function _Char_toLocaleUpper(char)
{
	return _Utils_chr(char.toLocaleUpperCase());
}

function _Char_toLocaleLower(char)
{
	return _Utils_chr(char.toLocaleLowerCase());
}



/**/
function _Json_errorToString(error)
{
	return $elm$json$Json$Decode$errorToString(error);
}
//*/


// CORE DECODERS

function _Json_succeed(msg)
{
	return {
		$: 0,
		a: msg
	};
}

function _Json_fail(msg)
{
	return {
		$: 1,
		a: msg
	};
}

function _Json_decodePrim(decoder)
{
	return { $: 2, b: decoder };
}

var _Json_decodeInt = _Json_decodePrim(function(value) {
	return (typeof value !== 'number')
		? _Json_expecting('an INT', value)
		:
	(-2147483647 < value && value < 2147483647 && (value | 0) === value)
		? $elm$core$Result$Ok(value)
		:
	(isFinite(value) && !(value % 1))
		? $elm$core$Result$Ok(value)
		: _Json_expecting('an INT', value);
});

var _Json_decodeBool = _Json_decodePrim(function(value) {
	return (typeof value === 'boolean')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a BOOL', value);
});

var _Json_decodeFloat = _Json_decodePrim(function(value) {
	return (typeof value === 'number')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a FLOAT', value);
});

var _Json_decodeValue = _Json_decodePrim(function(value) {
	return $elm$core$Result$Ok(_Json_wrap(value));
});

var _Json_decodeString = _Json_decodePrim(function(value) {
	return (typeof value === 'string')
		? $elm$core$Result$Ok(value)
		: (value instanceof String)
			? $elm$core$Result$Ok(value + '')
			: _Json_expecting('a STRING', value);
});

function _Json_decodeList(decoder) { return { $: 3, b: decoder }; }
function _Json_decodeArray(decoder) { return { $: 4, b: decoder }; }

function _Json_decodeNull(value) { return { $: 5, c: value }; }

var _Json_decodeField = F2(function(field, decoder)
{
	return {
		$: 6,
		d: field,
		b: decoder
	};
});

var _Json_decodeIndex = F2(function(index, decoder)
{
	return {
		$: 7,
		e: index,
		b: decoder
	};
});

function _Json_decodeKeyValuePairs(decoder)
{
	return {
		$: 8,
		b: decoder
	};
}

function _Json_mapMany(f, decoders)
{
	return {
		$: 9,
		f: f,
		g: decoders
	};
}

var _Json_andThen = F2(function(callback, decoder)
{
	return {
		$: 10,
		b: decoder,
		h: callback
	};
});

function _Json_oneOf(decoders)
{
	return {
		$: 11,
		g: decoders
	};
}


// DECODING OBJECTS

var _Json_map1 = F2(function(f, d1)
{
	return _Json_mapMany(f, [d1]);
});

var _Json_map2 = F3(function(f, d1, d2)
{
	return _Json_mapMany(f, [d1, d2]);
});

var _Json_map3 = F4(function(f, d1, d2, d3)
{
	return _Json_mapMany(f, [d1, d2, d3]);
});

var _Json_map4 = F5(function(f, d1, d2, d3, d4)
{
	return _Json_mapMany(f, [d1, d2, d3, d4]);
});

var _Json_map5 = F6(function(f, d1, d2, d3, d4, d5)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5]);
});

var _Json_map6 = F7(function(f, d1, d2, d3, d4, d5, d6)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6]);
});

var _Json_map7 = F8(function(f, d1, d2, d3, d4, d5, d6, d7)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7]);
});

var _Json_map8 = F9(function(f, d1, d2, d3, d4, d5, d6, d7, d8)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7, d8]);
});


// DECODE

var _Json_runOnString = F2(function(decoder, string)
{
	try
	{
		var value = JSON.parse(string);
		return _Json_runHelp(decoder, value);
	}
	catch (e)
	{
		return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'This is not valid JSON! ' + e.message, _Json_wrap(string)));
	}
});

var _Json_run = F2(function(decoder, value)
{
	return _Json_runHelp(decoder, _Json_unwrap(value));
});

function _Json_runHelp(decoder, value)
{
	switch (decoder.$)
	{
		case 2:
			return decoder.b(value);

		case 5:
			return (value === null)
				? $elm$core$Result$Ok(decoder.c)
				: _Json_expecting('null', value);

		case 3:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('a LIST', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _List_fromArray);

		case 4:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _Json_toElmArray);

		case 6:
			var field = decoder.d;
			if (typeof value !== 'object' || value === null || !(field in value))
			{
				return _Json_expecting('an OBJECT with a field named `' + field + '`', value);
			}
			var result = _Json_runHelp(decoder.b, value[field]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, field, result.a));

		case 7:
			var index = decoder.e;
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			if (index >= value.length)
			{
				return _Json_expecting('a LONGER array. Need index ' + index + ' but only see ' + value.length + ' entries', value);
			}
			var result = _Json_runHelp(decoder.b, value[index]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, index, result.a));

		case 8:
			if (typeof value !== 'object' || value === null || _Json_isArray(value))
			{
				return _Json_expecting('an OBJECT', value);
			}

			var keyValuePairs = _List_Nil;
			// TODO test perf of Object.keys and switch when support is good enough
			for (var key in value)
			{
				if (Object.prototype.hasOwnProperty.call(value, key))
				{
					var result = _Json_runHelp(decoder.b, value[key]);
					if (!$elm$core$Result$isOk(result))
					{
						return $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, key, result.a));
					}
					keyValuePairs = _List_Cons(_Utils_Tuple2(key, result.a), keyValuePairs);
				}
			}
			return $elm$core$Result$Ok($elm$core$List$reverse(keyValuePairs));

		case 9:
			var answer = decoder.f;
			var decoders = decoder.g;
			for (var i = 0; i < decoders.length; i++)
			{
				var result = _Json_runHelp(decoders[i], value);
				if (!$elm$core$Result$isOk(result))
				{
					return result;
				}
				answer = answer(result.a);
			}
			return $elm$core$Result$Ok(answer);

		case 10:
			var result = _Json_runHelp(decoder.b, value);
			return (!$elm$core$Result$isOk(result))
				? result
				: _Json_runHelp(decoder.h(result.a), value);

		case 11:
			var errors = _List_Nil;
			for (var temp = decoder.g; temp.b; temp = temp.b) // WHILE_CONS
			{
				var result = _Json_runHelp(temp.a, value);
				if ($elm$core$Result$isOk(result))
				{
					return result;
				}
				errors = _List_Cons(result.a, errors);
			}
			return $elm$core$Result$Err($elm$json$Json$Decode$OneOf($elm$core$List$reverse(errors)));

		case 1:
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, decoder.a, _Json_wrap(value)));

		case 0:
			return $elm$core$Result$Ok(decoder.a);
	}
}

function _Json_runArrayDecoder(decoder, value, toElmValue)
{
	var len = value.length;
	var array = new Array(len);
	for (var i = 0; i < len; i++)
	{
		var result = _Json_runHelp(decoder, value[i]);
		if (!$elm$core$Result$isOk(result))
		{
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, i, result.a));
		}
		array[i] = result.a;
	}
	return $elm$core$Result$Ok(toElmValue(array));
}

function _Json_isArray(value)
{
	return Array.isArray(value) || (typeof FileList !== 'undefined' && value instanceof FileList);
}

function _Json_toElmArray(array)
{
	return A2($elm$core$Array$initialize, array.length, function(i) { return array[i]; });
}

function _Json_expecting(type, value)
{
	return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'Expecting ' + type, _Json_wrap(value)));
}


// EQUALITY

function _Json_equality(x, y)
{
	if (x === y)
	{
		return true;
	}

	if (x.$ !== y.$)
	{
		return false;
	}

	switch (x.$)
	{
		case 0:
		case 1:
			return x.a === y.a;

		case 2:
			return x.b === y.b;

		case 5:
			return x.c === y.c;

		case 3:
		case 4:
		case 8:
			return _Json_equality(x.b, y.b);

		case 6:
			return x.d === y.d && _Json_equality(x.b, y.b);

		case 7:
			return x.e === y.e && _Json_equality(x.b, y.b);

		case 9:
			return x.f === y.f && _Json_listEquality(x.g, y.g);

		case 10:
			return x.h === y.h && _Json_equality(x.b, y.b);

		case 11:
			return _Json_listEquality(x.g, y.g);
	}
}

function _Json_listEquality(aDecoders, bDecoders)
{
	var len = aDecoders.length;
	if (len !== bDecoders.length)
	{
		return false;
	}
	for (var i = 0; i < len; i++)
	{
		if (!_Json_equality(aDecoders[i], bDecoders[i]))
		{
			return false;
		}
	}
	return true;
}


// ENCODE

var _Json_encode = F2(function(indentLevel, value)
{
	return JSON.stringify(_Json_unwrap(value), null, indentLevel) + '';
});

function _Json_wrap(value) { return { $: 0, a: value }; }
function _Json_unwrap(value) { return value.a; }

function _Json_wrap_UNUSED(value) { return value; }
function _Json_unwrap_UNUSED(value) { return value; }

function _Json_emptyArray() { return []; }
function _Json_emptyObject() { return {}; }

var _Json_addField = F3(function(key, value, object)
{
	var unwrapped = _Json_unwrap(value);
	if (!(key === 'toJSON' && typeof unwrapped === 'function'))
	{
		object[key] = unwrapped;
	}
	return object;
});

function _Json_addEntry(func)
{
	return F2(function(entry, array)
	{
		array.push(_Json_unwrap(func(entry)));
		return array;
	});
}

var _Json_encodeNull = _Json_wrap(null);



// TASKS

function _Scheduler_succeed(value)
{
	return {
		$: 0,
		a: value
	};
}

function _Scheduler_fail(error)
{
	return {
		$: 1,
		a: error
	};
}

// This function was slightly modified by elm-watch.
function _Scheduler_binding(callback)
{
	return {
		$: 2,
		b: callback,
		// c: null // commented out by elm-watch
		c: Function.prototype // added by elm-watch
	};
}

var _Scheduler_andThen = F2(function(callback, task)
{
	return {
		$: 3,
		b: callback,
		d: task
	};
});

var _Scheduler_onError = F2(function(callback, task)
{
	return {
		$: 4,
		b: callback,
		d: task
	};
});

function _Scheduler_receive(callback)
{
	return {
		$: 5,
		b: callback
	};
}


// PROCESSES

var _Scheduler_guid = 0;

function _Scheduler_rawSpawn(task)
{
	var proc = {
		$: 0,
		e: _Scheduler_guid++,
		f: task,
		g: null,
		h: []
	};

	_Scheduler_enqueue(proc);

	return proc;
}

function _Scheduler_spawn(task)
{
	return _Scheduler_binding(function(callback) {
		callback(_Scheduler_succeed(_Scheduler_rawSpawn(task)));
	});
}

function _Scheduler_rawSend(proc, msg)
{
	proc.h.push(msg);
	_Scheduler_enqueue(proc);
}

var _Scheduler_send = F2(function(proc, msg)
{
	return _Scheduler_binding(function(callback) {
		_Scheduler_rawSend(proc, msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});

function _Scheduler_kill(proc)
{
	return _Scheduler_binding(function(callback) {
		var task = proc.f;
		if (task.$ === 2 && task.c)
		{
			task.c();
		}

		proc.f = null;

		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
}


/* STEP PROCESSES

type alias Process =
  { $ : tag
  , id : unique_id
  , root : Task
  , stack : null | { $: SUCCEED | FAIL, a: callback, b: stack }
  , mailbox : [msg]
  }

*/


var _Scheduler_working = false;
var _Scheduler_queue = [];


function _Scheduler_enqueue(proc)
{
	_Scheduler_queue.push(proc);
	if (_Scheduler_working)
	{
		return;
	}
	_Scheduler_working = true;
	while (proc = _Scheduler_queue.shift())
	{
		_Scheduler_step(proc);
	}
	_Scheduler_working = false;
}


function _Scheduler_step(proc)
{
	while (proc.f)
	{
		var rootTag = proc.f.$;
		if (rootTag === 0 || rootTag === 1)
		{
			while (proc.g && proc.g.$ !== rootTag)
			{
				proc.g = proc.g.i;
			}
			if (!proc.g)
			{
				return;
			}
			proc.f = proc.g.b(proc.f.a);
			proc.g = proc.g.i;
		}
		else if (rootTag === 2)
		{
			proc.f.c = proc.f.b(function(newRoot) {
				proc.f = newRoot;
				_Scheduler_enqueue(proc);
			// }); // commented out by elm-watch
			}) || Function.prototype; // added by elm-watch
			return;
		}
		else if (rootTag === 5)
		{
			if (proc.h.length === 0)
			{
				return;
			}
			proc.f = proc.f.b(proc.h.shift());
		}
		else // if (rootTag === 3 || rootTag === 4)
		{
			proc.g = {
				$: rootTag === 3 ? 0 : 1,
				b: proc.f.b,
				i: proc.g
			};
			proc.f = proc.f.d;
		}
	}
}



function _Process_sleep(time)
{
	return _Scheduler_binding(function(callback) {
		var id = setTimeout(function() {
			callback(_Scheduler_succeed(_Utils_Tuple0));
		}, time);

		return function() { clearTimeout(id); };
	});
}




// PROGRAMS


// This function was slightly modified by elm-watch.
var _Platform_worker = F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		"Platform.worker", // added by elm-watch
		false, // isDebug, added by elm-watch
		debugMetadata, // added by elm-watch
		flagDecoder,
		args,
		impl.init,
		// impl.update, // commented out by elm-watch
		// impl.subscriptions, // commented out by elm-watch
		impl, // added by elm-watch
		function() { return function() {} }
	);
});



// INITIALIZE A PROGRAM


// added by elm-watch
var _elmWatchTargetName = "My app";

// This whole function was changed by elm-watch.
function _Platform_initialize(programType, isDebug, debugMetadata, flagDecoder, args, init, impl, stepperBuilder)
{
	if (args === "__elmWatchReturnData") {
		return { impl: impl, debugMetadata: debugMetadata, flagDecoder : flagDecoder, programType: programType, _Platform_effectManagers: _Platform_effectManagers, _Scheduler_enqueue: _Scheduler_enqueue };
	}

	var flags = _Json_wrap(args ? args['flags'] : undefined);
	var flagResult = A2(_Json_run, flagDecoder, flags);
	$elm$core$Result$isOk(flagResult) || _Debug_crash(2 /**/, _Json_errorToString(flagResult.a) /**/);
	var managers = {};
	var initUrl = programType === "Browser.application" ? _Browser_getUrl() : undefined;
	globalThis.__ELM_WATCH_INIT_URL = initUrl;
	var initPair = init(flagResult.a);
	delete globalThis.__ELM_WATCH_INIT_URL;
	var model = initPair.a;
	var stepper = stepperBuilder(sendToApp, model);
	var ports = _Platform_setupEffects(managers, sendToApp);
	var update;
	var subscriptions;

	function setUpdateAndSubscriptions() {
		update = impl.update || impl._impl.update;
		subscriptions = impl.subscriptions || impl._impl.subscriptions;
		if (isDebug) {
			update = $elm$browser$Debugger$Main$wrapUpdate(update);
			subscriptions = $elm$browser$Debugger$Main$wrapSubs(subscriptions);
		}
	}

	function sendToApp(msg, viewMetadata) {
		var pair = A2(update, msg, model);
		stepper(model = pair.a, viewMetadata);
		_Platform_enqueueEffects(managers, pair.b, subscriptions(model));
	}

	setUpdateAndSubscriptions();

	var skippedInitCmds = globalThis.__ELM_WATCH ? globalThis.__ELM_WATCH.SHOULD_SKIP_INIT_CMDS(_elmWatchTargetName) : false;

	_Platform_enqueueEffects(managers, skippedInitCmds ? _Platform_batch(_List_Nil) : initPair.b, subscriptions(model));

	function __elmWatchHotReload(newData) {
		_Platform_enqueueEffects(managers, _Platform_batch(_List_Nil), _Platform_batch(_List_Nil));
		_Scheduler_enqueue = newData._Scheduler_enqueue;

		var reloadReasons = [];

		for (var key in newData._Platform_effectManagers) {
			var manager = newData._Platform_effectManagers[key];
			if (!(key in _Platform_effectManagers)) {
				_Platform_effectManagers[key] = manager;
				managers[key] = _Platform_instantiateManager(manager, sendToApp);
				if (manager.a) {
					reloadReasons.push({ tag: "NewPortAdded", name: key });
					manager.a(key, sendToApp)
				}
			}
		}

		for (var key in newData.impl) {
			if (key === "_impl" && impl._impl) {
				for (var subKey in newData.impl[key]) {
					impl._impl[subKey] = newData.impl[key][subKey];
				}
			} else {
				impl[key] = newData.impl[key];
			}
		}

		var newFlagResult = A2(_Json_run, newData.flagDecoder, flags);
		if (!$elm$core$Result$isOk(newFlagResult)) {
			return reloadReasons.concat({ tag: "FlagsTypeChanged", jsonErrorMessage: _Json_errorToString(newFlagResult.a) });
		}
		if (!_Utils_eq_elmWatchInternal(debugMetadata, newData.debugMetadata)) {
			return reloadReasons.concat({ tag: "MessageTypeChangedInDebugMode" });
		}
		init = impl.init || impl._impl.init;
		if (isDebug) {
			init = A3($elm$browser$Debugger$Main$wrapInit, _Json_wrap(newData.debugMetadata), initPair.a.popout, init);
		}
		globalThis.__ELM_WATCH_INIT_URL = initUrl;
		var newInitPair = init(newFlagResult.a);
		delete globalThis.__ELM_WATCH_INIT_URL;
		if (!_Utils_eq_elmWatchInternal(initPair, newInitPair)) {
			return reloadReasons.concat({ tag: "InitReturnValueChanged" });
		}

		setUpdateAndSubscriptions();
		stepper(model, true /* isSync */);
		_Platform_enqueueEffects(managers, skippedInitCmds ? newInitPair.b : _Platform_batch(_List_Nil), subscriptions(model));
		skippedInitCmds = false;
		return reloadReasons;
	}

	function __elmWatchRunInitCmds() {
		if (skippedInitCmds) {
			_Platform_enqueueEffects(managers, initPair.b, subscriptions(model));
			skippedInitCmds = false;
		}
	}

	return Object.defineProperties(
		ports ? { ports: ports } : {},
		{
			__elmWatchHotReload: { value: __elmWatchHotReload },
			__elmWatchRunInitCmds: { value: __elmWatchRunInitCmds },
			__elmWatchProgramType: { value: programType },
		}
	);
}

// This whole function was added by elm-watch.
// Copy-paste of _Utils_eq but does not assume that x and y have the same type,
// and considers functions to always be equal.
function _Utils_eq_elmWatchInternal(x, y)
{
	for (
		var pair, stack = [], isEqual = _Utils_eqHelp_elmWatchInternal(x, y, 0, stack);
		isEqual && (pair = stack.pop());
		isEqual = _Utils_eqHelp_elmWatchInternal(pair.a, pair.b, 0, stack)
		)
	{}

	return isEqual;
}

// This whole function was added by elm-watch.
function _Utils_eqHelp_elmWatchInternal(x, y, depth, stack)
{
	if (x === y) {
		return true;
	}

	var xType = _Utils_typeof_elmWatchInternal(x);
	var yType = _Utils_typeof_elmWatchInternal(y);

	if (xType !== yType) {
		return false;
	}

	switch (xType) {
		case "primitive":
			return false;
		case "function":
			return true;
	}

	if (x.$ !== y.$) {
		return false;
	}

	if (x.$ === 'Set_elm_builtin') {
		x = $elm$core$Set$toList(x);
		y = $elm$core$Set$toList(y);
	} else if (x.$ === 'RBNode_elm_builtin' || x.$ === 'RBEmpty_elm_builtin' || x.$ < 0) {
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}

	if (Object.keys(x).length !== Object.keys(y).length) {
		return false;
	}

	if (depth > 100) {
		stack.push(_Utils_Tuple2(x, y));
		return true;
	}

	for (var key in x) {
		if (!_Utils_eqHelp_elmWatchInternal(x[key], y[key], depth + 1, stack)) {
			return false;
		}
	}
	return true;
}

// This whole function was added by elm-watch.
function _Utils_typeof_elmWatchInternal(x)
{
	var type = typeof x;
	return type === "function"
		? "function"
		: type !== "object" || type === null
		? "primitive"
		: "objectOrArray";
}



// TRACK PRELOADS
//
// This is used by code in elm/browser and elm/http
// to register any HTTP requests that are triggered by init.
//


var _Platform_preload;


function _Platform_registerPreload(url)
{
	_Platform_preload.add(url);
}



// EFFECT MANAGERS


var _Platform_effectManagers = {};


function _Platform_setupEffects(managers, sendToApp)
{
	var ports;

	// setup all necessary effect managers
	for (var key in _Platform_effectManagers)
	{
		var manager = _Platform_effectManagers[key];

		if (manager.a)
		{
			ports = ports || {};
			ports[key] = manager.a(key, sendToApp);
		}

		managers[key] = _Platform_instantiateManager(manager, sendToApp);
	}

	return ports;
}


function _Platform_createManager(init, onEffects, onSelfMsg, cmdMap, subMap)
{
	return {
		b: init,
		c: onEffects,
		d: onSelfMsg,
		e: cmdMap,
		f: subMap
	};
}


function _Platform_instantiateManager(info, sendToApp)
{
	var router = {
		g: sendToApp,
		h: undefined
	};

	var onEffects = info.c;
	var onSelfMsg = info.d;
	var cmdMap = info.e;
	var subMap = info.f;

	function loop(state)
	{
		return A2(_Scheduler_andThen, loop, _Scheduler_receive(function(msg)
		{
			var value = msg.a;

			if (msg.$ === 0)
			{
				return A3(onSelfMsg, router, value, state);
			}

			return cmdMap && subMap
				? A4(onEffects, router, value.i, value.j, state)
				: A3(onEffects, router, cmdMap ? value.i : value.j, state);
		}));
	}

	return router.h = _Scheduler_rawSpawn(A2(_Scheduler_andThen, loop, info.b));
}



// ROUTING


var _Platform_sendToApp = F2(function(router, msg)
{
	return _Scheduler_binding(function(callback)
	{
		router.g(msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});


var _Platform_sendToSelf = F2(function(router, msg)
{
	return A2(_Scheduler_send, router.h, {
		$: 0,
		a: msg
	});
});



// BAGS


function _Platform_leaf(home)
{
	return function(value)
	{
		return {
			$: 1,
			k: home,
			l: value
		};
	};
}


function _Platform_batch(list)
{
	return {
		$: 2,
		m: list
	};
}


var _Platform_map = F2(function(tagger, bag)
{
	return {
		$: 3,
		n: tagger,
		o: bag
	}
});



// PIPE BAGS INTO EFFECT MANAGERS
//
// Effects must be queued!
//
// Say your init contains a synchronous command, like Time.now or Time.here
//
//   - This will produce a batch of effects (FX_1)
//   - The synchronous task triggers the subsequent `update` call
//   - This will produce a batch of effects (FX_2)
//
// If we just start dispatching FX_2, subscriptions from FX_2 can be processed
// before subscriptions from FX_1. No good! Earlier versions of this code had
// this problem, leading to these reports:
//
//   https://github.com/elm/core/issues/980
//   https://github.com/elm/core/pull/981
//   https://github.com/elm/compiler/issues/1776
//
// The queue is necessary to avoid ordering issues for synchronous commands.


// Why use true/false here? Why not just check the length of the queue?
// The goal is to detect "are we currently dispatching effects?" If we
// are, we need to bail and let the ongoing while loop handle things.
//
// Now say the queue has 1 element. When we dequeue the final element,
// the queue will be empty, but we are still actively dispatching effects.
// So you could get queue jumping in a really tricky category of cases.
//
var _Platform_effectsQueue = [];
var _Platform_effectsActive = false;


function _Platform_enqueueEffects(managers, cmdBag, subBag)
{
	_Platform_effectsQueue.push({ p: managers, q: cmdBag, r: subBag });

	if (_Platform_effectsActive) return;

	_Platform_effectsActive = true;
	for (var fx; fx = _Platform_effectsQueue.shift(); )
	{
		_Platform_dispatchEffects(fx.p, fx.q, fx.r);
	}
	_Platform_effectsActive = false;
}


function _Platform_dispatchEffects(managers, cmdBag, subBag)
{
	var effectsDict = {};
	_Platform_gatherEffects(true, cmdBag, effectsDict, null);
	_Platform_gatherEffects(false, subBag, effectsDict, null);

	for (var home in managers)
	{
		_Scheduler_rawSend(managers[home], {
			$: 'fx',
			a: effectsDict[home] || { i: _List_Nil, j: _List_Nil }
		});
	}
}


function _Platform_gatherEffects(isCmd, bag, effectsDict, taggers)
{
	switch (bag.$)
	{
		case 1:
			var home = bag.k;
			var effect = _Platform_toEffect(isCmd, home, taggers, bag.l);
			effectsDict[home] = _Platform_insert(isCmd, effect, effectsDict[home]);
			return;

		case 2:
			for (var list = bag.m; list.b; list = list.b) // WHILE_CONS
			{
				_Platform_gatherEffects(isCmd, list.a, effectsDict, taggers);
			}
			return;

		case 3:
			_Platform_gatherEffects(isCmd, bag.o, effectsDict, {
				s: bag.n,
				t: taggers
			});
			return;
	}
}


function _Platform_toEffect(isCmd, home, taggers, value)
{
	function applyTaggers(x)
	{
		for (var temp = taggers; temp; temp = temp.t)
		{
			x = temp.s(x);
		}
		return x;
	}

	var map = isCmd
		? _Platform_effectManagers[home].e
		: _Platform_effectManagers[home].f;

	return A2(map, applyTaggers, value)
}


function _Platform_insert(isCmd, newEffect, effects)
{
	effects = effects || { i: _List_Nil, j: _List_Nil };

	isCmd
		? (effects.i = _List_Cons(newEffect, effects.i))
		: (effects.j = _List_Cons(newEffect, effects.j));

	return effects;
}



// PORTS


function _Platform_checkPortName(name)
{
	if (_Platform_effectManagers[name])
	{
		_Debug_crash(3, name)
	}
}



// OUTGOING PORTS


function _Platform_outgoingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		e: _Platform_outgoingPortMap,
		u: converter,
		a: _Platform_setupOutgoingPort
	};
	return _Platform_leaf(name);
}


var _Platform_outgoingPortMap = F2(function(tagger, value) { return value; });


function _Platform_setupOutgoingPort(name)
{
	var subs = [];
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Process_sleep(0);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, cmdList, state)
	{
		for ( ; cmdList.b; cmdList = cmdList.b) // WHILE_CONS
		{
			// grab a separate reference to subs in case unsubscribe is called
			var currentSubs = subs;
			var value = _Json_unwrap(converter(cmdList.a));
			for (var i = 0; i < currentSubs.length; i++)
			{
				currentSubs[i](value);
			}
		}
		return init;
	});

	// PUBLIC API

	function subscribe(callback)
	{
		subs.push(callback);
	}

	function unsubscribe(callback)
	{
		// copy subs into a new array in case unsubscribe is called within a
		// subscribed callback
		subs = subs.slice();
		var index = subs.indexOf(callback);
		if (index >= 0)
		{
			subs.splice(index, 1);
		}
	}

	return {
		subscribe: subscribe,
		unsubscribe: unsubscribe
	};
}



// INCOMING PORTS


function _Platform_incomingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		f: _Platform_incomingPortMap,
		u: converter,
		a: _Platform_setupIncomingPort
	};
	return _Platform_leaf(name);
}


var _Platform_incomingPortMap = F2(function(tagger, finalTagger)
{
	return function(value)
	{
		return tagger(finalTagger(value));
	};
});


function _Platform_setupIncomingPort(name, sendToApp)
{
	var subs = _List_Nil;
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Scheduler_succeed(null);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, subList, state)
	{
		subs = subList;
		return init;
	});

	// PUBLIC API

	function send(incomingValue)
	{
		var result = A2(_Json_run, converter, _Json_wrap(incomingValue));

		$elm$core$Result$isOk(result) || _Debug_crash(4, name, result.a);

		var value = result.a;
		for (var temp = subs; temp.b; temp = temp.b) // WHILE_CONS
		{
			sendToApp(temp.a(value));
		}
	}

	return { send: send };
}



// EXPORT ELM MODULES
//
// Have DEBUG and PROD versions so that we can (1) give nicer errors in
// debug mode and (2) not pay for the bits needed for that in prod mode.
//


function _Platform_export_UNUSED(exports)
{
	scope['Elm']
		? _Platform_mergeExportsProd(scope['Elm'], exports)
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsProd(obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6)
				: _Platform_mergeExportsProd(obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}


function _Platform_export(exports)
{
	// added by elm-watch
	if (globalThis.__ELM_WATCH) {
		if (globalThis.__ELM_WATCH.IS_REGISTERING) {
			globalThis.__ELM_WATCH.REGISTER(_elmWatchTargetName, exports);
		} else {
			globalThis.__ELM_WATCH.HOT_RELOAD(_elmWatchTargetName, exports);
			return;
		}
	}

	scope['Elm']
		? _Platform_mergeExportsDebug('Elm', scope['Elm'], exports) // Always calls the debug version with elm-watch (the only difference is an error message).
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsDebug(moduleName, obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6, moduleName)
				: _Platform_mergeExportsDebug(moduleName + '.' + name, obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}




// HELPERS


var _VirtualDom_divertHrefToApp;

var _VirtualDom_doc = typeof document !== 'undefined' ? document : {};


function _VirtualDom_appendChild(parent, child)
{
	parent.appendChild(child);
}

// This whole function was changed by elm-watch.
var _VirtualDom_init = F4(function(virtualNode, flagDecoder, debugMetadata, args)
{
	var programType = "Html";

	if (args === "__elmWatchReturnData") {
		return { virtualNode: virtualNode, programType: programType, _Platform_effectManagers: _Platform_effectManagers, _Scheduler_enqueue: _Scheduler_enqueue };
	}

	/**_UNUSED/ // always UNUSED with elm-watch
	var node = args['node'];
	//*/
	/**/
	var node = args && args['node'] ? args['node'] : _Debug_crash(0);
	//*/

	var sendToApp = function() {};
	var tNode = typeof _VirtualDom_createTNode === 'function' ? _VirtualDom_createTNode(undefined) : undefined;
	var nextNode = _VirtualDom_render(virtualNode, sendToApp, tNode);
	if (tNode !== undefined) {
		nextNode.elmTree = tNode;
	}
	node.parentNode.replaceChild(nextNode, node);
	node = nextNode;

	function __elmWatchHotReload(newData) {
		var patches = _VirtualDom_diff(virtualNode, newData.virtualNode);
		node = _VirtualDom_applyPatches(node, virtualNode, patches, sendToApp);
		virtualNode = newData.virtualNode;
		return [];
	}

	return Object.defineProperties(
		{},
		{
			__elmWatchHotReload: { value: __elmWatchHotReload },
			__elmWatchRunInitCmds: { value: Function.prototype },
			__elmWatchProgramType: { value: programType },
		}
	);
});



// TEXT


function _VirtualDom_text(string)
{
	return {
		$: 0,
		a: string
	};
}



// NODE


var _VirtualDom_nodeNS = F2(function(namespace, tag)
{
	return F2(function(factList, kidList)
	{
		for (var kids = [], descendantsCount = 0; kidList.b; kidList = kidList.b) // WHILE_CONS
		{
			var kid = kidList.a;
			descendantsCount += (kid.b || 0);
			kids.push(kid);
		}
		descendantsCount += kids.length;

		return {
			$: 1,
			c: tag,
			d: _VirtualDom_organizeFacts(factList),
			e: kids,
			f: namespace,
			b: descendantsCount
		};
	});
});


var _VirtualDom_node = _VirtualDom_nodeNS(undefined);



// KEYED NODE


var _VirtualDom_keyedNodeNS = F2(function(namespace, tag)
{
	return F2(function(factList, kidList)
	{
		for (var kids = [], descendantsCount = 0; kidList.b; kidList = kidList.b) // WHILE_CONS
		{
			var kid = kidList.a;
			descendantsCount += (kid.b.b || 0);
			kids.push(kid);
		}
		descendantsCount += kids.length;

		return {
			$: 2,
			c: tag,
			d: _VirtualDom_organizeFacts(factList),
			e: kids,
			f: namespace,
			b: descendantsCount
		};
	});
});


var _VirtualDom_keyedNode = _VirtualDom_keyedNodeNS(undefined);



// CUSTOM


function _VirtualDom_custom(factList, model, render, diff)
{
	return {
		$: 3,
		d: _VirtualDom_organizeFacts(factList),
		g: model,
		h: render,
		i: diff
	};
}



// MAP


var _VirtualDom_map = F2(function(tagger, node)
{
	return {
		$: 4,
		j: tagger,
		k: node,
		b: 1 + (node.b || 0)
	};
});



// LAZY


function _VirtualDom_thunk(refs, thunk)
{
	return {
		$: 5,
		l: refs,
		m: thunk,
		k: undefined
	};
}

var _VirtualDom_lazy = F2(function(func, a)
{
	return _VirtualDom_thunk([func, a], function() {
		return func(a);
	});
});

var _VirtualDom_lazy2 = F3(function(func, a, b)
{
	return _VirtualDom_thunk([func, a, b], function() {
		return A2(func, a, b);
	});
});

var _VirtualDom_lazy3 = F4(function(func, a, b, c)
{
	return _VirtualDom_thunk([func, a, b, c], function() {
		return A3(func, a, b, c);
	});
});

var _VirtualDom_lazy4 = F5(function(func, a, b, c, d)
{
	return _VirtualDom_thunk([func, a, b, c, d], function() {
		return A4(func, a, b, c, d);
	});
});

var _VirtualDom_lazy5 = F6(function(func, a, b, c, d, e)
{
	return _VirtualDom_thunk([func, a, b, c, d, e], function() {
		return A5(func, a, b, c, d, e);
	});
});

var _VirtualDom_lazy6 = F7(function(func, a, b, c, d, e, f)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f], function() {
		return A6(func, a, b, c, d, e, f);
	});
});

var _VirtualDom_lazy7 = F8(function(func, a, b, c, d, e, f, g)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f, g], function() {
		return A7(func, a, b, c, d, e, f, g);
	});
});

var _VirtualDom_lazy8 = F9(function(func, a, b, c, d, e, f, g, h)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f, g, h], function() {
		return A8(func, a, b, c, d, e, f, g, h);
	});
});



// FACTS


var _VirtualDom_on = F2(function(key, handler)
{
	return {
		$: 'a0',
		n: key,
		o: handler
	};
});
var _VirtualDom_style = F2(function(key, value)
{
	return {
		$: 'a1',
		n: key,
		o: value
	};
});
var _VirtualDom_property = F2(function(key, value)
{
	return {
		$: 'a2',
		n: key,
		o: value
	};
});
var _VirtualDom_attribute = F2(function(key, value)
{
	return {
		$: 'a3',
		n: key,
		o: value
	};
});
var _VirtualDom_attributeNS = F3(function(namespace, key, value)
{
	return {
		$: 'a4',
		n: key,
		o: { f: namespace, o: value }
	};
});



// XSS ATTACK VECTOR CHECKS
//
// For some reason, tabs can appear in href protocols and it still works.
// So '\tjava\tSCRIPT:alert("!!!")' and 'javascript:alert("!!!")' are the same
// in practice. That is why _VirtualDom_RE_js and _VirtualDom_RE_js_html look
// so freaky.
//
// Pulling the regular expressions out to the top level gives a slight speed
// boost in small benchmarks (4-10%) but hoisting values to reduce allocation
// can be unpredictable in large programs where JIT may have a harder time with
// functions are not fully self-contained. The benefit is more that the js and
// js_html ones are so weird that I prefer to see them near each other.


var _VirtualDom_RE_script = /^script$/i;
var _VirtualDom_RE_on_formAction = /^(on|formAction$)/i;
var _VirtualDom_RE_js = /^\s*j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/i;
var _VirtualDom_RE_js_html = /^\s*(j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:|d\s*a\s*t\s*a\s*:\s*t\s*e\s*x\s*t\s*\/\s*h\s*t\s*m\s*l\s*(,|;))/i;


function _VirtualDom_noScript(tag)
{
	return _VirtualDom_RE_script.test(tag) ? 'p' : tag;
}

function _VirtualDom_noOnOrFormAction(key)
{
	return _VirtualDom_RE_on_formAction.test(key) ? 'data-' + key : key;
}

function _VirtualDom_noInnerHtmlOrFormAction(key)
{
	return key == 'innerHTML' || key == 'outerHTML' || key == 'formAction' ? 'data-' + key : key;
}

function _VirtualDom_noJavaScriptUri(value)
{
	return _VirtualDom_RE_js.test(value)
		? /**_UNUSED/''//*//**/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		: value;
}

function _VirtualDom_noJavaScriptOrHtmlUri(value)
{
	return _VirtualDom_RE_js_html.test(value)
		? /**_UNUSED/''//*//**/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		: value;
}

function _VirtualDom_noJavaScriptOrHtmlJson(value)
{
	return (
		(typeof _Json_unwrap(value) === 'string' && _VirtualDom_RE_js_html.test(_Json_unwrap(value)))
		||
		(Array.isArray(_Json_unwrap(value)) && _VirtualDom_RE_js_html.test(String(_Json_unwrap(value))))
	)
		? _Json_wrap(
			/**_UNUSED/''//*//**/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		) : value;
}



// MAP FACTS


var _VirtualDom_mapAttribute = F2(function(func, attr)
{
	return (attr.$ === 'a0')
		? A2(_VirtualDom_on, attr.n, _VirtualDom_mapHandler(func, attr.o))
		: attr;
});

function _VirtualDom_mapHandler(func, handler)
{
	var tag = $elm$virtual_dom$VirtualDom$toHandlerInt(handler);

	// 0 = Normal
	// 1 = MayStopPropagation
	// 2 = MayPreventDefault
	// 3 = Custom

	return {
		$: handler.$,
		a:
			!tag
				? A2($elm$json$Json$Decode$map, func, handler.a)
				:
			A3($elm$json$Json$Decode$map2,
				tag < 3
					? _VirtualDom_mapEventTuple
					: _VirtualDom_mapEventRecord,
				$elm$json$Json$Decode$succeed(func),
				handler.a
			)
	};
}

var _VirtualDom_mapEventTuple = F2(function(func, tuple)
{
	return _Utils_Tuple2(func(tuple.a), tuple.b);
});

var _VirtualDom_mapEventRecord = F2(function(func, record)
{
	return {
		message: func(record.message),
		stopPropagation: record.stopPropagation,
		preventDefault: record.preventDefault
	}
});



// ORGANIZE FACTS


function _VirtualDom_organizeFacts(factList)
{
	for (var facts = {}; factList.b; factList = factList.b) // WHILE_CONS
	{
		var entry = factList.a;

		var tag = entry.$;
		var key = entry.n;
		var value = entry.o;

		if (tag === 'a2')
		{
			(key === 'className')
				? _VirtualDom_addClass(facts, key, _Json_unwrap(value))
				: facts[key] = _Json_unwrap(value);

			continue;
		}

		var subFacts = facts[tag] || (facts[tag] = {});
		(tag === 'a3' && key === 'class')
			? _VirtualDom_addClass(subFacts, key, value)
			: subFacts[key] = value;
	}

	return facts;
}

function _VirtualDom_addClass(object, key, newClass)
{
	var classes = object[key];
	object[key] = classes ? classes + ' ' + newClass : newClass;
}



// RENDER


function _VirtualDom_render(vNode, eventNode)
{
	var tag = vNode.$;

	if (tag === 5)
	{
		return _VirtualDom_render(vNode.k || (vNode.k = vNode.m()), eventNode);
	}

	if (tag === 0)
	{
		return _VirtualDom_doc.createTextNode(vNode.a);
	}

	if (tag === 4)
	{
		var subNode = vNode.k;
		var tagger = vNode.j;

		while (subNode.$ === 4)
		{
			typeof tagger !== 'object'
				? tagger = [tagger, subNode.j]
				: tagger.push(subNode.j);

			subNode = subNode.k;
		}

		var subEventRoot = { j: tagger, p: eventNode };
		var domNode = _VirtualDom_render(subNode, subEventRoot);
		domNode.elm_event_node_ref = subEventRoot;
		return domNode;
	}

	if (tag === 3)
	{
		var domNode = vNode.h(vNode.g);
		_VirtualDom_applyFacts(domNode, eventNode, vNode.d);
		return domNode;
	}

	// at this point `tag` must be 1 or 2

	var domNode = vNode.f
		? _VirtualDom_doc.createElementNS(vNode.f, vNode.c)
		: _VirtualDom_doc.createElement(vNode.c);

	if (_VirtualDom_divertHrefToApp && vNode.c == 'a')
	{
		domNode.addEventListener('click', _VirtualDom_divertHrefToApp(domNode));
	}

	_VirtualDom_applyFacts(domNode, eventNode, vNode.d);

	for (var kids = vNode.e, i = 0; i < kids.length; i++)
	{
		_VirtualDom_appendChild(domNode, _VirtualDom_render(tag === 1 ? kids[i] : kids[i].b, eventNode));
	}

	return domNode;
}



// APPLY FACTS


function _VirtualDom_applyFacts(domNode, eventNode, facts)
{
	for (var key in facts)
	{
		var value = facts[key];

		key === 'a1'
			? _VirtualDom_applyStyles(domNode, value)
			:
		key === 'a0'
			? _VirtualDom_applyEvents(domNode, eventNode, value)
			:
		key === 'a3'
			? _VirtualDom_applyAttrs(domNode, value)
			:
		key === 'a4'
			? _VirtualDom_applyAttrsNS(domNode, value)
			:
		((key !== 'value' && key !== 'checked') || domNode[key] !== value) && (domNode[key] = value);
	}
}



// APPLY STYLES


function _VirtualDom_applyStyles(domNode, styles)
{
	var domNodeStyle = domNode.style;

	for (var key in styles)
	{
		domNodeStyle[key] = styles[key];
	}
}



// APPLY ATTRS


function _VirtualDom_applyAttrs(domNode, attrs)
{
	for (var key in attrs)
	{
		var value = attrs[key];
		typeof value !== 'undefined'
			? domNode.setAttribute(key, value)
			: domNode.removeAttribute(key);
	}
}



// APPLY NAMESPACED ATTRS


function _VirtualDom_applyAttrsNS(domNode, nsAttrs)
{
	for (var key in nsAttrs)
	{
		var pair = nsAttrs[key];
		var namespace = pair.f;
		var value = pair.o;

		typeof value !== 'undefined'
			? domNode.setAttributeNS(namespace, key, value)
			: domNode.removeAttributeNS(namespace, key);
	}
}



// APPLY EVENTS


function _VirtualDom_applyEvents(domNode, eventNode, events)
{
	var allCallbacks = domNode.elmFs || (domNode.elmFs = {});

	for (var key in events)
	{
		var newHandler = events[key];
		var oldCallback = allCallbacks[key];

		if (!newHandler)
		{
			domNode.removeEventListener(key, oldCallback);
			allCallbacks[key] = undefined;
			continue;
		}

		if (oldCallback)
		{
			var oldHandler = oldCallback.q;
			if (oldHandler.$ === newHandler.$)
			{
				oldCallback.q = newHandler;
				continue;
			}
			domNode.removeEventListener(key, oldCallback);
		}

		oldCallback = _VirtualDom_makeCallback(eventNode, newHandler);
		domNode.addEventListener(key, oldCallback,
			_VirtualDom_passiveSupported
			&& { passive: $elm$virtual_dom$VirtualDom$toHandlerInt(newHandler) < 2 }
		);
		allCallbacks[key] = oldCallback;
	}
}



// PASSIVE EVENTS


var _VirtualDom_passiveSupported;

try
{
	window.addEventListener('t', null, Object.defineProperty({}, 'passive', {
		get: function() { _VirtualDom_passiveSupported = true; }
	}));
}
catch(e) {}



// EVENT HANDLERS


function _VirtualDom_makeCallback(eventNode, initialHandler)
{
	function callback(event)
	{
		var handler = callback.q;
		var result = _Json_runHelp(handler.a, event);

		if (!$elm$core$Result$isOk(result))
		{
			return;
		}

		var tag = $elm$virtual_dom$VirtualDom$toHandlerInt(handler);

		// 0 = Normal
		// 1 = MayStopPropagation
		// 2 = MayPreventDefault
		// 3 = Custom

		var value = result.a;
		var message = !tag ? value : tag < 3 ? value.a : value.message;
		var stopPropagation = tag == 1 ? value.b : tag == 3 && value.stopPropagation;
		var currentEventNode = (
			stopPropagation && event.stopPropagation(),
			(tag == 2 ? value.b : tag == 3 && value.preventDefault) && event.preventDefault(),
			eventNode
		);
		var tagger;
		var i;
		while (tagger = currentEventNode.j)
		{
			if (typeof tagger == 'function')
			{
				message = tagger(message);
			}
			else
			{
				for (var i = tagger.length; i--; )
				{
					message = tagger[i](message);
				}
			}
			currentEventNode = currentEventNode.p;
		}
		currentEventNode(message, stopPropagation); // stopPropagation implies isSync
	}

	callback.q = initialHandler;

	return callback;
}

function _VirtualDom_equalEvents(x, y)
{
	return x.$ == y.$ && _Json_equality(x.a, y.a);
}



// DIFF


// TODO: Should we do patches like in iOS?
//
// type Patch
//   = At Int Patch
//   | Batch (List Patch)
//   | Change ...
//
// How could it not be better?
//
function _VirtualDom_diff(x, y)
{
	var patches = [];
	_VirtualDom_diffHelp(x, y, patches, 0);
	return patches;
}


function _VirtualDom_pushPatch(patches, type, index, data)
{
	var patch = {
		$: type,
		r: index,
		s: data,
		t: undefined,
		u: undefined
	};
	patches.push(patch);
	return patch;
}


function _VirtualDom_diffHelp(x, y, patches, index)
{
	if (x === y)
	{
		return;
	}

	var xType = x.$;
	var yType = y.$;

	// Bail if you run into different types of nodes. Implies that the
	// structure has changed significantly and it's not worth a diff.
	if (xType !== yType)
	{
		if (xType === 1 && yType === 2)
		{
			y = _VirtualDom_dekey(y);
			yType = 1;
		}
		else
		{
			_VirtualDom_pushPatch(patches, 0, index, y);
			return;
		}
	}

	// Now we know that both nodes are the same $.
	switch (yType)
	{
		case 5:
			var xRefs = x.l;
			var yRefs = y.l;
			var i = xRefs.length;
			var same = i === yRefs.length;
			while (same && i--)
			{
				same = xRefs[i] === yRefs[i];
			}
			if (same)
			{
				y.k = x.k;
				return;
			}
			y.k = y.m();
			var subPatches = [];
			_VirtualDom_diffHelp(x.k, y.k, subPatches, 0);
			subPatches.length > 0 && _VirtualDom_pushPatch(patches, 1, index, subPatches);
			return;

		case 4:
			// gather nested taggers
			var xTaggers = x.j;
			var yTaggers = y.j;
			var nesting = false;

			var xSubNode = x.k;
			while (xSubNode.$ === 4)
			{
				nesting = true;

				typeof xTaggers !== 'object'
					? xTaggers = [xTaggers, xSubNode.j]
					: xTaggers.push(xSubNode.j);

				xSubNode = xSubNode.k;
			}

			var ySubNode = y.k;
			while (ySubNode.$ === 4)
			{
				nesting = true;

				typeof yTaggers !== 'object'
					? yTaggers = [yTaggers, ySubNode.j]
					: yTaggers.push(ySubNode.j);

				ySubNode = ySubNode.k;
			}

			// Just bail if different numbers of taggers. This implies the
			// structure of the virtual DOM has changed.
			if (nesting && xTaggers.length !== yTaggers.length)
			{
				_VirtualDom_pushPatch(patches, 0, index, y);
				return;
			}

			// check if taggers are "the same"
			if (nesting ? !_VirtualDom_pairwiseRefEqual(xTaggers, yTaggers) : xTaggers !== yTaggers)
			{
				_VirtualDom_pushPatch(patches, 2, index, yTaggers);
			}

			// diff everything below the taggers
			_VirtualDom_diffHelp(xSubNode, ySubNode, patches, index + 1);
			return;

		case 0:
			if (x.a !== y.a)
			{
				_VirtualDom_pushPatch(patches, 3, index, y.a);
			}
			return;

		case 1:
			_VirtualDom_diffNodes(x, y, patches, index, _VirtualDom_diffKids);
			return;

		case 2:
			_VirtualDom_diffNodes(x, y, patches, index, _VirtualDom_diffKeyedKids);
			return;

		case 3:
			if (x.h !== y.h)
			{
				_VirtualDom_pushPatch(patches, 0, index, y);
				return;
			}

			var factsDiff = _VirtualDom_diffFacts(x.d, y.d);
			factsDiff && _VirtualDom_pushPatch(patches, 4, index, factsDiff);

			var patch = y.i(x.g, y.g);
			patch && _VirtualDom_pushPatch(patches, 5, index, patch);

			return;
	}
}

// assumes the incoming arrays are the same length
function _VirtualDom_pairwiseRefEqual(as, bs)
{
	for (var i = 0; i < as.length; i++)
	{
		if (as[i] !== bs[i])
		{
			return false;
		}
	}

	return true;
}

function _VirtualDom_diffNodes(x, y, patches, index, diffKids)
{
	// Bail if obvious indicators have changed. Implies more serious
	// structural changes such that it's not worth it to diff.
	if (x.c !== y.c || x.f !== y.f)
	{
		_VirtualDom_pushPatch(patches, 0, index, y);
		return;
	}

	var factsDiff = _VirtualDom_diffFacts(x.d, y.d);
	factsDiff && _VirtualDom_pushPatch(patches, 4, index, factsDiff);

	diffKids(x, y, patches, index);
}



// DIFF FACTS


// TODO Instead of creating a new diff object, it's possible to just test if
// there *is* a diff. During the actual patch, do the diff again and make the
// modifications directly. This way, there's no new allocations. Worth it?
function _VirtualDom_diffFacts(x, y, category)
{
	var diff;

	// look for changes and removals
	for (var xKey in x)
	{
		if (xKey === 'a1' || xKey === 'a0' || xKey === 'a3' || xKey === 'a4')
		{
			var subDiff = _VirtualDom_diffFacts(x[xKey], y[xKey] || {}, xKey);
			if (subDiff)
			{
				diff = diff || {};
				diff[xKey] = subDiff;
			}
			continue;
		}

		// remove if not in the new facts
		if (!(xKey in y))
		{
			diff = diff || {};
			diff[xKey] =
				!category
					? (typeof x[xKey] === 'string' ? '' : null)
					:
				(category === 'a1')
					? ''
					:
				(category === 'a0' || category === 'a3')
					? undefined
					:
				{ f: x[xKey].f, o: undefined };

			continue;
		}

		var xValue = x[xKey];
		var yValue = y[xKey];

		// reference equal, so don't worry about it
		if (xValue === yValue && xKey !== 'value' && xKey !== 'checked'
			|| category === 'a0' && _VirtualDom_equalEvents(xValue, yValue))
		{
			continue;
		}

		diff = diff || {};
		diff[xKey] = yValue;
	}

	// add new stuff
	for (var yKey in y)
	{
		if (!(yKey in x))
		{
			diff = diff || {};
			diff[yKey] = y[yKey];
		}
	}

	return diff;
}



// DIFF KIDS


function _VirtualDom_diffKids(xParent, yParent, patches, index)
{
	var xKids = xParent.e;
	var yKids = yParent.e;

	var xLen = xKids.length;
	var yLen = yKids.length;

	// FIGURE OUT IF THERE ARE INSERTS OR REMOVALS

	if (xLen > yLen)
	{
		_VirtualDom_pushPatch(patches, 6, index, {
			v: yLen,
			i: xLen - yLen
		});
	}
	else if (xLen < yLen)
	{
		_VirtualDom_pushPatch(patches, 7, index, {
			v: xLen,
			e: yKids
		});
	}

	// PAIRWISE DIFF EVERYTHING ELSE

	for (var minLen = xLen < yLen ? xLen : yLen, i = 0; i < minLen; i++)
	{
		var xKid = xKids[i];
		_VirtualDom_diffHelp(xKid, yKids[i], patches, ++index);
		index += xKid.b || 0;
	}
}



// KEYED DIFF


function _VirtualDom_diffKeyedKids(xParent, yParent, patches, rootIndex)
{
	var localPatches = [];

	var changes = {}; // Dict String Entry
	var inserts = []; // Array { index : Int, entry : Entry }
	// type Entry = { tag : String, vnode : VNode, index : Int, data : _ }

	var xKids = xParent.e;
	var yKids = yParent.e;
	var xLen = xKids.length;
	var yLen = yKids.length;
	var xIndex = 0;
	var yIndex = 0;

	var index = rootIndex;

	while (xIndex < xLen && yIndex < yLen)
	{
		var x = xKids[xIndex];
		var y = yKids[yIndex];

		var xKey = x.a;
		var yKey = y.a;
		var xNode = x.b;
		var yNode = y.b;

		var newMatch = undefined;
		var oldMatch = undefined;

		// check if keys match

		if (xKey === yKey)
		{
			index++;
			_VirtualDom_diffHelp(xNode, yNode, localPatches, index);
			index += xNode.b || 0;

			xIndex++;
			yIndex++;
			continue;
		}

		// look ahead 1 to detect insertions and removals.

		var xNext = xKids[xIndex + 1];
		var yNext = yKids[yIndex + 1];

		if (xNext)
		{
			var xNextKey = xNext.a;
			var xNextNode = xNext.b;
			oldMatch = yKey === xNextKey;
		}

		if (yNext)
		{
			var yNextKey = yNext.a;
			var yNextNode = yNext.b;
			newMatch = xKey === yNextKey;
		}


		// swap x and y
		if (newMatch && oldMatch)
		{
			index++;
			_VirtualDom_diffHelp(xNode, yNextNode, localPatches, index);
			_VirtualDom_insertNode(changes, localPatches, xKey, yNode, yIndex, inserts);
			index += xNode.b || 0;

			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNextNode, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 2;
			continue;
		}

		// insert y
		if (newMatch)
		{
			index++;
			_VirtualDom_insertNode(changes, localPatches, yKey, yNode, yIndex, inserts);
			_VirtualDom_diffHelp(xNode, yNextNode, localPatches, index);
			index += xNode.b || 0;

			xIndex += 1;
			yIndex += 2;
			continue;
		}

		// remove x
		if (oldMatch)
		{
			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNode, index);
			index += xNode.b || 0;

			index++;
			_VirtualDom_diffHelp(xNextNode, yNode, localPatches, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 1;
			continue;
		}

		// remove x, insert y
		if (xNext && xNextKey === yNextKey)
		{
			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNode, index);
			_VirtualDom_insertNode(changes, localPatches, yKey, yNode, yIndex, inserts);
			index += xNode.b || 0;

			index++;
			_VirtualDom_diffHelp(xNextNode, yNextNode, localPatches, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 2;
			continue;
		}

		break;
	}

	// eat up any remaining nodes with removeNode and insertNode

	while (xIndex < xLen)
	{
		index++;
		var x = xKids[xIndex];
		var xNode = x.b;
		_VirtualDom_removeNode(changes, localPatches, x.a, xNode, index);
		index += xNode.b || 0;
		xIndex++;
	}

	while (yIndex < yLen)
	{
		var endInserts = endInserts || [];
		var y = yKids[yIndex];
		_VirtualDom_insertNode(changes, localPatches, y.a, y.b, undefined, endInserts);
		yIndex++;
	}

	if (localPatches.length > 0 || inserts.length > 0 || endInserts)
	{
		_VirtualDom_pushPatch(patches, 8, rootIndex, {
			w: localPatches,
			x: inserts,
			y: endInserts
		});
	}
}



// CHANGES FROM KEYED DIFF


var _VirtualDom_POSTFIX = '_elmW6BL';


function _VirtualDom_insertNode(changes, localPatches, key, vnode, yIndex, inserts)
{
	var entry = changes[key];

	// never seen this key before
	if (!entry)
	{
		entry = {
			c: 0,
			z: vnode,
			r: yIndex,
			s: undefined
		};

		inserts.push({ r: yIndex, A: entry });
		changes[key] = entry;

		return;
	}

	// this key was removed earlier, a match!
	if (entry.c === 1)
	{
		inserts.push({ r: yIndex, A: entry });

		entry.c = 2;
		var subPatches = [];
		_VirtualDom_diffHelp(entry.z, vnode, subPatches, entry.r);
		entry.r = yIndex;
		entry.s.s = {
			w: subPatches,
			A: entry
		};

		return;
	}

	// this key has already been inserted or moved, a duplicate!
	_VirtualDom_insertNode(changes, localPatches, key + _VirtualDom_POSTFIX, vnode, yIndex, inserts);
}


function _VirtualDom_removeNode(changes, localPatches, key, vnode, index)
{
	var entry = changes[key];

	// never seen this key before
	if (!entry)
	{
		var patch = _VirtualDom_pushPatch(localPatches, 9, index, undefined);

		changes[key] = {
			c: 1,
			z: vnode,
			r: index,
			s: patch
		};

		return;
	}

	// this key was inserted earlier, a match!
	if (entry.c === 0)
	{
		entry.c = 2;
		var subPatches = [];
		_VirtualDom_diffHelp(vnode, entry.z, subPatches, index);

		_VirtualDom_pushPatch(localPatches, 9, index, {
			w: subPatches,
			A: entry
		});

		return;
	}

	// this key has already been removed or moved, a duplicate!
	_VirtualDom_removeNode(changes, localPatches, key + _VirtualDom_POSTFIX, vnode, index);
}



// ADD DOM NODES
//
// Each DOM node has an "index" assigned in order of traversal. It is important
// to minimize our crawl over the actual DOM, so these indexes (along with the
// descendantsCount of virtual nodes) let us skip touching entire subtrees of
// the DOM if we know there are no patches there.


function _VirtualDom_addDomNodes(domNode, vNode, patches, eventNode)
{
	_VirtualDom_addDomNodesHelp(domNode, vNode, patches, 0, 0, vNode.b, eventNode);
}


// assumes `patches` is non-empty and indexes increase monotonically.
function _VirtualDom_addDomNodesHelp(domNode, vNode, patches, i, low, high, eventNode)
{
	var patch = patches[i];
	var index = patch.r;

	while (index === low)
	{
		var patchType = patch.$;

		if (patchType === 1)
		{
			_VirtualDom_addDomNodes(domNode, vNode.k, patch.s, eventNode);
		}
		else if (patchType === 8)
		{
			patch.t = domNode;
			patch.u = eventNode;

			var subPatches = patch.s.w;
			if (subPatches.length > 0)
			{
				_VirtualDom_addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
			}
		}
		else if (patchType === 9)
		{
			patch.t = domNode;
			patch.u = eventNode;

			var data = patch.s;
			if (data)
			{
				data.A.s = domNode;
				var subPatches = data.w;
				if (subPatches.length > 0)
				{
					_VirtualDom_addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
				}
			}
		}
		else
		{
			patch.t = domNode;
			patch.u = eventNode;
		}

		i++;

		if (!(patch = patches[i]) || (index = patch.r) > high)
		{
			return i;
		}
	}

	var tag = vNode.$;

	if (tag === 4)
	{
		var subNode = vNode.k;

		while (subNode.$ === 4)
		{
			subNode = subNode.k;
		}

		return _VirtualDom_addDomNodesHelp(domNode, subNode, patches, i, low + 1, high, domNode.elm_event_node_ref);
	}

	// tag must be 1 or 2 at this point

	var vKids = vNode.e;
	var childNodes = domNode.childNodes;
	for (var j = 0; j < vKids.length; j++)
	{
		low++;
		var vKid = tag === 1 ? vKids[j] : vKids[j].b;
		var nextLow = low + (vKid.b || 0);
		if (low <= index && index <= nextLow)
		{
			i = _VirtualDom_addDomNodesHelp(childNodes[j], vKid, patches, i, low, nextLow, eventNode);
			if (!(patch = patches[i]) || (index = patch.r) > high)
			{
				return i;
			}
		}
		low = nextLow;
	}
	return i;
}



// APPLY PATCHES


function _VirtualDom_applyPatches(rootDomNode, oldVirtualNode, patches, eventNode)
{
	if (patches.length === 0)
	{
		return rootDomNode;
	}

	_VirtualDom_addDomNodes(rootDomNode, oldVirtualNode, patches, eventNode);
	return _VirtualDom_applyPatchesHelp(rootDomNode, patches);
}

function _VirtualDom_applyPatchesHelp(rootDomNode, patches)
{
	for (var i = 0; i < patches.length; i++)
	{
		var patch = patches[i];
		var localDomNode = patch.t
		var newNode = _VirtualDom_applyPatch(localDomNode, patch);
		if (localDomNode === rootDomNode)
		{
			rootDomNode = newNode;
		}
	}
	return rootDomNode;
}

function _VirtualDom_applyPatch(domNode, patch)
{
	switch (patch.$)
	{
		case 0:
			return _VirtualDom_applyPatchRedraw(domNode, patch.s, patch.u);

		case 4:
			_VirtualDom_applyFacts(domNode, patch.u, patch.s);
			return domNode;

		case 3:
			domNode.replaceData(0, domNode.length, patch.s);
			return domNode;

		case 1:
			return _VirtualDom_applyPatchesHelp(domNode, patch.s);

		case 2:
			if (domNode.elm_event_node_ref)
			{
				domNode.elm_event_node_ref.j = patch.s;
			}
			else
			{
				domNode.elm_event_node_ref = { j: patch.s, p: patch.u };
			}
			return domNode;

		case 6:
			var data = patch.s;
			for (var i = 0; i < data.i; i++)
			{
				domNode.removeChild(domNode.childNodes[data.v]);
			}
			return domNode;

		case 7:
			var data = patch.s;
			var kids = data.e;
			var i = data.v;
			var theEnd = domNode.childNodes[i];
			for (; i < kids.length; i++)
			{
				domNode.insertBefore(_VirtualDom_render(kids[i], patch.u), theEnd);
			}
			return domNode;

		case 9:
			var data = patch.s;
			if (!data)
			{
				domNode.parentNode.removeChild(domNode);
				return domNode;
			}
			var entry = data.A;
			if (typeof entry.r !== 'undefined')
			{
				domNode.parentNode.removeChild(domNode);
			}
			entry.s = _VirtualDom_applyPatchesHelp(domNode, data.w);
			return domNode;

		case 8:
			return _VirtualDom_applyPatchReorder(domNode, patch);

		case 5:
			return patch.s(domNode);

		default:
			_Debug_crash(10); // 'Ran into an unknown patch!'
	}
}


function _VirtualDom_applyPatchRedraw(domNode, vNode, eventNode)
{
	var parentNode = domNode.parentNode;
	var newNode = _VirtualDom_render(vNode, eventNode);

	if (!newNode.elm_event_node_ref)
	{
		newNode.elm_event_node_ref = domNode.elm_event_node_ref;
	}

	if (parentNode && newNode !== domNode)
	{
		parentNode.replaceChild(newNode, domNode);
	}
	return newNode;
}


function _VirtualDom_applyPatchReorder(domNode, patch)
{
	var data = patch.s;

	// remove end inserts
	var frag = _VirtualDom_applyPatchReorderEndInsertsHelp(data.y, patch);

	// removals
	domNode = _VirtualDom_applyPatchesHelp(domNode, data.w);

	// inserts
	var inserts = data.x;
	for (var i = 0; i < inserts.length; i++)
	{
		var insert = inserts[i];
		var entry = insert.A;
		var node = entry.c === 2
			? entry.s
			: _VirtualDom_render(entry.z, patch.u);
		domNode.insertBefore(node, domNode.childNodes[insert.r]);
	}

	// add end inserts
	if (frag)
	{
		_VirtualDom_appendChild(domNode, frag);
	}

	return domNode;
}


function _VirtualDom_applyPatchReorderEndInsertsHelp(endInserts, patch)
{
	if (!endInserts)
	{
		return;
	}

	var frag = _VirtualDom_doc.createDocumentFragment();
	for (var i = 0; i < endInserts.length; i++)
	{
		var insert = endInserts[i];
		var entry = insert.A;
		_VirtualDom_appendChild(frag, entry.c === 2
			? entry.s
			: _VirtualDom_render(entry.z, patch.u)
		);
	}
	return frag;
}


function _VirtualDom_virtualize(node)
{
	// TEXT NODES

	if (node.nodeType === 3)
	{
		return _VirtualDom_text(node.textContent);
	}


	// WEIRD NODES

	if (node.nodeType !== 1)
	{
		return _VirtualDom_text('');
	}


	// ELEMENT NODES

	var attrList = _List_Nil;
	var attrs = node.attributes;
	for (var i = attrs.length; i--; )
	{
		var attr = attrs[i];
		var name = attr.name;
		var value = attr.value;
		attrList = _List_Cons( A2(_VirtualDom_attribute, name, value), attrList );
	}

	var tag = node.tagName.toLowerCase();
	var kidList = _List_Nil;
	var kids = node.childNodes;

	for (var i = kids.length; i--; )
	{
		kidList = _List_Cons(_VirtualDom_virtualize(kids[i]), kidList);
	}
	return A3(_VirtualDom_node, tag, attrList, kidList);
}

function _VirtualDom_dekey(keyedNode)
{
	var keyedKids = keyedNode.e;
	var len = keyedKids.length;
	var kids = new Array(len);
	for (var i = 0; i < len; i++)
	{
		kids[i] = keyedKids[i].b;
	}

	return {
		$: 1,
		c: keyedNode.c,
		d: keyedNode.d,
		e: kids,
		f: keyedNode.f,
		b: keyedNode.b
	};
}




// ELEMENT


var _Debugger_element;

// This function was slightly modified by elm-watch.
var _Browser_element = _Debugger_element || F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		impl._impl ? "Browser.sandbox" : "Browser.element", // added by elm-watch
		false, // isDebug, added by elm-watch
		debugMetadata, // added by elm-watch
		flagDecoder,
		args,
		impl.init,
		// impl.update, // commented out by elm-watch
		// impl.subscriptions, // commented out by elm-watch
		impl, // added by elm-watch
		function(sendToApp, initialModel) {
			// var view = impl.view; // commented out by elm-watch
			/**_UNUSED/ // always UNUSED with elm-watch
			var domNode = args['node'];
			//*/
			/**/
			var domNode = args && args['node'] ? args['node'] : _Debug_crash(0);
			//*/
			var currNode = _VirtualDom_virtualize(domNode);

			return _Browser_makeAnimator(initialModel, function(model)
			{
				// var nextNode = view(model); // commented out by elm-watch
				var nextNode = impl.view(model); // added by elm-watch
				var patches = _VirtualDom_diff(currNode, nextNode);
				domNode = _VirtualDom_applyPatches(domNode, currNode, patches, sendToApp);
				currNode = nextNode;
			});
		}
	);
});



// DOCUMENT


var _Debugger_document;

// This function was slightly modified by elm-watch.
var _Browser_document = _Debugger_document || F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		impl._impl ? "Browser.application" : "Browser.document", // added by elm-watch
		false, // isDebug, added by elm-watch
		debugMetadata, // added by elm-watch
		flagDecoder,
		args,
		impl.init,
		// impl.update, // commented out by elm-watch
		// impl.subscriptions, // commented out by elm-watch
		impl, // added by elm-watch
		function(sendToApp, initialModel) {
			var divertHrefToApp = impl.setup && impl.setup(sendToApp)
			// var view = impl.view; // commented out by elm-watch
			var title = _VirtualDom_doc.title;
			var bodyNode = _VirtualDom_doc.body;
			_VirtualDom_divertHrefToApp = divertHrefToApp; // added by elm-watch
			var currNode = _VirtualDom_virtualize(bodyNode);
			_VirtualDom_divertHrefToApp = 0; // added by elm-watch
			return _Browser_makeAnimator(initialModel, function(model)
			{
				_VirtualDom_divertHrefToApp = divertHrefToApp;
				// var doc = view(model); // commented out by elm-watch
				var doc = impl.view(model); // added by elm-watch
				var nextNode = _VirtualDom_node('body')(_List_Nil)(doc.body);
				var patches = _VirtualDom_diff(currNode, nextNode);
				bodyNode = _VirtualDom_applyPatches(bodyNode, currNode, patches, sendToApp);
				currNode = nextNode;
				_VirtualDom_divertHrefToApp = 0;
				(title !== doc.title) && (_VirtualDom_doc.title = title = doc.title);
			});
		}
	);
});



// ANIMATION


var _Browser_cancelAnimationFrame =
	typeof cancelAnimationFrame !== 'undefined'
		? cancelAnimationFrame
		: function(id) { clearTimeout(id); };

var _Browser_requestAnimationFrame =
	typeof requestAnimationFrame !== 'undefined'
		? requestAnimationFrame
		: function(callback) { return setTimeout(callback, 1000 / 60); };


function _Browser_makeAnimator(model, draw)
{
	draw(model);

	var state = 0;

	function updateIfNeeded()
	{
		state = state === 1
			? 0
			: ( _Browser_requestAnimationFrame(updateIfNeeded), draw(model), 1 );
	}

	return function(nextModel, isSync)
	{
		model = nextModel;

		isSync
			? ( draw(model),
				state === 2 && (state = 1)
				)
			: ( state === 0 && _Browser_requestAnimationFrame(updateIfNeeded),
				state = 2
				);
	};
}



// APPLICATION


// This function was slightly modified by elm-watch.
function _Browser_application(impl)
{
	// var onUrlChange = impl.onUrlChange; // commented out by elm-watch
	// var onUrlRequest = impl.onUrlRequest; // commented out by elm-watch
	// var key = function() { key.a(onUrlChange(_Browser_getUrl())); }; // commented out by elm-watch
	var key = function() { key.a(impl.onUrlChange(_Browser_getUrl())); }; // added by elm-watch

	return _Browser_document({
		setup: function(sendToApp)
		{
			key.a = sendToApp;
			_Browser_window.addEventListener('popstate', key);
			_Browser_window.navigator.userAgent.indexOf('Trident') < 0 || _Browser_window.addEventListener('hashchange', key);

			return F2(function(domNode, event)
			{
				if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button < 1 && !domNode.target && !domNode.hasAttribute('download'))
				{
					event.preventDefault();
					var href = domNode.href;
					var curr = _Browser_getUrl();
					var next = $elm$url$Url$fromString(href).a;
					sendToApp(impl.onUrlRequest(
						(next
							&& curr.protocol === next.protocol
							&& curr.host === next.host
							&& curr.port_.a === next.port_.a
						)
							? $elm$browser$Browser$Internal(next)
							: $elm$browser$Browser$External(href)
					));
				}
			});
		},
		init: function(flags)
		{
			// return A3(impl.init, flags, _Browser_getUrl(), key); // commented out by elm-watch
			return A3(impl.init, flags, globalThis.__ELM_WATCH_INIT_URL, key); // added by elm-watch
		},
		// view: impl.view, // commented out by elm-watch
		// update: impl.update, // commented out by elm-watch
		// subscriptions: impl.subscriptions // commented out by elm-watch
		view: function(model) { return impl.view(model); }, // added by elm-watch
		_impl: impl // added by elm-watch
	});
}

function _Browser_getUrl()
{
	return $elm$url$Url$fromString(_VirtualDom_doc.location.href).a || _Debug_crash(1);
}

var _Browser_go = F2(function(key, n)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		n && history.go(n);
		key();
	}));
});

var _Browser_pushUrl = F2(function(key, url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		history.pushState({}, '', url);
		key();
	}));
});

var _Browser_replaceUrl = F2(function(key, url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		history.replaceState({}, '', url);
		key();
	}));
});



// GLOBAL EVENTS


var _Browser_fakeNode = { addEventListener: function() {}, removeEventListener: function() {} };
var _Browser_doc = typeof document !== 'undefined' ? document : _Browser_fakeNode;
var _Browser_window = typeof window !== 'undefined' ? window : _Browser_fakeNode;

var _Browser_on = F3(function(node, eventName, sendToSelf)
{
	return _Scheduler_spawn(_Scheduler_binding(function(callback)
	{
		function handler(event)	{ _Scheduler_rawSpawn(sendToSelf(event)); }
		node.addEventListener(eventName, handler, _VirtualDom_passiveSupported && { passive: true });
		return function() { node.removeEventListener(eventName, handler); };
	}));
});

var _Browser_decodeEvent = F2(function(decoder, event)
{
	var result = _Json_runHelp(decoder, event);
	return $elm$core$Result$isOk(result) ? $elm$core$Maybe$Just(result.a) : $elm$core$Maybe$Nothing;
});



// PAGE VISIBILITY


function _Browser_visibilityInfo()
{
	return (typeof _VirtualDom_doc.hidden !== 'undefined')
		? { hidden: 'hidden', change: 'visibilitychange' }
		:
	(typeof _VirtualDom_doc.mozHidden !== 'undefined')
		? { hidden: 'mozHidden', change: 'mozvisibilitychange' }
		:
	(typeof _VirtualDom_doc.msHidden !== 'undefined')
		? { hidden: 'msHidden', change: 'msvisibilitychange' }
		:
	(typeof _VirtualDom_doc.webkitHidden !== 'undefined')
		? { hidden: 'webkitHidden', change: 'webkitvisibilitychange' }
		: { hidden: 'hidden', change: 'visibilitychange' };
}



// ANIMATION FRAMES


function _Browser_rAF()
{
	return _Scheduler_binding(function(callback)
	{
		var id = _Browser_requestAnimationFrame(function() {
			callback(_Scheduler_succeed(Date.now()));
		});

		return function() {
			_Browser_cancelAnimationFrame(id);
		};
	});
}


function _Browser_now()
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(Date.now()));
	});
}



// DOM STUFF


function _Browser_withNode(id, doStuff)
{
	return _Scheduler_binding(function(callback)
	{
		_Browser_requestAnimationFrame(function() {
			var node = document.getElementById(id);
			callback(node
				? _Scheduler_succeed(doStuff(node))
				: _Scheduler_fail($elm$browser$Browser$Dom$NotFound(id))
			);
		});
	});
}


function _Browser_withWindow(doStuff)
{
	return _Scheduler_binding(function(callback)
	{
		_Browser_requestAnimationFrame(function() {
			callback(_Scheduler_succeed(doStuff()));
		});
	});
}


// FOCUS and BLUR


var _Browser_call = F2(function(functionName, id)
{
	return _Browser_withNode(id, function(node) {
		node[functionName]();
		return _Utils_Tuple0;
	});
});



// WINDOW VIEWPORT


function _Browser_getViewport()
{
	return {
		scene: _Browser_getScene(),
		viewport: {
			x: _Browser_window.pageXOffset,
			y: _Browser_window.pageYOffset,
			width: _Browser_doc.documentElement.clientWidth,
			height: _Browser_doc.documentElement.clientHeight
		}
	};
}

function _Browser_getScene()
{
	var body = _Browser_doc.body;
	var elem = _Browser_doc.documentElement;
	return {
		width: Math.max(body.scrollWidth, body.offsetWidth, elem.scrollWidth, elem.offsetWidth, elem.clientWidth),
		height: Math.max(body.scrollHeight, body.offsetHeight, elem.scrollHeight, elem.offsetHeight, elem.clientHeight)
	};
}

var _Browser_setViewport = F2(function(x, y)
{
	return _Browser_withWindow(function()
	{
		_Browser_window.scroll(x, y);
		return _Utils_Tuple0;
	});
});



// ELEMENT VIEWPORT


function _Browser_getViewportOf(id)
{
	return _Browser_withNode(id, function(node)
	{
		return {
			scene: {
				width: node.scrollWidth,
				height: node.scrollHeight
			},
			viewport: {
				x: node.scrollLeft,
				y: node.scrollTop,
				width: node.clientWidth,
				height: node.clientHeight
			}
		};
	});
}


var _Browser_setViewportOf = F3(function(id, x, y)
{
	return _Browser_withNode(id, function(node)
	{
		node.scrollLeft = x;
		node.scrollTop = y;
		return _Utils_Tuple0;
	});
});



// ELEMENT


function _Browser_getElement(id)
{
	return _Browser_withNode(id, function(node)
	{
		var rect = node.getBoundingClientRect();
		var x = _Browser_window.pageXOffset;
		var y = _Browser_window.pageYOffset;
		return {
			scene: _Browser_getScene(),
			viewport: {
				x: x,
				y: y,
				width: _Browser_doc.documentElement.clientWidth,
				height: _Browser_doc.documentElement.clientHeight
			},
			element: {
				x: x + rect.left,
				y: y + rect.top,
				width: rect.width,
				height: rect.height
			}
		};
	});
}



// LOAD and RELOAD


function _Browser_reload(skipCache)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function(callback)
	{
		_VirtualDom_doc.location.reload(skipCache);
	}));
}

function _Browser_load(url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function(callback)
	{
		try
		{
			_Browser_window.location = url;
		}
		catch(err)
		{
			// Only Firefox can throw a NS_ERROR_MALFORMED_URI exception here.
			// Other browsers reload the page, so let's be consistent about that.
			_VirtualDom_doc.location.reload(false);
		}
	}));
}



function _Time_now(millisToPosix)
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(millisToPosix(Date.now())));
	});
}

var _Time_setInterval = F2(function(interval, task)
{
	return _Scheduler_binding(function(callback)
	{
		var id = setInterval(function() { _Scheduler_rawSpawn(task); }, interval);
		return function() { clearInterval(id); };
	});
});

function _Time_here()
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(
			A2($elm$time$Time$customZone, -(new Date().getTimezoneOffset()), _List_Nil)
		));
	});
}


function _Time_getZoneName()
{
	return _Scheduler_binding(function(callback)
	{
		try
		{
			var name = $elm$time$Time$Name(Intl.DateTimeFormat().resolvedOptions().timeZone);
		}
		catch (e)
		{
			var name = $elm$time$Time$Offset(new Date().getTimezoneOffset());
		}
		callback(_Scheduler_succeed(name));
	});
}



var _Bitwise_and = F2(function(a, b)
{
	return a & b;
});

var _Bitwise_or = F2(function(a, b)
{
	return a | b;
});

var _Bitwise_xor = F2(function(a, b)
{
	return a ^ b;
});

function _Bitwise_complement(a)
{
	return ~a;
};

var _Bitwise_shiftLeftBy = F2(function(offset, a)
{
	return a << offset;
});

var _Bitwise_shiftRightBy = F2(function(offset, a)
{
	return a >> offset;
});

var _Bitwise_shiftRightZfBy = F2(function(offset, a)
{
	return a >>> offset;
});



// DECODER

var _File_decoder = _Json_decodePrim(function(value) {
	// NOTE: checks if `File` exists in case this is run on node
	return (typeof File !== 'undefined' && value instanceof File)
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a FILE', value);
});


// METADATA

function _File_name(file) { return file.name; }
function _File_mime(file) { return file.type; }
function _File_size(file) { return file.size; }

function _File_lastModified(file)
{
	return $elm$time$Time$millisToPosix(file.lastModified);
}


// DOWNLOAD

var _File_downloadNode;

function _File_getDownloadNode()
{
	return _File_downloadNode || (_File_downloadNode = document.createElement('a'));
}

var _File_download = F3(function(name, mime, content)
{
	return _Scheduler_binding(function(callback)
	{
		var blob = new Blob([content], {type: mime});

		// for IE10+
		if (navigator.msSaveOrOpenBlob)
		{
			navigator.msSaveOrOpenBlob(blob, name);
			return;
		}

		// for HTML5
		var node = _File_getDownloadNode();
		var objectUrl = URL.createObjectURL(blob);
		node.href = objectUrl;
		node.download = name;
		_File_click(node);
		URL.revokeObjectURL(objectUrl);
	});
});

function _File_downloadUrl(href)
{
	return _Scheduler_binding(function(callback)
	{
		var node = _File_getDownloadNode();
		node.href = href;
		node.download = '';
		node.origin === location.origin || (node.target = '_blank');
		_File_click(node);
	});
}


// IE COMPATIBILITY

function _File_makeBytesSafeForInternetExplorer(bytes)
{
	// only needed by IE10 and IE11 to fix https://github.com/elm/file/issues/10
	// all other browsers can just run `new Blob([bytes])` directly with no problem
	//
	return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function _File_click(node)
{
	// only needed by IE10 and IE11 to fix https://github.com/elm/file/issues/11
	// all other browsers have MouseEvent and do not need this conditional stuff
	//
	if (typeof MouseEvent === 'function')
	{
		node.dispatchEvent(new MouseEvent('click'));
	}
	else
	{
		var event = document.createEvent('MouseEvents');
		event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		document.body.appendChild(node);
		node.dispatchEvent(event);
		document.body.removeChild(node);
	}
}


// UPLOAD

var _File_node;

function _File_uploadOne(mimes)
{
	return _Scheduler_binding(function(callback)
	{
		_File_node = document.createElement('input');
		_File_node.type = 'file';
		_File_node.accept = A2($elm$core$String$join, ',', mimes);
		_File_node.addEventListener('change', function(event)
		{
			callback(_Scheduler_succeed(event.target.files[0]));
		});
		_File_click(_File_node);
	});
}

function _File_uploadOneOrMore(mimes)
{
	return _Scheduler_binding(function(callback)
	{
		_File_node = document.createElement('input');
		_File_node.type = 'file';
		_File_node.multiple = true;
		_File_node.accept = A2($elm$core$String$join, ',', mimes);
		_File_node.addEventListener('change', function(event)
		{
			var elmFiles = _List_fromArray(event.target.files);
			callback(_Scheduler_succeed(_Utils_Tuple2(elmFiles.a, elmFiles.b)));
		});
		_File_click(_File_node);
	});
}


// CONTENT

function _File_toString(blob)
{
	return _Scheduler_binding(function(callback)
	{
		var reader = new FileReader();
		reader.addEventListener('loadend', function() {
			callback(_Scheduler_succeed(reader.result));
		});
		reader.readAsText(blob);
		return function() { reader.abort(); };
	});
}

function _File_toBytes(blob)
{
	return _Scheduler_binding(function(callback)
	{
		var reader = new FileReader();
		reader.addEventListener('loadend', function() {
			callback(_Scheduler_succeed(new DataView(reader.result)));
		});
		reader.readAsArrayBuffer(blob);
		return function() { reader.abort(); };
	});
}

function _File_toUrl(blob)
{
	return _Scheduler_binding(function(callback)
	{
		var reader = new FileReader();
		reader.addEventListener('loadend', function() {
			callback(_Scheduler_succeed(reader.result));
		});
		reader.readAsDataURL(blob);
		return function() { reader.abort(); };
	});
}





// STRINGS


var _Parser_isSubString = F5(function(smallString, offset, row, col, bigString)
{
	var smallLength = smallString.length;
	var isGood = offset + smallLength <= bigString.length;

	for (var i = 0; isGood && i < smallLength; )
	{
		var code = bigString.charCodeAt(offset);
		isGood =
			smallString[i++] === bigString[offset++]
			&& (
				code === 0x000A /* \n */
					? ( row++, col=1 )
					: ( col++, (code & 0xF800) === 0xD800 ? smallString[i++] === bigString[offset++] : 1 )
			)
	}

	return _Utils_Tuple3(isGood ? offset : -1, row, col);
});



// CHARS


var _Parser_isSubChar = F3(function(predicate, offset, string)
{
	return (
		string.length <= offset
			? -1
			:
		(string.charCodeAt(offset) & 0xF800) === 0xD800
			? (predicate(_Utils_chr(string.substr(offset, 2))) ? offset + 2 : -1)
			:
		(predicate(_Utils_chr(string[offset]))
			? ((string[offset] === '\n') ? -2 : (offset + 1))
			: -1
		)
	);
});


var _Parser_isAsciiCode = F3(function(code, offset, string)
{
	return string.charCodeAt(offset) === code;
});



// NUMBERS


var _Parser_chompBase10 = F2(function(offset, string)
{
	for (; offset < string.length; offset++)
	{
		var code = string.charCodeAt(offset);
		if (code < 0x30 || 0x39 < code)
		{
			return offset;
		}
	}
	return offset;
});


var _Parser_consumeBase = F3(function(base, offset, string)
{
	for (var total = 0; offset < string.length; offset++)
	{
		var digit = string.charCodeAt(offset) - 0x30;
		if (digit < 0 || base <= digit) break;
		total = base * total + digit;
	}
	return _Utils_Tuple2(offset, total);
});


var _Parser_consumeBase16 = F2(function(offset, string)
{
	for (var total = 0; offset < string.length; offset++)
	{
		var code = string.charCodeAt(offset);
		if (0x30 <= code && code <= 0x39)
		{
			total = 16 * total + code - 0x30;
		}
		else if (0x41 <= code && code <= 0x46)
		{
			total = 16 * total + code - 55;
		}
		else if (0x61 <= code && code <= 0x66)
		{
			total = 16 * total + code - 87;
		}
		else
		{
			break;
		}
	}
	return _Utils_Tuple2(offset, total);
});



// FIND STRING


var _Parser_findSubString = F5(function(smallString, offset, row, col, bigString)
{
	var newOffset = bigString.indexOf(smallString, offset);
	var target = newOffset < 0 ? bigString.length : newOffset + smallString.length;

	while (offset < target)
	{
		var code = bigString.charCodeAt(offset++);
		code === 0x000A /* \n */
			? ( col=1, row++ )
			: ( col++, (code & 0xF800) === 0xD800 && offset++ )
	}

	return _Utils_Tuple3(newOffset, row, col);
});


function _Url_percentEncode(string)
{
	return encodeURIComponent(string);
}

function _Url_percentDecode(string)
{
	try
	{
		return $elm$core$Maybe$Just(decodeURIComponent(string));
	}
	catch (e)
	{
		return $elm$core$Maybe$Nothing;
	}
}var $author$project$Main$UrlChanged = function (a) {
	return {$: 'UrlChanged', a: a};
};
var $author$project$Main$UrlRequested = function (a) {
	return {$: 'UrlRequested', a: a};
};
var $elm$core$List$cons = _List_cons;
var $elm$core$Elm$JsArray$foldr = _JsArray_foldr;
var $elm$core$Array$foldr = F3(
	function (func, baseCase, _v0) {
		var tree = _v0.c;
		var tail = _v0.d;
		var helper = F2(
			function (node, acc) {
				if (node.$ === 'SubTree') {
					var subTree = node.a;
					return A3($elm$core$Elm$JsArray$foldr, helper, acc, subTree);
				} else {
					var values = node.a;
					return A3($elm$core$Elm$JsArray$foldr, func, acc, values);
				}
			});
		return A3(
			$elm$core$Elm$JsArray$foldr,
			helper,
			A3($elm$core$Elm$JsArray$foldr, func, baseCase, tail),
			tree);
	});
var $elm$core$Array$toList = function (array) {
	return A3($elm$core$Array$foldr, $elm$core$List$cons, _List_Nil, array);
};
var $elm$core$Dict$foldr = F3(
	function (func, acc, t) {
		foldr:
		while (true) {
			if (t.$ === 'RBEmpty_elm_builtin') {
				return acc;
			} else {
				var key = t.b;
				var value = t.c;
				var left = t.d;
				var right = t.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldr, func, acc, right)),
					$temp$t = left;
				func = $temp$func;
				acc = $temp$acc;
				t = $temp$t;
				continue foldr;
			}
		}
	});
var $elm$core$Dict$toList = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, list) {
				return A2(
					$elm$core$List$cons,
					_Utils_Tuple2(key, value),
					list);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Dict$keys = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, keyList) {
				return A2($elm$core$List$cons, key, keyList);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Set$toList = function (_v0) {
	var dict = _v0.a;
	return $elm$core$Dict$keys(dict);
};
var $elm$core$Basics$EQ = {$: 'EQ'};
var $elm$core$Basics$GT = {$: 'GT'};
var $elm$core$Basics$LT = {$: 'LT'};
var $elm$core$Result$Err = function (a) {
	return {$: 'Err', a: a};
};
var $elm$json$Json$Decode$Failure = F2(
	function (a, b) {
		return {$: 'Failure', a: a, b: b};
	});
var $elm$json$Json$Decode$Field = F2(
	function (a, b) {
		return {$: 'Field', a: a, b: b};
	});
var $elm$json$Json$Decode$Index = F2(
	function (a, b) {
		return {$: 'Index', a: a, b: b};
	});
var $elm$core$Result$Ok = function (a) {
	return {$: 'Ok', a: a};
};
var $elm$json$Json$Decode$OneOf = function (a) {
	return {$: 'OneOf', a: a};
};
var $elm$core$Basics$False = {$: 'False'};
var $elm$core$Basics$add = _Basics_add;
var $elm$core$Maybe$Just = function (a) {
	return {$: 'Just', a: a};
};
var $elm$core$Maybe$Nothing = {$: 'Nothing'};
var $elm$core$String$all = _String_all;
var $elm$core$Basics$and = _Basics_and;
var $elm$core$Basics$append = _Utils_append;
var $elm$json$Json$Encode$encode = _Json_encode;
var $elm$core$String$fromInt = _String_fromNumber;
var $elm$core$String$join = F2(
	function (sep, chunks) {
		return A2(
			_String_join,
			sep,
			_List_toArray(chunks));
	});
var $elm$core$String$split = F2(
	function (sep, string) {
		return _List_fromArray(
			A2(_String_split, sep, string));
	});
var $elm$json$Json$Decode$indent = function (str) {
	return A2(
		$elm$core$String$join,
		'\n    ',
		A2($elm$core$String$split, '\n', str));
};
var $elm$core$List$foldl = F3(
	function (func, acc, list) {
		foldl:
		while (true) {
			if (!list.b) {
				return acc;
			} else {
				var x = list.a;
				var xs = list.b;
				var $temp$func = func,
					$temp$acc = A2(func, x, acc),
					$temp$list = xs;
				func = $temp$func;
				acc = $temp$acc;
				list = $temp$list;
				continue foldl;
			}
		}
	});
var $elm$core$List$length = function (xs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, i) {
				return i + 1;
			}),
		0,
		xs);
};
var $elm$core$List$map2 = _List_map2;
var $elm$core$Basics$le = _Utils_le;
var $elm$core$Basics$sub = _Basics_sub;
var $elm$core$List$rangeHelp = F3(
	function (lo, hi, list) {
		rangeHelp:
		while (true) {
			if (_Utils_cmp(lo, hi) < 1) {
				var $temp$lo = lo,
					$temp$hi = hi - 1,
					$temp$list = A2($elm$core$List$cons, hi, list);
				lo = $temp$lo;
				hi = $temp$hi;
				list = $temp$list;
				continue rangeHelp;
			} else {
				return list;
			}
		}
	});
var $elm$core$List$range = F2(
	function (lo, hi) {
		return A3($elm$core$List$rangeHelp, lo, hi, _List_Nil);
	});
var $elm$core$List$indexedMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$map2,
			f,
			A2(
				$elm$core$List$range,
				0,
				$elm$core$List$length(xs) - 1),
			xs);
	});
var $elm$core$Char$toCode = _Char_toCode;
var $elm$core$Char$isLower = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (97 <= code) && (code <= 122);
};
var $elm$core$Char$isUpper = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 90) && (65 <= code);
};
var $elm$core$Basics$or = _Basics_or;
var $elm$core$Char$isAlpha = function (_char) {
	return $elm$core$Char$isLower(_char) || $elm$core$Char$isUpper(_char);
};
var $elm$core$Char$isDigit = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 57) && (48 <= code);
};
var $elm$core$Char$isAlphaNum = function (_char) {
	return $elm$core$Char$isLower(_char) || ($elm$core$Char$isUpper(_char) || $elm$core$Char$isDigit(_char));
};
var $elm$core$List$reverse = function (list) {
	return A3($elm$core$List$foldl, $elm$core$List$cons, _List_Nil, list);
};
var $elm$core$String$uncons = _String_uncons;
var $elm$json$Json$Decode$errorOneOf = F2(
	function (i, error) {
		return '\n\n(' + ($elm$core$String$fromInt(i + 1) + (') ' + $elm$json$Json$Decode$indent(
			$elm$json$Json$Decode$errorToString(error))));
	});
var $elm$json$Json$Decode$errorToString = function (error) {
	return A2($elm$json$Json$Decode$errorToStringHelp, error, _List_Nil);
};
var $elm$json$Json$Decode$errorToStringHelp = F2(
	function (error, context) {
		errorToStringHelp:
		while (true) {
			switch (error.$) {
				case 'Field':
					var f = error.a;
					var err = error.b;
					var isSimple = function () {
						var _v1 = $elm$core$String$uncons(f);
						if (_v1.$ === 'Nothing') {
							return false;
						} else {
							var _v2 = _v1.a;
							var _char = _v2.a;
							var rest = _v2.b;
							return $elm$core$Char$isAlpha(_char) && A2($elm$core$String$all, $elm$core$Char$isAlphaNum, rest);
						}
					}();
					var fieldName = isSimple ? ('.' + f) : ('[\'' + (f + '\']'));
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, fieldName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 'Index':
					var i = error.a;
					var err = error.b;
					var indexName = '[' + ($elm$core$String$fromInt(i) + ']');
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, indexName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 'OneOf':
					var errors = error.a;
					if (!errors.b) {
						return 'Ran into a Json.Decode.oneOf with no possibilities' + function () {
							if (!context.b) {
								return '!';
							} else {
								return ' at json' + A2(
									$elm$core$String$join,
									'',
									$elm$core$List$reverse(context));
							}
						}();
					} else {
						if (!errors.b.b) {
							var err = errors.a;
							var $temp$error = err,
								$temp$context = context;
							error = $temp$error;
							context = $temp$context;
							continue errorToStringHelp;
						} else {
							var starter = function () {
								if (!context.b) {
									return 'Json.Decode.oneOf';
								} else {
									return 'The Json.Decode.oneOf at json' + A2(
										$elm$core$String$join,
										'',
										$elm$core$List$reverse(context));
								}
							}();
							var introduction = starter + (' failed in the following ' + ($elm$core$String$fromInt(
								$elm$core$List$length(errors)) + ' ways:'));
							return A2(
								$elm$core$String$join,
								'\n\n',
								A2(
									$elm$core$List$cons,
									introduction,
									A2($elm$core$List$indexedMap, $elm$json$Json$Decode$errorOneOf, errors)));
						}
					}
				default:
					var msg = error.a;
					var json = error.b;
					var introduction = function () {
						if (!context.b) {
							return 'Problem with the given value:\n\n';
						} else {
							return 'Problem with the value at json' + (A2(
								$elm$core$String$join,
								'',
								$elm$core$List$reverse(context)) + ':\n\n    ');
						}
					}();
					return introduction + ($elm$json$Json$Decode$indent(
						A2($elm$json$Json$Encode$encode, 4, json)) + ('\n\n' + msg));
			}
		}
	});
var $elm$core$Array$branchFactor = 32;
var $elm$core$Array$Array_elm_builtin = F4(
	function (a, b, c, d) {
		return {$: 'Array_elm_builtin', a: a, b: b, c: c, d: d};
	});
var $elm$core$Elm$JsArray$empty = _JsArray_empty;
var $elm$core$Basics$ceiling = _Basics_ceiling;
var $elm$core$Basics$fdiv = _Basics_fdiv;
var $elm$core$Basics$logBase = F2(
	function (base, number) {
		return _Basics_log(number) / _Basics_log(base);
	});
var $elm$core$Basics$toFloat = _Basics_toFloat;
var $elm$core$Array$shiftStep = $elm$core$Basics$ceiling(
	A2($elm$core$Basics$logBase, 2, $elm$core$Array$branchFactor));
var $elm$core$Array$empty = A4($elm$core$Array$Array_elm_builtin, 0, $elm$core$Array$shiftStep, $elm$core$Elm$JsArray$empty, $elm$core$Elm$JsArray$empty);
var $elm$core$Elm$JsArray$initialize = _JsArray_initialize;
var $elm$core$Array$Leaf = function (a) {
	return {$: 'Leaf', a: a};
};
var $elm$core$Basics$apL = F2(
	function (f, x) {
		return f(x);
	});
var $elm$core$Basics$apR = F2(
	function (x, f) {
		return f(x);
	});
var $elm$core$Basics$eq = _Utils_equal;
var $elm$core$Basics$floor = _Basics_floor;
var $elm$core$Elm$JsArray$length = _JsArray_length;
var $elm$core$Basics$gt = _Utils_gt;
var $elm$core$Basics$max = F2(
	function (x, y) {
		return (_Utils_cmp(x, y) > 0) ? x : y;
	});
var $elm$core$Basics$mul = _Basics_mul;
var $elm$core$Array$SubTree = function (a) {
	return {$: 'SubTree', a: a};
};
var $elm$core$Elm$JsArray$initializeFromList = _JsArray_initializeFromList;
var $elm$core$Array$compressNodes = F2(
	function (nodes, acc) {
		compressNodes:
		while (true) {
			var _v0 = A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodes);
			var node = _v0.a;
			var remainingNodes = _v0.b;
			var newAcc = A2(
				$elm$core$List$cons,
				$elm$core$Array$SubTree(node),
				acc);
			if (!remainingNodes.b) {
				return $elm$core$List$reverse(newAcc);
			} else {
				var $temp$nodes = remainingNodes,
					$temp$acc = newAcc;
				nodes = $temp$nodes;
				acc = $temp$acc;
				continue compressNodes;
			}
		}
	});
var $elm$core$Tuple$first = function (_v0) {
	var x = _v0.a;
	return x;
};
var $elm$core$Array$treeFromBuilder = F2(
	function (nodeList, nodeListSize) {
		treeFromBuilder:
		while (true) {
			var newNodeSize = $elm$core$Basics$ceiling(nodeListSize / $elm$core$Array$branchFactor);
			if (newNodeSize === 1) {
				return A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodeList).a;
			} else {
				var $temp$nodeList = A2($elm$core$Array$compressNodes, nodeList, _List_Nil),
					$temp$nodeListSize = newNodeSize;
				nodeList = $temp$nodeList;
				nodeListSize = $temp$nodeListSize;
				continue treeFromBuilder;
			}
		}
	});
var $elm$core$Array$builderToArray = F2(
	function (reverseNodeList, builder) {
		if (!builder.nodeListSize) {
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.tail),
				$elm$core$Array$shiftStep,
				$elm$core$Elm$JsArray$empty,
				builder.tail);
		} else {
			var treeLen = builder.nodeListSize * $elm$core$Array$branchFactor;
			var depth = $elm$core$Basics$floor(
				A2($elm$core$Basics$logBase, $elm$core$Array$branchFactor, treeLen - 1));
			var correctNodeList = reverseNodeList ? $elm$core$List$reverse(builder.nodeList) : builder.nodeList;
			var tree = A2($elm$core$Array$treeFromBuilder, correctNodeList, builder.nodeListSize);
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.tail) + treeLen,
				A2($elm$core$Basics$max, 5, depth * $elm$core$Array$shiftStep),
				tree,
				builder.tail);
		}
	});
var $elm$core$Basics$idiv = _Basics_idiv;
var $elm$core$Basics$lt = _Utils_lt;
var $elm$core$Array$initializeHelp = F5(
	function (fn, fromIndex, len, nodeList, tail) {
		initializeHelp:
		while (true) {
			if (fromIndex < 0) {
				return A2(
					$elm$core$Array$builderToArray,
					false,
					{nodeList: nodeList, nodeListSize: (len / $elm$core$Array$branchFactor) | 0, tail: tail});
			} else {
				var leaf = $elm$core$Array$Leaf(
					A3($elm$core$Elm$JsArray$initialize, $elm$core$Array$branchFactor, fromIndex, fn));
				var $temp$fn = fn,
					$temp$fromIndex = fromIndex - $elm$core$Array$branchFactor,
					$temp$len = len,
					$temp$nodeList = A2($elm$core$List$cons, leaf, nodeList),
					$temp$tail = tail;
				fn = $temp$fn;
				fromIndex = $temp$fromIndex;
				len = $temp$len;
				nodeList = $temp$nodeList;
				tail = $temp$tail;
				continue initializeHelp;
			}
		}
	});
var $elm$core$Basics$remainderBy = _Basics_remainderBy;
var $elm$core$Array$initialize = F2(
	function (len, fn) {
		if (len <= 0) {
			return $elm$core$Array$empty;
		} else {
			var tailLen = len % $elm$core$Array$branchFactor;
			var tail = A3($elm$core$Elm$JsArray$initialize, tailLen, len - tailLen, fn);
			var initialFromIndex = (len - tailLen) - $elm$core$Array$branchFactor;
			return A5($elm$core$Array$initializeHelp, fn, initialFromIndex, len, _List_Nil, tail);
		}
	});
var $elm$core$Basics$True = {$: 'True'};
var $elm$core$Result$isOk = function (result) {
	if (result.$ === 'Ok') {
		return true;
	} else {
		return false;
	}
};
var $elm$json$Json$Decode$andThen = _Json_andThen;
var $elm$json$Json$Decode$map = _Json_map1;
var $elm$json$Json$Decode$map2 = _Json_map2;
var $elm$json$Json$Decode$succeed = _Json_succeed;
var $elm$virtual_dom$VirtualDom$toHandlerInt = function (handler) {
	switch (handler.$) {
		case 'Normal':
			return 0;
		case 'MayStopPropagation':
			return 1;
		case 'MayPreventDefault':
			return 2;
		default:
			return 3;
	}
};
var $elm$browser$Browser$External = function (a) {
	return {$: 'External', a: a};
};
var $elm$browser$Browser$Internal = function (a) {
	return {$: 'Internal', a: a};
};
var $elm$core$Basics$identity = function (x) {
	return x;
};
var $elm$browser$Browser$Dom$NotFound = function (a) {
	return {$: 'NotFound', a: a};
};
var $elm$url$Url$Http = {$: 'Http'};
var $elm$url$Url$Https = {$: 'Https'};
var $elm$url$Url$Url = F6(
	function (protocol, host, port_, path, query, fragment) {
		return {fragment: fragment, host: host, path: path, port_: port_, protocol: protocol, query: query};
	});
var $elm$core$String$contains = _String_contains;
var $elm$core$String$length = _String_length;
var $elm$core$String$slice = _String_slice;
var $elm$core$String$dropLeft = F2(
	function (n, string) {
		return (n < 1) ? string : A3(
			$elm$core$String$slice,
			n,
			$elm$core$String$length(string),
			string);
	});
var $elm$core$String$indexes = _String_indexes;
var $elm$core$String$isEmpty = function (string) {
	return string === '';
};
var $elm$core$String$left = F2(
	function (n, string) {
		return (n < 1) ? '' : A3($elm$core$String$slice, 0, n, string);
	});
var $elm$core$String$toInt = _String_toInt;
var $elm$url$Url$chompBeforePath = F5(
	function (protocol, path, params, frag, str) {
		if ($elm$core$String$isEmpty(str) || A2($elm$core$String$contains, '@', str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, ':', str);
			if (!_v0.b) {
				return $elm$core$Maybe$Just(
					A6($elm$url$Url$Url, protocol, str, $elm$core$Maybe$Nothing, path, params, frag));
			} else {
				if (!_v0.b.b) {
					var i = _v0.a;
					var _v1 = $elm$core$String$toInt(
						A2($elm$core$String$dropLeft, i + 1, str));
					if (_v1.$ === 'Nothing') {
						return $elm$core$Maybe$Nothing;
					} else {
						var port_ = _v1;
						return $elm$core$Maybe$Just(
							A6(
								$elm$url$Url$Url,
								protocol,
								A2($elm$core$String$left, i, str),
								port_,
								path,
								params,
								frag));
					}
				} else {
					return $elm$core$Maybe$Nothing;
				}
			}
		}
	});
var $elm$url$Url$chompBeforeQuery = F4(
	function (protocol, params, frag, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '/', str);
			if (!_v0.b) {
				return A5($elm$url$Url$chompBeforePath, protocol, '/', params, frag, str);
			} else {
				var i = _v0.a;
				return A5(
					$elm$url$Url$chompBeforePath,
					protocol,
					A2($elm$core$String$dropLeft, i, str),
					params,
					frag,
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$url$Url$chompBeforeFragment = F3(
	function (protocol, frag, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '?', str);
			if (!_v0.b) {
				return A4($elm$url$Url$chompBeforeQuery, protocol, $elm$core$Maybe$Nothing, frag, str);
			} else {
				var i = _v0.a;
				return A4(
					$elm$url$Url$chompBeforeQuery,
					protocol,
					$elm$core$Maybe$Just(
						A2($elm$core$String$dropLeft, i + 1, str)),
					frag,
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$url$Url$chompAfterProtocol = F2(
	function (protocol, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '#', str);
			if (!_v0.b) {
				return A3($elm$url$Url$chompBeforeFragment, protocol, $elm$core$Maybe$Nothing, str);
			} else {
				var i = _v0.a;
				return A3(
					$elm$url$Url$chompBeforeFragment,
					protocol,
					$elm$core$Maybe$Just(
						A2($elm$core$String$dropLeft, i + 1, str)),
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$core$String$startsWith = _String_startsWith;
var $elm$url$Url$fromString = function (str) {
	return A2($elm$core$String$startsWith, 'http://', str) ? A2(
		$elm$url$Url$chompAfterProtocol,
		$elm$url$Url$Http,
		A2($elm$core$String$dropLeft, 7, str)) : (A2($elm$core$String$startsWith, 'https://', str) ? A2(
		$elm$url$Url$chompAfterProtocol,
		$elm$url$Url$Https,
		A2($elm$core$String$dropLeft, 8, str)) : $elm$core$Maybe$Nothing);
};
var $elm$core$Basics$never = function (_v0) {
	never:
	while (true) {
		var nvr = _v0.a;
		var $temp$_v0 = nvr;
		_v0 = $temp$_v0;
		continue never;
	}
};
var $elm$core$Task$Perform = function (a) {
	return {$: 'Perform', a: a};
};
var $elm$core$Task$succeed = _Scheduler_succeed;
var $elm$core$Task$init = $elm$core$Task$succeed(_Utils_Tuple0);
var $elm$core$List$foldrHelper = F4(
	function (fn, acc, ctr, ls) {
		if (!ls.b) {
			return acc;
		} else {
			var a = ls.a;
			var r1 = ls.b;
			if (!r1.b) {
				return A2(fn, a, acc);
			} else {
				var b = r1.a;
				var r2 = r1.b;
				if (!r2.b) {
					return A2(
						fn,
						a,
						A2(fn, b, acc));
				} else {
					var c = r2.a;
					var r3 = r2.b;
					if (!r3.b) {
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(fn, c, acc)));
					} else {
						var d = r3.a;
						var r4 = r3.b;
						var res = (ctr > 500) ? A3(
							$elm$core$List$foldl,
							fn,
							acc,
							$elm$core$List$reverse(r4)) : A4($elm$core$List$foldrHelper, fn, acc, ctr + 1, r4);
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(
									fn,
									c,
									A2(fn, d, res))));
					}
				}
			}
		}
	});
var $elm$core$List$foldr = F3(
	function (fn, acc, ls) {
		return A4($elm$core$List$foldrHelper, fn, acc, 0, ls);
	});
var $elm$core$List$map = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, acc) {
					return A2(
						$elm$core$List$cons,
						f(x),
						acc);
				}),
			_List_Nil,
			xs);
	});
var $elm$core$Task$andThen = _Scheduler_andThen;
var $elm$core$Task$map = F2(
	function (func, taskA) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return $elm$core$Task$succeed(
					func(a));
			},
			taskA);
	});
var $elm$core$Task$map2 = F3(
	function (func, taskA, taskB) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return A2(
					$elm$core$Task$andThen,
					function (b) {
						return $elm$core$Task$succeed(
							A2(func, a, b));
					},
					taskB);
			},
			taskA);
	});
var $elm$core$Task$sequence = function (tasks) {
	return A3(
		$elm$core$List$foldr,
		$elm$core$Task$map2($elm$core$List$cons),
		$elm$core$Task$succeed(_List_Nil),
		tasks);
};
var $elm$core$Platform$sendToApp = _Platform_sendToApp;
var $elm$core$Task$spawnCmd = F2(
	function (router, _v0) {
		var task = _v0.a;
		return _Scheduler_spawn(
			A2(
				$elm$core$Task$andThen,
				$elm$core$Platform$sendToApp(router),
				task));
	});
var $elm$core$Task$onEffects = F3(
	function (router, commands, state) {
		return A2(
			$elm$core$Task$map,
			function (_v0) {
				return _Utils_Tuple0;
			},
			$elm$core$Task$sequence(
				A2(
					$elm$core$List$map,
					$elm$core$Task$spawnCmd(router),
					commands)));
	});
var $elm$core$Task$onSelfMsg = F3(
	function (_v0, _v1, _v2) {
		return $elm$core$Task$succeed(_Utils_Tuple0);
	});
var $elm$core$Task$cmdMap = F2(
	function (tagger, _v0) {
		var task = _v0.a;
		return $elm$core$Task$Perform(
			A2($elm$core$Task$map, tagger, task));
	});
_Platform_effectManagers['Task'] = _Platform_createManager($elm$core$Task$init, $elm$core$Task$onEffects, $elm$core$Task$onSelfMsg, $elm$core$Task$cmdMap);
var $elm$core$Task$command = _Platform_leaf('Task');
var $elm$core$Task$perform = F2(
	function (toMessage, task) {
		return $elm$core$Task$command(
			$elm$core$Task$Perform(
				A2($elm$core$Task$map, toMessage, task)));
	});
var $elm$browser$Browser$application = _Browser_application;
var $elm$json$Json$Decode$field = _Json_decodeField;
var $author$project$Main$DbLoaded = function (a) {
	return {$: 'DbLoaded', a: a};
};
var $author$project$Main$Initializing = function (a) {
	return {$: 'Initializing', a: a};
};
var $author$project$Main$TimeZoneFound = function (a) {
	return {$: 'TimeZoneFound', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Error = function (a) {
	return {$: 'Error', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Success = function (a) {
	return {$: 'Success', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$UnexpectedError = function (a) {
	return {$: 'UnexpectedError', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$get = function (_v0) {
	var id = _v0.a;
	return $elm$core$String$fromInt(id);
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$currentAttemptId = function (_v0) {
	var pool_ = _v0.a;
	var _v1 = pool_.poolId;
	if (_v1.$ === 'Just') {
		var id = _v1.a;
		return $elm$core$String$fromInt(id) + (':' + $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$get(pool_.attemptIds));
	} else {
		return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$get(pool_.attemptIds);
	}
};
var $elm$core$Dict$RBEmpty_elm_builtin = {$: 'RBEmpty_elm_builtin'};
var $elm$core$Dict$empty = $elm$core$Dict$RBEmpty_elm_builtin;
var $elm$core$Set$Set_elm_builtin = function (a) {
	return {$: 'Set_elm_builtin', a: a};
};
var $elm$core$Set$empty = $elm$core$Set$Set_elm_builtin($elm$core$Dict$empty);
var $elm$core$Elm$JsArray$foldl = _JsArray_foldl;
var $elm$core$Array$foldl = F3(
	function (func, baseCase, _v0) {
		var tree = _v0.c;
		var tail = _v0.d;
		var helper = F2(
			function (node, acc) {
				if (node.$ === 'SubTree') {
					var subTree = node.a;
					return A3($elm$core$Elm$JsArray$foldl, helper, acc, subTree);
				} else {
					var values = node.a;
					return A3($elm$core$Elm$JsArray$foldl, func, acc, values);
				}
			});
		return A3(
			$elm$core$Elm$JsArray$foldl,
			func,
			A3($elm$core$Elm$JsArray$foldl, helper, baseCase, tree),
			tail);
	});
var $elm$json$Json$Encode$array = F2(
	function (func, entries) {
		return _Json_wrap(
			A3(
				$elm$core$Array$foldl,
				_Json_addEntry(func),
				_Json_emptyArray(_Utils_Tuple0),
				entries));
	});
var $elm$json$Json$Encode$object = function (pairs) {
	return _Json_wrap(
		A3(
			$elm$core$List$foldl,
			F2(
				function (_v0, obj) {
					var k = _v0.a;
					var v = _v0.b;
					return A3(_Json_addField, k, v, obj);
				}),
			_Json_emptyObject(_Utils_Tuple0),
			pairs));
};
var $elm$json$Json$Encode$string = _Json_wrap;
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$encodeDefinitions = function (attemptId) {
	return $elm$json$Json$Encode$array(
		function (def) {
			return $elm$json$Json$Encode$object(
				_List_fromArray(
					[
						_Utils_Tuple2(
						'attemptId',
						$elm$json$Json$Encode$string(attemptId)),
						_Utils_Tuple2(
						'taskId',
						$elm$json$Json$Encode$string(def.taskId)),
						_Utils_Tuple2(
						'function',
						$elm$json$Json$Encode$string(def._function)),
						_Utils_Tuple2('args', def.args)
					]));
		});
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$Sequence = function (a) {
	return {$: 'Sequence', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$init = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$Sequence(0);
var $elm$core$Dict$Black = {$: 'Black'};
var $elm$core$Dict$RBNode_elm_builtin = F5(
	function (a, b, c, d, e) {
		return {$: 'RBNode_elm_builtin', a: a, b: b, c: c, d: d, e: e};
	});
var $elm$core$Dict$Red = {$: 'Red'};
var $elm$core$Dict$balance = F5(
	function (color, key, value, left, right) {
		if ((right.$ === 'RBNode_elm_builtin') && (right.a.$ === 'Red')) {
			var _v1 = right.a;
			var rK = right.b;
			var rV = right.c;
			var rLeft = right.d;
			var rRight = right.e;
			if ((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) {
				var _v3 = left.a;
				var lK = left.b;
				var lV = left.c;
				var lLeft = left.d;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Red,
					key,
					value,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					color,
					rK,
					rV,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, left, rLeft),
					rRight);
			}
		} else {
			if ((((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) && (left.d.$ === 'RBNode_elm_builtin')) && (left.d.a.$ === 'Red')) {
				var _v5 = left.a;
				var lK = left.b;
				var lV = left.c;
				var _v6 = left.d;
				var _v7 = _v6.a;
				var llK = _v6.b;
				var llV = _v6.c;
				var llLeft = _v6.d;
				var llRight = _v6.e;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Red,
					lK,
					lV,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, llK, llV, llLeft, llRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, key, value, lRight, right));
			} else {
				return A5($elm$core$Dict$RBNode_elm_builtin, color, key, value, left, right);
			}
		}
	});
var $elm$core$Basics$compare = _Utils_compare;
var $elm$core$Dict$insertHelp = F3(
	function (key, value, dict) {
		if (dict.$ === 'RBEmpty_elm_builtin') {
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, $elm$core$Dict$RBEmpty_elm_builtin, $elm$core$Dict$RBEmpty_elm_builtin);
		} else {
			var nColor = dict.a;
			var nKey = dict.b;
			var nValue = dict.c;
			var nLeft = dict.d;
			var nRight = dict.e;
			var _v1 = A2($elm$core$Basics$compare, key, nKey);
			switch (_v1.$) {
				case 'LT':
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						A3($elm$core$Dict$insertHelp, key, value, nLeft),
						nRight);
				case 'EQ':
					return A5($elm$core$Dict$RBNode_elm_builtin, nColor, nKey, value, nLeft, nRight);
				default:
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						nLeft,
						A3($elm$core$Dict$insertHelp, key, value, nRight));
			}
		}
	});
var $elm$core$Dict$insert = F3(
	function (key, value, dict) {
		var _v0 = A3($elm$core$Dict$insertHelp, key, value, dict);
		if ((_v0.$ === 'RBNode_elm_builtin') && (_v0.a.$ === 'Red')) {
			var _v1 = _v0.a;
			var k = _v0.b;
			var v = _v0.c;
			var l = _v0.d;
			var r = _v0.e;
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, k, v, l, r);
		} else {
			var x = _v0;
			return x;
		}
	});
var $elm$core$Set$insert = F2(
	function (key, _v0) {
		var dict = _v0.a;
		return $elm$core$Set$Set_elm_builtin(
			A3($elm$core$Dict$insert, key, _Utils_Tuple0, dict));
	});
var $elm$core$Set$fromList = function (list) {
	return A3($elm$core$List$foldl, $elm$core$Set$insert, $elm$core$Set$empty, list);
};
var $elm$core$Elm$JsArray$map = _JsArray_map;
var $elm$core$Array$map = F2(
	function (func, _v0) {
		var len = _v0.a;
		var startShift = _v0.b;
		var tree = _v0.c;
		var tail = _v0.d;
		var helper = function (node) {
			if (node.$ === 'SubTree') {
				var subTree = node.a;
				return $elm$core$Array$SubTree(
					A2($elm$core$Elm$JsArray$map, helper, subTree));
			} else {
				var values = node.a;
				return $elm$core$Array$Leaf(
					A2($elm$core$Elm$JsArray$map, func, values));
			}
		};
		return A4(
			$elm$core$Array$Array_elm_builtin,
			len,
			startShift,
			A2($elm$core$Elm$JsArray$map, helper, tree),
			A2($elm$core$Elm$JsArray$map, func, tail));
	});
var $elm$core$Dict$foldl = F3(
	function (func, acc, dict) {
		foldl:
		while (true) {
			if (dict.$ === 'RBEmpty_elm_builtin') {
				return acc;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldl, func, acc, left)),
					$temp$dict = right;
				func = $temp$func;
				acc = $temp$acc;
				dict = $temp$dict;
				continue foldl;
			}
		}
	});
var $elm$core$Dict$union = F2(
	function (t1, t2) {
		return A3($elm$core$Dict$foldl, $elm$core$Dict$insert, t2, t1);
	});
var $elm$core$Set$union = F2(
	function (_v0, _v1) {
		var dict1 = _v0.a;
		var dict2 = _v1.a;
		return $elm$core$Set$Set_elm_builtin(
			A2($elm$core$Dict$union, dict1, dict2));
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$recordSent = F2(
	function (defs, inFlight) {
		var sentIds = $elm$core$Set$fromList(
			$elm$core$Array$toList(
				A2(
					$elm$core$Array$map,
					function ($) {
						return $.taskId;
					},
					defs)));
		return A2($elm$core$Set$union, inFlight, sentIds);
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$sendResult = F2(
	function (onComplete, res) {
		return A2(
			$elm$core$Task$perform,
			onComplete,
			$elm$core$Task$succeed(res));
	});
var $elm$core$Basics$composeR = F3(
	function (f, g, x) {
		return g(
			f(x));
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Pool = function (a) {
	return {$: 'Pool', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$mapPool = F2(
	function (f, _v0) {
		var p = _v0.a;
		return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Pool(
			f(p));
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$next = function (_v0) {
	var id = _v0.a;
	return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$Sequence(id + 1);
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$nextAttemptId = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$mapPool(
	function (pool_) {
		return _Utils_update(
			pool_,
			{
				attemptIds: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$next(pool_.attemptIds)
			});
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$startAttempt = F2(
	function (id, progress) {
		return A2(
			$elm$core$Basics$composeR,
			$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$mapPool(
				function (pool_) {
					return _Utils_update(
						pool_,
						{
							attempts: A3($elm$core$Dict$insert, id, progress, pool_.attempts)
						});
				}),
			$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$nextAttemptId);
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$stepTask = F2(
	function (res, _v0) {
		var ids = _v0.a;
		var run = _v0.b.a;
		return A2(run, res, ids);
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$attempt = F2(
	function (attempt_, task) {
		var id = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$currentAttemptId(attempt_.pool);
		var _v0 = A2(
			$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$stepTask,
			$elm$core$Dict$empty,
			_Utils_Tuple2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$init, task));
		if (_v0.b.$ === 'Done') {
			var res = _v0.b.a;
			return _Utils_Tuple3(
				id,
				attempt_.pool,
				A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$sendResult, attempt_.onComplete, res));
		} else {
			var _v1 = _v0.b;
			var defs = _v1.a;
			var progress = {
				inFlight: A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$recordSent, defs, $elm$core$Set$empty),
				onComplete: attempt_.onComplete,
				task: _Utils_Tuple2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$init, task)
			};
			return _Utils_Tuple3(
				id,
				A3($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$startAttempt, id, progress, attempt_.pool),
				attempt_.send(
					A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$encodeDefinitions, id, defs)));
		}
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Done = function (a) {
	return {$: 'Done', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Pending = F2(
	function (a, b) {
		return {$: 'Pending', a: a, b: b};
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Task = function (a) {
	return {$: 'Task', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Error = function (a) {
	return {$: 'Error', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Success = function (a) {
	return {$: 'Success', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$UnexpectedError = function (a) {
	return {$: 'UnexpectedError', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$mapResponse = F2(
	function (f, res) {
		switch (res.$) {
			case 'Success':
				var a = res.a;
				return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Success(
					f(a));
			case 'Error':
				var e = res.a;
				return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Error(e);
			default:
				var e = res.a;
				return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$UnexpectedError(e);
		}
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$map = F2(
	function (f, _v0) {
		var run = _v0.a;
		return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Task(
			F2(
				function (result, ids) {
					var _v1 = A2(run, result, ids);
					var ids_ = _v1.a;
					var task = _v1.b;
					return _Utils_Tuple2(
						ids_,
						function () {
							if (task.$ === 'Pending') {
								var defs = task.a;
								var next = task.b;
								return A2(
									$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Pending,
									defs,
									A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$map, f, next));
							} else {
								var a = task.a;
								return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Done(
									A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$mapResponse, f, a));
							}
						}());
				}));
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$map = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$map;
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$onError = F2(
	function (f, _v0) {
		var run = _v0.a;
		return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Task(
			F2(
				function (res, ids) {
					var _v1 = A2(run, res, ids);
					var ids_ = _v1.a;
					var task = _v1.b;
					if (task.$ === 'Done') {
						var a = task.a;
						switch (a.$) {
							case 'Success':
								var a_ = a.a;
								return _Utils_Tuple2(
									ids_,
									$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Done(
										$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Success(a_)));
							case 'Error':
								var e = a.a;
								return A2(
									$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$stepTask,
									res,
									_Utils_Tuple2(
										ids_,
										f(e)));
							default:
								var e = a.a;
								return _Utils_Tuple2(
									ids_,
									$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Done(
										$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$UnexpectedError(e)));
						}
					} else {
						var defs = task.a;
						var next = task.b;
						return _Utils_Tuple2(
							ids_,
							A2(
								$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Pending,
								defs,
								A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$onError, f, next)));
					}
				}));
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$onError = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$onError;
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$wrap = function (res) {
	return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Task(
		F2(
			function (_v0, ids) {
				return _Utils_Tuple2(
					ids,
					$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Done(res));
			}));
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$succeed = function (a) {
	return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$wrap(
		$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Success(a));
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$succeed = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$succeed;
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$ErrorsDecoderFailure = function (a) {
	return {$: 'ErrorsDecoderFailure', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$InternalError = function (a) {
	return {$: 'InternalError', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$MissingFunction = function (a) {
	return {$: 'MissingFunction', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$ResponseDecoderFailure = function (a) {
	return {$: 'ResponseDecoderFailure', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$UnhandledJsException = function (a) {
	return {$: 'UnhandledJsException', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$toUnexpectedError = function (err) {
	switch (err.$) {
		case 'UnhandledJsException':
			var e = err.a;
			return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$UnhandledJsException(e);
		case 'ResponseDecoderFailure':
			var e = err.a;
			return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$ResponseDecoderFailure(e);
		case 'ErrorsDecoderFailure':
			var e = err.a;
			return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$ErrorsDecoderFailure(e);
		case 'MissingFunction':
			var e = err.a;
			return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$MissingFunction(e);
		default:
			var e = err.a;
			return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$InternalError(e);
	}
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$attemptWithId = F2(
	function (config, task) {
		var onComplete = function (res) {
			switch (res.$) {
				case 'Success':
					var s = res.a;
					return s;
				case 'Error':
					var e = res.a;
					return e;
				default:
					var e = res.a;
					return config.onComplete(
						$andrewMacmurray$elm_concurrent_task$ConcurrentTask$UnexpectedError(
							$andrewMacmurray$elm_concurrent_task$ConcurrentTask$toUnexpectedError(e)));
			}
		};
		var mappedTask = A2(
			$andrewMacmurray$elm_concurrent_task$ConcurrentTask$onError,
			function (err) {
				return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$succeed(
					config.onComplete(
						$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Error(err)));
			},
			A2(
				$andrewMacmurray$elm_concurrent_task$ConcurrentTask$map,
				function (res) {
					return config.onComplete(
						$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Success(res));
				},
				task));
		return A2(
			$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$attempt,
			{onComplete: onComplete, pool: config.pool, send: config.send},
			mappedTask);
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$attempt = F2(
	function (options, task) {
		var _v0 = A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$attemptWithId, options, task);
		var p = _v0.b;
		var cmd = _v0.c;
		return _Utils_Tuple2(p, cmd);
	});
var $elm$core$Platform$Cmd$batch = _Platform_batch;
var $elm$time$Time$Name = function (a) {
	return {$: 'Name', a: a};
};
var $elm$time$Time$Offset = function (a) {
	return {$: 'Offset', a: a};
};
var $elm$time$Time$Zone = F2(
	function (a, b) {
		return {$: 'Zone', a: a, b: b};
	});
var $elm$time$Time$customZone = $elm$time$Time$Zone;
var $elm$time$Time$here = _Time_here(_Utils_Tuple0);
var $elm$random$Random$Seed = F2(
	function (a, b) {
		return {$: 'Seed', a: a, b: b};
	});
var $elm$core$Bitwise$shiftRightZfBy = _Bitwise_shiftRightZfBy;
var $elm$random$Random$next = function (_v0) {
	var state0 = _v0.a;
	var incr = _v0.b;
	return A2($elm$random$Random$Seed, ((state0 * 1664525) + incr) >>> 0, incr);
};
var $elm$random$Random$initialSeed = function (x) {
	var _v0 = $elm$random$Random$next(
		A2($elm$random$Random$Seed, 0, 1013904223));
	var state1 = _v0.a;
	var incr = _v0.b;
	var state2 = (state1 + x) >>> 0;
	return $elm$random$Random$next(
		A2($elm$random$Random$Seed, state2, incr));
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$andThen = F2(
	function (f, _v0) {
		var run = _v0.a;
		return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Task(
			F2(
				function (res, ids) {
					var _v1 = A2(run, res, ids);
					var ids_ = _v1.a;
					var task = _v1.b;
					if (task.$ === 'Done') {
						var a = task.a;
						switch (a.$) {
							case 'Success':
								var a_ = a.a;
								return A2(
									$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$stepTask,
									res,
									_Utils_Tuple2(
										ids_,
										f(a_)));
							case 'Error':
								var e = a.a;
								return _Utils_Tuple2(
									ids_,
									$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Done(
										$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Error(e)));
							default:
								var e = a.a;
								return _Utils_Tuple2(
									ids,
									$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Done(
										$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$UnexpectedError(e)));
						}
					} else {
						var defs = task.a;
						var next = task.b;
						return _Utils_Tuple2(
							ids_,
							A2(
								$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Pending,
								defs,
								A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$andThen, f, next)));
					}
				}));
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$andThen = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$andThen;
var $author$project$IndexedDb$Store = function (a) {
	return {$: 'Store', a: a};
};
var $author$project$IndexedDb$defineStore = function (name) {
	return $author$project$IndexedDb$Store(
		{autoIncrement: false, keyPath: $elm$core$Maybe$Nothing, name: name});
};
var $author$project$IndexedDb$withKeyPath = F2(
	function (path, _v0) {
		var config = _v0.a;
		return $author$project$IndexedDb$Store(
			_Utils_update(
				config,
				{
					keyPath: $elm$core$Maybe$Just(path)
				}));
	});
var $author$project$Main$behaviorStore = A2(
	$author$project$IndexedDb$withKeyPath,
	'id',
	$author$project$IndexedDb$defineStore('safetyBehaviors'));
var $author$project$IndexedDb$Schema = function (a) {
	return {$: 'Schema', a: a};
};
var $author$project$IndexedDb$schema = F2(
	function (name, version) {
		return $author$project$IndexedDb$Schema(
			{name: name, stores: _List_Nil, version: version});
	});
var $author$project$IndexedDb$withStore = F2(
	function (_v0, _v1) {
		var config = _v0.a;
		var s = _v1.a;
		return $author$project$IndexedDb$Schema(
			_Utils_update(
				s,
				{
					stores: A2($elm$core$List$cons, config, s.stores)
				}));
	});
var $author$project$Main$appSchema = A2(
	$author$project$IndexedDb$withStore,
	$author$project$Main$behaviorStore,
	A2($author$project$IndexedDb$schema, 'safetyBehaviorsTracking', 1));
var $author$project$Main$Behavior = F4(
	function (id, name, submits, resists) {
		return {id: id, name: name, resists: resists, submits: submits};
	});
var $elm$json$Json$Decode$int = _Json_decodeInt;
var $elm$json$Json$Decode$string = _Json_decodeString;
var $elm$json$Json$Decode$fail = _Json_fail;
var $TSFoster$elm_uuid$UUID$WrongFormat = {$: 'WrongFormat'};
var $TSFoster$elm_uuid$UUID$WrongLength = {$: 'WrongLength'};
var $elm$core$String$endsWith = _String_endsWith;
var $elm$core$List$maybeCons = F3(
	function (f, mx, xs) {
		var _v0 = f(mx);
		if (_v0.$ === 'Just') {
			var x = _v0.a;
			return A2($elm$core$List$cons, x, xs);
		} else {
			return xs;
		}
	});
var $elm$core$List$filterMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			$elm$core$List$maybeCons(f),
			_List_Nil,
			xs);
	});
var $TSFoster$elm_uuid$UUID$IsNil = {$: 'IsNil'};
var $TSFoster$elm_uuid$UUID$NoVersion = {$: 'NoVersion'};
var $TSFoster$elm_uuid$UUID$UUID = F4(
	function (a, b, c, d) {
		return {$: 'UUID', a: a, b: b, c: c, d: d};
	});
var $TSFoster$elm_uuid$UUID$UnsupportedVariant = {$: 'UnsupportedVariant'};
var $TSFoster$elm_uuid$UUID$isVariant1 = function (_v0) {
	var c = _v0.c;
	return (c >>> 30) === 2;
};
var $elm$core$Basics$not = _Basics_not;
var $elm$core$Bitwise$and = _Bitwise_and;
var $TSFoster$elm_uuid$UUID$version = function (_v0) {
	var b = _v0.b;
	return 15 & (b >>> 12);
};
var $TSFoster$elm_uuid$UUID$fromInt32s = F4(
	function (a, b, c, d) {
		var wouldBeUUID = A4($TSFoster$elm_uuid$UUID$UUID, a, b, c, d);
		return ((!a) && ((!b) && ((!c) && (!d)))) ? $elm$core$Result$Err($TSFoster$elm_uuid$UUID$IsNil) : (($TSFoster$elm_uuid$UUID$version(wouldBeUUID) > 5) ? $elm$core$Result$Err($TSFoster$elm_uuid$UUID$NoVersion) : ((!$TSFoster$elm_uuid$UUID$isVariant1(wouldBeUUID)) ? $elm$core$Result$Err($TSFoster$elm_uuid$UUID$UnsupportedVariant) : $elm$core$Result$Ok(wouldBeUUID)));
	});
var $elm$core$Basics$negate = function (n) {
	return -n;
};
var $elm$core$Basics$neq = _Utils_notEqual;
var $TSFoster$elm_uuid$UUID$forceUnsigned = $elm$core$Bitwise$shiftRightZfBy(0);
var $elm$core$Bitwise$or = _Bitwise_or;
var $elm$core$Bitwise$shiftLeftBy = _Bitwise_shiftLeftBy;
var $TSFoster$elm_uuid$UUID$nibbleValuesToU32 = F8(
	function (a, b, c, d, e, f, g, h) {
		return $TSFoster$elm_uuid$UUID$forceUnsigned((a << 28) | ((b << 24) | ((c << 20) | ((d << 16) | ((e << 12) | ((f << 8) | ((g << 4) | h)))))));
	});
var $elm$core$String$replace = F3(
	function (before, after, string) {
		return A2(
			$elm$core$String$join,
			after,
			A2($elm$core$String$split, before, string));
	});
var $elm$core$String$foldr = _String_foldr;
var $elm$core$String$toList = function (string) {
	return A3($elm$core$String$foldr, $elm$core$List$cons, _List_Nil, string);
};
var $elm$core$String$toLower = _String_toLower;
var $TSFoster$elm_uuid$UUID$toNibbleValue = function (_char) {
	switch (_char.valueOf()) {
		case '0':
			return $elm$core$Maybe$Just(0);
		case '1':
			return $elm$core$Maybe$Just(1);
		case '2':
			return $elm$core$Maybe$Just(2);
		case '3':
			return $elm$core$Maybe$Just(3);
		case '4':
			return $elm$core$Maybe$Just(4);
		case '5':
			return $elm$core$Maybe$Just(5);
		case '6':
			return $elm$core$Maybe$Just(6);
		case '7':
			return $elm$core$Maybe$Just(7);
		case '8':
			return $elm$core$Maybe$Just(8);
		case '9':
			return $elm$core$Maybe$Just(9);
		case 'a':
			return $elm$core$Maybe$Just(10);
		case 'b':
			return $elm$core$Maybe$Just(11);
		case 'c':
			return $elm$core$Maybe$Just(12);
		case 'd':
			return $elm$core$Maybe$Just(13);
		case 'e':
			return $elm$core$Maybe$Just(14);
		case 'f':
			return $elm$core$Maybe$Just(15);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $TSFoster$elm_uuid$UUID$fromString = function (string) {
	var normalized = function (str) {
		return A2($elm$core$String$startsWith, 'urn:uuid:', str) ? A2($elm$core$String$dropLeft, 9, str) : ((A2($elm$core$String$startsWith, '{', str) && A2($elm$core$String$endsWith, '}', str)) ? A3($elm$core$String$slice, 1, -1, str) : str);
	}(
		$elm$core$String$toLower(
			A3(
				$elm$core$String$replace,
				'-',
				'',
				A3(
					$elm$core$String$replace,
					' ',
					'',
					A3(
						$elm$core$String$replace,
						'\t',
						'',
						A3($elm$core$String$replace, '\n', '', string))))));
	if ($elm$core$String$length(normalized) !== 32) {
		return $elm$core$Result$Err($TSFoster$elm_uuid$UUID$WrongLength);
	} else {
		var _v0 = A2(
			$elm$core$List$filterMap,
			$TSFoster$elm_uuid$UUID$toNibbleValue,
			$elm$core$String$toList(normalized));
		if ((((((((((((((((((((((((((((((((_v0.b && _v0.b.b) && _v0.b.b.b) && _v0.b.b.b.b) && _v0.b.b.b.b.b) && _v0.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && _v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b) && (!_v0.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b)) {
			var a1 = _v0.a;
			var _v1 = _v0.b;
			var a2 = _v1.a;
			var _v2 = _v1.b;
			var a3 = _v2.a;
			var _v3 = _v2.b;
			var a4 = _v3.a;
			var _v4 = _v3.b;
			var a5 = _v4.a;
			var _v5 = _v4.b;
			var a6 = _v5.a;
			var _v6 = _v5.b;
			var a7 = _v6.a;
			var _v7 = _v6.b;
			var a8 = _v7.a;
			var _v8 = _v7.b;
			var b1 = _v8.a;
			var _v9 = _v8.b;
			var b2 = _v9.a;
			var _v10 = _v9.b;
			var b3 = _v10.a;
			var _v11 = _v10.b;
			var b4 = _v11.a;
			var _v12 = _v11.b;
			var b5 = _v12.a;
			var _v13 = _v12.b;
			var b6 = _v13.a;
			var _v14 = _v13.b;
			var b7 = _v14.a;
			var _v15 = _v14.b;
			var b8 = _v15.a;
			var _v16 = _v15.b;
			var c1 = _v16.a;
			var _v17 = _v16.b;
			var c2 = _v17.a;
			var _v18 = _v17.b;
			var c3 = _v18.a;
			var _v19 = _v18.b;
			var c4 = _v19.a;
			var _v20 = _v19.b;
			var c5 = _v20.a;
			var _v21 = _v20.b;
			var c6 = _v21.a;
			var _v22 = _v21.b;
			var c7 = _v22.a;
			var _v23 = _v22.b;
			var c8 = _v23.a;
			var _v24 = _v23.b;
			var d1 = _v24.a;
			var _v25 = _v24.b;
			var d2 = _v25.a;
			var _v26 = _v25.b;
			var d3 = _v26.a;
			var _v27 = _v26.b;
			var d4 = _v27.a;
			var _v28 = _v27.b;
			var d5 = _v28.a;
			var _v29 = _v28.b;
			var d6 = _v29.a;
			var _v30 = _v29.b;
			var d7 = _v30.a;
			var _v31 = _v30.b;
			var d8 = _v31.a;
			return A4(
				$TSFoster$elm_uuid$UUID$fromInt32s,
				A8($TSFoster$elm_uuid$UUID$nibbleValuesToU32, a1, a2, a3, a4, a5, a6, a7, a8),
				A8($TSFoster$elm_uuid$UUID$nibbleValuesToU32, b1, b2, b3, b4, b5, b6, b7, b8),
				A8($TSFoster$elm_uuid$UUID$nibbleValuesToU32, c1, c2, c3, c4, c5, c6, c7, c8),
				A8($TSFoster$elm_uuid$UUID$nibbleValuesToU32, d1, d2, d3, d4, d5, d6, d7, d8));
		} else {
			return $elm$core$Result$Err($TSFoster$elm_uuid$UUID$WrongFormat);
		}
	}
};
var $TSFoster$elm_uuid$UUID$stringToJsonDecoder = function (string) {
	var _v0 = $TSFoster$elm_uuid$UUID$fromString(string);
	if (_v0.$ === 'Ok') {
		var uuid = _v0.a;
		return $elm$json$Json$Decode$succeed(uuid);
	} else {
		switch (_v0.a.$) {
			case 'WrongFormat':
				var _v1 = _v0.a;
				return $elm$json$Json$Decode$fail('UUID is in wrong format');
			case 'WrongLength':
				var _v2 = _v0.a;
				return $elm$json$Json$Decode$fail('UUID is wrong length');
			case 'UnsupportedVariant':
				var _v3 = _v0.a;
				return $elm$json$Json$Decode$fail('UUID is an unsupported variant');
			case 'IsNil':
				var _v4 = _v0.a;
				return $elm$json$Json$Decode$fail('UUID is nil');
			default:
				var _v5 = _v0.a;
				return $elm$json$Json$Decode$fail('UUID is not properly versioned');
		}
	}
};
var $TSFoster$elm_uuid$UUID$jsonDecoder = A2($elm$json$Json$Decode$andThen, $TSFoster$elm_uuid$UUID$stringToJsonDecoder, $elm$json$Json$Decode$string);
var $elm$json$Json$Decode$list = _Json_decodeList;
var $elm$json$Json$Decode$map4 = _Json_map4;
var $elm$time$Time$Posix = function (a) {
	return {$: 'Posix', a: a};
};
var $elm$time$Time$millisToPosix = $elm$time$Time$Posix;
var $author$project$Main$decodeBehavior = A5(
	$elm$json$Json$Decode$map4,
	$author$project$Main$Behavior,
	A2($elm$json$Json$Decode$field, 'id', $TSFoster$elm_uuid$UUID$jsonDecoder),
	A2($elm$json$Json$Decode$field, 'name', $elm$json$Json$Decode$string),
	A2(
		$elm$json$Json$Decode$field,
		'submits',
		$elm$json$Json$Decode$list(
			A2($elm$json$Json$Decode$map, $elm$time$Time$millisToPosix, $elm$json$Json$Decode$int))),
	A2(
		$elm$json$Json$Decode$field,
		'resists',
		$elm$json$Json$Decode$list(
			A2($elm$json$Json$Decode$map, $elm$time$Time$millisToPosix, $elm$json$Json$Decode$int))));
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$ErrorsDecoderFailure = function (a) {
	return {$: 'ErrorsDecoderFailure', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$InternalError = function (a) {
	return {$: 'InternalError', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$MissingFunction = function (a) {
	return {$: 'MissingFunction', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$ResponseDecoderFailure = function (a) {
	return {$: 'ResponseDecoderFailure', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$UnhandledJsException = function (a) {
	return {$: 'UnhandledJsException', a: a};
};
var $elm$json$Json$Decode$decodeValue = _Json_run;
var $elm$json$Json$Decode$value = _Json_decodeValue;
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$decodeResponse = F2(
	function (def, val) {
		var decodeRunnerSuccess = function () {
			var _v12 = def.expect;
			var expect = _v12.a;
			return A2($elm$json$Json$Decode$field, 'value', expect);
		}();
		var decodeRunnerError = A2(
			$elm$json$Json$Decode$field,
			'error',
			A2(
				$elm$json$Json$Decode$andThen,
				function (reason) {
					switch (reason) {
						case 'js_exception':
							return A3(
								$elm$json$Json$Decode$map2,
								F2(
									function (msg, raw) {
										return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$UnhandledJsException(
											{_function: def._function, message: msg, raw: raw});
									}),
								A2($elm$json$Json$Decode$field, 'message', $elm$json$Json$Decode$string),
								A2($elm$json$Json$Decode$field, 'raw', $elm$json$Json$Decode$value));
						case 'missing_function':
							return A2(
								$elm$json$Json$Decode$field,
								'message',
								A2($elm$json$Json$Decode$map, $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$MissingFunction, $elm$json$Json$Decode$string));
						default:
							return $elm$json$Json$Decode$succeed(
								$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$InternalError('Unknown runner error reason: ' + reason));
					}
				},
				A2($elm$json$Json$Decode$field, 'reason', $elm$json$Json$Decode$string)));
		var decodeExpectThrows = function (_catch) {
			var _v8 = A2($elm$json$Json$Decode$decodeValue, decodeRunnerError, val);
			if (_v8.$ === 'Ok') {
				var err = _v8.a;
				if (err.$ === 'UnhandledJsException') {
					var e = err.a;
					return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Error(
						_catch(e.message));
				} else {
					return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$UnexpectedError(err);
				}
			} else {
				var _v10 = A2($elm$json$Json$Decode$decodeValue, decodeRunnerSuccess, val);
				if (_v10.$ === 'Ok') {
					var a = _v10.a;
					return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Success(a);
				} else {
					var e = _v10.a;
					return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$UnexpectedError(
						$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$ResponseDecoderFailure(
							{error: e, _function: def._function}));
				}
			}
		};
		var decodeExpectNoErrors = function (_v7) {
			var _v5 = A2($elm$json$Json$Decode$decodeValue, decodeRunnerError, val);
			if (_v5.$ === 'Ok') {
				var err = _v5.a;
				return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$UnexpectedError(err);
			} else {
				var _v6 = A2($elm$json$Json$Decode$decodeValue, decodeRunnerSuccess, val);
				if (_v6.$ === 'Ok') {
					var a = _v6.a;
					return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Success(a);
				} else {
					var e = _v6.a;
					return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$UnexpectedError(
						$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$ResponseDecoderFailure(
							{error: e, _function: def._function}));
				}
			}
		};
		var decodeExpectErrors = function (expect) {
			var decodeExpectErrorField = function (decoder) {
				return A2(
					$elm$json$Json$Decode$field,
					'value',
					A2($elm$json$Json$Decode$field, 'error', decoder));
			};
			var _v1 = A2($elm$json$Json$Decode$decodeValue, decodeRunnerError, val);
			if (_v1.$ === 'Ok') {
				var err = _v1.a;
				return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$UnexpectedError(err);
			} else {
				var _v2 = A2(
					$elm$json$Json$Decode$decodeValue,
					decodeExpectErrorField($elm$json$Json$Decode$value),
					val);
				if (_v2.$ === 'Ok') {
					var _v3 = A2(
						$elm$json$Json$Decode$decodeValue,
						decodeExpectErrorField(expect),
						val);
					if (_v3.$ === 'Ok') {
						var err_ = _v3.a;
						return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Error(err_);
					} else {
						var e_ = _v3.a;
						return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$UnexpectedError(
							$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$ErrorsDecoderFailure(
								{error: e_, _function: def._function}));
					}
				} else {
					var _v4 = A2($elm$json$Json$Decode$decodeValue, decodeRunnerSuccess, val);
					if (_v4.$ === 'Ok') {
						var a = _v4.a;
						return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Success(a);
					} else {
						var e_ = _v4.a;
						return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$UnexpectedError(
							$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$ResponseDecoderFailure(
								{error: e_, _function: def._function}));
					}
				}
			}
		};
		var _v0 = def.errors;
		switch (_v0.$) {
			case 'ExpectThrows':
				var _catch = _v0.a;
				return decodeExpectThrows(_catch);
			case 'ExpectErrors':
				var expect = _v0.a;
				return decodeExpectErrors(expect);
			default:
				return decodeExpectNoErrors(_Utils_Tuple0);
		}
	});
var $elm$core$Array$fromListHelp = F3(
	function (list, nodeList, nodeListSize) {
		fromListHelp:
		while (true) {
			var _v0 = A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, list);
			var jsArray = _v0.a;
			var remainingItems = _v0.b;
			if (_Utils_cmp(
				$elm$core$Elm$JsArray$length(jsArray),
				$elm$core$Array$branchFactor) < 0) {
				return A2(
					$elm$core$Array$builderToArray,
					true,
					{nodeList: nodeList, nodeListSize: nodeListSize, tail: jsArray});
			} else {
				var $temp$list = remainingItems,
					$temp$nodeList = A2(
					$elm$core$List$cons,
					$elm$core$Array$Leaf(jsArray),
					nodeList),
					$temp$nodeListSize = nodeListSize + 1;
				list = $temp$list;
				nodeList = $temp$nodeList;
				nodeListSize = $temp$nodeListSize;
				continue fromListHelp;
			}
		}
	});
var $elm$core$Array$fromList = function (list) {
	if (!list.b) {
		return $elm$core$Array$empty;
	} else {
		return A3($elm$core$Array$fromListHelp, list, _List_Nil, 0);
	}
};
var $elm$core$Dict$get = F2(
	function (targetKey, dict) {
		get:
		while (true) {
			if (dict.$ === 'RBEmpty_elm_builtin') {
				return $elm$core$Maybe$Nothing;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var _v1 = A2($elm$core$Basics$compare, targetKey, key);
				switch (_v1.$) {
					case 'LT':
						var $temp$targetKey = targetKey,
							$temp$dict = left;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
					case 'EQ':
						return $elm$core$Maybe$Just(value);
					default:
						var $temp$targetKey = targetKey,
							$temp$dict = right;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
				}
			}
		}
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$runWith = F2(
	function (s, _v0) {
		var run = _v0.a;
		return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Task(
			F2(
				function (res, _v1) {
					return A2(run, res, s);
				}));
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$define = function (def) {
	return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Task(
		F2(
			function (results, ids) {
				var taskId = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$get(ids);
				return _Utils_Tuple2(
					$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$next(ids),
					A2(
						$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Pending,
						$elm$core$Array$fromList(
							_List_fromArray(
								[
									{args: def.args, _function: def._function, taskId: taskId}
								])),
						function () {
							var _v0 = A2($elm$core$Dict$get, taskId, results);
							if (_v0.$ === 'Just') {
								var result = _v0.a;
								return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$wrap(
									A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$decodeResponse, def, result));
							} else {
								return A2(
									$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$runWith,
									ids,
									$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$define(def));
							}
						}()));
			}));
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$define = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$define;
var $author$project$IndexedDb$AlreadyExists = {$: 'AlreadyExists'};
var $author$project$IndexedDb$DatabaseError = function (a) {
	return {$: 'DatabaseError', a: a};
};
var $author$project$IndexedDb$QuotaExceeded = {$: 'QuotaExceeded'};
var $author$project$IndexedDb$TransactionError = function (a) {
	return {$: 'TransactionError', a: a};
};
var $author$project$IndexedDb$splitOnce = F2(
	function (sep, str) {
		var _v0 = A2($elm$core$String$indexes, sep, str);
		if (_v0.b) {
			var i = _v0.a;
			return $elm$core$Maybe$Just(
				_Utils_Tuple2(
					A2($elm$core$String$left, i, str),
					A2(
						$elm$core$String$dropLeft,
						i + $elm$core$String$length(sep),
						str)));
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $author$project$IndexedDb$errorDecoder = A2(
	$elm$json$Json$Decode$andThen,
	function (err) {
		if (err === 'ALREADY_EXISTS') {
			return $elm$json$Json$Decode$succeed($author$project$IndexedDb$AlreadyExists);
		} else {
			if (err === 'QUOTA_EXCEEDED') {
				return $elm$json$Json$Decode$succeed($author$project$IndexedDb$QuotaExceeded);
			} else {
				var _v0 = A2($author$project$IndexedDb$splitOnce, ':', err);
				_v0$2:
				while (true) {
					if (_v0.$ === 'Just') {
						switch (_v0.a.a) {
							case 'TRANSACTION_ERROR':
								var _v1 = _v0.a;
								var msg = _v1.b;
								return $elm$json$Json$Decode$succeed(
									$author$project$IndexedDb$TransactionError(msg));
							case 'DATABASE_ERROR':
								var _v2 = _v0.a;
								var msg = _v2.b;
								return $elm$json$Json$Decode$succeed(
									$author$project$IndexedDb$DatabaseError(msg));
							default:
								break _v0$2;
						}
					} else {
						break _v0$2;
					}
				}
				return $elm$json$Json$Decode$fail('Unknown IndexedDB error: ' + err);
			}
		}
	},
	$elm$json$Json$Decode$string);
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$ExpectErrors = function (a) {
	return {$: 'ExpectErrors', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$expectErrors = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$ExpectErrors;
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$ExpectJson = function (a) {
	return {$: 'ExpectJson', a: a};
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$expectJson = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$ExpectJson;
var $author$project$IndexedDb$getDbName = function (_v0) {
	var name = _v0.a;
	return name;
};
var $author$project$IndexedDb$getStoreName = function (_v0) {
	var config = _v0.a;
	return config.name;
};
var $author$project$IndexedDb$getAll = F3(
	function (db, store, decoder) {
		return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$define(
			{
				args: $elm$json$Json$Encode$object(
					_List_fromArray(
						[
							_Utils_Tuple2(
							'db',
							$elm$json$Json$Encode$string(
								$author$project$IndexedDb$getDbName(db))),
							_Utils_Tuple2(
							'store',
							$elm$json$Json$Encode$string(
								$author$project$IndexedDb$getStoreName(store)))
						])),
				errors: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$expectErrors($author$project$IndexedDb$errorDecoder),
				expect: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$expectJson(
					$elm$json$Json$Decode$list(decoder)),
				_function: 'indexeddb:getAll'
			});
	});
var $elm$core$Tuple$pair = F2(
	function (a, b) {
		return _Utils_Tuple2(a, b);
	});
var $author$project$Main$loadBehaviorsData = function (db) {
	return A2(
		$andrewMacmurray$elm_concurrent_task$ConcurrentTask$map,
		$elm$core$Tuple$pair(db),
		A3($author$project$IndexedDb$getAll, db, $author$project$Main$behaviorStore, $author$project$Main$decodeBehavior));
};
var $author$project$IndexedDb$Db = function (a) {
	return {$: 'Db', a: a};
};
var $elm$json$Json$Encode$bool = _Json_wrap;
var $elm$json$Json$Encode$null = _Json_encodeNull;
var $author$project$IndexedDb$encodeStoreConfig = function (config) {
	return $elm$json$Json$Encode$object(
		_List_fromArray(
			[
				_Utils_Tuple2(
				'name',
				$elm$json$Json$Encode$string(config.name)),
				_Utils_Tuple2(
				'keyPath',
				function () {
					var _v0 = config.keyPath;
					if (_v0.$ === 'Just') {
						var p = _v0.a;
						return $elm$json$Json$Encode$string(p);
					} else {
						return $elm$json$Json$Encode$null;
					}
				}()),
				_Utils_Tuple2(
				'autoIncrement',
				$elm$json$Json$Encode$bool(config.autoIncrement))
			]));
};
var $elm$json$Json$Encode$int = _Json_wrap;
var $elm$json$Json$Encode$list = F2(
	function (func, entries) {
		return _Json_wrap(
			A3(
				$elm$core$List$foldl,
				_Json_addEntry(func),
				_Json_emptyArray(_Utils_Tuple0),
				entries));
	});
var $author$project$IndexedDb$encodeSchema = F3(
	function (name, version, stores) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'name',
					$elm$json$Json$Encode$string(name)),
					_Utils_Tuple2(
					'version',
					$elm$json$Json$Encode$int(version)),
					_Utils_Tuple2(
					'stores',
					A2($elm$json$Json$Encode$list, $author$project$IndexedDb$encodeStoreConfig, stores))
				]));
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$expectWhatever = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$ExpectJson(
	$elm$json$Json$Decode$succeed(_Utils_Tuple0));
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$fail = function (x) {
	return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$wrap(
		$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Error(x));
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$fail = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$fail;
var $elm$core$Dict$member = F2(
	function (key, dict) {
		var _v0 = A2($elm$core$Dict$get, key, dict);
		if (_v0.$ === 'Just') {
			return true;
		} else {
			return false;
		}
	});
var $elm$core$Set$member = F2(
	function (key, _v0) {
		var dict = _v0.a;
		return A2($elm$core$Dict$member, key, dict);
	});
var $elm$core$Tuple$second = function (_v0) {
	var y = _v0.b;
	return y;
};
var $author$project$IndexedDb$findDuplicates = function (names) {
	return $elm$core$Set$toList(
		A3(
			$elm$core$List$foldl,
			F2(
				function (name, _v0) {
					var seen = _v0.a;
					var dupes = _v0.b;
					return A2($elm$core$Set$member, name, seen) ? _Utils_Tuple2(
						seen,
						A2($elm$core$Set$insert, name, dupes)) : _Utils_Tuple2(
						A2($elm$core$Set$insert, name, seen),
						dupes);
				}),
			_Utils_Tuple2($elm$core$Set$empty, $elm$core$Set$empty),
			names).b);
};
var $elm$core$List$isEmpty = function (xs) {
	if (!xs.b) {
		return true;
	} else {
		return false;
	}
};
var $author$project$IndexedDb$open = function (_v0) {
	var s = _v0.a;
	var stores = $elm$core$List$reverse(s.stores);
	var names = A2(
		$elm$core$List$map,
		function ($) {
			return $.name;
		},
		stores);
	var duplicates = $author$project$IndexedDb$findDuplicates(names);
	return $elm$core$List$isEmpty(duplicates) ? A2(
		$andrewMacmurray$elm_concurrent_task$ConcurrentTask$map,
		function (_v1) {
			return $author$project$IndexedDb$Db(s.name);
		},
		$andrewMacmurray$elm_concurrent_task$ConcurrentTask$define(
			{
				args: A3($author$project$IndexedDb$encodeSchema, s.name, s.version, stores),
				errors: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$expectErrors($author$project$IndexedDb$errorDecoder),
				expect: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$expectWhatever,
				_function: 'indexeddb:open'
			})) : $andrewMacmurray$elm_concurrent_task$ConcurrentTask$fail(
		$author$project$IndexedDb$DatabaseError(
			'Duplicate store names in schema: ' + A2($elm$core$String$join, ', ', duplicates)));
};
var $author$project$Main$loadBehaviors = A2(
	$andrewMacmurray$elm_concurrent_task$ConcurrentTask$andThen,
	$author$project$Main$loadBehaviorsData,
	$author$project$IndexedDb$open($author$project$Main$appSchema));
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$pool = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Pool(
	{attemptIds: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$Ids$init, attempts: $elm$core$Dict$empty, poolId: $elm$core$Maybe$Nothing});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$pool = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$pool;
var $author$project$Main$sendToDb = _Platform_outgoingPort('sendToDb', $elm$core$Basics$identity);
var $elm$time$Time$utc = A2($elm$time$Time$Zone, 0, _List_Nil);
var $author$project$Main$init = F3(
	function (flags, url, navKey) {
		var _v0 = A2(
			$andrewMacmurray$elm_concurrent_task$ConcurrentTask$attempt,
			{onComplete: $author$project$Main$DbLoaded, pool: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$pool, send: $author$project$Main$sendToDb},
			$author$project$Main$loadBehaviors);
		var dbTasks = _v0.a;
		var cmd = _v0.b;
		return _Utils_Tuple2(
			$author$project$Main$Initializing(
				{
					dbTasks: dbTasks,
					navKey: navKey,
					seeds: {
						seed1: $elm$random$Random$initialSeed(flags.seed1),
						seed2: $elm$random$Random$initialSeed(flags.seed2),
						seed3: $elm$random$Random$initialSeed(flags.seed3),
						seed4: $elm$random$Random$initialSeed(flags.seed4)
					},
					today: $elm$time$Time$millisToPosix(0),
					url: url,
					zone: $elm$time$Time$utc
				}),
			$elm$core$Platform$Cmd$batch(
				_List_fromArray(
					[
						cmd,
						A2($elm$core$Task$perform, $author$project$Main$TimeZoneFound, $elm$time$Time$here)
					])));
	});
var $author$project$Main$OnDbProgress = function (a) {
	return {$: 'OnDbProgress', a: a};
};
var $elm$core$Platform$Sub$batch = _Platform_batch;
var $elm$core$Platform$Sub$none = $elm$core$Platform$Sub$batch(_List_Nil);
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$findAttempt = F2(
	function (attemptId, _v0) {
		var p = _v0.a;
		return A2($elm$core$Dict$get, attemptId, p.attempts);
	});
var $elm$core$Platform$Cmd$none = $elm$core$Platform$Cmd$batch(_List_Nil);
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$RawResult = F3(
	function (attemptId, taskId, result) {
		return {attemptId: attemptId, result: result, taskId: taskId};
	});
var $elm$json$Json$Decode$map3 = _Json_map3;
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$decodeRawResult = A4(
	$elm$json$Json$Decode$map3,
	$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$RawResult,
	A2($elm$json$Json$Decode$field, 'attemptId', $elm$json$Json$Decode$string),
	A2($elm$json$Json$Decode$field, 'taskId', $elm$json$Json$Decode$string),
	A2($elm$json$Json$Decode$field, 'result', $elm$json$Json$Decode$value));
var $elm$core$Result$map = F2(
	function (func, ra) {
		if (ra.$ === 'Ok') {
			var a = ra.a;
			return $elm$core$Result$Ok(
				func(a));
		} else {
			var e = ra.a;
			return $elm$core$Result$Err(e);
		}
	});
var $elm$core$Dict$singleton = F2(
	function (key, value) {
		return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, key, value, $elm$core$Dict$RBEmpty_elm_builtin, $elm$core$Dict$RBEmpty_elm_builtin);
	});
var $elm$core$Dict$getMin = function (dict) {
	getMin:
	while (true) {
		if ((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) {
			var left = dict.d;
			var $temp$dict = left;
			dict = $temp$dict;
			continue getMin;
		} else {
			return dict;
		}
	}
};
var $elm$core$Dict$moveRedLeft = function (dict) {
	if (((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) && (dict.e.$ === 'RBNode_elm_builtin')) {
		if ((dict.e.d.$ === 'RBNode_elm_builtin') && (dict.e.d.a.$ === 'Red')) {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v1 = dict.d;
			var lClr = _v1.a;
			var lK = _v1.b;
			var lV = _v1.c;
			var lLeft = _v1.d;
			var lRight = _v1.e;
			var _v2 = dict.e;
			var rClr = _v2.a;
			var rK = _v2.b;
			var rV = _v2.c;
			var rLeft = _v2.d;
			var _v3 = rLeft.a;
			var rlK = rLeft.b;
			var rlV = rLeft.c;
			var rlL = rLeft.d;
			var rlR = rLeft.e;
			var rRight = _v2.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				$elm$core$Dict$Red,
				rlK,
				rlV,
				A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					rlL),
				A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, rK, rV, rlR, rRight));
		} else {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v4 = dict.d;
			var lClr = _v4.a;
			var lK = _v4.b;
			var lV = _v4.c;
			var lLeft = _v4.d;
			var lRight = _v4.e;
			var _v5 = dict.e;
			var rClr = _v5.a;
			var rK = _v5.b;
			var rV = _v5.c;
			var rLeft = _v5.d;
			var rRight = _v5.e;
			if (clr.$ === 'Black') {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			}
		}
	} else {
		return dict;
	}
};
var $elm$core$Dict$moveRedRight = function (dict) {
	if (((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) && (dict.e.$ === 'RBNode_elm_builtin')) {
		if ((dict.d.d.$ === 'RBNode_elm_builtin') && (dict.d.d.a.$ === 'Red')) {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v1 = dict.d;
			var lClr = _v1.a;
			var lK = _v1.b;
			var lV = _v1.c;
			var _v2 = _v1.d;
			var _v3 = _v2.a;
			var llK = _v2.b;
			var llV = _v2.c;
			var llLeft = _v2.d;
			var llRight = _v2.e;
			var lRight = _v1.e;
			var _v4 = dict.e;
			var rClr = _v4.a;
			var rK = _v4.b;
			var rV = _v4.c;
			var rLeft = _v4.d;
			var rRight = _v4.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				$elm$core$Dict$Red,
				lK,
				lV,
				A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, llK, llV, llLeft, llRight),
				A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					lRight,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight)));
		} else {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v5 = dict.d;
			var lClr = _v5.a;
			var lK = _v5.b;
			var lV = _v5.c;
			var lLeft = _v5.d;
			var lRight = _v5.e;
			var _v6 = dict.e;
			var rClr = _v6.a;
			var rK = _v6.b;
			var rV = _v6.c;
			var rLeft = _v6.d;
			var rRight = _v6.e;
			if (clr.$ === 'Black') {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			}
		}
	} else {
		return dict;
	}
};
var $elm$core$Dict$removeHelpPrepEQGT = F7(
	function (targetKey, dict, color, key, value, left, right) {
		if ((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) {
			var _v1 = left.a;
			var lK = left.b;
			var lV = left.c;
			var lLeft = left.d;
			var lRight = left.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				lK,
				lV,
				lLeft,
				A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, lRight, right));
		} else {
			_v2$2:
			while (true) {
				if ((right.$ === 'RBNode_elm_builtin') && (right.a.$ === 'Black')) {
					if (right.d.$ === 'RBNode_elm_builtin') {
						if (right.d.a.$ === 'Black') {
							var _v3 = right.a;
							var _v4 = right.d;
							var _v5 = _v4.a;
							return $elm$core$Dict$moveRedRight(dict);
						} else {
							break _v2$2;
						}
					} else {
						var _v6 = right.a;
						var _v7 = right.d;
						return $elm$core$Dict$moveRedRight(dict);
					}
				} else {
					break _v2$2;
				}
			}
			return dict;
		}
	});
var $elm$core$Dict$removeMin = function (dict) {
	if ((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) {
		var color = dict.a;
		var key = dict.b;
		var value = dict.c;
		var left = dict.d;
		var lColor = left.a;
		var lLeft = left.d;
		var right = dict.e;
		if (lColor.$ === 'Black') {
			if ((lLeft.$ === 'RBNode_elm_builtin') && (lLeft.a.$ === 'Red')) {
				var _v3 = lLeft.a;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					color,
					key,
					value,
					$elm$core$Dict$removeMin(left),
					right);
			} else {
				var _v4 = $elm$core$Dict$moveRedLeft(dict);
				if (_v4.$ === 'RBNode_elm_builtin') {
					var nColor = _v4.a;
					var nKey = _v4.b;
					var nValue = _v4.c;
					var nLeft = _v4.d;
					var nRight = _v4.e;
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						$elm$core$Dict$removeMin(nLeft),
						nRight);
				} else {
					return $elm$core$Dict$RBEmpty_elm_builtin;
				}
			}
		} else {
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				key,
				value,
				$elm$core$Dict$removeMin(left),
				right);
		}
	} else {
		return $elm$core$Dict$RBEmpty_elm_builtin;
	}
};
var $elm$core$Dict$removeHelp = F2(
	function (targetKey, dict) {
		if (dict.$ === 'RBEmpty_elm_builtin') {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		} else {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			if (_Utils_cmp(targetKey, key) < 0) {
				if ((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Black')) {
					var _v4 = left.a;
					var lLeft = left.d;
					if ((lLeft.$ === 'RBNode_elm_builtin') && (lLeft.a.$ === 'Red')) {
						var _v6 = lLeft.a;
						return A5(
							$elm$core$Dict$RBNode_elm_builtin,
							color,
							key,
							value,
							A2($elm$core$Dict$removeHelp, targetKey, left),
							right);
					} else {
						var _v7 = $elm$core$Dict$moveRedLeft(dict);
						if (_v7.$ === 'RBNode_elm_builtin') {
							var nColor = _v7.a;
							var nKey = _v7.b;
							var nValue = _v7.c;
							var nLeft = _v7.d;
							var nRight = _v7.e;
							return A5(
								$elm$core$Dict$balance,
								nColor,
								nKey,
								nValue,
								A2($elm$core$Dict$removeHelp, targetKey, nLeft),
								nRight);
						} else {
							return $elm$core$Dict$RBEmpty_elm_builtin;
						}
					}
				} else {
					return A5(
						$elm$core$Dict$RBNode_elm_builtin,
						color,
						key,
						value,
						A2($elm$core$Dict$removeHelp, targetKey, left),
						right);
				}
			} else {
				return A2(
					$elm$core$Dict$removeHelpEQGT,
					targetKey,
					A7($elm$core$Dict$removeHelpPrepEQGT, targetKey, dict, color, key, value, left, right));
			}
		}
	});
var $elm$core$Dict$removeHelpEQGT = F2(
	function (targetKey, dict) {
		if (dict.$ === 'RBNode_elm_builtin') {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			if (_Utils_eq(targetKey, key)) {
				var _v1 = $elm$core$Dict$getMin(right);
				if (_v1.$ === 'RBNode_elm_builtin') {
					var minKey = _v1.b;
					var minValue = _v1.c;
					return A5(
						$elm$core$Dict$balance,
						color,
						minKey,
						minValue,
						left,
						$elm$core$Dict$removeMin(right));
				} else {
					return $elm$core$Dict$RBEmpty_elm_builtin;
				}
			} else {
				return A5(
					$elm$core$Dict$balance,
					color,
					key,
					value,
					left,
					A2($elm$core$Dict$removeHelp, targetKey, right));
			}
		} else {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		}
	});
var $elm$core$Dict$remove = F2(
	function (key, dict) {
		var _v0 = A2($elm$core$Dict$removeHelp, key, dict);
		if ((_v0.$ === 'RBNode_elm_builtin') && (_v0.a.$ === 'Red')) {
			var _v1 = _v0.a;
			var k = _v0.b;
			var v = _v0.c;
			var l = _v0.d;
			var r = _v0.e;
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, k, v, l, r);
		} else {
			var x = _v0;
			return x;
		}
	});
var $elm$core$Dict$update = F3(
	function (targetKey, alter, dictionary) {
		var _v0 = alter(
			A2($elm$core$Dict$get, targetKey, dictionary));
		if (_v0.$ === 'Just') {
			var value = _v0.a;
			return A3($elm$core$Dict$insert, targetKey, value, dictionary);
		} else {
			return A2($elm$core$Dict$remove, targetKey, dictionary);
		}
	});
var $elm$core$Result$withDefault = F2(
	function (def, result) {
		if (result.$ === 'Ok') {
			var a = result.a;
			return a;
		} else {
			return def;
		}
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$toBatchResults = function () {
	var toBatchResults_ = A2(
		$elm$core$List$foldl,
		F2(
			function (result, batch_) {
				return A3(
					$elm$core$Dict$update,
					result.attemptId,
					function (attempt_) {
						if (attempt_.$ === 'Nothing') {
							return $elm$core$Maybe$Just(
								A2($elm$core$Dict$singleton, result.taskId, result.result));
						} else {
							var attempt__ = attempt_.a;
							return $elm$core$Maybe$Just(
								A3($elm$core$Dict$insert, result.taskId, result.result, attempt__));
						}
					},
					batch_);
			}),
		$elm$core$Dict$empty);
	return A2(
		$elm$core$Basics$composeR,
		$elm$json$Json$Decode$decodeValue(
			$elm$json$Json$Decode$list($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$decodeRawResult)),
		A2(
			$elm$core$Basics$composeR,
			$elm$core$Result$map(toBatchResults_),
			$elm$core$Result$withDefault($elm$core$Dict$empty)));
}();
var $elm$core$Array$filter = F2(
	function (isGood, array) {
		return $elm$core$Array$fromList(
			A3(
				$elm$core$Array$foldr,
				F2(
					function (x, xs) {
						return isGood(x) ? A2($elm$core$List$cons, x, xs) : xs;
					}),
				_List_Nil,
				array));
	});
var $elm$core$Dict$diff = F2(
	function (t1, t2) {
		return A3(
			$elm$core$Dict$foldl,
			F3(
				function (k, v, t) {
					return A2($elm$core$Dict$remove, k, t);
				}),
			t1,
			t2);
	});
var $elm$core$Set$diff = F2(
	function (_v0, _v1) {
		var dict1 = _v0.a;
		var dict2 = _v1.a;
		return $elm$core$Set$Set_elm_builtin(
			A2($elm$core$Dict$diff, dict1, dict2));
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$removeCompleted = F2(
	function (res, inFlight) {
		return A2(
			$elm$core$Set$diff,
			inFlight,
			$elm$core$Set$fromList(
				$elm$core$Dict$keys(res)));
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$removeFromPool = function (attemptId) {
	return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$mapPool(
		function (pool_) {
			return _Utils_update(
				pool_,
				{
					attempts: A2($elm$core$Dict$remove, attemptId, pool_.attempts)
				});
		});
};
var $elm$core$Basics$always = F2(
	function (a, _v0) {
		return a;
	});
var $elm$core$Maybe$map = F2(
	function (f, maybe) {
		if (maybe.$ === 'Just') {
			var value = maybe.a;
			return $elm$core$Maybe$Just(
				f(value));
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$updateProgressFor = F2(
	function (attemptId, progress_) {
		return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$mapPool(
			function (pool_) {
				return _Utils_update(
					pool_,
					{
						attempts: A3(
							$elm$core$Dict$update,
							attemptId,
							$elm$core$Maybe$map(
								$elm$core$Basics$always(progress_)),
							pool_.attempts)
					});
			});
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$updateAttempt = F4(
	function (options, pool_, _v0, progress) {
		var attemptId = _v0.a;
		var results = _v0.b;
		var _v1 = A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$stepTask, results, progress.task);
		if (_v1.b.$ === 'Pending') {
			var ids_ = _v1.a;
			var _v2 = _v1.b;
			var next_ = _v2.b;
			var notStarted = function (def) {
				return !A2($elm$core$Set$member, def.taskId, progress.inFlight);
			};
			var nextProgress = _Utils_Tuple2(ids_, next_);
			var _v3 = A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$stepTask, results, nextProgress);
			if (_v3.b.$ === 'Done') {
				var res = _v3.b.a;
				return _Utils_Tuple2(
					A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$removeFromPool, attemptId, pool_),
					A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$sendResult, progress.onComplete, res));
			} else {
				var _v4 = _v3.b;
				var defs = _v4.a;
				return _Utils_Tuple2(
					A3(
						$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$updateProgressFor,
						attemptId,
						_Utils_update(
							progress,
							{
								inFlight: A2(
									$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$removeCompleted,
									results,
									A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$recordSent, defs, progress.inFlight)),
								task: nextProgress
							}),
						pool_),
					options.send(
						A2(
							$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$encodeDefinitions,
							attemptId,
							A2($elm$core$Array$filter, notStarted, defs))));
			}
		} else {
			return _Utils_Tuple2(pool_, $elm$core$Platform$Cmd$none);
		}
	});
var $elm$core$Tuple$mapSecond = F2(
	function (func, _v0) {
		var x = _v0.a;
		var y = _v0.b;
		return _Utils_Tuple2(
			x,
			func(y));
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$withCmd = function (cmd) {
	return $elm$core$Tuple$mapSecond(
		function (c) {
			return $elm$core$Platform$Cmd$batch(
				_List_fromArray(
					[c, cmd]));
		});
};
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$onProgress = F2(
	function (options, pool_) {
		return options.receive(
			function (rawResults) {
				return options.onProgress(
					A3(
						$elm$core$List$foldl,
						F2(
							function (_v0, _v1) {
								var attempt_ = _v0.a;
								var results = _v0.b;
								var p = _v1.a;
								var cmd = _v1.b;
								var _v2 = A2($andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$findAttempt, attempt_, p);
								if (_v2.$ === 'Nothing') {
									return _Utils_Tuple2(p, cmd);
								} else {
									var progress = _v2.a;
									return A2(
										$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$withCmd,
										cmd,
										A4(
											$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$updateAttempt,
											options,
											p,
											_Utils_Tuple2(attempt_, results),
											progress));
								}
							}),
						_Utils_Tuple2(pool_, $elm$core$Platform$Cmd$none),
						$elm$core$Dict$toList(
							$andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$toBatchResults(rawResults))));
			});
	});
var $andrewMacmurray$elm_concurrent_task$ConcurrentTask$onProgress = $andrewMacmurray$elm_concurrent_task$ConcurrentTask$Internal$onProgress;
var $author$project$Main$receiveFromDb = _Platform_incomingPort('receiveFromDb', $elm$json$Json$Decode$value);
var $author$project$Main$subscriptions = function (app) {
	switch (app.$) {
		case 'StartupFailure':
			return $elm$core$Platform$Sub$none;
		case 'Initializing':
			var model = app.a;
			return A2(
				$andrewMacmurray$elm_concurrent_task$ConcurrentTask$onProgress,
				{onProgress: $author$project$Main$OnDbProgress, receive: $author$project$Main$receiveFromDb, send: $author$project$Main$sendToDb},
				model.dbTasks);
		default:
			var model = app.a;
			return A2(
				$andrewMacmurray$elm_concurrent_task$ConcurrentTask$onProgress,
				{onProgress: $author$project$Main$OnDbProgress, receive: $author$project$Main$receiveFromDb, send: $author$project$Main$sendToDb},
				model.dbTasks);
	}
};
var $author$project$Main$BehaviorCreateResponded = F2(
	function (a, b) {
		return {$: 'BehaviorCreateResponded', a: a, b: b};
	});
var $author$project$Main$BehaviorDeleteResponded = F2(
	function (a, b) {
		return {$: 'BehaviorDeleteResponded', a: a, b: b};
	});
var $author$project$Main$BehaviorImportResponded = F2(
	function (a, b) {
		return {$: 'BehaviorImportResponded', a: a, b: b};
	});
var $author$project$Main$BehaviorImported = F2(
	function (a, b) {
		return {$: 'BehaviorImported', a: a, b: b};
	});
var $author$project$Main$BehaviorSaveResponded = function (a) {
	return {$: 'BehaviorSaveResponded', a: a};
};
var $author$project$Main$FailedToSave = function (a) {
	return {$: 'FailedToSave', a: a};
};
var $author$project$Main$FilesImported = F2(
	function (a, b) {
		return {$: 'FilesImported', a: a, b: b};
	});
var $author$project$Main$Fresh = {$: 'Fresh'};
var $author$project$Main$GotToday = function (a) {
	return {$: 'GotToday', a: a};
};
var $author$project$Main$HomeRoute = {$: 'HomeRoute'};
var $author$project$Main$Initialized = function (a) {
	return {$: 'Initialized', a: a};
};
var $author$project$Main$ResistedBehaviorAt = F2(
	function (a, b) {
		return {$: 'ResistedBehaviorAt', a: a, b: b};
	});
var $author$project$Main$Saving = {$: 'Saving'};
var $author$project$Main$StartupFailure = {$: 'StartupFailure'};
var $author$project$Main$SubmittedToBehaviorAt = F2(
	function (a, b) {
		return {$: 'SubmittedToBehaviorAt', a: a, b: b};
	});
var $author$project$IndexedDb$CompoundKey = function (a) {
	return {$: 'CompoundKey', a: a};
};
var $author$project$IndexedDb$FloatKey = function (a) {
	return {$: 'FloatKey', a: a};
};
var $author$project$IndexedDb$IntKey = function (a) {
	return {$: 'IntKey', a: a};
};
var $author$project$IndexedDb$StringKey = function (a) {
	return {$: 'StringKey', a: a};
};
var $elm$json$Json$Decode$float = _Json_decodeFloat;
var $elm$json$Json$Decode$lazy = function (thunk) {
	return A2(
		$elm$json$Json$Decode$andThen,
		thunk,
		$elm$json$Json$Decode$succeed(_Utils_Tuple0));
};
function $author$project$IndexedDb$cyclic$keyDecoder() {
	return A2(
		$elm$json$Json$Decode$andThen,
		function (t) {
			switch (t) {
				case 'string':
					return A2(
						$elm$json$Json$Decode$map,
						$author$project$IndexedDb$StringKey,
						A2($elm$json$Json$Decode$field, 'value', $elm$json$Json$Decode$string));
				case 'int':
					return A2(
						$elm$json$Json$Decode$map,
						$author$project$IndexedDb$IntKey,
						A2($elm$json$Json$Decode$field, 'value', $elm$json$Json$Decode$int));
				case 'float':
					return A2(
						$elm$json$Json$Decode$map,
						$author$project$IndexedDb$FloatKey,
						A2($elm$json$Json$Decode$field, 'value', $elm$json$Json$Decode$float));
				case 'compound':
					return A2(
						$elm$json$Json$Decode$map,
						$author$project$IndexedDb$CompoundKey,
						A2(
							$elm$json$Json$Decode$field,
							'value',
							$elm$json$Json$Decode$list(
								$elm$json$Json$Decode$lazy(
									function (_v1) {
										return $author$project$IndexedDb$cyclic$keyDecoder();
									}))));
				default:
					return $elm$json$Json$Decode$fail('Unknown key type: ' + t);
			}
		},
		A2($elm$json$Json$Decode$field, 'type', $elm$json$Json$Decode$string));
}
try {
	var $author$project$IndexedDb$keyDecoder = $author$project$IndexedDb$cyclic$keyDecoder();
	$author$project$IndexedDb$cyclic$keyDecoder = function () {
		return $author$project$IndexedDb$keyDecoder;
	};
} catch ($) {
	throw 'Some top-level definitions from `IndexedDb` are causing infinite recursion:\n\n  ┌─────┐\n  │    keyDecoder\n  └─────┘\n\nThese errors are very tricky, so read https://elm-lang.org/0.19.1/bad-recursion to learn how to fix it!';}
var $author$project$IndexedDb$add = F3(
	function (db, store, value) {
		return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$define(
			{
				args: $elm$json$Json$Encode$object(
					_List_fromArray(
						[
							_Utils_Tuple2(
							'db',
							$elm$json$Json$Encode$string(
								$author$project$IndexedDb$getDbName(db))),
							_Utils_Tuple2(
							'store',
							$elm$json$Json$Encode$string(
								$author$project$IndexedDb$getStoreName(store))),
							_Utils_Tuple2('value', value)
						])),
				errors: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$expectErrors($author$project$IndexedDb$errorDecoder),
				expect: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$expectJson($author$project$IndexedDb$keyDecoder),
				_function: 'indexeddb:add'
			});
	});
var $elm$core$Basics$composeL = F3(
	function (g, f, x) {
		return g(
			f(x));
	});
var $elm$core$Task$onError = _Scheduler_onError;
var $elm$core$Task$attempt = F2(
	function (resultToMessage, task) {
		return $elm$core$Task$command(
			$elm$core$Task$Perform(
				A2(
					$elm$core$Task$onError,
					A2(
						$elm$core$Basics$composeL,
						A2($elm$core$Basics$composeL, $elm$core$Task$succeed, resultToMessage),
						$elm$core$Result$Err),
					A2(
						$elm$core$Task$andThen,
						A2(
							$elm$core$Basics$composeL,
							A2($elm$core$Basics$composeL, $elm$core$Task$succeed, resultToMessage),
							$elm$core$Result$Ok),
						task))));
	});
var $BrianHicks$elm_csv$Csv$Decode$FieldNamesFromFirstRow = {$: 'FieldNamesFromFirstRow'};
var $BrianHicks$elm_csv$Csv$Decode$Decoder = function (a) {
	return {$: 'Decoder', a: a};
};
var $elm$core$Result$andThen = F2(
	function (callback, result) {
		if (result.$ === 'Ok') {
			var value = result.a;
			return callback(value);
		} else {
			var msg = result.a;
			return $elm$core$Result$Err(msg);
		}
	});
var $BrianHicks$elm_csv$Csv$Decode$andThen = F2(
	function (next, _v0) {
		var first = _v0.a;
		return $BrianHicks$elm_csv$Csv$Decode$Decoder(
			F4(
				function (location, fieldNames, rowNum, row) {
					return A2(
						$elm$core$Result$andThen,
						function (nextValue) {
							var _v1 = next(nextValue);
							var _final = _v1.a;
							return A4(_final, location, fieldNames, rowNum, row);
						},
						A4(first, location, fieldNames, rowNum, row));
				}));
	});
var $BrianHicks$elm_csv$Csv$Decode$Column_ = function (a) {
	return {$: 'Column_', a: a};
};
var $BrianHicks$elm_csv$Csv$Decode$column = F2(
	function (col, _v0) {
		var decoder = _v0.a;
		return $BrianHicks$elm_csv$Csv$Decode$Decoder(
			F3(
				function (_v1, fieldNames, row) {
					return A3(
						decoder,
						$BrianHicks$elm_csv$Csv$Decode$Column_(col),
						fieldNames,
						row);
				}));
	});
var $BrianHicks$elm_csv$Csv$Decode$ParsingError = function (a) {
	return {$: 'ParsingError', a: a};
};
var $BrianHicks$elm_csv$Csv$Decode$DecodingErrors = function (a) {
	return {$: 'DecodingErrors', a: a};
};
var $BrianHicks$elm_csv$Csv$Decode$OnlyColumn_ = {$: 'OnlyColumn_'};
var $elm$core$List$append = F2(
	function (xs, ys) {
		if (!ys.b) {
			return xs;
		} else {
			return A3($elm$core$List$foldr, $elm$core$List$cons, ys, xs);
		}
	});
var $elm$core$List$concat = function (lists) {
	return A3($elm$core$List$foldr, $elm$core$List$append, _List_Nil, lists);
};
var $BrianHicks$elm_csv$Csv$Decode$NoFieldNamesOnFirstRow = {$: 'NoFieldNamesOnFirstRow'};
var $elm$core$String$trim = _String_trim;
var $BrianHicks$elm_csv$Csv$Decode$getFieldNames = F2(
	function (headers, rows) {
		var fromList = function (names) {
			return A3(
				$elm$core$List$foldl,
				F2(
					function (name, _v2) {
						var soFar = _v2.a;
						var i = _v2.b;
						return _Utils_Tuple2(
							A3($elm$core$Dict$insert, name, i, soFar),
							i + 1);
					}),
				_Utils_Tuple2($elm$core$Dict$empty, 0),
				names).a;
		};
		switch (headers.$) {
			case 'NoFieldNames':
				return $elm$core$Result$Ok(
					_Utils_Tuple3(
						{available: false, names: $elm$core$Dict$empty},
						0,
						rows));
			case 'CustomFieldNames':
				var names = headers.a;
				return $elm$core$Result$Ok(
					_Utils_Tuple3(
						{
							available: true,
							names: fromList(names)
						},
						0,
						rows));
			default:
				if (!rows.b) {
					return $elm$core$Result$Err($BrianHicks$elm_csv$Csv$Decode$NoFieldNamesOnFirstRow);
				} else {
					var first = rows.a;
					var rest = rows.b;
					return $elm$core$Result$Ok(
						_Utils_Tuple3(
							{
								available: true,
								names: fromList(
									A2($elm$core$List$map, $elm$core$String$trim, first))
							},
							1,
							rest));
				}
		}
	});
var $elm$core$Result$mapError = F2(
	function (f, result) {
		if (result.$ === 'Ok') {
			var v = result.a;
			return $elm$core$Result$Ok(v);
		} else {
			var e = result.a;
			return $elm$core$Result$Err(
				f(e));
		}
	});
var $BrianHicks$elm_csv$Csv$Decode$applyDecoder = F3(
	function (fieldNames, _v0, allRows) {
		var decode = _v0.a;
		var defaultLocation = $BrianHicks$elm_csv$Csv$Decode$OnlyColumn_;
		return A2(
			$elm$core$Result$andThen,
			function (_v1) {
				var resolvedNames = _v1.a;
				var firstRowNumber = _v1.b;
				var rows = _v1.c;
				return A2(
					$elm$core$Result$mapError,
					A2(
						$elm$core$Basics$composeL,
						A2($elm$core$Basics$composeL, $BrianHicks$elm_csv$Csv$Decode$DecodingErrors, $elm$core$List$concat),
						$elm$core$List$reverse),
					A2(
						$elm$core$Result$map,
						$elm$core$List$reverse,
						A3(
							$elm$core$List$foldl,
							F2(
								function (row, _v2) {
									var soFar = _v2.a;
									var rowNum = _v2.b;
									return _Utils_Tuple2(
										function () {
											var _v3 = A4(decode, defaultLocation, resolvedNames, rowNum, row);
											if (_v3.$ === 'Ok') {
												var val = _v3.a;
												if (soFar.$ === 'Ok') {
													var values = soFar.a;
													return $elm$core$Result$Ok(
														A2($elm$core$List$cons, val, values));
												} else {
													var errs = soFar.a;
													return $elm$core$Result$Err(errs);
												}
											} else {
												var err = _v3.a;
												if (soFar.$ === 'Ok') {
													return $elm$core$Result$Err(
														_List_fromArray(
															[err]));
												} else {
													var errs = soFar.a;
													return $elm$core$Result$Err(
														A2($elm$core$List$cons, err, errs));
												}
											}
										}(),
										rowNum + 1);
								}),
							_Utils_Tuple2(
								$elm$core$Result$Ok(_List_Nil),
								firstRowNumber),
							rows).a));
			},
			A2($BrianHicks$elm_csv$Csv$Decode$getFieldNames, fieldNames, allRows));
	});
var $BrianHicks$elm_csv$Csv$Parser$AdditionalCharactersAfterClosingQuote = function (a) {
	return {$: 'AdditionalCharactersAfterClosingQuote', a: a};
};
var $BrianHicks$elm_csv$Csv$Parser$SourceEndedWithoutClosingQuote = function (a) {
	return {$: 'SourceEndedWithoutClosingQuote', a: a};
};
var $elm$core$String$cons = _String_cons;
var $elm$core$String$fromChar = function (_char) {
	return A2($elm$core$String$cons, _char, '');
};
var $elm$core$Basics$ge = _Utils_ge;
var $BrianHicks$elm_csv$Csv$Parser$parse = F2(
	function (config, source) {
		var finalLength = $elm$core$String$length(source);
		var parseQuotedField = F4(
			function (isFieldSeparator, soFar, startOffset, endOffset) {
				parseQuotedField:
				while (true) {
					if ((endOffset - finalLength) >= 0) {
						return $elm$core$Result$Err($BrianHicks$elm_csv$Csv$Parser$SourceEndedWithoutClosingQuote);
					} else {
						if (A3($elm$core$String$slice, endOffset, endOffset + 1, source) === '\"') {
							var segment = A3($elm$core$String$slice, startOffset, endOffset, source);
							if (((endOffset + 1) - finalLength) >= 0) {
								return $elm$core$Result$Ok(
									_Utils_Tuple3(
										_Utils_ap(soFar, segment),
										endOffset + 1,
										false));
							} else {
								var next = A3($elm$core$String$slice, endOffset + 1, endOffset + 2, source);
								if (next === '\"') {
									var newPos = endOffset + 2;
									var $temp$isFieldSeparator = isFieldSeparator,
										$temp$soFar = soFar + (segment + '\"'),
										$temp$startOffset = newPos,
										$temp$endOffset = newPos;
									isFieldSeparator = $temp$isFieldSeparator;
									soFar = $temp$soFar;
									startOffset = $temp$startOffset;
									endOffset = $temp$endOffset;
									continue parseQuotedField;
								} else {
									if (isFieldSeparator(next)) {
										return $elm$core$Result$Ok(
											_Utils_Tuple3(
												_Utils_ap(soFar, segment),
												endOffset + 2,
												false));
									} else {
										if (next === '\n') {
											return $elm$core$Result$Ok(
												_Utils_Tuple3(
													_Utils_ap(soFar, segment),
													endOffset + 2,
													true));
										} else {
											if ((next === '\u000D') && (A3($elm$core$String$slice, endOffset + 2, endOffset + 3, source) === '\n')) {
												return $elm$core$Result$Ok(
													_Utils_Tuple3(
														_Utils_ap(soFar, segment),
														endOffset + 3,
														true));
											} else {
												return $elm$core$Result$Err($BrianHicks$elm_csv$Csv$Parser$AdditionalCharactersAfterClosingQuote);
											}
										}
									}
								}
							}
						} else {
							var $temp$isFieldSeparator = isFieldSeparator,
								$temp$soFar = soFar,
								$temp$startOffset = startOffset,
								$temp$endOffset = endOffset + 1;
							isFieldSeparator = $temp$isFieldSeparator;
							soFar = $temp$soFar;
							startOffset = $temp$startOffset;
							endOffset = $temp$endOffset;
							continue parseQuotedField;
						}
					}
				}
			});
		var parseComma = F4(
			function (row, rows, startOffset, endOffset) {
				parseComma:
				while (true) {
					if ((endOffset - finalLength) >= 0) {
						var finalField = A3($elm$core$String$slice, startOffset, endOffset, source);
						return ((finalField === '') && _Utils_eq(row, _List_Nil)) ? $elm$core$Result$Ok(
							$elm$core$List$reverse(rows)) : $elm$core$Result$Ok(
							$elm$core$List$reverse(
								A2(
									$elm$core$List$cons,
									$elm$core$List$reverse(
										A2($elm$core$List$cons, finalField, row)),
									rows)));
					} else {
						var first = A3($elm$core$String$slice, endOffset, endOffset + 1, source);
						if (first === ',') {
							var newPos = endOffset + 1;
							var $temp$row = A2(
								$elm$core$List$cons,
								A3($elm$core$String$slice, startOffset, endOffset, source),
								row),
								$temp$rows = rows,
								$temp$startOffset = newPos,
								$temp$endOffset = newPos;
							row = $temp$row;
							rows = $temp$rows;
							startOffset = $temp$startOffset;
							endOffset = $temp$endOffset;
							continue parseComma;
						} else {
							if (first === '\n') {
								var newPos = endOffset + 1;
								var $temp$row = _List_Nil,
									$temp$rows = A2(
									$elm$core$List$cons,
									$elm$core$List$reverse(
										A2(
											$elm$core$List$cons,
											A3($elm$core$String$slice, startOffset, endOffset, source),
											row)),
									rows),
									$temp$startOffset = newPos,
									$temp$endOffset = newPos;
								row = $temp$row;
								rows = $temp$rows;
								startOffset = $temp$startOffset;
								endOffset = $temp$endOffset;
								continue parseComma;
							} else {
								if ((first === '\u000D') && (A3($elm$core$String$slice, endOffset + 1, endOffset + 2, source) === '\n')) {
									var newPos = endOffset + 2;
									var $temp$row = _List_Nil,
										$temp$rows = A2(
										$elm$core$List$cons,
										$elm$core$List$reverse(
											A2(
												$elm$core$List$cons,
												A3($elm$core$String$slice, startOffset, endOffset, source),
												row)),
										rows),
										$temp$startOffset = newPos,
										$temp$endOffset = newPos;
									row = $temp$row;
									rows = $temp$rows;
									startOffset = $temp$startOffset;
									endOffset = $temp$endOffset;
									continue parseComma;
								} else {
									if (first === '\"') {
										var newPos = endOffset + 1;
										var _v0 = A4(
											parseQuotedField,
											function (c) {
												return c === ',';
											},
											'',
											newPos,
											newPos);
										if (_v0.$ === 'Ok') {
											var _v1 = _v0.a;
											var value = _v1.a;
											var afterQuotedField = _v1.b;
											var rowEnded = _v1.c;
											if (_Utils_cmp(afterQuotedField, finalLength) > -1) {
												return $elm$core$Result$Ok(
													$elm$core$List$reverse(
														A2(
															$elm$core$List$cons,
															$elm$core$List$reverse(
																A2($elm$core$List$cons, value, row)),
															rows)));
											} else {
												if (rowEnded) {
													var $temp$row = _List_Nil,
														$temp$rows = A2(
														$elm$core$List$cons,
														$elm$core$List$reverse(
															A2($elm$core$List$cons, value, row)),
														rows),
														$temp$startOffset = afterQuotedField,
														$temp$endOffset = afterQuotedField;
													row = $temp$row;
													rows = $temp$rows;
													startOffset = $temp$startOffset;
													endOffset = $temp$endOffset;
													continue parseComma;
												} else {
													var $temp$row = A2($elm$core$List$cons, value, row),
														$temp$rows = rows,
														$temp$startOffset = afterQuotedField,
														$temp$endOffset = afterQuotedField;
													row = $temp$row;
													rows = $temp$rows;
													startOffset = $temp$startOffset;
													endOffset = $temp$endOffset;
													continue parseComma;
												}
											}
										} else {
											var problem = _v0.a;
											return $elm$core$Result$Err(
												problem(
													$elm$core$List$length(rows) + 1));
										}
									} else {
										var $temp$row = row,
											$temp$rows = rows,
											$temp$startOffset = startOffset,
											$temp$endOffset = endOffset + 1;
										row = $temp$row;
										rows = $temp$rows;
										startOffset = $temp$startOffset;
										endOffset = $temp$endOffset;
										continue parseComma;
									}
								}
							}
						}
					}
				}
			});
		var parseHelp = F5(
			function (isFieldSeparator, row, rows, startOffset, endOffset) {
				parseHelp:
				while (true) {
					if ((endOffset - finalLength) >= 0) {
						var finalField = A3($elm$core$String$slice, startOffset, endOffset, source);
						return ((finalField === '') && _Utils_eq(row, _List_Nil)) ? $elm$core$Result$Ok(
							$elm$core$List$reverse(rows)) : $elm$core$Result$Ok(
							$elm$core$List$reverse(
								A2(
									$elm$core$List$cons,
									$elm$core$List$reverse(
										A2($elm$core$List$cons, finalField, row)),
									rows)));
					} else {
						var first = A3($elm$core$String$slice, endOffset, endOffset + 1, source);
						if (isFieldSeparator(first)) {
							var newPos = endOffset + 1;
							var $temp$isFieldSeparator = isFieldSeparator,
								$temp$row = A2(
								$elm$core$List$cons,
								A3($elm$core$String$slice, startOffset, endOffset, source),
								row),
								$temp$rows = rows,
								$temp$startOffset = newPos,
								$temp$endOffset = newPos;
							isFieldSeparator = $temp$isFieldSeparator;
							row = $temp$row;
							rows = $temp$rows;
							startOffset = $temp$startOffset;
							endOffset = $temp$endOffset;
							continue parseHelp;
						} else {
							if (first === '\n') {
								var newPos = endOffset + 1;
								var $temp$isFieldSeparator = isFieldSeparator,
									$temp$row = _List_Nil,
									$temp$rows = A2(
									$elm$core$List$cons,
									$elm$core$List$reverse(
										A2(
											$elm$core$List$cons,
											A3($elm$core$String$slice, startOffset, endOffset, source),
											row)),
									rows),
									$temp$startOffset = newPos,
									$temp$endOffset = newPos;
								isFieldSeparator = $temp$isFieldSeparator;
								row = $temp$row;
								rows = $temp$rows;
								startOffset = $temp$startOffset;
								endOffset = $temp$endOffset;
								continue parseHelp;
							} else {
								if ((first === '\u000D') && (A3($elm$core$String$slice, endOffset + 1, endOffset + 2, source) === '\n')) {
									var newPos = endOffset + 2;
									var $temp$isFieldSeparator = isFieldSeparator,
										$temp$row = _List_Nil,
										$temp$rows = A2(
										$elm$core$List$cons,
										$elm$core$List$reverse(
											A2(
												$elm$core$List$cons,
												A3($elm$core$String$slice, startOffset, endOffset, source),
												row)),
										rows),
										$temp$startOffset = newPos,
										$temp$endOffset = newPos;
									isFieldSeparator = $temp$isFieldSeparator;
									row = $temp$row;
									rows = $temp$rows;
									startOffset = $temp$startOffset;
									endOffset = $temp$endOffset;
									continue parseHelp;
								} else {
									if (first === '\"') {
										var newPos = endOffset + 1;
										var _v2 = A4(parseQuotedField, isFieldSeparator, '', newPos, newPos);
										if (_v2.$ === 'Ok') {
											var _v3 = _v2.a;
											var value = _v3.a;
											var afterQuotedField = _v3.b;
											var rowEnded = _v3.c;
											if (_Utils_cmp(afterQuotedField, finalLength) > -1) {
												return $elm$core$Result$Ok(
													$elm$core$List$reverse(
														A2(
															$elm$core$List$cons,
															$elm$core$List$reverse(
																A2($elm$core$List$cons, value, row)),
															rows)));
											} else {
												if (rowEnded) {
													var $temp$isFieldSeparator = isFieldSeparator,
														$temp$row = _List_Nil,
														$temp$rows = A2(
														$elm$core$List$cons,
														$elm$core$List$reverse(
															A2($elm$core$List$cons, value, row)),
														rows),
														$temp$startOffset = afterQuotedField,
														$temp$endOffset = afterQuotedField;
													isFieldSeparator = $temp$isFieldSeparator;
													row = $temp$row;
													rows = $temp$rows;
													startOffset = $temp$startOffset;
													endOffset = $temp$endOffset;
													continue parseHelp;
												} else {
													var $temp$isFieldSeparator = isFieldSeparator,
														$temp$row = A2($elm$core$List$cons, value, row),
														$temp$rows = rows,
														$temp$startOffset = afterQuotedField,
														$temp$endOffset = afterQuotedField;
													isFieldSeparator = $temp$isFieldSeparator;
													row = $temp$row;
													rows = $temp$rows;
													startOffset = $temp$startOffset;
													endOffset = $temp$endOffset;
													continue parseHelp;
												}
											}
										} else {
											var problem = _v2.a;
											return $elm$core$Result$Err(
												problem(
													$elm$core$List$length(rows) + 1));
										}
									} else {
										var $temp$isFieldSeparator = isFieldSeparator,
											$temp$row = row,
											$temp$rows = rows,
											$temp$startOffset = startOffset,
											$temp$endOffset = endOffset + 1;
										isFieldSeparator = $temp$isFieldSeparator;
										row = $temp$row;
										rows = $temp$rows;
										startOffset = $temp$startOffset;
										endOffset = $temp$endOffset;
										continue parseHelp;
									}
								}
							}
						}
					}
				}
			});
		var parseSemicolon = F4(
			function (row, rows, startOffset, endOffset) {
				parseSemicolon:
				while (true) {
					if ((endOffset - finalLength) >= 0) {
						var finalField = A3($elm$core$String$slice, startOffset, endOffset, source);
						return ((finalField === '') && _Utils_eq(row, _List_Nil)) ? $elm$core$Result$Ok(
							$elm$core$List$reverse(rows)) : $elm$core$Result$Ok(
							$elm$core$List$reverse(
								A2(
									$elm$core$List$cons,
									$elm$core$List$reverse(
										A2($elm$core$List$cons, finalField, row)),
									rows)));
					} else {
						var first = A3($elm$core$String$slice, endOffset, endOffset + 1, source);
						if (first === ';') {
							var newPos = endOffset + 1;
							var $temp$row = A2(
								$elm$core$List$cons,
								A3($elm$core$String$slice, startOffset, endOffset, source),
								row),
								$temp$rows = rows,
								$temp$startOffset = newPos,
								$temp$endOffset = newPos;
							row = $temp$row;
							rows = $temp$rows;
							startOffset = $temp$startOffset;
							endOffset = $temp$endOffset;
							continue parseSemicolon;
						} else {
							if (first === '\n') {
								var newPos = endOffset + 1;
								var $temp$row = _List_Nil,
									$temp$rows = A2(
									$elm$core$List$cons,
									$elm$core$List$reverse(
										A2(
											$elm$core$List$cons,
											A3($elm$core$String$slice, startOffset, endOffset, source),
											row)),
									rows),
									$temp$startOffset = newPos,
									$temp$endOffset = newPos;
								row = $temp$row;
								rows = $temp$rows;
								startOffset = $temp$startOffset;
								endOffset = $temp$endOffset;
								continue parseSemicolon;
							} else {
								if ((first === '\u000D') && (A3($elm$core$String$slice, endOffset + 1, endOffset + 2, source) === '\n')) {
									var newPos = endOffset + 2;
									var $temp$row = _List_Nil,
										$temp$rows = A2(
										$elm$core$List$cons,
										$elm$core$List$reverse(
											A2(
												$elm$core$List$cons,
												A3($elm$core$String$slice, startOffset, endOffset, source),
												row)),
										rows),
										$temp$startOffset = newPos,
										$temp$endOffset = newPos;
									row = $temp$row;
									rows = $temp$rows;
									startOffset = $temp$startOffset;
									endOffset = $temp$endOffset;
									continue parseSemicolon;
								} else {
									if (first === '\"') {
										var newPos = endOffset + 1;
										var _v4 = A4(
											parseQuotedField,
											function (c) {
												return c === ';';
											},
											'',
											newPos,
											newPos);
										if (_v4.$ === 'Ok') {
											var _v5 = _v4.a;
											var value = _v5.a;
											var afterQuotedField = _v5.b;
											var rowEnded = _v5.c;
											if (_Utils_cmp(afterQuotedField, finalLength) > -1) {
												return $elm$core$Result$Ok(
													$elm$core$List$reverse(
														A2(
															$elm$core$List$cons,
															$elm$core$List$reverse(
																A2($elm$core$List$cons, value, row)),
															rows)));
											} else {
												if (rowEnded) {
													var $temp$row = _List_Nil,
														$temp$rows = A2(
														$elm$core$List$cons,
														$elm$core$List$reverse(
															A2($elm$core$List$cons, value, row)),
														rows),
														$temp$startOffset = afterQuotedField,
														$temp$endOffset = afterQuotedField;
													row = $temp$row;
													rows = $temp$rows;
													startOffset = $temp$startOffset;
													endOffset = $temp$endOffset;
													continue parseSemicolon;
												} else {
													var $temp$row = A2($elm$core$List$cons, value, row),
														$temp$rows = rows,
														$temp$startOffset = afterQuotedField,
														$temp$endOffset = afterQuotedField;
													row = $temp$row;
													rows = $temp$rows;
													startOffset = $temp$startOffset;
													endOffset = $temp$endOffset;
													continue parseSemicolon;
												}
											}
										} else {
											var problem = _v4.a;
											return $elm$core$Result$Err(
												problem(
													$elm$core$List$length(rows) + 1));
										}
									} else {
										var $temp$row = row,
											$temp$rows = rows,
											$temp$startOffset = startOffset,
											$temp$endOffset = endOffset + 1;
										row = $temp$row;
										rows = $temp$rows;
										startOffset = $temp$startOffset;
										endOffset = $temp$endOffset;
										continue parseSemicolon;
									}
								}
							}
						}
					}
				}
			});
		var fieldSeparator = $elm$core$String$fromChar(config.fieldSeparator);
		return $elm$core$String$isEmpty(source) ? $elm$core$Result$Ok(_List_Nil) : (_Utils_eq(
			config.fieldSeparator,
			_Utils_chr(',')) ? A4(parseComma, _List_Nil, _List_Nil, 0, 0) : (_Utils_eq(
			config.fieldSeparator,
			_Utils_chr(';')) ? A4(parseSemicolon, _List_Nil, _List_Nil, 0, 0) : A5(
			parseHelp,
			function (s) {
				return _Utils_eq(s, fieldSeparator);
			},
			_List_Nil,
			_List_Nil,
			0,
			0)));
	});
var $BrianHicks$elm_csv$Csv$Decode$decodeCustom = F4(
	function (config, fieldNames, decoder, source) {
		return A2(
			$elm$core$Result$andThen,
			A2($BrianHicks$elm_csv$Csv$Decode$applyDecoder, fieldNames, decoder),
			A2(
				$elm$core$Result$mapError,
				$BrianHicks$elm_csv$Csv$Decode$ParsingError,
				A2($BrianHicks$elm_csv$Csv$Parser$parse, config, source)));
	});
var $BrianHicks$elm_csv$Csv$Decode$decodeCsv = $BrianHicks$elm_csv$Csv$Decode$decodeCustom(
	{
		fieldSeparator: _Utils_chr(',')
	});
var $BrianHicks$elm_csv$Csv$Decode$Failure = function (a) {
	return {$: 'Failure', a: a};
};
var $BrianHicks$elm_csv$Csv$Decode$FieldDecodingError = function (a) {
	return {$: 'FieldDecodingError', a: a};
};
var $BrianHicks$elm_csv$Csv$Decode$Column = function (a) {
	return {$: 'Column', a: a};
};
var $BrianHicks$elm_csv$Csv$Decode$Field = F2(
	function (a, b) {
		return {$: 'Field', a: a, b: b};
	});
var $BrianHicks$elm_csv$Csv$Decode$OnlyColumn = {$: 'OnlyColumn'};
var $BrianHicks$elm_csv$Csv$Decode$locationToColumn = F2(
	function (fieldNames, location) {
		switch (location.$) {
			case 'Column_':
				var i = location.a;
				return $BrianHicks$elm_csv$Csv$Decode$Column(i);
			case 'Field_':
				var name = location.a;
				return A2(
					$BrianHicks$elm_csv$Csv$Decode$Field,
					name,
					A2($elm$core$Dict$get, name, fieldNames));
			default:
				return $BrianHicks$elm_csv$Csv$Decode$OnlyColumn;
		}
	});
var $BrianHicks$elm_csv$Csv$Decode$fail = function (message) {
	return $BrianHicks$elm_csv$Csv$Decode$Decoder(
		F4(
			function (location, _v0, rowNum, _v1) {
				var names = _v0.names;
				return $elm$core$Result$Err(
					_List_fromArray(
						[
							$BrianHicks$elm_csv$Csv$Decode$FieldDecodingError(
							{
								column: A2($BrianHicks$elm_csv$Csv$Decode$locationToColumn, names, location),
								problem: $BrianHicks$elm_csv$Csv$Decode$Failure(message),
								row: rowNum
							})
						]));
			}));
};
var $BrianHicks$elm_csv$Csv$Decode$succeed = function (value) {
	return $BrianHicks$elm_csv$Csv$Decode$Decoder(
		F4(
			function (_v0, _v1, _v2, _v3) {
				return $elm$core$Result$Ok(value);
			}));
};
var $BrianHicks$elm_csv$Csv$Decode$fromMaybe = F2(
	function (problem, maybe) {
		if (maybe.$ === 'Just') {
			var value = maybe.a;
			return $BrianHicks$elm_csv$Csv$Decode$succeed(value);
		} else {
			return $BrianHicks$elm_csv$Csv$Decode$fail(problem);
		}
	});
var $elm$time$Time$Apr = {$: 'Apr'};
var $elm$time$Time$Aug = {$: 'Aug'};
var $elm$time$Time$Dec = {$: 'Dec'};
var $elm$time$Time$Feb = {$: 'Feb'};
var $elm$time$Time$Jan = {$: 'Jan'};
var $elm$time$Time$Jul = {$: 'Jul'};
var $elm$time$Time$Jun = {$: 'Jun'};
var $elm$time$Time$Mar = {$: 'Mar'};
var $elm$time$Time$May = {$: 'May'};
var $elm$time$Time$Nov = {$: 'Nov'};
var $elm$time$Time$Oct = {$: 'Oct'};
var $elm$time$Time$Sep = {$: 'Sep'};
var $author$project$Main$monthFromIntStr = function (str) {
	switch (str) {
		case '1':
			return $elm$core$Maybe$Just($elm$time$Time$Jan);
		case '2':
			return $elm$core$Maybe$Just($elm$time$Time$Feb);
		case '3':
			return $elm$core$Maybe$Just($elm$time$Time$Mar);
		case '4':
			return $elm$core$Maybe$Just($elm$time$Time$Apr);
		case '5':
			return $elm$core$Maybe$Just($elm$time$Time$May);
		case '6':
			return $elm$core$Maybe$Just($elm$time$Time$Jun);
		case '7':
			return $elm$core$Maybe$Just($elm$time$Time$Jul);
		case '8':
			return $elm$core$Maybe$Just($elm$time$Time$Aug);
		case '9':
			return $elm$core$Maybe$Just($elm$time$Time$Sep);
		case '10':
			return $elm$core$Maybe$Just($elm$time$Time$Oct);
		case '11':
			return $elm$core$Maybe$Just($elm$time$Time$Nov);
		case '12':
			return $elm$core$Maybe$Just($elm$time$Time$Dec);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$Basics$clamp = F3(
	function (low, high, number) {
		return (_Utils_cmp(number, low) < 0) ? low : ((_Utils_cmp(number, high) > 0) ? high : number);
	});
var $justinmimbs$date$Date$RD = function (a) {
	return {$: 'RD', a: a};
};
var $elm$core$Basics$modBy = _Basics_modBy;
var $justinmimbs$date$Date$isLeapYear = function (y) {
	return ((!A2($elm$core$Basics$modBy, 4, y)) && (!(!A2($elm$core$Basics$modBy, 100, y)))) || (!A2($elm$core$Basics$modBy, 400, y));
};
var $justinmimbs$date$Date$daysBeforeMonth = F2(
	function (y, m) {
		var leapDays = $justinmimbs$date$Date$isLeapYear(y) ? 1 : 0;
		switch (m.$) {
			case 'Jan':
				return 0;
			case 'Feb':
				return 31;
			case 'Mar':
				return 59 + leapDays;
			case 'Apr':
				return 90 + leapDays;
			case 'May':
				return 120 + leapDays;
			case 'Jun':
				return 151 + leapDays;
			case 'Jul':
				return 181 + leapDays;
			case 'Aug':
				return 212 + leapDays;
			case 'Sep':
				return 243 + leapDays;
			case 'Oct':
				return 273 + leapDays;
			case 'Nov':
				return 304 + leapDays;
			default:
				return 334 + leapDays;
		}
	});
var $justinmimbs$date$Date$floorDiv = F2(
	function (a, b) {
		return $elm$core$Basics$floor(a / b);
	});
var $justinmimbs$date$Date$daysBeforeYear = function (y1) {
	var y = y1 - 1;
	var leapYears = (A2($justinmimbs$date$Date$floorDiv, y, 4) - A2($justinmimbs$date$Date$floorDiv, y, 100)) + A2($justinmimbs$date$Date$floorDiv, y, 400);
	return (365 * y) + leapYears;
};
var $justinmimbs$date$Date$daysInMonth = F2(
	function (y, m) {
		switch (m.$) {
			case 'Jan':
				return 31;
			case 'Feb':
				return $justinmimbs$date$Date$isLeapYear(y) ? 29 : 28;
			case 'Mar':
				return 31;
			case 'Apr':
				return 30;
			case 'May':
				return 31;
			case 'Jun':
				return 30;
			case 'Jul':
				return 31;
			case 'Aug':
				return 31;
			case 'Sep':
				return 30;
			case 'Oct':
				return 31;
			case 'Nov':
				return 30;
			default:
				return 31;
		}
	});
var $justinmimbs$date$Date$fromCalendarDate = F3(
	function (y, m, d) {
		return $justinmimbs$date$Date$RD(
			($justinmimbs$date$Date$daysBeforeYear(y) + A2($justinmimbs$date$Date$daysBeforeMonth, y, m)) + A3(
				$elm$core$Basics$clamp,
				1,
				A2($justinmimbs$date$Date$daysInMonth, y, m),
				d));
	});
var $justinmimbs$date$Date$toRataDie = function (_v0) {
	var rd = _v0.a;
	return rd;
};
var $justinmimbs$time_extra$Time$Extra$dateToMillis = function (date) {
	var daysSinceEpoch = $justinmimbs$date$Date$toRataDie(date) - 719163;
	return daysSinceEpoch * 86400000;
};
var $elm$time$Time$flooredDiv = F2(
	function (numerator, denominator) {
		return $elm$core$Basics$floor(numerator / denominator);
	});
var $elm$time$Time$posixToMillis = function (_v0) {
	var millis = _v0.a;
	return millis;
};
var $elm$time$Time$toAdjustedMinutesHelp = F3(
	function (defaultOffset, posixMinutes, eras) {
		toAdjustedMinutesHelp:
		while (true) {
			if (!eras.b) {
				return posixMinutes + defaultOffset;
			} else {
				var era = eras.a;
				var olderEras = eras.b;
				if (_Utils_cmp(era.start, posixMinutes) < 0) {
					return posixMinutes + era.offset;
				} else {
					var $temp$defaultOffset = defaultOffset,
						$temp$posixMinutes = posixMinutes,
						$temp$eras = olderEras;
					defaultOffset = $temp$defaultOffset;
					posixMinutes = $temp$posixMinutes;
					eras = $temp$eras;
					continue toAdjustedMinutesHelp;
				}
			}
		}
	});
var $elm$time$Time$toAdjustedMinutes = F2(
	function (_v0, time) {
		var defaultOffset = _v0.a;
		var eras = _v0.b;
		return A3(
			$elm$time$Time$toAdjustedMinutesHelp,
			defaultOffset,
			A2(
				$elm$time$Time$flooredDiv,
				$elm$time$Time$posixToMillis(time),
				60000),
			eras);
	});
var $elm$time$Time$toCivil = function (minutes) {
	var rawDay = A2($elm$time$Time$flooredDiv, minutes, 60 * 24) + 719468;
	var era = (((rawDay >= 0) ? rawDay : (rawDay - 146096)) / 146097) | 0;
	var dayOfEra = rawDay - (era * 146097);
	var yearOfEra = ((((dayOfEra - ((dayOfEra / 1460) | 0)) + ((dayOfEra / 36524) | 0)) - ((dayOfEra / 146096) | 0)) / 365) | 0;
	var dayOfYear = dayOfEra - (((365 * yearOfEra) + ((yearOfEra / 4) | 0)) - ((yearOfEra / 100) | 0));
	var mp = (((5 * dayOfYear) + 2) / 153) | 0;
	var month = mp + ((mp < 10) ? 3 : (-9));
	var year = yearOfEra + (era * 400);
	return {
		day: (dayOfYear - ((((153 * mp) + 2) / 5) | 0)) + 1,
		month: month,
		year: year + ((month <= 2) ? 1 : 0)
	};
};
var $elm$time$Time$toDay = F2(
	function (zone, time) {
		return $elm$time$Time$toCivil(
			A2($elm$time$Time$toAdjustedMinutes, zone, time)).day;
	});
var $elm$time$Time$toMonth = F2(
	function (zone, time) {
		var _v0 = $elm$time$Time$toCivil(
			A2($elm$time$Time$toAdjustedMinutes, zone, time)).month;
		switch (_v0) {
			case 1:
				return $elm$time$Time$Jan;
			case 2:
				return $elm$time$Time$Feb;
			case 3:
				return $elm$time$Time$Mar;
			case 4:
				return $elm$time$Time$Apr;
			case 5:
				return $elm$time$Time$May;
			case 6:
				return $elm$time$Time$Jun;
			case 7:
				return $elm$time$Time$Jul;
			case 8:
				return $elm$time$Time$Aug;
			case 9:
				return $elm$time$Time$Sep;
			case 10:
				return $elm$time$Time$Oct;
			case 11:
				return $elm$time$Time$Nov;
			default:
				return $elm$time$Time$Dec;
		}
	});
var $elm$time$Time$toYear = F2(
	function (zone, time) {
		return $elm$time$Time$toCivil(
			A2($elm$time$Time$toAdjustedMinutes, zone, time)).year;
	});
var $justinmimbs$date$Date$fromPosix = F2(
	function (zone, posix) {
		return A3(
			$justinmimbs$date$Date$fromCalendarDate,
			A2($elm$time$Time$toYear, zone, posix),
			A2($elm$time$Time$toMonth, zone, posix),
			A2($elm$time$Time$toDay, zone, posix));
	});
var $justinmimbs$time_extra$Time$Extra$timeFromClock = F4(
	function (hour, minute, second, millisecond) {
		return (((hour * 3600000) + (minute * 60000)) + (second * 1000)) + millisecond;
	});
var $elm$time$Time$toHour = F2(
	function (zone, time) {
		return A2(
			$elm$core$Basics$modBy,
			24,
			A2(
				$elm$time$Time$flooredDiv,
				A2($elm$time$Time$toAdjustedMinutes, zone, time),
				60));
	});
var $elm$time$Time$toMillis = F2(
	function (_v0, time) {
		return A2(
			$elm$core$Basics$modBy,
			1000,
			$elm$time$Time$posixToMillis(time));
	});
var $elm$time$Time$toMinute = F2(
	function (zone, time) {
		return A2(
			$elm$core$Basics$modBy,
			60,
			A2($elm$time$Time$toAdjustedMinutes, zone, time));
	});
var $elm$time$Time$toSecond = F2(
	function (_v0, time) {
		return A2(
			$elm$core$Basics$modBy,
			60,
			A2(
				$elm$time$Time$flooredDiv,
				$elm$time$Time$posixToMillis(time),
				1000));
	});
var $justinmimbs$time_extra$Time$Extra$timeFromPosix = F2(
	function (zone, posix) {
		return A4(
			$justinmimbs$time_extra$Time$Extra$timeFromClock,
			A2($elm$time$Time$toHour, zone, posix),
			A2($elm$time$Time$toMinute, zone, posix),
			A2($elm$time$Time$toSecond, zone, posix),
			A2($elm$time$Time$toMillis, zone, posix));
	});
var $justinmimbs$time_extra$Time$Extra$toOffset = F2(
	function (zone, posix) {
		var millis = $elm$time$Time$posixToMillis(posix);
		var localMillis = $justinmimbs$time_extra$Time$Extra$dateToMillis(
			A2($justinmimbs$date$Date$fromPosix, zone, posix)) + A2($justinmimbs$time_extra$Time$Extra$timeFromPosix, zone, posix);
		return ((localMillis - millis) / 60000) | 0;
	});
var $justinmimbs$time_extra$Time$Extra$posixFromDateTime = F3(
	function (zone, date, time) {
		var millis = $justinmimbs$time_extra$Time$Extra$dateToMillis(date) + time;
		var offset0 = A2(
			$justinmimbs$time_extra$Time$Extra$toOffset,
			zone,
			$elm$time$Time$millisToPosix(millis));
		var posix1 = $elm$time$Time$millisToPosix(millis - (offset0 * 60000));
		var offset1 = A2($justinmimbs$time_extra$Time$Extra$toOffset, zone, posix1);
		if (_Utils_eq(offset0, offset1)) {
			return posix1;
		} else {
			var posix2 = $elm$time$Time$millisToPosix(millis - (offset1 * 60000));
			var offset2 = A2($justinmimbs$time_extra$Time$Extra$toOffset, zone, posix2);
			return _Utils_eq(offset1, offset2) ? posix2 : posix1;
		}
	});
var $justinmimbs$time_extra$Time$Extra$partsToPosix = F2(
	function (zone, _v0) {
		var year = _v0.year;
		var month = _v0.month;
		var day = _v0.day;
		var hour = _v0.hour;
		var minute = _v0.minute;
		var second = _v0.second;
		var millisecond = _v0.millisecond;
		return A3(
			$justinmimbs$time_extra$Time$Extra$posixFromDateTime,
			zone,
			A3($justinmimbs$date$Date$fromCalendarDate, year, month, day),
			A4(
				$justinmimbs$time_extra$Time$Extra$timeFromClock,
				A3($elm$core$Basics$clamp, 0, 23, hour),
				A3($elm$core$Basics$clamp, 0, 59, minute),
				A3($elm$core$Basics$clamp, 0, 59, second),
				A3($elm$core$Basics$clamp, 0, 999, millisecond)));
	});
var $elm$core$String$toUpper = _String_toUpper;
var $author$project$Main$importDateOParser = F2(
	function (zone, timestamp) {
		var _v0 = A2(
			$elm$core$String$split,
			' ',
			$elm$core$String$trim(timestamp));
		if (((_v0.b && _v0.b.b) && _v0.b.b.b) && (!_v0.b.b.b.b)) {
			var date = _v0.a;
			var _v1 = _v0.b;
			var time = _v1.a;
			var _v2 = _v1.b;
			var amPm = _v2.a;
			var _v3 = A2($elm$core$String$split, '/', date);
			if (((_v3.b && _v3.b.b) && _v3.b.b.b) && (!_v3.b.b.b.b)) {
				var dayStr = _v3.a;
				var _v4 = _v3.b;
				var monthStr = _v4.a;
				var _v5 = _v4.b;
				var yearStr = _v5.a;
				var _v6 = _Utils_Tuple3(
					$elm$core$String$toInt(dayStr),
					$author$project$Main$monthFromIntStr(monthStr),
					$elm$core$String$toInt(yearStr));
				if (((_v6.a.$ === 'Just') && (_v6.b.$ === 'Just')) && (_v6.c.$ === 'Just')) {
					var day = _v6.a.a;
					var month = _v6.b.a;
					var year = _v6.c.a;
					var _v7 = A2($elm$core$String$split, ':', time);
					if ((_v7.b && _v7.b.b) && (!_v7.b.b.b)) {
						var hourStr = _v7.a;
						var _v8 = _v7.b;
						var minStr = _v8.a;
						var _v9 = _Utils_Tuple2(
							$elm$core$String$toInt(hourStr),
							$elm$core$String$toInt(minStr));
						if ((_v9.a.$ === 'Just') && (_v9.b.$ === 'Just')) {
							var hour = _v9.a.a;
							var minute = _v9.b.a;
							var _v10 = $elm$core$String$toUpper(amPm);
							switch (_v10) {
								case 'AM':
									return $elm$core$Maybe$Just(
										A2(
											$justinmimbs$time_extra$Time$Extra$partsToPosix,
											zone,
											{day: day, hour: hour, millisecond: 0, minute: minute, month: month, second: 0, year: year}));
								case 'PM':
									return $elm$core$Maybe$Just(
										A2(
											$justinmimbs$time_extra$Time$Extra$partsToPosix,
											zone,
											{day: day, hour: hour + 12, millisecond: 0, minute: minute, month: month, second: 0, year: year}));
								default:
									return $elm$core$Maybe$Nothing;
							}
						} else {
							return $elm$core$Maybe$Nothing;
						}
					} else {
						return $elm$core$Maybe$Nothing;
					}
				} else {
					return $elm$core$Maybe$Nothing;
				}
			} else {
				return $elm$core$Maybe$Nothing;
			}
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $BrianHicks$elm_csv$Csv$Decode$map = F2(
	function (transform, _v0) {
		var decoder = _v0.a;
		return $BrianHicks$elm_csv$Csv$Decode$Decoder(
			F4(
				function (location, fieldNames, rowNum, row) {
					return A2(
						$elm$core$Result$map,
						transform,
						A4(decoder, location, fieldNames, rowNum, row));
				}));
	});
var $BrianHicks$elm_csv$Csv$Decode$map3 = F4(
	function (transform, _v0, _v1, _v2) {
		var decodeA = _v0.a;
		var decodeB = _v1.a;
		var decodeC = _v2.a;
		return $BrianHicks$elm_csv$Csv$Decode$Decoder(
			F4(
				function (location, fieldNames, rowNum, row) {
					var _v3 = _Utils_Tuple3(
						A4(decodeA, location, fieldNames, rowNum, row),
						A4(decodeB, location, fieldNames, rowNum, row),
						A4(decodeC, location, fieldNames, rowNum, row));
					if (_v3.a.$ === 'Ok') {
						if (_v3.b.$ === 'Ok') {
							if (_v3.c.$ === 'Ok') {
								var a = _v3.a.a;
								var b = _v3.b.a;
								var c = _v3.c.a;
								return $elm$core$Result$Ok(
									A3(transform, a, b, c));
							} else {
								var c = _v3.c.a;
								return $elm$core$Result$Err(c);
							}
						} else {
							if (_v3.c.$ === 'Err') {
								var b = _v3.b.a;
								var c = _v3.c.a;
								return $elm$core$Result$Err(
									_Utils_ap(b, c));
							} else {
								var b = _v3.b.a;
								return $elm$core$Result$Err(b);
							}
						}
					} else {
						if (_v3.b.$ === 'Err') {
							if (_v3.c.$ === 'Err') {
								var a = _v3.a.a;
								var b = _v3.b.a;
								var c = _v3.c.a;
								return $elm$core$Result$Err(
									_Utils_ap(
										a,
										_Utils_ap(b, c)));
							} else {
								var a = _v3.a.a;
								var b = _v3.b.a;
								return $elm$core$Result$Err(
									_Utils_ap(a, b));
							}
						} else {
							if (_v3.c.$ === 'Err') {
								var a = _v3.a.a;
								var c = _v3.c.a;
								return $elm$core$Result$Err(
									_Utils_ap(a, c));
							} else {
								var a = _v3.a.a;
								return $elm$core$Result$Err(a);
							}
						}
					}
				}));
	});
var $BrianHicks$elm_csv$Csv$Decode$ColumnNotFound = function (a) {
	return {$: 'ColumnNotFound', a: a};
};
var $BrianHicks$elm_csv$Csv$Decode$ExpectedOneColumn = function (a) {
	return {$: 'ExpectedOneColumn', a: a};
};
var $BrianHicks$elm_csv$Csv$Decode$FieldNotFound = function (a) {
	return {$: 'FieldNotFound', a: a};
};
var $BrianHicks$elm_csv$Csv$Decode$FieldNotProvided = function (a) {
	return {$: 'FieldNotProvided', a: a};
};
var $elm$core$List$drop = F2(
	function (n, list) {
		drop:
		while (true) {
			if (n <= 0) {
				return list;
			} else {
				if (!list.b) {
					return list;
				} else {
					var x = list.a;
					var xs = list.b;
					var $temp$n = n - 1,
						$temp$list = xs;
					n = $temp$n;
					list = $temp$list;
					continue drop;
				}
			}
		}
	});
var $elm$core$List$head = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(x);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $BrianHicks$elm_csv$Csv$Decode$fromString = function (convert) {
	return $BrianHicks$elm_csv$Csv$Decode$Decoder(
		F4(
			function (location, _v0, rowNum, row) {
				var names = _v0.names;
				var error = function (problem) {
					return $elm$core$Result$Err(
						_List_fromArray(
							[
								$BrianHicks$elm_csv$Csv$Decode$FieldDecodingError(
								{
									column: A2($BrianHicks$elm_csv$Csv$Decode$locationToColumn, names, location),
									problem: problem,
									row: rowNum
								})
							]));
				};
				switch (location.$) {
					case 'Column_':
						var colNum = location.a;
						var _v2 = $elm$core$List$head(
							A2($elm$core$List$drop, colNum, row));
						if (_v2.$ === 'Just') {
							var value = _v2.a;
							var _v3 = convert(value);
							if (_v3.$ === 'Ok') {
								var converted = _v3.a;
								return $elm$core$Result$Ok(converted);
							} else {
								var problem = _v3.a;
								return error(problem);
							}
						} else {
							return error(
								$BrianHicks$elm_csv$Csv$Decode$ColumnNotFound(colNum));
						}
					case 'Field_':
						var name = location.a;
						var _v4 = A2($elm$core$Dict$get, name, names);
						if (_v4.$ === 'Just') {
							var colNum = _v4.a;
							var _v5 = $elm$core$List$head(
								A2($elm$core$List$drop, colNum, row));
							if (_v5.$ === 'Just') {
								var value = _v5.a;
								var _v6 = convert(value);
								if (_v6.$ === 'Ok') {
									var converted = _v6.a;
									return $elm$core$Result$Ok(converted);
								} else {
									var problem = _v6.a;
									return error(problem);
								}
							} else {
								return error(
									$BrianHicks$elm_csv$Csv$Decode$FieldNotFound(name));
							}
						} else {
							return $elm$core$Result$Err(
								_List_fromArray(
									[
										$BrianHicks$elm_csv$Csv$Decode$FieldNotProvided(name)
									]));
						}
					default:
						if (!row.b) {
							return error(
								$BrianHicks$elm_csv$Csv$Decode$ColumnNotFound(0));
						} else {
							if (!row.b.b) {
								var only = row.a;
								var _v8 = convert(only);
								if (_v8.$ === 'Ok') {
									var converted = _v8.a;
									return $elm$core$Result$Ok(converted);
								} else {
									var problem = _v8.a;
									return error(problem);
								}
							} else {
								return error(
									$BrianHicks$elm_csv$Csv$Decode$ExpectedOneColumn(
										$elm$core$List$length(row)));
							}
						}
				}
			}));
};
var $BrianHicks$elm_csv$Csv$Decode$string = $BrianHicks$elm_csv$Csv$Decode$fromString($elm$core$Result$Ok);
var $author$project$Main$csvDecoder = function (zone) {
	return A2(
		$BrianHicks$elm_csv$Csv$Decode$decodeCsv,
		$BrianHicks$elm_csv$Csv$Decode$FieldNamesFromFirstRow,
		A4(
			$BrianHicks$elm_csv$Csv$Decode$map3,
			F3(
				function (date, submit, resist) {
					return _Utils_Tuple3(date, submit, resist);
				}),
			A2(
				$BrianHicks$elm_csv$Csv$Decode$column,
				0,
				A2(
					$BrianHicks$elm_csv$Csv$Decode$andThen,
					function (dateStr) {
						return A2(
							$BrianHicks$elm_csv$Csv$Decode$fromMaybe,
							'Expected a date in the format M/D/YYYY H:M AM',
							A2($author$project$Main$importDateOParser, zone, dateStr));
					},
					$BrianHicks$elm_csv$Csv$Decode$string)),
			A2(
				$BrianHicks$elm_csv$Csv$Decode$column,
				1,
				A2(
					$BrianHicks$elm_csv$Csv$Decode$map,
					function (submit) {
						return !$elm$core$String$isEmpty(submit);
					},
					$BrianHicks$elm_csv$Csv$Decode$string)),
			A2(
				$BrianHicks$elm_csv$Csv$Decode$column,
				1,
				A2(
					$BrianHicks$elm_csv$Csv$Decode$map,
					function (resist) {
						return !$elm$core$String$isEmpty(resist);
					},
					$BrianHicks$elm_csv$Csv$Decode$string))));
};
var $elm$json$Json$Encode$float = _Json_wrap;
var $author$project$IndexedDb$encodeKey = function (key) {
	switch (key.$) {
		case 'StringKey':
			var s = key.a;
			return $elm$json$Json$Encode$object(
				_List_fromArray(
					[
						_Utils_Tuple2(
						'type',
						$elm$json$Json$Encode$string('string')),
						_Utils_Tuple2(
						'value',
						$elm$json$Json$Encode$string(s))
					]));
		case 'IntKey':
			var i = key.a;
			return $elm$json$Json$Encode$object(
				_List_fromArray(
					[
						_Utils_Tuple2(
						'type',
						$elm$json$Json$Encode$string('int')),
						_Utils_Tuple2(
						'value',
						$elm$json$Json$Encode$int(i))
					]));
		case 'FloatKey':
			var f = key.a;
			return $elm$json$Json$Encode$object(
				_List_fromArray(
					[
						_Utils_Tuple2(
						'type',
						$elm$json$Json$Encode$string('float')),
						_Utils_Tuple2(
						'value',
						$elm$json$Json$Encode$float(f))
					]));
		default:
			var keys = key.a;
			return $elm$json$Json$Encode$object(
				_List_fromArray(
					[
						_Utils_Tuple2(
						'type',
						$elm$json$Json$Encode$string('compound')),
						_Utils_Tuple2(
						'value',
						A2($elm$json$Json$Encode$list, $author$project$IndexedDb$encodeKey, keys))
					]));
	}
};
var $author$project$IndexedDb$delete = F3(
	function (db, store, key) {
		return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$define(
			{
				args: $elm$json$Json$Encode$object(
					_List_fromArray(
						[
							_Utils_Tuple2(
							'db',
							$elm$json$Json$Encode$string(
								$author$project$IndexedDb$getDbName(db))),
							_Utils_Tuple2(
							'store',
							$elm$json$Json$Encode$string(
								$author$project$IndexedDb$getStoreName(store))),
							_Utils_Tuple2(
							'key',
							$author$project$IndexedDb$encodeKey(key))
						])),
				errors: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$expectErrors($author$project$IndexedDb$errorDecoder),
				expect: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$expectWhatever,
				_function: 'indexeddb:delete'
			});
	});
var $author$project$Main$doDbTask = F2(
	function (onComplete, task) {
		return A2(
			$andrewMacmurray$elm_concurrent_task$ConcurrentTask$attempt,
			{onComplete: onComplete, pool: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$pool, send: $author$project$Main$sendToDb},
			task);
	});
var $elm$core$Dict$fromList = function (assocs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, dict) {
				var key = _v0.a;
				var value = _v0.b;
				return A3($elm$core$Dict$insert, key, value, dict);
			}),
		$elm$core$Dict$empty,
		assocs);
};
var $elm$core$Dict$map = F2(
	function (func, dict) {
		if (dict.$ === 'RBEmpty_elm_builtin') {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		} else {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				key,
				A2(func, key, value),
				A2($elm$core$Dict$map, func, left),
				A2($elm$core$Dict$map, func, right));
		}
	});
var $elm$core$List$sortBy = _List_sortBy;
var $elm$core$List$sum = function (numbers) {
	return A3($elm$core$List$foldl, $elm$core$Basics$add, 0, numbers);
};
var $elm$core$Maybe$withDefault = F2(
	function (_default, maybe) {
		if (maybe.$ === 'Just') {
			var value = maybe.a;
			return value;
		} else {
			return _default;
		}
	});
var $BrianHicks$elm_csv$Csv$Encode$encodeItems = F2(
	function (encoder, rows) {
		if (encoder.$ === 'WithFieldNames') {
			var convert = encoder.a;
			var _v1 = A3(
				$elm$core$List$foldr,
				F2(
					function (row, _v2) {
						var converted_ = _v2.a;
						var names = _v2.b;
						var convertedRow = convert(row);
						return _Utils_Tuple2(
							A2(
								$elm$core$List$cons,
								$elm$core$Dict$fromList(convertedRow),
								converted_),
							A3(
								$elm$core$List$foldl,
								F2(
									function (_v3, _v4) {
										var name = _v3.a;
										var soFar = _v4.a;
										var column = _v4.b;
										return _Utils_Tuple2(
											A3(
												$elm$core$Dict$update,
												name,
												function (value) {
													if (value.$ === 'Just') {
														var columns = value.a;
														return $elm$core$Maybe$Just(
															A2($elm$core$List$cons, column, columns));
													} else {
														return $elm$core$Maybe$Just(
															_List_fromArray(
																[column]));
													}
												},
												soFar),
											column + 1);
									}),
								_Utils_Tuple2(names, 0),
								convertedRow).a);
					}),
				_Utils_Tuple2(_List_Nil, $elm$core$Dict$empty),
				rows);
			var converted = _v1.a;
			var namePositions = _v1.b;
			var ordering = A2(
				$elm$core$List$map,
				$elm$core$Tuple$first,
				A2(
					$elm$core$List$sortBy,
					$elm$core$Tuple$second,
					$elm$core$Dict$toList(
						A2(
							$elm$core$Dict$map,
							F2(
								function (_v6, positions) {
									return $elm$core$List$sum(positions) / $elm$core$List$length(positions);
								}),
							namePositions))));
			return A2(
				$elm$core$List$cons,
				ordering,
				A2(
					$elm$core$List$map,
					function (row) {
						return A2(
							$elm$core$List$map,
							function (field) {
								return A2(
									$elm$core$Maybe$withDefault,
									'',
									A2($elm$core$Dict$get, field, row));
							},
							ordering);
					},
					converted));
		} else {
			var convert = encoder.a;
			return A2($elm$core$List$map, convert, rows);
		}
	});
var $BrianHicks$elm_csv$Csv$Encode$quoteIfNecessary = F2(
	function (fieldSeparator, value) {
		return (A2($elm$core$String$contains, '\"', value) || (A2($elm$core$String$contains, fieldSeparator, value) || (A2($elm$core$String$contains, '\u000D\n', value) || A2($elm$core$String$contains, '\n', value)))) ? ('\"' + (A3($elm$core$String$replace, '\"', '\"\"', value) + '\"')) : value;
	});
var $BrianHicks$elm_csv$Csv$Encode$encode = F2(
	function (_v0, items) {
		var encoder = _v0.encoder;
		var fieldSeparator = _v0.fieldSeparator;
		var fieldSeparatorString = $elm$core$String$fromChar(fieldSeparator);
		return A2(
			$elm$core$String$join,
			'\u000D\n',
			A2(
				$elm$core$List$map,
				A2(
					$elm$core$Basics$composeL,
					$elm$core$String$join(fieldSeparatorString),
					$elm$core$List$map(
						$BrianHicks$elm_csv$Csv$Encode$quoteIfNecessary(fieldSeparatorString))),
				A2($BrianHicks$elm_csv$Csv$Encode$encodeItems, encoder, items)));
	});
var $elm$core$Bitwise$shiftRightBy = _Bitwise_shiftRightBy;
var $elm$core$String$repeatHelp = F3(
	function (n, chunk, result) {
		return (n <= 0) ? result : A3(
			$elm$core$String$repeatHelp,
			n >> 1,
			_Utils_ap(chunk, chunk),
			(!(n & 1)) ? result : _Utils_ap(result, chunk));
	});
var $elm$core$String$repeat = F2(
	function (n, chunk) {
		return A3($elm$core$String$repeatHelp, n, chunk, '');
	});
var $elm$core$String$padLeft = F3(
	function (n, _char, string) {
		return _Utils_ap(
			A2(
				$elm$core$String$repeat,
				n - $elm$core$String$length(string),
				$elm$core$String$fromChar(_char)),
			string);
	});
var $elm$core$String$fromList = _String_fromList;
var $TSFoster$elm_uuid$UUID$toHex = F2(
	function (acc, _int) {
		toHex:
		while (true) {
			if (!_int) {
				return $elm$core$String$fromList(acc);
			} else {
				var _char = function () {
					var _v0 = 15 & _int;
					switch (_v0) {
						case 0:
							return _Utils_chr('0');
						case 1:
							return _Utils_chr('1');
						case 2:
							return _Utils_chr('2');
						case 3:
							return _Utils_chr('3');
						case 4:
							return _Utils_chr('4');
						case 5:
							return _Utils_chr('5');
						case 6:
							return _Utils_chr('6');
						case 7:
							return _Utils_chr('7');
						case 8:
							return _Utils_chr('8');
						case 9:
							return _Utils_chr('9');
						case 10:
							return _Utils_chr('a');
						case 11:
							return _Utils_chr('b');
						case 12:
							return _Utils_chr('c');
						case 13:
							return _Utils_chr('d');
						case 14:
							return _Utils_chr('e');
						default:
							return _Utils_chr('f');
					}
				}();
				var $temp$acc = A2($elm$core$List$cons, _char, acc),
					$temp$int = _int >>> 4;
				acc = $temp$acc;
				_int = $temp$int;
				continue toHex;
			}
		}
	});
var $TSFoster$elm_uuid$UUID$toStringWith = F2(
	function (sep, _v0) {
		var a = _v0.a;
		var b = _v0.b;
		var c = _v0.c;
		var d = _v0.d;
		return _Utils_ap(
			A3(
				$elm$core$String$padLeft,
				8,
				_Utils_chr('0'),
				A2($TSFoster$elm_uuid$UUID$toHex, _List_Nil, a)),
			_Utils_ap(
				sep,
				_Utils_ap(
					A3(
						$elm$core$String$padLeft,
						4,
						_Utils_chr('0'),
						A2($TSFoster$elm_uuid$UUID$toHex, _List_Nil, b >>> 16)),
					_Utils_ap(
						sep,
						_Utils_ap(
							A3(
								$elm$core$String$padLeft,
								4,
								_Utils_chr('0'),
								A2($TSFoster$elm_uuid$UUID$toHex, _List_Nil, 65535 & b)),
							_Utils_ap(
								sep,
								_Utils_ap(
									A3(
										$elm$core$String$padLeft,
										4,
										_Utils_chr('0'),
										A2($TSFoster$elm_uuid$UUID$toHex, _List_Nil, c >>> 16)),
									_Utils_ap(
										sep,
										_Utils_ap(
											A3(
												$elm$core$String$padLeft,
												4,
												_Utils_chr('0'),
												A2($TSFoster$elm_uuid$UUID$toHex, _List_Nil, 65535 & c)),
											A3(
												$elm$core$String$padLeft,
												8,
												_Utils_chr('0'),
												A2($TSFoster$elm_uuid$UUID$toHex, _List_Nil, d)))))))))));
	});
var $TSFoster$elm_uuid$UUID$toString = $TSFoster$elm_uuid$UUID$toStringWith('-');
var $TSFoster$elm_uuid$UUID$toValue = A2($elm$core$Basics$composeR, $TSFoster$elm_uuid$UUID$toString, $elm$json$Json$Encode$string);
var $author$project$Main$encodeBehavior = function (behavior) {
	return $elm$json$Json$Encode$object(
		_List_fromArray(
			[
				_Utils_Tuple2(
				'id',
				$TSFoster$elm_uuid$UUID$toValue(behavior.id)),
				_Utils_Tuple2(
				'name',
				$elm$json$Json$Encode$string(behavior.name)),
				_Utils_Tuple2(
				'submits',
				A2(
					$elm$json$Json$Encode$list,
					A2($elm$core$Basics$composeR, $elm$time$Time$posixToMillis, $elm$json$Json$Encode$int),
					behavior.submits)),
				_Utils_Tuple2(
				'resists',
				A2(
					$elm$json$Json$Encode$list,
					A2($elm$core$Basics$composeR, $elm$time$Time$posixToMillis, $elm$json$Json$Encode$int),
					behavior.resists))
			]));
};
var $ryan_haskell$date_format$DateFormat$AmPmUppercase = {$: 'AmPmUppercase'};
var $ryan_haskell$date_format$DateFormat$amPmUppercase = $ryan_haskell$date_format$DateFormat$AmPmUppercase;
var $ryan_haskell$date_format$DateFormat$DayOfMonthNumber = {$: 'DayOfMonthNumber'};
var $ryan_haskell$date_format$DateFormat$dayOfMonthNumber = $ryan_haskell$date_format$DateFormat$DayOfMonthNumber;
var $ryan_haskell$date_format$DateFormat$Language$Language = F6(
	function (toMonthName, toMonthAbbreviation, toWeekdayName, toWeekdayAbbreviation, toAmPm, toOrdinalSuffix) {
		return {toAmPm: toAmPm, toMonthAbbreviation: toMonthAbbreviation, toMonthName: toMonthName, toOrdinalSuffix: toOrdinalSuffix, toWeekdayAbbreviation: toWeekdayAbbreviation, toWeekdayName: toWeekdayName};
	});
var $ryan_haskell$date_format$DateFormat$Language$toEnglishAmPm = function (hour) {
	return (hour > 11) ? 'pm' : 'am';
};
var $ryan_haskell$date_format$DateFormat$Language$toEnglishMonthName = function (month) {
	switch (month.$) {
		case 'Jan':
			return 'January';
		case 'Feb':
			return 'February';
		case 'Mar':
			return 'March';
		case 'Apr':
			return 'April';
		case 'May':
			return 'May';
		case 'Jun':
			return 'June';
		case 'Jul':
			return 'July';
		case 'Aug':
			return 'August';
		case 'Sep':
			return 'September';
		case 'Oct':
			return 'October';
		case 'Nov':
			return 'November';
		default:
			return 'December';
	}
};
var $ryan_haskell$date_format$DateFormat$Language$toEnglishSuffix = function (num) {
	var _v0 = A2($elm$core$Basics$modBy, 100, num);
	switch (_v0) {
		case 11:
			return 'th';
		case 12:
			return 'th';
		case 13:
			return 'th';
		default:
			var _v1 = A2($elm$core$Basics$modBy, 10, num);
			switch (_v1) {
				case 1:
					return 'st';
				case 2:
					return 'nd';
				case 3:
					return 'rd';
				default:
					return 'th';
			}
	}
};
var $ryan_haskell$date_format$DateFormat$Language$toEnglishWeekdayName = function (weekday) {
	switch (weekday.$) {
		case 'Mon':
			return 'Monday';
		case 'Tue':
			return 'Tuesday';
		case 'Wed':
			return 'Wednesday';
		case 'Thu':
			return 'Thursday';
		case 'Fri':
			return 'Friday';
		case 'Sat':
			return 'Saturday';
		default:
			return 'Sunday';
	}
};
var $ryan_haskell$date_format$DateFormat$Language$english = A6(
	$ryan_haskell$date_format$DateFormat$Language$Language,
	$ryan_haskell$date_format$DateFormat$Language$toEnglishMonthName,
	A2(
		$elm$core$Basics$composeR,
		$ryan_haskell$date_format$DateFormat$Language$toEnglishMonthName,
		$elm$core$String$left(3)),
	$ryan_haskell$date_format$DateFormat$Language$toEnglishWeekdayName,
	A2(
		$elm$core$Basics$composeR,
		$ryan_haskell$date_format$DateFormat$Language$toEnglishWeekdayName,
		$elm$core$String$left(3)),
	$ryan_haskell$date_format$DateFormat$Language$toEnglishAmPm,
	$ryan_haskell$date_format$DateFormat$Language$toEnglishSuffix);
var $ryan_haskell$date_format$DateFormat$amPm = F3(
	function (language, zone, posix) {
		return language.toAmPm(
			A2($elm$time$Time$toHour, zone, posix));
	});
var $ryan_haskell$date_format$DateFormat$dayOfMonth = $elm$time$Time$toDay;
var $elm$time$Time$Sun = {$: 'Sun'};
var $elm$time$Time$Fri = {$: 'Fri'};
var $elm$time$Time$Mon = {$: 'Mon'};
var $elm$time$Time$Sat = {$: 'Sat'};
var $elm$time$Time$Thu = {$: 'Thu'};
var $elm$time$Time$Tue = {$: 'Tue'};
var $elm$time$Time$Wed = {$: 'Wed'};
var $ryan_haskell$date_format$DateFormat$days = _List_fromArray(
	[$elm$time$Time$Sun, $elm$time$Time$Mon, $elm$time$Time$Tue, $elm$time$Time$Wed, $elm$time$Time$Thu, $elm$time$Time$Fri, $elm$time$Time$Sat]);
var $elm$core$List$filter = F2(
	function (isGood, list) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, xs) {
					return isGood(x) ? A2($elm$core$List$cons, x, xs) : xs;
				}),
			_List_Nil,
			list);
	});
var $elm$time$Time$toWeekday = F2(
	function (zone, time) {
		var _v0 = A2(
			$elm$core$Basics$modBy,
			7,
			A2(
				$elm$time$Time$flooredDiv,
				A2($elm$time$Time$toAdjustedMinutes, zone, time),
				60 * 24));
		switch (_v0) {
			case 0:
				return $elm$time$Time$Thu;
			case 1:
				return $elm$time$Time$Fri;
			case 2:
				return $elm$time$Time$Sat;
			case 3:
				return $elm$time$Time$Sun;
			case 4:
				return $elm$time$Time$Mon;
			case 5:
				return $elm$time$Time$Tue;
			default:
				return $elm$time$Time$Wed;
		}
	});
var $ryan_haskell$date_format$DateFormat$dayOfWeek = F2(
	function (zone, posix) {
		return function (_v1) {
			var i = _v1.a;
			return i;
		}(
			A2(
				$elm$core$Maybe$withDefault,
				_Utils_Tuple2(0, $elm$time$Time$Sun),
				$elm$core$List$head(
					A2(
						$elm$core$List$filter,
						function (_v0) {
							var day = _v0.b;
							return _Utils_eq(
								day,
								A2($elm$time$Time$toWeekday, zone, posix));
						},
						A2(
							$elm$core$List$indexedMap,
							F2(
								function (i, day) {
									return _Utils_Tuple2(i, day);
								}),
							$ryan_haskell$date_format$DateFormat$days)))));
	});
var $ryan_haskell$date_format$DateFormat$isLeapYear = function (year_) {
	return (!(!A2($elm$core$Basics$modBy, 4, year_))) ? false : ((!(!A2($elm$core$Basics$modBy, 100, year_))) ? true : ((!(!A2($elm$core$Basics$modBy, 400, year_))) ? false : true));
};
var $ryan_haskell$date_format$DateFormat$daysInMonth = F2(
	function (year_, month) {
		switch (month.$) {
			case 'Jan':
				return 31;
			case 'Feb':
				return $ryan_haskell$date_format$DateFormat$isLeapYear(year_) ? 29 : 28;
			case 'Mar':
				return 31;
			case 'Apr':
				return 30;
			case 'May':
				return 31;
			case 'Jun':
				return 30;
			case 'Jul':
				return 31;
			case 'Aug':
				return 31;
			case 'Sep':
				return 30;
			case 'Oct':
				return 31;
			case 'Nov':
				return 30;
			default:
				return 31;
		}
	});
var $ryan_haskell$date_format$DateFormat$months = _List_fromArray(
	[$elm$time$Time$Jan, $elm$time$Time$Feb, $elm$time$Time$Mar, $elm$time$Time$Apr, $elm$time$Time$May, $elm$time$Time$Jun, $elm$time$Time$Jul, $elm$time$Time$Aug, $elm$time$Time$Sep, $elm$time$Time$Oct, $elm$time$Time$Nov, $elm$time$Time$Dec]);
var $ryan_haskell$date_format$DateFormat$monthPair = F2(
	function (zone, posix) {
		return A2(
			$elm$core$Maybe$withDefault,
			_Utils_Tuple2(0, $elm$time$Time$Jan),
			$elm$core$List$head(
				A2(
					$elm$core$List$filter,
					function (_v0) {
						var i = _v0.a;
						var m = _v0.b;
						return _Utils_eq(
							m,
							A2($elm$time$Time$toMonth, zone, posix));
					},
					A2(
						$elm$core$List$indexedMap,
						F2(
							function (a, b) {
								return _Utils_Tuple2(a, b);
							}),
						$ryan_haskell$date_format$DateFormat$months))));
	});
var $ryan_haskell$date_format$DateFormat$monthNumber_ = F2(
	function (zone, posix) {
		return 1 + function (_v0) {
			var i = _v0.a;
			var m = _v0.b;
			return i;
		}(
			A2($ryan_haskell$date_format$DateFormat$monthPair, zone, posix));
	});
var $elm$core$List$takeReverse = F3(
	function (n, list, kept) {
		takeReverse:
		while (true) {
			if (n <= 0) {
				return kept;
			} else {
				if (!list.b) {
					return kept;
				} else {
					var x = list.a;
					var xs = list.b;
					var $temp$n = n - 1,
						$temp$list = xs,
						$temp$kept = A2($elm$core$List$cons, x, kept);
					n = $temp$n;
					list = $temp$list;
					kept = $temp$kept;
					continue takeReverse;
				}
			}
		}
	});
var $elm$core$List$takeTailRec = F2(
	function (n, list) {
		return $elm$core$List$reverse(
			A3($elm$core$List$takeReverse, n, list, _List_Nil));
	});
var $elm$core$List$takeFast = F3(
	function (ctr, n, list) {
		if (n <= 0) {
			return _List_Nil;
		} else {
			var _v0 = _Utils_Tuple2(n, list);
			_v0$1:
			while (true) {
				_v0$5:
				while (true) {
					if (!_v0.b.b) {
						return list;
					} else {
						if (_v0.b.b.b) {
							switch (_v0.a) {
								case 1:
									break _v0$1;
								case 2:
									var _v2 = _v0.b;
									var x = _v2.a;
									var _v3 = _v2.b;
									var y = _v3.a;
									return _List_fromArray(
										[x, y]);
								case 3:
									if (_v0.b.b.b.b) {
										var _v4 = _v0.b;
										var x = _v4.a;
										var _v5 = _v4.b;
										var y = _v5.a;
										var _v6 = _v5.b;
										var z = _v6.a;
										return _List_fromArray(
											[x, y, z]);
									} else {
										break _v0$5;
									}
								default:
									if (_v0.b.b.b.b && _v0.b.b.b.b.b) {
										var _v7 = _v0.b;
										var x = _v7.a;
										var _v8 = _v7.b;
										var y = _v8.a;
										var _v9 = _v8.b;
										var z = _v9.a;
										var _v10 = _v9.b;
										var w = _v10.a;
										var tl = _v10.b;
										return (ctr > 1000) ? A2(
											$elm$core$List$cons,
											x,
											A2(
												$elm$core$List$cons,
												y,
												A2(
													$elm$core$List$cons,
													z,
													A2(
														$elm$core$List$cons,
														w,
														A2($elm$core$List$takeTailRec, n - 4, tl))))) : A2(
											$elm$core$List$cons,
											x,
											A2(
												$elm$core$List$cons,
												y,
												A2(
													$elm$core$List$cons,
													z,
													A2(
														$elm$core$List$cons,
														w,
														A3($elm$core$List$takeFast, ctr + 1, n - 4, tl)))));
									} else {
										break _v0$5;
									}
							}
						} else {
							if (_v0.a === 1) {
								break _v0$1;
							} else {
								break _v0$5;
							}
						}
					}
				}
				return list;
			}
			var _v1 = _v0.b;
			var x = _v1.a;
			return _List_fromArray(
				[x]);
		}
	});
var $elm$core$List$take = F2(
	function (n, list) {
		return A3($elm$core$List$takeFast, 0, n, list);
	});
var $ryan_haskell$date_format$DateFormat$dayOfYear = F2(
	function (zone, posix) {
		var monthsBeforeThisOne = A2(
			$elm$core$List$take,
			A2($ryan_haskell$date_format$DateFormat$monthNumber_, zone, posix) - 1,
			$ryan_haskell$date_format$DateFormat$months);
		var daysBeforeThisMonth = $elm$core$List$sum(
			A2(
				$elm$core$List$map,
				$ryan_haskell$date_format$DateFormat$daysInMonth(
					A2($elm$time$Time$toYear, zone, posix)),
				monthsBeforeThisOne));
		return daysBeforeThisMonth + A2($ryan_haskell$date_format$DateFormat$dayOfMonth, zone, posix);
	});
var $ryan_haskell$date_format$DateFormat$quarter = F2(
	function (zone, posix) {
		return (A2($ryan_haskell$date_format$DateFormat$monthNumber_, zone, posix) / 4) | 0;
	});
var $elm$core$String$right = F2(
	function (n, string) {
		return (n < 1) ? '' : A3(
			$elm$core$String$slice,
			-n,
			$elm$core$String$length(string),
			string);
	});
var $ryan_haskell$date_format$DateFormat$toFixedLength = F2(
	function (totalChars, num) {
		var numStr = $elm$core$String$fromInt(num);
		var numZerosNeeded = totalChars - $elm$core$String$length(numStr);
		var zeros = A2(
			$elm$core$String$join,
			'',
			A2(
				$elm$core$List$map,
				function (_v0) {
					return '0';
				},
				A2($elm$core$List$range, 1, numZerosNeeded)));
		return _Utils_ap(zeros, numStr);
	});
var $ryan_haskell$date_format$DateFormat$toNonMilitary = function (num) {
	return (!num) ? 12 : ((num <= 12) ? num : (num - 12));
};
var $elm$core$Basics$round = _Basics_round;
var $ryan_haskell$date_format$DateFormat$millisecondsPerYear = $elm$core$Basics$round((((1000 * 60) * 60) * 24) * 365.25);
var $ryan_haskell$date_format$DateFormat$firstDayOfYear = F2(
	function (zone, time) {
		return $elm$time$Time$millisToPosix(
			$ryan_haskell$date_format$DateFormat$millisecondsPerYear * A2($elm$time$Time$toYear, zone, time));
	});
var $ryan_haskell$date_format$DateFormat$weekOfYear = F2(
	function (zone, posix) {
		var firstDay = A2($ryan_haskell$date_format$DateFormat$firstDayOfYear, zone, posix);
		var firstDayOffset = A2($ryan_haskell$date_format$DateFormat$dayOfWeek, zone, firstDay);
		var daysSoFar = A2($ryan_haskell$date_format$DateFormat$dayOfYear, zone, posix);
		return (((daysSoFar + firstDayOffset) / 7) | 0) + 1;
	});
var $ryan_haskell$date_format$DateFormat$year = F2(
	function (zone, time) {
		return $elm$core$String$fromInt(
			A2($elm$time$Time$toYear, zone, time));
	});
var $ryan_haskell$date_format$DateFormat$piece = F4(
	function (language, zone, posix, token) {
		switch (token.$) {
			case 'MonthNumber':
				return $elm$core$String$fromInt(
					A2($ryan_haskell$date_format$DateFormat$monthNumber_, zone, posix));
			case 'MonthSuffix':
				return function (num) {
					return _Utils_ap(
						$elm$core$String$fromInt(num),
						language.toOrdinalSuffix(num));
				}(
					A2($ryan_haskell$date_format$DateFormat$monthNumber_, zone, posix));
			case 'MonthFixed':
				return A2(
					$ryan_haskell$date_format$DateFormat$toFixedLength,
					2,
					A2($ryan_haskell$date_format$DateFormat$monthNumber_, zone, posix));
			case 'MonthNameAbbreviated':
				return language.toMonthAbbreviation(
					A2($elm$time$Time$toMonth, zone, posix));
			case 'MonthNameFull':
				return language.toMonthName(
					A2($elm$time$Time$toMonth, zone, posix));
			case 'QuarterNumber':
				return $elm$core$String$fromInt(
					1 + A2($ryan_haskell$date_format$DateFormat$quarter, zone, posix));
			case 'QuarterSuffix':
				return function (num) {
					return _Utils_ap(
						$elm$core$String$fromInt(num),
						language.toOrdinalSuffix(num));
				}(
					1 + A2($ryan_haskell$date_format$DateFormat$quarter, zone, posix));
			case 'DayOfMonthNumber':
				return $elm$core$String$fromInt(
					A2($ryan_haskell$date_format$DateFormat$dayOfMonth, zone, posix));
			case 'DayOfMonthSuffix':
				return function (num) {
					return _Utils_ap(
						$elm$core$String$fromInt(num),
						language.toOrdinalSuffix(num));
				}(
					A2($ryan_haskell$date_format$DateFormat$dayOfMonth, zone, posix));
			case 'DayOfMonthFixed':
				return A2(
					$ryan_haskell$date_format$DateFormat$toFixedLength,
					2,
					A2($ryan_haskell$date_format$DateFormat$dayOfMonth, zone, posix));
			case 'DayOfYearNumber':
				return $elm$core$String$fromInt(
					A2($ryan_haskell$date_format$DateFormat$dayOfYear, zone, posix));
			case 'DayOfYearSuffix':
				return function (num) {
					return _Utils_ap(
						$elm$core$String$fromInt(num),
						language.toOrdinalSuffix(num));
				}(
					A2($ryan_haskell$date_format$DateFormat$dayOfYear, zone, posix));
			case 'DayOfYearFixed':
				return A2(
					$ryan_haskell$date_format$DateFormat$toFixedLength,
					3,
					A2($ryan_haskell$date_format$DateFormat$dayOfYear, zone, posix));
			case 'DayOfWeekNumber':
				return $elm$core$String$fromInt(
					A2($ryan_haskell$date_format$DateFormat$dayOfWeek, zone, posix));
			case 'DayOfWeekSuffix':
				return function (num) {
					return _Utils_ap(
						$elm$core$String$fromInt(num),
						language.toOrdinalSuffix(num));
				}(
					A2($ryan_haskell$date_format$DateFormat$dayOfWeek, zone, posix));
			case 'DayOfWeekNameAbbreviated':
				return language.toWeekdayAbbreviation(
					A2($elm$time$Time$toWeekday, zone, posix));
			case 'DayOfWeekNameFull':
				return language.toWeekdayName(
					A2($elm$time$Time$toWeekday, zone, posix));
			case 'WeekOfYearNumber':
				return $elm$core$String$fromInt(
					A2($ryan_haskell$date_format$DateFormat$weekOfYear, zone, posix));
			case 'WeekOfYearSuffix':
				return function (num) {
					return _Utils_ap(
						$elm$core$String$fromInt(num),
						language.toOrdinalSuffix(num));
				}(
					A2($ryan_haskell$date_format$DateFormat$weekOfYear, zone, posix));
			case 'WeekOfYearFixed':
				return A2(
					$ryan_haskell$date_format$DateFormat$toFixedLength,
					2,
					A2($ryan_haskell$date_format$DateFormat$weekOfYear, zone, posix));
			case 'YearNumberLastTwo':
				return A2(
					$elm$core$String$right,
					2,
					A2($ryan_haskell$date_format$DateFormat$year, zone, posix));
			case 'YearNumber':
				return A2($ryan_haskell$date_format$DateFormat$year, zone, posix);
			case 'AmPmUppercase':
				return $elm$core$String$toUpper(
					A3($ryan_haskell$date_format$DateFormat$amPm, language, zone, posix));
			case 'AmPmLowercase':
				return $elm$core$String$toLower(
					A3($ryan_haskell$date_format$DateFormat$amPm, language, zone, posix));
			case 'HourMilitaryNumber':
				return $elm$core$String$fromInt(
					A2($elm$time$Time$toHour, zone, posix));
			case 'HourMilitaryFixed':
				return A2(
					$ryan_haskell$date_format$DateFormat$toFixedLength,
					2,
					A2($elm$time$Time$toHour, zone, posix));
			case 'HourNumber':
				return $elm$core$String$fromInt(
					$ryan_haskell$date_format$DateFormat$toNonMilitary(
						A2($elm$time$Time$toHour, zone, posix)));
			case 'HourFixed':
				return A2(
					$ryan_haskell$date_format$DateFormat$toFixedLength,
					2,
					$ryan_haskell$date_format$DateFormat$toNonMilitary(
						A2($elm$time$Time$toHour, zone, posix)));
			case 'HourMilitaryFromOneNumber':
				return $elm$core$String$fromInt(
					1 + A2($elm$time$Time$toHour, zone, posix));
			case 'HourMilitaryFromOneFixed':
				return A2(
					$ryan_haskell$date_format$DateFormat$toFixedLength,
					2,
					1 + A2($elm$time$Time$toHour, zone, posix));
			case 'MinuteNumber':
				return $elm$core$String$fromInt(
					A2($elm$time$Time$toMinute, zone, posix));
			case 'MinuteFixed':
				return A2(
					$ryan_haskell$date_format$DateFormat$toFixedLength,
					2,
					A2($elm$time$Time$toMinute, zone, posix));
			case 'SecondNumber':
				return $elm$core$String$fromInt(
					A2($elm$time$Time$toSecond, zone, posix));
			case 'SecondFixed':
				return A2(
					$ryan_haskell$date_format$DateFormat$toFixedLength,
					2,
					A2($elm$time$Time$toSecond, zone, posix));
			case 'MillisecondNumber':
				return $elm$core$String$fromInt(
					A2($elm$time$Time$toMillis, zone, posix));
			case 'MillisecondFixed':
				return A2(
					$ryan_haskell$date_format$DateFormat$toFixedLength,
					3,
					A2($elm$time$Time$toMillis, zone, posix));
			default:
				var string = token.a;
				return string;
		}
	});
var $ryan_haskell$date_format$DateFormat$formatWithLanguage = F4(
	function (language, tokens, zone, time) {
		return A2(
			$elm$core$String$join,
			'',
			A2(
				$elm$core$List$map,
				A3($ryan_haskell$date_format$DateFormat$piece, language, zone, time),
				tokens));
	});
var $ryan_haskell$date_format$DateFormat$format = $ryan_haskell$date_format$DateFormat$formatWithLanguage($ryan_haskell$date_format$DateFormat$Language$english);
var $ryan_haskell$date_format$DateFormat$HourNumber = {$: 'HourNumber'};
var $ryan_haskell$date_format$DateFormat$hourNumber = $ryan_haskell$date_format$DateFormat$HourNumber;
var $ryan_haskell$date_format$DateFormat$MinuteFixed = {$: 'MinuteFixed'};
var $ryan_haskell$date_format$DateFormat$minuteFixed = $ryan_haskell$date_format$DateFormat$MinuteFixed;
var $ryan_haskell$date_format$DateFormat$MonthNumber = {$: 'MonthNumber'};
var $ryan_haskell$date_format$DateFormat$monthNumber = $ryan_haskell$date_format$DateFormat$MonthNumber;
var $ryan_haskell$date_format$DateFormat$Text = function (a) {
	return {$: 'Text', a: a};
};
var $ryan_haskell$date_format$DateFormat$text = $ryan_haskell$date_format$DateFormat$Text;
var $ryan_haskell$date_format$DateFormat$YearNumber = {$: 'YearNumber'};
var $ryan_haskell$date_format$DateFormat$yearNumber = $ryan_haskell$date_format$DateFormat$YearNumber;
var $author$project$Main$exportDateFormatter = $ryan_haskell$date_format$DateFormat$format(
	_List_fromArray(
		[
			$ryan_haskell$date_format$DateFormat$monthNumber,
			$ryan_haskell$date_format$DateFormat$text('/'),
			$ryan_haskell$date_format$DateFormat$dayOfMonthNumber,
			$ryan_haskell$date_format$DateFormat$text('/'),
			$ryan_haskell$date_format$DateFormat$yearNumber,
			$ryan_haskell$date_format$DateFormat$text(' '),
			$ryan_haskell$date_format$DateFormat$hourNumber,
			$ryan_haskell$date_format$DateFormat$text(':'),
			$ryan_haskell$date_format$DateFormat$minuteFixed,
			$ryan_haskell$date_format$DateFormat$text(' '),
			$ryan_haskell$date_format$DateFormat$amPmUppercase
		]));
var $elm$core$Task$fail = _Scheduler_fail;
var $elm$file$File$Select$files = F2(
	function (mimes, toMsg) {
		return A2(
			$elm$core$Task$perform,
			function (_v0) {
				var f = _v0.a;
				var fs = _v0.b;
				return A2(toMsg, f, fs);
			},
			_File_uploadOneOrMore(mimes));
	});
var $elm$core$String$filter = _String_filter;
var $author$project$Main$findBehaviorById = F2(
	function (id, behaviors) {
		findBehaviorById:
		while (true) {
			if (!behaviors.b) {
				return $elm$core$Maybe$Nothing;
			} else {
				var behavior = behaviors.a;
				var rest = behaviors.b;
				if (_Utils_eq(behavior.id, id)) {
					return $elm$core$Maybe$Just(behavior);
				} else {
					var $temp$id = id,
						$temp$behaviors = rest;
					id = $temp$id;
					behaviors = $temp$behaviors;
					continue findBehaviorById;
				}
			}
		}
	});
var $elm$browser$Browser$Navigation$load = _Browser_load;
var $elm$core$Tuple$mapFirst = F2(
	function (func, _v0) {
		var x = _v0.a;
		var y = _v0.b;
		return _Utils_Tuple2(
			func(x),
			y);
	});
var $elm$file$File$name = _File_name;
var $elm$time$Time$now = _Time_now($elm$time$Time$millisToPosix);
var $wolfadex$elm_rfc3339$Rfc3339$TimeLocal = function (a) {
	return {$: 'TimeLocal', a: a};
};
var $wolfadex$elm_rfc3339$Rfc3339$DateLocal = function (a) {
	return {$: 'DateLocal', a: a};
};
var $wolfadex$elm_rfc3339$Rfc3339$DateTimeLocal = function (a) {
	return {$: 'DateTimeLocal', a: a};
};
var $wolfadex$elm_rfc3339$Rfc3339$DateTimeOffset = function (a) {
	return {$: 'DateTimeOffset', a: a};
};
var $wolfadex$elm_rfc3339$Rfc3339$ExpectedDateSeparator = {$: 'ExpectedDateSeparator'};
var $wolfadex$elm_rfc3339$Rfc3339$InvalidDay = {$: 'InvalidDay'};
var $wolfadex$elm_rfc3339$Rfc3339$InvalidMonth = {$: 'InvalidMonth'};
var $elm$parser$Parser$Advanced$Token = F2(
	function (a, b) {
		return {$: 'Token', a: a, b: b};
	});
var $elm$parser$Parser$Advanced$Bad = F2(
	function (a, b) {
		return {$: 'Bad', a: a, b: b};
	});
var $elm$parser$Parser$Advanced$Good = F3(
	function (a, b, c) {
		return {$: 'Good', a: a, b: b, c: c};
	});
var $elm$parser$Parser$Advanced$Parser = function (a) {
	return {$: 'Parser', a: a};
};
var $elm$parser$Parser$Advanced$andThen = F2(
	function (callback, _v0) {
		var parseA = _v0.a;
		return $elm$parser$Parser$Advanced$Parser(
			function (s0) {
				var _v1 = parseA(s0);
				if (_v1.$ === 'Bad') {
					var p = _v1.a;
					var x = _v1.b;
					return A2($elm$parser$Parser$Advanced$Bad, p, x);
				} else {
					var p1 = _v1.a;
					var a = _v1.b;
					var s1 = _v1.c;
					var _v2 = callback(a);
					var parseB = _v2.a;
					var _v3 = parseB(s1);
					if (_v3.$ === 'Bad') {
						var p2 = _v3.a;
						var x = _v3.b;
						return A2($elm$parser$Parser$Advanced$Bad, p1 || p2, x);
					} else {
						var p2 = _v3.a;
						var b = _v3.b;
						var s2 = _v3.c;
						return A3($elm$parser$Parser$Advanced$Good, p1 || p2, b, s2);
					}
				}
			});
	});
var $wolfadex$elm_rfc3339$Rfc3339$DayTooLarge = function (a) {
	return {$: 'DayTooLarge', a: a};
};
var $wolfadex$elm_rfc3339$Rfc3339$isLeapYear = function (year) {
	return (!A2($elm$core$Basics$modBy, 4, year)) && ((!(!A2($elm$core$Basics$modBy, 100, year))) || (!A2($elm$core$Basics$modBy, 400, year)));
};
var $wolfadex$elm_rfc3339$Rfc3339$daysInMonth = function (date) {
	var _v0 = date.month;
	switch (_v0.$) {
		case 'Jan':
			return 31;
		case 'Feb':
			return $wolfadex$elm_rfc3339$Rfc3339$isLeapYear(date.year) ? 29 : 28;
		case 'Mar':
			return 31;
		case 'Apr':
			return 30;
		case 'May':
			return 31;
		case 'Jun':
			return 30;
		case 'Jul':
			return 31;
		case 'Aug':
			return 31;
		case 'Sep':
			return 30;
		case 'Oct':
			return 31;
		case 'Nov':
			return 30;
		default:
			return 31;
	}
};
var $elm$parser$Parser$Advanced$AddRight = F2(
	function (a, b) {
		return {$: 'AddRight', a: a, b: b};
	});
var $elm$parser$Parser$Advanced$DeadEnd = F4(
	function (row, col, problem, contextStack) {
		return {col: col, contextStack: contextStack, problem: problem, row: row};
	});
var $elm$parser$Parser$Advanced$Empty = {$: 'Empty'};
var $elm$parser$Parser$Advanced$fromState = F2(
	function (s, x) {
		return A2(
			$elm$parser$Parser$Advanced$AddRight,
			$elm$parser$Parser$Advanced$Empty,
			A4($elm$parser$Parser$Advanced$DeadEnd, s.row, s.col, x, s.context));
	});
var $elm$parser$Parser$Advanced$problem = function (x) {
	return $elm$parser$Parser$Advanced$Parser(
		function (s) {
			return A2(
				$elm$parser$Parser$Advanced$Bad,
				false,
				A2($elm$parser$Parser$Advanced$fromState, s, x));
		});
};
var $elm$parser$Parser$Advanced$succeed = function (a) {
	return $elm$parser$Parser$Advanced$Parser(
		function (s) {
			return A3($elm$parser$Parser$Advanced$Good, false, a, s);
		});
};
var $wolfadex$elm_rfc3339$Rfc3339$checkDay = function (date) {
	var maxDays = $wolfadex$elm_rfc3339$Rfc3339$daysInMonth(date);
	return (_Utils_cmp(date.day, maxDays) > 0) ? $elm$parser$Parser$Advanced$problem(
		$wolfadex$elm_rfc3339$Rfc3339$DayTooLarge(maxDays)) : $elm$parser$Parser$Advanced$succeed(
		A3($justinmimbs$date$Date$fromCalendarDate, date.year, date.month, date.day));
};
var $elm$parser$Parser$Advanced$map2 = F3(
	function (func, _v0, _v1) {
		var parseA = _v0.a;
		var parseB = _v1.a;
		return $elm$parser$Parser$Advanced$Parser(
			function (s0) {
				var _v2 = parseA(s0);
				if (_v2.$ === 'Bad') {
					var p = _v2.a;
					var x = _v2.b;
					return A2($elm$parser$Parser$Advanced$Bad, p, x);
				} else {
					var p1 = _v2.a;
					var a = _v2.b;
					var s1 = _v2.c;
					var _v3 = parseB(s1);
					if (_v3.$ === 'Bad') {
						var p2 = _v3.a;
						var x = _v3.b;
						return A2($elm$parser$Parser$Advanced$Bad, p1 || p2, x);
					} else {
						var p2 = _v3.a;
						var b = _v3.b;
						var s2 = _v3.c;
						return A3(
							$elm$parser$Parser$Advanced$Good,
							p1 || p2,
							A2(func, a, b),
							s2);
					}
				}
			});
	});
var $elm$parser$Parser$Advanced$ignorer = F2(
	function (keepParser, ignoreParser) {
		return A3($elm$parser$Parser$Advanced$map2, $elm$core$Basics$always, keepParser, ignoreParser);
	});
var $elm$parser$Parser$Advanced$keeper = F2(
	function (parseFunc, parseArg) {
		return A3($elm$parser$Parser$Advanced$map2, $elm$core$Basics$apL, parseFunc, parseArg);
	});
var $justinmimbs$date$Date$numberToMonth = function (mn) {
	var _v0 = A2($elm$core$Basics$max, 1, mn);
	switch (_v0) {
		case 1:
			return $elm$time$Time$Jan;
		case 2:
			return $elm$time$Time$Feb;
		case 3:
			return $elm$time$Time$Mar;
		case 4:
			return $elm$time$Time$Apr;
		case 5:
			return $elm$time$Time$May;
		case 6:
			return $elm$time$Time$Jun;
		case 7:
			return $elm$time$Time$Jul;
		case 8:
			return $elm$time$Time$Aug;
		case 9:
			return $elm$time$Time$Sep;
		case 10:
			return $elm$time$Time$Oct;
		case 11:
			return $elm$time$Time$Nov;
		default:
			return $elm$time$Time$Dec;
	}
};
var $wolfadex$elm_rfc3339$Rfc3339$ExpectedAnInt = {$: 'ExpectedAnInt'};
var $elm$parser$Parser$Advanced$mapChompedString = F2(
	function (func, _v0) {
		var parse = _v0.a;
		return $elm$parser$Parser$Advanced$Parser(
			function (s0) {
				var _v1 = parse(s0);
				if (_v1.$ === 'Bad') {
					var p = _v1.a;
					var x = _v1.b;
					return A2($elm$parser$Parser$Advanced$Bad, p, x);
				} else {
					var p = _v1.a;
					var a = _v1.b;
					var s1 = _v1.c;
					return A3(
						$elm$parser$Parser$Advanced$Good,
						p,
						A2(
							func,
							A3($elm$core$String$slice, s0.offset, s1.offset, s0.src),
							a),
						s1);
				}
			});
	});
var $elm$parser$Parser$Advanced$getChompedString = function (parser) {
	return A2($elm$parser$Parser$Advanced$mapChompedString, $elm$core$Basics$always, parser);
};
var $elm$parser$Parser$Advanced$loopHelp = F4(
	function (p, state, callback, s0) {
		loopHelp:
		while (true) {
			var _v0 = callback(state);
			var parse = _v0.a;
			var _v1 = parse(s0);
			if (_v1.$ === 'Good') {
				var p1 = _v1.a;
				var step = _v1.b;
				var s1 = _v1.c;
				if (step.$ === 'Loop') {
					var newState = step.a;
					var $temp$p = p || p1,
						$temp$state = newState,
						$temp$callback = callback,
						$temp$s0 = s1;
					p = $temp$p;
					state = $temp$state;
					callback = $temp$callback;
					s0 = $temp$s0;
					continue loopHelp;
				} else {
					var result = step.a;
					return A3($elm$parser$Parser$Advanced$Good, p || p1, result, s1);
				}
			} else {
				var p1 = _v1.a;
				var x = _v1.b;
				return A2($elm$parser$Parser$Advanced$Bad, p || p1, x);
			}
		}
	});
var $elm$parser$Parser$Advanced$loop = F2(
	function (state, callback) {
		return $elm$parser$Parser$Advanced$Parser(
			function (s) {
				return A4($elm$parser$Parser$Advanced$loopHelp, false, state, callback, s);
			});
	});
var $elm$parser$Parser$Advanced$Done = function (a) {
	return {$: 'Done', a: a};
};
var $wolfadex$elm_rfc3339$Rfc3339$ExpectedDigit = {$: 'ExpectedDigit'};
var $wolfadex$elm_rfc3339$Rfc3339$InvalidNegativeDigits = {$: 'InvalidNegativeDigits'};
var $elm$parser$Parser$Advanced$Loop = function (a) {
	return {$: 'Loop', a: a};
};
var $elm$parser$Parser$Advanced$isSubChar = _Parser_isSubChar;
var $elm$parser$Parser$Advanced$chompIf = F2(
	function (isGood, expecting) {
		return $elm$parser$Parser$Advanced$Parser(
			function (s) {
				var newOffset = A3($elm$parser$Parser$Advanced$isSubChar, isGood, s.offset, s.src);
				return _Utils_eq(newOffset, -1) ? A2(
					$elm$parser$Parser$Advanced$Bad,
					false,
					A2($elm$parser$Parser$Advanced$fromState, s, expecting)) : (_Utils_eq(newOffset, -2) ? A3(
					$elm$parser$Parser$Advanced$Good,
					true,
					_Utils_Tuple0,
					{col: 1, context: s.context, indent: s.indent, offset: s.offset + 1, row: s.row + 1, src: s.src}) : A3(
					$elm$parser$Parser$Advanced$Good,
					true,
					_Utils_Tuple0,
					{col: s.col + 1, context: s.context, indent: s.indent, offset: newOffset, row: s.row, src: s.src}));
			});
	});
var $wolfadex$elm_rfc3339$Rfc3339$parseDigitsHelper = function (leftToChomp) {
	return (leftToChomp < 0) ? $elm$parser$Parser$Advanced$problem($wolfadex$elm_rfc3339$Rfc3339$InvalidNegativeDigits) : ((leftToChomp > 0) ? A2(
		$elm$parser$Parser$Advanced$ignorer,
		$elm$parser$Parser$Advanced$succeed(
			$elm$parser$Parser$Advanced$Loop(leftToChomp - 1)),
		A2($elm$parser$Parser$Advanced$chompIf, $elm$core$Char$isDigit, $wolfadex$elm_rfc3339$Rfc3339$ExpectedDigit)) : $elm$parser$Parser$Advanced$succeed(
		$elm$parser$Parser$Advanced$Done(_Utils_Tuple0)));
};
var $wolfadex$elm_rfc3339$Rfc3339$parseDigits = function (size) {
	return A2(
		$elm$parser$Parser$Advanced$andThen,
		function (digits) {
			var _v0 = $elm$core$String$toInt(digits);
			if (_v0.$ === 'Nothing') {
				return $elm$parser$Parser$Advanced$problem($wolfadex$elm_rfc3339$Rfc3339$ExpectedAnInt);
			} else {
				var i = _v0.a;
				return $elm$parser$Parser$Advanced$succeed(i);
			}
		},
		$elm$parser$Parser$Advanced$getChompedString(
			A2($elm$parser$Parser$Advanced$loop, size, $wolfadex$elm_rfc3339$Rfc3339$parseDigitsHelper)));
};
var $wolfadex$elm_rfc3339$Rfc3339$parseDigitsInRange = F3(
	function (size, limits, limitProblem) {
		return A2(
			$elm$parser$Parser$Advanced$andThen,
			function (digits) {
				var _v0 = $elm$core$String$toInt(digits);
				if (_v0.$ === 'Nothing') {
					return $elm$parser$Parser$Advanced$problem($wolfadex$elm_rfc3339$Rfc3339$ExpectedAnInt);
				} else {
					var i = _v0.a;
					return (_Utils_cmp(i, limits.min) < 0) ? $elm$parser$Parser$Advanced$problem(limitProblem) : ((_Utils_cmp(i, limits.max) > 0) ? $elm$parser$Parser$Advanced$problem(limitProblem) : $elm$parser$Parser$Advanced$succeed(i));
				}
			},
			$elm$parser$Parser$Advanced$getChompedString(
				A2($elm$parser$Parser$Advanced$loop, size, $wolfadex$elm_rfc3339$Rfc3339$parseDigitsHelper)));
	});
var $elm$parser$Parser$Advanced$isSubString = _Parser_isSubString;
var $elm$parser$Parser$Advanced$token = function (_v0) {
	var str = _v0.a;
	var expecting = _v0.b;
	var progress = !$elm$core$String$isEmpty(str);
	return $elm$parser$Parser$Advanced$Parser(
		function (s) {
			var _v1 = A5($elm$parser$Parser$Advanced$isSubString, str, s.offset, s.row, s.col, s.src);
			var newOffset = _v1.a;
			var newRow = _v1.b;
			var newCol = _v1.c;
			return _Utils_eq(newOffset, -1) ? A2(
				$elm$parser$Parser$Advanced$Bad,
				false,
				A2($elm$parser$Parser$Advanced$fromState, s, expecting)) : A3(
				$elm$parser$Parser$Advanced$Good,
				progress,
				_Utils_Tuple0,
				{col: newCol, context: s.context, indent: s.indent, offset: newOffset, row: newRow, src: s.src});
		});
};
var $wolfadex$elm_rfc3339$Rfc3339$dateLocalParser = A2(
	$elm$parser$Parser$Advanced$andThen,
	$wolfadex$elm_rfc3339$Rfc3339$checkDay,
	A2(
		$elm$parser$Parser$Advanced$keeper,
		A2(
			$elm$parser$Parser$Advanced$keeper,
			A2(
				$elm$parser$Parser$Advanced$keeper,
				$elm$parser$Parser$Advanced$succeed(
					F3(
						function (year, month, day) {
							return {day: day, month: month, year: year};
						})),
				A2(
					$elm$parser$Parser$Advanced$ignorer,
					$wolfadex$elm_rfc3339$Rfc3339$parseDigits(4),
					$elm$parser$Parser$Advanced$token(
						A2($elm$parser$Parser$Advanced$Token, '-', $wolfadex$elm_rfc3339$Rfc3339$ExpectedDateSeparator)))),
			A2(
				$elm$parser$Parser$Advanced$ignorer,
				A2(
					$elm$parser$Parser$Advanced$andThen,
					function (_int) {
						return ((_int < 1) || (_int > 12)) ? $elm$parser$Parser$Advanced$problem($wolfadex$elm_rfc3339$Rfc3339$InvalidMonth) : $elm$parser$Parser$Advanced$succeed(
							$justinmimbs$date$Date$numberToMonth(_int));
					},
					$wolfadex$elm_rfc3339$Rfc3339$parseDigits(2)),
				$elm$parser$Parser$Advanced$token(
					A2($elm$parser$Parser$Advanced$Token, '-', $wolfadex$elm_rfc3339$Rfc3339$ExpectedDateSeparator)))),
		A3(
			$wolfadex$elm_rfc3339$Rfc3339$parseDigitsInRange,
			2,
			{max: 31, min: 1},
			$wolfadex$elm_rfc3339$Rfc3339$InvalidDay)));
var $justinmimbs$date$Date$monthToNumber = function (m) {
	switch (m.$) {
		case 'Jan':
			return 1;
		case 'Feb':
			return 2;
		case 'Mar':
			return 3;
		case 'Apr':
			return 4;
		case 'May':
			return 5;
		case 'Jun':
			return 6;
		case 'Jul':
			return 7;
		case 'Aug':
			return 8;
		case 'Sep':
			return 9;
		case 'Oct':
			return 10;
		case 'Nov':
			return 11;
		default:
			return 12;
	}
};
var $justinmimbs$date$Date$toCalendarDateHelp = F3(
	function (y, m, d) {
		toCalendarDateHelp:
		while (true) {
			var monthDays = A2($justinmimbs$date$Date$daysInMonth, y, m);
			var mn = $justinmimbs$date$Date$monthToNumber(m);
			if ((mn < 12) && (_Utils_cmp(d, monthDays) > 0)) {
				var $temp$y = y,
					$temp$m = $justinmimbs$date$Date$numberToMonth(mn + 1),
					$temp$d = d - monthDays;
				y = $temp$y;
				m = $temp$m;
				d = $temp$d;
				continue toCalendarDateHelp;
			} else {
				return {day: d, month: m, year: y};
			}
		}
	});
var $justinmimbs$date$Date$divWithRemainder = F2(
	function (a, b) {
		return _Utils_Tuple2(
			A2($justinmimbs$date$Date$floorDiv, a, b),
			A2($elm$core$Basics$modBy, b, a));
	});
var $justinmimbs$date$Date$year = function (_v0) {
	var rd = _v0.a;
	var _v1 = A2($justinmimbs$date$Date$divWithRemainder, rd, 146097);
	var n400 = _v1.a;
	var r400 = _v1.b;
	var _v2 = A2($justinmimbs$date$Date$divWithRemainder, r400, 36524);
	var n100 = _v2.a;
	var r100 = _v2.b;
	var _v3 = A2($justinmimbs$date$Date$divWithRemainder, r100, 1461);
	var n4 = _v3.a;
	var r4 = _v3.b;
	var _v4 = A2($justinmimbs$date$Date$divWithRemainder, r4, 365);
	var n1 = _v4.a;
	var r1 = _v4.b;
	var n = (!r1) ? 0 : 1;
	return ((((n400 * 400) + (n100 * 100)) + (n4 * 4)) + n1) + n;
};
var $justinmimbs$date$Date$toOrdinalDate = function (_v0) {
	var rd = _v0.a;
	var y = $justinmimbs$date$Date$year(
		$justinmimbs$date$Date$RD(rd));
	return {
		ordinalDay: rd - $justinmimbs$date$Date$daysBeforeYear(y),
		year: y
	};
};
var $justinmimbs$date$Date$toCalendarDate = function (_v0) {
	var rd = _v0.a;
	var date = $justinmimbs$date$Date$toOrdinalDate(
		$justinmimbs$date$Date$RD(rd));
	return A3($justinmimbs$date$Date$toCalendarDateHelp, date.year, $elm$time$Time$Jan, date.ordinalDay);
};
var $justinmimbs$date$Date$day = A2(
	$elm$core$Basics$composeR,
	$justinmimbs$date$Date$toCalendarDate,
	function ($) {
		return $.day;
	});
var $wolfadex$elm_rfc3339$Rfc3339$fakeZone = function (offset) {
	return A2(
		$elm$time$Time$customZone,
		(offset.hour >= 0) ? ((offset.hour * 60) + offset.minute) : ((offset.hour * 60) - offset.minute),
		_List_Nil);
};
var $elm$parser$Parser$Advanced$map = F2(
	function (func, _v0) {
		var parse = _v0.a;
		return $elm$parser$Parser$Advanced$Parser(
			function (s0) {
				var _v1 = parse(s0);
				if (_v1.$ === 'Good') {
					var p = _v1.a;
					var a = _v1.b;
					var s1 = _v1.c;
					return A3(
						$elm$parser$Parser$Advanced$Good,
						p,
						func(a),
						s1);
				} else {
					var p = _v1.a;
					var x = _v1.b;
					return A2($elm$parser$Parser$Advanced$Bad, p, x);
				}
			});
	});
var $justinmimbs$date$Date$month = A2(
	$elm$core$Basics$composeR,
	$justinmimbs$date$Date$toCalendarDate,
	function ($) {
		return $.month;
	});
var $wolfadex$elm_rfc3339$Rfc3339$ExpectedOffsetSeparator = {$: 'ExpectedOffsetSeparator'};
var $wolfadex$elm_rfc3339$Rfc3339$ExpectedOffsetSign = {$: 'ExpectedOffsetSign'};
var $wolfadex$elm_rfc3339$Rfc3339$ExpectedZuluOffset = {$: 'ExpectedZuluOffset'};
var $wolfadex$elm_rfc3339$Rfc3339$InvalidHour = {$: 'InvalidHour'};
var $wolfadex$elm_rfc3339$Rfc3339$hourParser = A3(
	$wolfadex$elm_rfc3339$Rfc3339$parseDigitsInRange,
	2,
	{max: 23, min: 0},
	$wolfadex$elm_rfc3339$Rfc3339$InvalidHour);
var $wolfadex$elm_rfc3339$Rfc3339$InvalidMinute = {$: 'InvalidMinute'};
var $wolfadex$elm_rfc3339$Rfc3339$minuteParser = A3(
	$wolfadex$elm_rfc3339$Rfc3339$parseDigitsInRange,
	2,
	{max: 59, min: 0},
	$wolfadex$elm_rfc3339$Rfc3339$InvalidMinute);
var $elm$parser$Parser$Advanced$Append = F2(
	function (a, b) {
		return {$: 'Append', a: a, b: b};
	});
var $elm$parser$Parser$Advanced$oneOfHelp = F3(
	function (s0, bag, parsers) {
		oneOfHelp:
		while (true) {
			if (!parsers.b) {
				return A2($elm$parser$Parser$Advanced$Bad, false, bag);
			} else {
				var parse = parsers.a.a;
				var remainingParsers = parsers.b;
				var _v1 = parse(s0);
				if (_v1.$ === 'Good') {
					var step = _v1;
					return step;
				} else {
					var step = _v1;
					var p = step.a;
					var x = step.b;
					if (p) {
						return step;
					} else {
						var $temp$s0 = s0,
							$temp$bag = A2($elm$parser$Parser$Advanced$Append, bag, x),
							$temp$parsers = remainingParsers;
						s0 = $temp$s0;
						bag = $temp$bag;
						parsers = $temp$parsers;
						continue oneOfHelp;
					}
				}
			}
		}
	});
var $elm$parser$Parser$Advanced$oneOf = function (parsers) {
	return $elm$parser$Parser$Advanced$Parser(
		function (s) {
			return A3($elm$parser$Parser$Advanced$oneOfHelp, s, $elm$parser$Parser$Advanced$Empty, parsers);
		});
};
var $wolfadex$elm_rfc3339$Rfc3339$offsetParser = $elm$parser$Parser$Advanced$oneOf(
	_List_fromArray(
		[
			A2(
			$elm$parser$Parser$Advanced$ignorer,
			$elm$parser$Parser$Advanced$succeed(
				{hour: 0, minute: 0}),
			$elm$parser$Parser$Advanced$token(
				A2($elm$parser$Parser$Advanced$Token, 'Z', $wolfadex$elm_rfc3339$Rfc3339$ExpectedZuluOffset))),
			A2(
			$elm$parser$Parser$Advanced$keeper,
			A2(
				$elm$parser$Parser$Advanced$keeper,
				A2(
					$elm$parser$Parser$Advanced$keeper,
					$elm$parser$Parser$Advanced$succeed(
						F3(
							function (sign, hour, minute) {
								return {
									hour: sign(hour),
									minute: minute
								};
							})),
					$elm$parser$Parser$Advanced$oneOf(
						_List_fromArray(
							[
								A2(
								$elm$parser$Parser$Advanced$ignorer,
								$elm$parser$Parser$Advanced$succeed($elm$core$Basics$identity),
								$elm$parser$Parser$Advanced$token(
									A2($elm$parser$Parser$Advanced$Token, '+', $wolfadex$elm_rfc3339$Rfc3339$ExpectedOffsetSign))),
								A2(
								$elm$parser$Parser$Advanced$ignorer,
								$elm$parser$Parser$Advanced$succeed($elm$core$Basics$negate),
								$elm$parser$Parser$Advanced$token(
									A2($elm$parser$Parser$Advanced$Token, '-', $wolfadex$elm_rfc3339$Rfc3339$ExpectedOffsetSign)))
							]))),
				A2(
					$elm$parser$Parser$Advanced$ignorer,
					$wolfadex$elm_rfc3339$Rfc3339$hourParser,
					$elm$parser$Parser$Advanced$token(
						A2($elm$parser$Parser$Advanced$Token, ':', $wolfadex$elm_rfc3339$Rfc3339$ExpectedOffsetSeparator)))),
			$wolfadex$elm_rfc3339$Rfc3339$minuteParser)
		]));
var $wolfadex$elm_rfc3339$Rfc3339$ExpectedFractionalSecondSeparator = {$: 'ExpectedFractionalSecondSeparator'};
var $wolfadex$elm_rfc3339$Rfc3339$ExpectedTimeSeparator = {$: 'ExpectedTimeSeparator'};
var $wolfadex$elm_rfc3339$Rfc3339$InvalidSecond = {$: 'InvalidSecond'};
var $elm$parser$Parser$Advanced$chompWhileHelp = F5(
	function (isGood, offset, row, col, s0) {
		chompWhileHelp:
		while (true) {
			var newOffset = A3($elm$parser$Parser$Advanced$isSubChar, isGood, offset, s0.src);
			if (_Utils_eq(newOffset, -1)) {
				return A3(
					$elm$parser$Parser$Advanced$Good,
					_Utils_cmp(s0.offset, offset) < 0,
					_Utils_Tuple0,
					{col: col, context: s0.context, indent: s0.indent, offset: offset, row: row, src: s0.src});
			} else {
				if (_Utils_eq(newOffset, -2)) {
					var $temp$isGood = isGood,
						$temp$offset = offset + 1,
						$temp$row = row + 1,
						$temp$col = 1,
						$temp$s0 = s0;
					isGood = $temp$isGood;
					offset = $temp$offset;
					row = $temp$row;
					col = $temp$col;
					s0 = $temp$s0;
					continue chompWhileHelp;
				} else {
					var $temp$isGood = isGood,
						$temp$offset = newOffset,
						$temp$row = row,
						$temp$col = col + 1,
						$temp$s0 = s0;
					isGood = $temp$isGood;
					offset = $temp$offset;
					row = $temp$row;
					col = $temp$col;
					s0 = $temp$s0;
					continue chompWhileHelp;
				}
			}
		}
	});
var $elm$parser$Parser$Advanced$chompWhile = function (isGood) {
	return $elm$parser$Parser$Advanced$Parser(
		function (s) {
			return A5($elm$parser$Parser$Advanced$chompWhileHelp, isGood, s.offset, s.row, s.col, s);
		});
};
var $wolfadex$elm_rfc3339$Rfc3339$timeLocalParser = A2(
	$elm$parser$Parser$Advanced$keeper,
	A2(
		$elm$parser$Parser$Advanced$keeper,
		A2(
			$elm$parser$Parser$Advanced$keeper,
			$elm$parser$Parser$Advanced$succeed(
				F3(
					function (hour, minute, _v0) {
						var second = _v0.a;
						var millisecond = _v0.b;
						return {hour: hour, millisecond: millisecond, minute: minute, second: second};
					})),
			A2(
				$elm$parser$Parser$Advanced$ignorer,
				$wolfadex$elm_rfc3339$Rfc3339$hourParser,
				$elm$parser$Parser$Advanced$token(
					A2($elm$parser$Parser$Advanced$Token, ':', $wolfadex$elm_rfc3339$Rfc3339$ExpectedTimeSeparator)))),
		A2(
			$elm$parser$Parser$Advanced$ignorer,
			$wolfadex$elm_rfc3339$Rfc3339$minuteParser,
			$elm$parser$Parser$Advanced$token(
				A2($elm$parser$Parser$Advanced$Token, ':', $wolfadex$elm_rfc3339$Rfc3339$ExpectedTimeSeparator)))),
	A2(
		$elm$parser$Parser$Advanced$andThen,
		function (_v1) {
			var second = _v1.a;
			var fracSeconds = _v1.b;
			if (fracSeconds.$ === 'Nothing') {
				return $elm$parser$Parser$Advanced$succeed(
					_Utils_Tuple2(second, 0));
			} else {
				var frac = fracSeconds.a;
				var _v3 = $elm$core$String$toInt(
					A2($elm$core$String$left, 3, frac + '000'));
				if (_v3.$ === 'Nothing') {
					return $elm$parser$Parser$Advanced$problem($wolfadex$elm_rfc3339$Rfc3339$ExpectedAnInt);
				} else {
					var f = _v3.a;
					return $elm$parser$Parser$Advanced$succeed(
						_Utils_Tuple2(second, f));
				}
			}
		},
		A2(
			$elm$parser$Parser$Advanced$keeper,
			A2(
				$elm$parser$Parser$Advanced$keeper,
				$elm$parser$Parser$Advanced$succeed($elm$core$Tuple$pair),
				A3(
					$wolfadex$elm_rfc3339$Rfc3339$parseDigitsInRange,
					2,
					{max: 59, min: 0},
					$wolfadex$elm_rfc3339$Rfc3339$InvalidSecond)),
			$elm$parser$Parser$Advanced$oneOf(
				_List_fromArray(
					[
						A2(
						$elm$parser$Parser$Advanced$keeper,
						A2(
							$elm$parser$Parser$Advanced$ignorer,
							$elm$parser$Parser$Advanced$succeed($elm$core$Maybe$Just),
							$elm$parser$Parser$Advanced$token(
								A2($elm$parser$Parser$Advanced$Token, '.', $wolfadex$elm_rfc3339$Rfc3339$ExpectedFractionalSecondSeparator))),
						$elm$parser$Parser$Advanced$getChompedString(
							A2(
								$elm$parser$Parser$Advanced$ignorer,
								A2(
									$elm$parser$Parser$Advanced$ignorer,
									$elm$parser$Parser$Advanced$succeed(_Utils_Tuple0),
									A2($elm$parser$Parser$Advanced$chompIf, $elm$core$Char$isDigit, $wolfadex$elm_rfc3339$Rfc3339$ExpectedDigit)),
								$elm$parser$Parser$Advanced$chompWhile($elm$core$Char$isDigit)))),
						$elm$parser$Parser$Advanced$succeed($elm$core$Maybe$Nothing)
					])))));
var $wolfadex$elm_rfc3339$Rfc3339$ExpectedDateTimeSeparator = {$: 'ExpectedDateTimeSeparator'};
var $elm$parser$Parser$Advanced$backtrackable = function (_v0) {
	var parse = _v0.a;
	return $elm$parser$Parser$Advanced$Parser(
		function (s0) {
			var _v1 = parse(s0);
			if (_v1.$ === 'Bad') {
				var x = _v1.b;
				return A2($elm$parser$Parser$Advanced$Bad, false, x);
			} else {
				var a = _v1.b;
				var s1 = _v1.c;
				return A3($elm$parser$Parser$Advanced$Good, false, a, s1);
			}
		});
};
var $wolfadex$elm_rfc3339$Rfc3339$timeSeparatorParser = $elm$parser$Parser$Advanced$oneOf(
	_List_fromArray(
		[
			$elm$parser$Parser$Advanced$token(
			A2($elm$parser$Parser$Advanced$Token, 'T', $wolfadex$elm_rfc3339$Rfc3339$ExpectedDateTimeSeparator)),
			$elm$parser$Parser$Advanced$token(
			A2($elm$parser$Parser$Advanced$Token, 't', $wolfadex$elm_rfc3339$Rfc3339$ExpectedDateTimeSeparator)),
			$elm$parser$Parser$Advanced$backtrackable(
			$elm$parser$Parser$Advanced$token(
				A2($elm$parser$Parser$Advanced$Token, ' ', $wolfadex$elm_rfc3339$Rfc3339$ExpectedDateTimeSeparator)))
		]));
var $wolfadex$elm_rfc3339$Rfc3339$dateTimeParser = A2(
	$elm$parser$Parser$Advanced$keeper,
	A2(
		$elm$parser$Parser$Advanced$keeper,
		$elm$parser$Parser$Advanced$succeed(
			F2(
				function (date, maybeTimeOffset) {
					if (maybeTimeOffset.$ === 'Nothing') {
						return $wolfadex$elm_rfc3339$Rfc3339$DateLocal(date);
					} else {
						var _v1 = maybeTimeOffset.a;
						var time = _v1.a;
						var maybeOffset = _v1.b;
						var parts = {
							day: $justinmimbs$date$Date$day(date),
							hour: time.hour,
							millisecond: time.millisecond,
							minute: time.minute,
							month: $justinmimbs$date$Date$month(date),
							second: time.second,
							year: $justinmimbs$date$Date$year(date)
						};
						if (maybeOffset.$ === 'Nothing') {
							return $wolfadex$elm_rfc3339$Rfc3339$DateTimeLocal(parts);
						} else {
							var offset = maybeOffset.a;
							return $wolfadex$elm_rfc3339$Rfc3339$DateTimeOffset(
								{
									instant: A2(
										$justinmimbs$time_extra$Time$Extra$partsToPosix,
										$wolfadex$elm_rfc3339$Rfc3339$fakeZone(offset),
										parts),
									offset: offset
								});
						}
					}
				})),
		$wolfadex$elm_rfc3339$Rfc3339$dateLocalParser),
	$elm$parser$Parser$Advanced$oneOf(
		_List_fromArray(
			[
				A2(
				$elm$parser$Parser$Advanced$keeper,
				A2(
					$elm$parser$Parser$Advanced$keeper,
					A2(
						$elm$parser$Parser$Advanced$ignorer,
						$elm$parser$Parser$Advanced$succeed(
							F2(
								function (time, maybeOffset) {
									return $elm$core$Maybe$Just(
										_Utils_Tuple2(time, maybeOffset));
								})),
						$wolfadex$elm_rfc3339$Rfc3339$timeSeparatorParser),
					$wolfadex$elm_rfc3339$Rfc3339$timeLocalParser),
				$elm$parser$Parser$Advanced$oneOf(
					_List_fromArray(
						[
							A2($elm$parser$Parser$Advanced$map, $elm$core$Maybe$Just, $wolfadex$elm_rfc3339$Rfc3339$offsetParser),
							$elm$parser$Parser$Advanced$succeed($elm$core$Maybe$Nothing)
						]))),
				$elm$parser$Parser$Advanced$succeed($elm$core$Maybe$Nothing)
			])));
var $elm$parser$Parser$Advanced$bagToList = F2(
	function (bag, list) {
		bagToList:
		while (true) {
			switch (bag.$) {
				case 'Empty':
					return list;
				case 'AddRight':
					var bag1 = bag.a;
					var x = bag.b;
					var $temp$bag = bag1,
						$temp$list = A2($elm$core$List$cons, x, list);
					bag = $temp$bag;
					list = $temp$list;
					continue bagToList;
				default:
					var bag1 = bag.a;
					var bag2 = bag.b;
					var $temp$bag = bag1,
						$temp$list = A2($elm$parser$Parser$Advanced$bagToList, bag2, list);
					bag = $temp$bag;
					list = $temp$list;
					continue bagToList;
			}
		}
	});
var $elm$parser$Parser$Advanced$run = F2(
	function (_v0, src) {
		var parse = _v0.a;
		var _v1 = parse(
			{col: 1, context: _List_Nil, indent: 1, offset: 0, row: 1, src: src});
		if (_v1.$ === 'Good') {
			var value = _v1.b;
			return $elm$core$Result$Ok(value);
		} else {
			var bag = _v1.b;
			return $elm$core$Result$Err(
				A2($elm$parser$Parser$Advanced$bagToList, bag, _List_Nil));
		}
	});
var $wolfadex$elm_rfc3339$Rfc3339$parse = function (input) {
	var useDateParser = function () {
		var _v0 = $elm$core$String$uncons(
			A3($elm$core$String$slice, 2, 3, input));
		if (_v0.$ === 'Nothing') {
			return true;
		} else {
			var _v1 = _v0.a;
			var _char = _v1.a;
			return $elm$core$Char$isDigit(_char);
		}
	}();
	return A2(
		$elm$core$Result$mapError,
		$elm$core$List$map(
			function ($) {
				return $.problem;
			}),
		useDateParser ? A2($elm$parser$Parser$Advanced$run, $wolfadex$elm_rfc3339$Rfc3339$dateTimeParser, input) : A2(
			$elm$parser$Parser$Advanced$run,
			A2($elm$parser$Parser$Advanced$map, $wolfadex$elm_rfc3339$Rfc3339$TimeLocal, $wolfadex$elm_rfc3339$Rfc3339$timeLocalParser),
			input));
};
var $elm$browser$Browser$Navigation$pushUrl = _Browser_pushUrl;
var $author$project$IndexedDb$put = F3(
	function (db, store, value) {
		return $andrewMacmurray$elm_concurrent_task$ConcurrentTask$define(
			{
				args: $elm$json$Json$Encode$object(
					_List_fromArray(
						[
							_Utils_Tuple2(
							'db',
							$elm$json$Json$Encode$string(
								$author$project$IndexedDb$getDbName(db))),
							_Utils_Tuple2(
							'store',
							$elm$json$Json$Encode$string(
								$author$project$IndexedDb$getStoreName(store))),
							_Utils_Tuple2('value', value)
						])),
				errors: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$expectErrors($author$project$IndexedDb$errorDecoder),
				expect: $andrewMacmurray$elm_concurrent_task$ConcurrentTask$expectJson($author$project$IndexedDb$keyDecoder),
				_function: 'indexeddb:put'
			});
	});
var $author$project$Main$AddBehaviorRoute = {$: 'AddBehaviorRoute'};
var $author$project$Main$EditBehaviorRoute = function (a) {
	return {$: 'EditBehaviorRoute', a: a};
};
var $author$project$Main$SettingsRoute = {$: 'SettingsRoute'};
var $author$project$Main$StatRoute = function (a) {
	return {$: 'StatRoute', a: a};
};
var $author$project$Main$StatsRoute = {$: 'StatsRoute'};
var $elm$url$Url$percentDecode = _Url_percentDecode;
var $lydell$elm_app_url$AppUrl$percentDecode = function (string) {
	return A2(
		$elm$core$Maybe$withDefault,
		string,
		$elm$url$Url$percentDecode(string));
};
var $lydell$elm_app_url$AppUrl$trimLeadingSlash = function (string) {
	return A2($elm$core$String$startsWith, '/', string) ? A2($elm$core$String$dropLeft, 1, string) : string;
};
var $elm$core$String$dropRight = F2(
	function (n, string) {
		return (n < 1) ? string : A3($elm$core$String$slice, 0, -n, string);
	});
var $lydell$elm_app_url$AppUrl$trimTrailingSlash = function (string) {
	return A2($elm$core$String$endsWith, '/', string) ? A2($elm$core$String$dropRight, 1, string) : string;
};
var $lydell$elm_app_url$AppUrl$parsePath = function (path) {
	var trimmed = $lydell$elm_app_url$AppUrl$trimTrailingSlash(
		$lydell$elm_app_url$AppUrl$trimLeadingSlash(path));
	return $elm$core$String$isEmpty(trimmed) ? _List_Nil : A2(
		$elm$core$List$map,
		$lydell$elm_app_url$AppUrl$percentDecode,
		A2($elm$core$String$split, '/', trimmed));
};
var $lydell$elm_app_url$AppUrl$insert = F2(
	function (value, maybeList) {
		return $elm$core$Maybe$Just(
			A2(
				$elm$core$List$cons,
				value,
				A2($elm$core$Maybe$withDefault, _List_Nil, maybeList)));
	});
var $lydell$elm_app_url$AppUrl$queryParameterDecode = A2(
	$elm$core$Basics$composeR,
	A2($elm$core$String$replace, '+', ' '),
	$lydell$elm_app_url$AppUrl$percentDecode);
var $lydell$elm_app_url$AppUrl$parseQueryParameter = F2(
	function (segment, queryParameters) {
		var _v0 = A2($elm$core$String$split, '=', segment);
		if (!_v0.b) {
			return queryParameters;
		} else {
			if ((_v0.a === '') && (!_v0.b.b)) {
				return queryParameters;
			} else {
				var rawKey = _v0.a;
				var rest = _v0.b;
				return A3(
					$elm$core$Dict$update,
					$lydell$elm_app_url$AppUrl$queryParameterDecode(rawKey),
					$lydell$elm_app_url$AppUrl$insert(
						$lydell$elm_app_url$AppUrl$queryParameterDecode(
							A2($elm$core$String$join, '=', rest))),
					queryParameters);
			}
		}
	});
var $lydell$elm_app_url$AppUrl$parseQueryParameters = A2(
	$elm$core$Basics$composeR,
	$elm$core$String$split('&'),
	A2($elm$core$List$foldr, $lydell$elm_app_url$AppUrl$parseQueryParameter, $elm$core$Dict$empty));
var $lydell$elm_app_url$AppUrl$fromUrl = function (url) {
	return {
		fragment: A2($elm$core$Maybe$map, $lydell$elm_app_url$AppUrl$percentDecode, url.fragment),
		path: $lydell$elm_app_url$AppUrl$parsePath(url.path),
		queryParameters: A2(
			$elm$core$Maybe$withDefault,
			$elm$core$Dict$empty,
			A2($elm$core$Maybe$map, $lydell$elm_app_url$AppUrl$parseQueryParameters, url.query))
	};
};
var $author$project$Main$routeFromUrl = function (url) {
	var appUrl = $lydell$elm_app_url$AppUrl$fromUrl(url);
	var _v0 = appUrl.path;
	_v0$6:
	while (true) {
		if (!_v0.b) {
			return $author$project$Main$HomeRoute;
		} else {
			if (_v0.b.b) {
				if (_v0.a === 'behavior') {
					if (!_v0.b.b.b) {
						if (_v0.b.a === 'add') {
							var _v1 = _v0.b;
							return $author$project$Main$AddBehaviorRoute;
						} else {
							break _v0$6;
						}
					} else {
						if (!_v0.b.b.b.b) {
							switch (_v0.b.b.a) {
								case 'edit':
									var _v2 = _v0.b;
									var idStr = _v2.a;
									var _v3 = _v2.b;
									var _v4 = $TSFoster$elm_uuid$UUID$fromString(idStr);
									if (_v4.$ === 'Err') {
										return $author$project$Main$HomeRoute;
									} else {
										var id = _v4.a;
										return $author$project$Main$EditBehaviorRoute(id);
									}
								case 'stats':
									var _v5 = _v0.b;
									var idStr = _v5.a;
									var _v6 = _v5.b;
									var _v7 = $TSFoster$elm_uuid$UUID$fromString(idStr);
									if (_v7.$ === 'Err') {
										return $author$project$Main$StatsRoute;
									} else {
										var id = _v7.a;
										return $author$project$Main$StatRoute(id);
									}
								default:
									break _v0$6;
							}
						} else {
							break _v0$6;
						}
					}
				} else {
					break _v0$6;
				}
			} else {
				switch (_v0.a) {
					case 'settings':
						return $author$project$Main$SettingsRoute;
					case 'stats':
						return $author$project$Main$StatsRoute;
					default:
						break _v0$6;
				}
			}
		}
	}
	return $author$project$Main$HomeRoute;
};
var $author$project$Main$routeToString = function (route) {
	switch (route.$) {
		case 'HomeRoute':
			return '/';
		case 'AddBehaviorRoute':
			return '/behavior/add';
		case 'EditBehaviorRoute':
			var id = route.a;
			return '/behavior/' + ($TSFoster$elm_uuid$UUID$toString(id) + '/edit');
		case 'StatRoute':
			var id = route.a;
			return '/behavior/' + ($TSFoster$elm_uuid$UUID$toString(id) + '/stats');
		case 'SettingsRoute':
			return '/settings';
		default:
			return '/stats';
	}
};
var $TSFoster$elm_uuid$UUID$Seeds = F4(
	function (seed1, seed2, seed3, seed4) {
		return {seed1: seed1, seed2: seed2, seed3: seed3, seed4: seed4};
	});
var $elm$random$Random$Generator = function (a) {
	return {$: 'Generator', a: a};
};
var $elm$core$Bitwise$xor = _Bitwise_xor;
var $elm$random$Random$peel = function (_v0) {
	var state = _v0.a;
	var word = (state ^ (state >>> ((state >>> 28) + 4))) * 277803737;
	return ((word >>> 22) ^ word) >>> 0;
};
var $elm$random$Random$int = F2(
	function (a, b) {
		return $elm$random$Random$Generator(
			function (seed0) {
				var _v0 = (_Utils_cmp(a, b) < 0) ? _Utils_Tuple2(a, b) : _Utils_Tuple2(b, a);
				var lo = _v0.a;
				var hi = _v0.b;
				var range = (hi - lo) + 1;
				if (!((range - 1) & range)) {
					return _Utils_Tuple2(
						(((range - 1) & $elm$random$Random$peel(seed0)) >>> 0) + lo,
						$elm$random$Random$next(seed0));
				} else {
					var threshhold = (((-range) >>> 0) % range) >>> 0;
					var accountForBias = function (seed) {
						accountForBias:
						while (true) {
							var x = $elm$random$Random$peel(seed);
							var seedN = $elm$random$Random$next(seed);
							if (_Utils_cmp(x, threshhold) < 0) {
								var $temp$seed = seedN;
								seed = $temp$seed;
								continue accountForBias;
							} else {
								return _Utils_Tuple2((x % range) + lo, seedN);
							}
						}
					};
					return accountForBias(seed0);
				}
			});
	});
var $elm$random$Random$map = F2(
	function (func, _v0) {
		var genA = _v0.a;
		return $elm$random$Random$Generator(
			function (seed0) {
				var _v1 = genA(seed0);
				var a = _v1.a;
				var seed1 = _v1.b;
				return _Utils_Tuple2(
					func(a),
					seed1);
			});
	});
var $elm$random$Random$maxInt = 2147483647;
var $elm$random$Random$minInt = -2147483648;
var $TSFoster$elm_uuid$UUID$randomU32 = A2(
	$elm$random$Random$map,
	$TSFoster$elm_uuid$UUID$forceUnsigned,
	A2($elm$random$Random$int, $elm$random$Random$minInt, $elm$random$Random$maxInt));
var $elm$random$Random$step = F2(
	function (_v0, seed) {
		var generator = _v0.a;
		return generator(seed);
	});
var $TSFoster$elm_uuid$UUID$toVariant1 = function (_v0) {
	var a = _v0.a;
	var b = _v0.b;
	var c = _v0.c;
	var d = _v0.d;
	return A4(
		$TSFoster$elm_uuid$UUID$UUID,
		a,
		b,
		$TSFoster$elm_uuid$UUID$forceUnsigned(2147483648 | (1073741823 & c)),
		d);
};
var $TSFoster$elm_uuid$UUID$toVersion = F2(
	function (v, _v0) {
		var a = _v0.a;
		var b = _v0.b;
		var c = _v0.c;
		var d = _v0.d;
		return A4(
			$TSFoster$elm_uuid$UUID$UUID,
			a,
			$TSFoster$elm_uuid$UUID$forceUnsigned((v << 12) | (4294905855 & b)),
			c,
			d);
	});
var $TSFoster$elm_uuid$UUID$step = function (s) {
	var _v0 = A2($elm$random$Random$step, $TSFoster$elm_uuid$UUID$randomU32, s.seed4);
	var int4 = _v0.a;
	var seed4 = _v0.b;
	var _v1 = A2($elm$random$Random$step, $TSFoster$elm_uuid$UUID$randomU32, s.seed3);
	var int3 = _v1.a;
	var seed3 = _v1.b;
	var _v2 = A2($elm$random$Random$step, $TSFoster$elm_uuid$UUID$randomU32, s.seed2);
	var int2 = _v2.a;
	var seed2 = _v2.b;
	var _v3 = A2($elm$random$Random$step, $TSFoster$elm_uuid$UUID$randomU32, s.seed1);
	var int1 = _v3.a;
	var seed1 = _v3.b;
	var uuid = $TSFoster$elm_uuid$UUID$toVariant1(
		A2(
			$TSFoster$elm_uuid$UUID$toVersion,
			4,
			A4($TSFoster$elm_uuid$UUID$UUID, int1, int2, int3, int4)));
	return _Utils_Tuple2(
		uuid,
		A4($TSFoster$elm_uuid$UUID$Seeds, seed1, seed2, seed3, seed4));
};
var $elm$file$File$Download$string = F3(
	function (name, mime, content) {
		return A2(
			$elm$core$Task$perform,
			$elm$core$Basics$never,
			A3(_File_download, name, mime, content));
	});
var $elm$file$File$toString = _File_toString;
var $elm$url$Url$addPort = F2(
	function (maybePort, starter) {
		if (maybePort.$ === 'Nothing') {
			return starter;
		} else {
			var port_ = maybePort.a;
			return starter + (':' + $elm$core$String$fromInt(port_));
		}
	});
var $elm$url$Url$addPrefixed = F3(
	function (prefix, maybeSegment, starter) {
		if (maybeSegment.$ === 'Nothing') {
			return starter;
		} else {
			var segment = maybeSegment.a;
			return _Utils_ap(
				starter,
				_Utils_ap(prefix, segment));
		}
	});
var $elm$url$Url$toString = function (url) {
	var http = function () {
		var _v0 = url.protocol;
		if (_v0.$ === 'Http') {
			return 'http://';
		} else {
			return 'https://';
		}
	}();
	return A3(
		$elm$url$Url$addPrefixed,
		'#',
		url.fragment,
		A3(
			$elm$url$Url$addPrefixed,
			'?',
			url.query,
			_Utils_ap(
				A2(
					$elm$url$Url$addPort,
					url.port_,
					_Utils_ap(http, url.host)),
				url.path)));
};
var $author$project$Main$uuidToKey = function (uuid) {
	return $author$project$IndexedDb$StringKey(
		$TSFoster$elm_uuid$UUID$toString(uuid));
};
var $BrianHicks$elm_csv$Csv$Encode$WithFieldNames = function (a) {
	return {$: 'WithFieldNames', a: a};
};
var $BrianHicks$elm_csv$Csv$Encode$withFieldNames = $BrianHicks$elm_csv$Csv$Encode$WithFieldNames;
var $author$project$Main$update = F2(
	function (msg, app) {
		switch (app.$) {
			case 'StartupFailure':
				return _Utils_Tuple2(app, $elm$core$Platform$Cmd$none);
			case 'Initializing':
				var model = app.a;
				switch (msg.$) {
					case 'UrlChanged':
						var url = msg.a;
						return _Utils_Tuple2(
							$author$project$Main$Initializing(
								_Utils_update(
									model,
									{url: url})),
							$elm$core$Platform$Cmd$none);
					case 'UrlRequested':
						var urlRequest = msg.a;
						if (urlRequest.$ === 'Internal') {
							var url = urlRequest.a;
							return _Utils_Tuple2(
								app,
								A2(
									$elm$browser$Browser$Navigation$pushUrl,
									model.navKey,
									$elm$url$Url$toString(url)));
						} else {
							var url = urlRequest.a;
							return _Utils_Tuple2(
								app,
								$elm$browser$Browser$Navigation$load(url));
						}
					case 'TimeZoneFound':
						var zone = msg.a;
						return _Utils_Tuple2(
							$author$project$Main$Initializing(
								_Utils_update(
									model,
									{zone: zone})),
							$elm$core$Platform$Cmd$none);
					case 'GotToday':
						var today = msg.a;
						return _Utils_Tuple2(
							$author$project$Main$Initializing(
								_Utils_update(
									model,
									{today: today})),
							$elm$core$Platform$Cmd$none);
					case 'OnDbProgress':
						var _v3 = msg.a;
						var dbTasks = _v3.a;
						var cmd = _v3.b;
						return _Utils_Tuple2(
							$author$project$Main$Initializing(
								_Utils_update(
									model,
									{dbTasks: dbTasks})),
							cmd);
					case 'DbLoaded':
						var response = msg.a;
						switch (response.$) {
							case 'Error':
								return _Utils_Tuple2($author$project$Main$StartupFailure, $elm$core$Platform$Cmd$none);
							case 'UnexpectedError':
								return _Utils_Tuple2($author$project$Main$StartupFailure, $elm$core$Platform$Cmd$none);
							default:
								var _v5 = response.a;
								var db = _v5.a;
								var behaviors = _v5.b;
								var route = $author$project$Main$routeFromUrl(model.url);
								return _Utils_Tuple2(
									$author$project$Main$Initialized(
										function (m) {
											if (route.$ === 'EditBehaviorRoute') {
												var id = route.a;
												var _v7 = A2($author$project$Main$findBehaviorById, id, m.safetyBehaviors);
												if (_v7.$ === 'Nothing') {
													return m;
												} else {
													var behavior = _v7.a;
													return _Utils_update(
														m,
														{
															behaviorEditing: $elm$core$Maybe$Just(
																{_new: behavior, old: behavior, resistToInsert: '', submitToInsert: ''}),
															confirmDelete: $elm$core$Maybe$Nothing,
															deleting: false
														});
												}
											} else {
												return m;
											}
										}(
											{
												addingBehavior: $author$project$Main$Fresh,
												behaviorEditing: $elm$core$Maybe$Nothing,
												behaviorNameToAdd: '',
												confirmDelete: $elm$core$Maybe$Nothing,
												db: db,
												dbTasks: model.dbTasks,
												deleting: false,
												editingBehavior: $author$project$Main$Fresh,
												importErrors: _List_Nil,
												navKey: model.navKey,
												route: route,
												safetyBehaviors: behaviors,
												seeds: model.seeds,
												today: $elm$time$Time$millisToPosix(0),
												zone: model.zone
											})),
									function () {
										if (route.$ === 'StatsRoute') {
											return A2($elm$core$Task$perform, $author$project$Main$GotToday, $elm$time$Time$now);
										} else {
											return $elm$core$Platform$Cmd$none;
										}
									}());
						}
					default:
						return _Utils_Tuple2(app, $elm$core$Platform$Cmd$none);
				}
			default:
				var model = app.a;
				return A2(
					$elm$core$Tuple$mapFirst,
					$author$project$Main$Initialized,
					function () {
						switch (msg.$) {
							case 'UrlChanged':
								var url = msg.a;
								var route = $author$project$Main$routeFromUrl(url);
								switch (route.$) {
									case 'EditBehaviorRoute':
										var id = route.a;
										var _v11 = A2($author$project$Main$findBehaviorById, id, model.safetyBehaviors);
										if (_v11.$ === 'Nothing') {
											return _Utils_Tuple2(
												_Utils_update(
													model,
													{behaviorEditing: $elm$core$Maybe$Nothing, deleting: false, route: route}),
												$elm$core$Platform$Cmd$none);
										} else {
											var behavior = _v11.a;
											return _Utils_Tuple2(
												_Utils_update(
													model,
													{
														behaviorEditing: $elm$core$Maybe$Just(
															{_new: behavior, old: behavior, resistToInsert: '', submitToInsert: ''}),
														confirmDelete: $elm$core$Maybe$Nothing,
														deleting: false,
														editingBehavior: $author$project$Main$Fresh,
														route: route
													}),
												$elm$core$Platform$Cmd$none);
										}
									case 'AddBehaviorRoute':
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{addingBehavior: $author$project$Main$Fresh, route: route}),
											$elm$core$Platform$Cmd$none);
									case 'StatsRoute':
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{behaviorEditing: $elm$core$Maybe$Nothing, route: route}),
											A2($elm$core$Task$perform, $author$project$Main$GotToday, $elm$time$Time$now));
									default:
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{behaviorEditing: $elm$core$Maybe$Nothing, route: route}),
											$elm$core$Platform$Cmd$none);
								}
							case 'UrlRequested':
								var urlRequest = msg.a;
								if (urlRequest.$ === 'Internal') {
									var url = urlRequest.a;
									return _Utils_Tuple2(
										model,
										A2(
											$elm$browser$Browser$Navigation$pushUrl,
											model.navKey,
											$elm$url$Url$toString(url)));
								} else {
									var url = urlRequest.a;
									return _Utils_Tuple2(
										model,
										$elm$browser$Browser$Navigation$load(url));
								}
							case 'TimeZoneFound':
								var zone = msg.a;
								return _Utils_Tuple2(
									_Utils_update(
										model,
										{zone: zone}),
									$elm$core$Platform$Cmd$none);
							case 'GotToday':
								var today = msg.a;
								return _Utils_Tuple2(
									_Utils_update(
										model,
										{today: today}),
									$elm$core$Platform$Cmd$none);
							case 'OnDbProgress':
								var _v13 = msg.a;
								var dbTasks = _v13.a;
								var cmd = _v13.b;
								return _Utils_Tuple2(
									_Utils_update(
										model,
										{dbTasks: dbTasks}),
									cmd);
							case 'DbLoaded':
								return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
							case 'BehaviorNameToAddChanged':
								var name = msg.a;
								return _Utils_Tuple2(
									_Utils_update(
										model,
										{behaviorNameToAdd: name}),
									$elm$core$Platform$Cmd$none);
							case 'AddBehavior':
								var _v14 = model.addingBehavior;
								if (_v14.$ === 'Saving') {
									return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
								} else {
									if ($elm$core$String$isEmpty(model.behaviorNameToAdd)) {
										return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
									} else {
										var _v15 = $TSFoster$elm_uuid$UUID$step(model.seeds);
										var id = _v15.a;
										var seeds = _v15.b;
										var _v16 = A2(
											$author$project$Main$doDbTask,
											$author$project$Main$BehaviorCreateResponded(id),
											A3(
												$author$project$IndexedDb$add,
												model.db,
												$author$project$Main$behaviorStore,
												$author$project$Main$encodeBehavior(
													{id: id, name: model.behaviorNameToAdd, resists: _List_Nil, submits: _List_Nil})));
										var dbTasks = _v16.a;
										var cmd = _v16.b;
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{addingBehavior: $author$project$Main$Saving, dbTasks: dbTasks, seeds: seeds}),
											cmd);
									}
								}
							case 'BehaviorCreateResponded':
								var id = msg.a;
								var response = msg.b;
								switch (response.$) {
									case 'Error':
										var err = response.a;
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													addingBehavior: $author$project$Main$FailedToSave(
														function () {
															switch (err.$) {
																case 'AlreadyExists':
																	return 'Already exists';
																case 'TransactionError':
																	var e = err.a;
																	return e;
																case 'QuotaExceeded':
																	return 'Quota exceeded';
																default:
																	var e = err.a;
																	return e;
															}
														}())
												}),
											$elm$core$Platform$Cmd$none);
									case 'UnexpectedError':
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													addingBehavior: $author$project$Main$FailedToSave('Unexpected error')
												}),
											$elm$core$Platform$Cmd$none);
									default:
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													behaviorNameToAdd: '',
													safetyBehaviors: A2(
														$elm$core$List$cons,
														{id: id, name: model.behaviorNameToAdd, resists: _List_Nil, submits: _List_Nil},
														model.safetyBehaviors)
												}),
											A2(
												$elm$browser$Browser$Navigation$pushUrl,
												model.navKey,
												$author$project$Main$routeToString($author$project$Main$HomeRoute)));
								}
							case 'SubmittedToBehavior':
								var id = msg.a;
								var _v19 = A2($author$project$Main$findBehaviorById, id, model.safetyBehaviors);
								if (_v19.$ === 'Nothing') {
									return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
								} else {
									var b = _v19.a;
									return _Utils_Tuple2(
										model,
										A2(
											$elm$core$Task$perform,
											$author$project$Main$SubmittedToBehaviorAt(b),
											$elm$time$Time$now));
								}
							case 'SubmittedToBehaviorAt':
								var behavior = msg.a;
								var time = msg.b;
								var _v20 = A2(
									$author$project$Main$doDbTask,
									$author$project$Main$BehaviorSaveResponded,
									A3(
										$author$project$IndexedDb$put,
										model.db,
										$author$project$Main$behaviorStore,
										$author$project$Main$encodeBehavior(
											_Utils_update(
												behavior,
												{
													submits: A2($elm$core$List$cons, time, behavior.submits)
												}))));
								var dbTasks = _v20.a;
								var cmd = _v20.b;
								return _Utils_Tuple2(
									_Utils_update(
										model,
										{
											dbTasks: dbTasks,
											safetyBehaviors: A2(
												$elm$core$List$map,
												function (bvh) {
													return _Utils_eq(bvh.id, behavior.id) ? _Utils_update(
														bvh,
														{
															submits: A2($elm$core$List$cons, time, bvh.submits)
														}) : bvh;
												},
												model.safetyBehaviors)
										}),
									cmd);
							case 'ResistedBehavior':
								var id = msg.a;
								var _v21 = A2($author$project$Main$findBehaviorById, id, model.safetyBehaviors);
								if (_v21.$ === 'Nothing') {
									return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
								} else {
									var b = _v21.a;
									return _Utils_Tuple2(
										model,
										A2(
											$elm$core$Task$perform,
											$author$project$Main$ResistedBehaviorAt(b),
											$elm$time$Time$now));
								}
							case 'ResistedBehaviorAt':
								var behavior = msg.a;
								var time = msg.b;
								var _v22 = A2(
									$author$project$Main$doDbTask,
									$author$project$Main$BehaviorSaveResponded,
									A3(
										$author$project$IndexedDb$put,
										model.db,
										$author$project$Main$behaviorStore,
										$author$project$Main$encodeBehavior(
											_Utils_update(
												behavior,
												{
													resists: A2($elm$core$List$cons, time, behavior.resists)
												}))));
								var dbTasks = _v22.a;
								var cmd = _v22.b;
								return _Utils_Tuple2(
									_Utils_update(
										model,
										{
											dbTasks: dbTasks,
											safetyBehaviors: A2(
												$elm$core$List$map,
												function (bvh) {
													return _Utils_eq(bvh.id, behavior.id) ? _Utils_update(
														bvh,
														{
															resists: A2($elm$core$List$cons, time, bvh.resists)
														}) : bvh;
												},
												model.safetyBehaviors)
										}),
									cmd);
							case 'BehaviorNameEdited':
								var name = msg.a;
								var _v23 = model.behaviorEditing;
								if (_v23.$ === 'Nothing') {
									return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
								} else {
									var behaviorEditing = _v23.a;
									var _new = behaviorEditing._new;
									return _Utils_Tuple2(
										_Utils_update(
											model,
											{
												behaviorEditing: $elm$core$Maybe$Just(
													_Utils_update(
														behaviorEditing,
														{
															_new: _Utils_update(
																_new,
																{name: name})
														}))
											}),
										$elm$core$Platform$Cmd$none);
								}
							case 'RemoveSubmit':
								var timestamp = msg.a;
								var _v24 = model.behaviorEditing;
								if (_v24.$ === 'Nothing') {
									return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
								} else {
									var behaviorEditing = _v24.a;
									var _new = behaviorEditing._new;
									return _Utils_Tuple2(
										_Utils_update(
											model,
											{
												behaviorEditing: $elm$core$Maybe$Just(
													_Utils_update(
														behaviorEditing,
														{
															_new: _Utils_update(
																_new,
																{
																	submits: A2(
																		$elm$core$List$filter,
																		function (submit) {
																			return !_Utils_eq(submit, timestamp);
																		},
																		_new.submits)
																})
														}))
											}),
										$elm$core$Platform$Cmd$none);
								}
							case 'SubmitToInsertChanged':
								var submitToInsert = msg.a;
								var _v25 = model.behaviorEditing;
								if (_v25.$ === 'Nothing') {
									return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
								} else {
									var behaviorEditing = _v25.a;
									return _Utils_Tuple2(
										_Utils_update(
											model,
											{
												behaviorEditing: $elm$core$Maybe$Just(
													_Utils_update(
														behaviorEditing,
														{submitToInsert: submitToInsert}))
											}),
										$elm$core$Platform$Cmd$none);
								}
							case 'InsertSubmit':
								var _v26 = model.behaviorEditing;
								if (_v26.$ === 'Nothing') {
									return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
								} else {
									var behaviorEditing = _v26.a;
									var _new = behaviorEditing._new;
									var _v27 = $wolfadex$elm_rfc3339$Rfc3339$parse(behaviorEditing.submitToInsert + ':00');
									if ((_v27.$ === 'Ok') && (_v27.a.$ === 'DateTimeLocal')) {
										var parts = _v27.a.a;
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													behaviorEditing: function () {
														var submits = _new.submits;
														return $elm$core$Maybe$Just(
															_Utils_update(
																behaviorEditing,
																{
																	_new: _Utils_update(
																		_new,
																		{
																			submits: $elm$core$List$reverse(
																				A2(
																					$elm$core$List$sortBy,
																					$elm$time$Time$posixToMillis,
																					A2(
																						$elm$core$List$cons,
																						A2($justinmimbs$time_extra$Time$Extra$partsToPosix, model.zone, parts),
																						submits)))
																		}),
																	submitToInsert: ''
																}));
													}()
												}),
											$elm$core$Platform$Cmd$none);
									} else {
										return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
									}
								}
							case 'RemoveResist':
								var timestamp = msg.a;
								var _v28 = model.behaviorEditing;
								if (_v28.$ === 'Nothing') {
									return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
								} else {
									var behaviorEditing = _v28.a;
									var _new = behaviorEditing._new;
									return _Utils_Tuple2(
										_Utils_update(
											model,
											{
												behaviorEditing: $elm$core$Maybe$Just(
													_Utils_update(
														behaviorEditing,
														{
															_new: _Utils_update(
																_new,
																{
																	resists: A2(
																		$elm$core$List$filter,
																		function (resist) {
																			return !_Utils_eq(resist, timestamp);
																		},
																		_new.resists)
																})
														}))
											}),
										$elm$core$Platform$Cmd$none);
								}
							case 'ResistToInsertChanged':
								var resistToInsert = msg.a;
								var _v29 = model.behaviorEditing;
								if (_v29.$ === 'Nothing') {
									return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
								} else {
									var behaviorEditing = _v29.a;
									return _Utils_Tuple2(
										_Utils_update(
											model,
											{
												behaviorEditing: $elm$core$Maybe$Just(
													_Utils_update(
														behaviorEditing,
														{resistToInsert: resistToInsert}))
											}),
										$elm$core$Platform$Cmd$none);
								}
							case 'InsertResist':
								var _v30 = model.behaviorEditing;
								if (_v30.$ === 'Nothing') {
									return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
								} else {
									var behaviorEditing = _v30.a;
									var _new = behaviorEditing._new;
									var _v31 = $wolfadex$elm_rfc3339$Rfc3339$parse(behaviorEditing.resistToInsert + ':00');
									if ((_v31.$ === 'Ok') && (_v31.a.$ === 'DateTimeLocal')) {
										var parts = _v31.a.a;
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													behaviorEditing: function () {
														var resists = _new.resists;
														return $elm$core$Maybe$Just(
															_Utils_update(
																behaviorEditing,
																{
																	_new: _Utils_update(
																		_new,
																		{
																			resists: $elm$core$List$reverse(
																				A2(
																					$elm$core$List$sortBy,
																					$elm$time$Time$posixToMillis,
																					A2(
																						$elm$core$List$cons,
																						A2($justinmimbs$time_extra$Time$Extra$partsToPosix, model.zone, parts),
																						resists)))
																		}),
																	resistToInsert: ''
																}));
													}()
												}),
											$elm$core$Platform$Cmd$none);
									} else {
										return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
									}
								}
							case 'SaveBehavior':
								var id = msg.a;
								var _v32 = model.behaviorEditing;
								if (_v32.$ === 'Nothing') {
									return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
								} else {
									var _new = _v32.a._new;
									if ($elm$core$String$isEmpty(_new.name)) {
										return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
									} else {
										var _v33 = A2(
											$author$project$Main$doDbTask,
											$author$project$Main$BehaviorSaveResponded,
											A3(
												$author$project$IndexedDb$put,
												model.db,
												$author$project$Main$behaviorStore,
												$author$project$Main$encodeBehavior(_new)));
										var dbTasks = _v33.a;
										var cmd = _v33.b;
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													dbTasks: dbTasks,
													safetyBehaviors: A2(
														$elm$core$List$map,
														function (behavior) {
															return _Utils_eq(behavior.id, id) ? _new : behavior;
														},
														model.safetyBehaviors)
												}),
											$elm$core$Platform$Cmd$batch(
												_List_fromArray(
													[
														A2(
														$elm$browser$Browser$Navigation$pushUrl,
														model.navKey,
														$author$project$Main$routeToString($author$project$Main$HomeRoute)),
														cmd
													])));
									}
								}
							case 'BehaviorSaveResponded':
								var response = msg.a;
								switch (response.$) {
									case 'Error':
										var err = response.a;
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													editingBehavior: $author$project$Main$FailedToSave(
														function () {
															switch (err.$) {
																case 'AlreadyExists':
																	return 'Already exists';
																case 'TransactionError':
																	var e = err.a;
																	return e;
																case 'QuotaExceeded':
																	return 'Quota exceeded';
																default:
																	var e = err.a;
																	return e;
															}
														}())
												}),
											$elm$core$Platform$Cmd$none);
									case 'UnexpectedError':
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													editingBehavior: $author$project$Main$FailedToSave('Unexpected error')
												}),
											$elm$core$Platform$Cmd$none);
									default:
										return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
								}
							case 'DeleteBehavior':
								var id = msg.a;
								return _Utils_Tuple2(
									_Utils_update(
										model,
										{
											confirmDelete: $elm$core$Maybe$Just(id)
										}),
									$elm$core$Platform$Cmd$none);
							case 'ConfirmDeleteBehavior':
								var id = msg.a;
								var _v36 = A2(
									$author$project$Main$doDbTask,
									$author$project$Main$BehaviorDeleteResponded(id),
									A3(
										$author$project$IndexedDb$delete,
										model.db,
										$author$project$Main$behaviorStore,
										$author$project$Main$uuidToKey(id)));
								var dbTasks = _v36.a;
								var cmd = _v36.b;
								return _Utils_Tuple2(
									_Utils_update(
										model,
										{dbTasks: dbTasks, deleting: true}),
									cmd);
							case 'BehaviorDeleteResponded':
								var key = msg.a;
								var response = msg.b;
								switch (response.$) {
									case 'Error':
										var err = response.a;
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													editingBehavior: $author$project$Main$FailedToSave(
														function () {
															switch (err.$) {
																case 'AlreadyExists':
																	return 'Already exists';
																case 'TransactionError':
																	var e = err.a;
																	return e;
																case 'QuotaExceeded':
																	return 'Quota exceeded';
																default:
																	var e = err.a;
																	return e;
															}
														}())
												}),
											$elm$core$Platform$Cmd$none);
									case 'UnexpectedError':
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													editingBehavior: $author$project$Main$FailedToSave('Unexpected error')
												}),
											$elm$core$Platform$Cmd$none);
									default:
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													confirmDelete: $elm$core$Maybe$Nothing,
													deleting: false,
													safetyBehaviors: A2(
														$elm$core$List$filter,
														function (b) {
															return !_Utils_eq(b.id, key);
														},
														model.safetyBehaviors)
												}),
											A2(
												$elm$browser$Browser$Navigation$pushUrl,
												model.navKey,
												$author$project$Main$routeToString($author$project$Main$HomeRoute)));
								}
							case 'CancelDeleteBehavior':
								return _Utils_Tuple2(
									_Utils_update(
										model,
										{confirmDelete: $elm$core$Maybe$Nothing}),
									$elm$core$Platform$Cmd$none);
							case 'Export':
								return _Utils_Tuple2(
									model,
									$elm$core$Platform$Cmd$batch(
										A2(
											$elm$core$List$map,
											function (behavior) {
												return A3(
													$elm$file$File$Download$string,
													A2(
														$elm$core$String$filter,
														function (_char) {
															return $elm$core$Char$isAlphaNum(_char) || (_Utils_eq(
																_char,
																_Utils_chr('_')) || _Utils_eq(
																_char,
																_Utils_chr('-')));
														},
														behavior.name) + '.csv',
													'text/csv',
													function () {
														var timestamps = _Utils_ap(
															A2(
																$elm$core$List$map,
																function (submit) {
																	return _Utils_Tuple3(submit, 'x', '');
																},
																behavior.submits),
															A2(
																$elm$core$List$map,
																function (resist) {
																	return _Utils_Tuple3(resist, '', 'x');
																},
																behavior.resists));
														return A2(
															$BrianHicks$elm_csv$Csv$Encode$encode,
															{
																encoder: $BrianHicks$elm_csv$Csv$Encode$withFieldNames(
																	function (_v40) {
																		var date = _v40.a;
																		var submit = _v40.b;
																		var resist = _v40.c;
																		return _List_fromArray(
																			[
																				_Utils_Tuple2(
																				'date',
																				A2($author$project$Main$exportDateFormatter, model.zone, date)),
																				_Utils_Tuple2('submit', submit),
																				_Utils_Tuple2('resist', resist)
																			]);
																	}),
																fieldSeparator: _Utils_chr(',')
															},
															A2(
																$elm$core$List$sortBy,
																function (_v39) {
																	var t = _v39.a;
																	return $elm$time$Time$posixToMillis(t);
																},
																timestamps));
													}());
											},
											model.safetyBehaviors)));
							case 'Import':
								return _Utils_Tuple2(
									model,
									A2(
										$elm$file$File$Select$files,
										_List_fromArray(
											['text/csv']),
										$author$project$Main$FilesImported));
							case 'FilesImported':
								var first = msg.a;
								var rest = msg.b;
								return _Utils_Tuple2(
									model,
									$elm$core$Platform$Cmd$batch(
										A2(
											$elm$core$List$map,
											function (file) {
												return A2(
													$elm$core$Task$attempt,
													$author$project$Main$BehaviorImported(
														$elm$file$File$name(file)),
													A2(
														$elm$core$Task$andThen,
														function (contents) {
															var _v41 = A2($author$project$Main$csvDecoder, model.zone, contents);
															if (_v41.$ === 'Err') {
																var err = _v41.a;
																return $elm$core$Task$fail(err);
															} else {
																var submitsAndResists = _v41.a;
																return $elm$core$Task$succeed(submitsAndResists);
															}
														},
														$elm$file$File$toString(file)));
											},
											A2($elm$core$List$cons, first, rest))));
							case 'BehaviorImported':
								if (msg.b.$ === 'Err') {
									var fileName = msg.a;
									return _Utils_Tuple2(
										_Utils_update(
											model,
											{
												importErrors: A2($elm$core$List$cons, 'Failed to import ' + fileName, model.importErrors)
											}),
										$elm$core$Platform$Cmd$none);
								} else {
									var fileName = msg.a;
									var submitsAndResists = msg.b.a;
									var _v42 = $TSFoster$elm_uuid$UUID$step(model.seeds);
									var id = _v42.a;
									var seeds = _v42.b;
									var behavior = {
										id: id,
										name: A3(
											$elm$core$String$replace,
											'.csv',
											'',
											A3($elm$core$String$replace, '_', ' ', fileName)),
										resists: A2(
											$elm$core$List$filterMap,
											function (_v44) {
												var timestamp = _v44.a;
												var resist = _v44.c;
												return resist ? $elm$core$Maybe$Just(timestamp) : $elm$core$Maybe$Nothing;
											},
											submitsAndResists),
										submits: A2(
											$elm$core$List$filterMap,
											function (_v45) {
												var timestamp = _v45.a;
												var submit = _v45.b;
												return submit ? $elm$core$Maybe$Just(timestamp) : $elm$core$Maybe$Nothing;
											},
											submitsAndResists)
									};
									var _v43 = A2(
										$author$project$Main$doDbTask,
										$author$project$Main$BehaviorImportResponded(behavior),
										A3(
											$author$project$IndexedDb$add,
											model.db,
											$author$project$Main$behaviorStore,
											$author$project$Main$encodeBehavior(behavior)));
									var dbTasks = _v43.a;
									var cmd = _v43.b;
									return _Utils_Tuple2(
										_Utils_update(
											model,
											{dbTasks: dbTasks, seeds: seeds}),
										cmd);
								}
							default:
								var behavior = msg.a;
								var response = msg.b;
								switch (response.$) {
									case 'Error':
										var err = response.a;
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													importErrors: A2($elm$core$List$cons, 'Failed to import ' + behavior.name, model.importErrors)
												}),
											$elm$core$Platform$Cmd$none);
									case 'UnexpectedError':
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													importErrors: A2($elm$core$List$cons, 'Failed to import ' + behavior.name, model.importErrors)
												}),
											$elm$core$Platform$Cmd$none);
									default:
										return _Utils_Tuple2(
											_Utils_update(
												model,
												{
													safetyBehaviors: A2($elm$core$List$cons, behavior, model.safetyBehaviors)
												}),
											A2(
												$elm$browser$Browser$Navigation$pushUrl,
												model.navKey,
												$author$project$Main$routeToString($author$project$Main$HomeRoute)));
								}
						}
					}());
		}
	});
var $elm$html$Html$div = _VirtualDom_node('div');
var $elm$html$Html$h2 = _VirtualDom_node('h2');
var $elm$html$Html$h3 = _VirtualDom_node('h3');
var $elm$html$Html$Attributes$stringProperty = F2(
	function (key, string) {
		return A2(
			_VirtualDom_property,
			key,
			$elm$json$Json$Encode$string(string));
	});
var $elm$html$Html$Attributes$class = $elm$html$Html$Attributes$stringProperty('className');
var $author$project$Css$loader = $elm$html$Html$Attributes$class('loader');
var $elm$html$Html$span = _VirtualDom_node('span');
var $author$project$Main$spinner = A2(
	$elm$html$Html$span,
	_List_fromArray(
		[$author$project$Css$loader]),
	_List_Nil);
var $elm$virtual_dom$VirtualDom$style = _VirtualDom_style;
var $elm$html$Html$Attributes$style = $elm$virtual_dom$VirtualDom$style;
var $elm$virtual_dom$VirtualDom$text = _VirtualDom_text;
var $elm$html$Html$text = $elm$virtual_dom$VirtualDom$text;
var $author$project$Main$AddBehavior = {$: 'AddBehavior'};
var $author$project$Main$BehaviorNameToAddChanged = function (a) {
	return {$: 'BehaviorNameToAddChanged', a: a};
};
var $elm$html$Html$button = _VirtualDom_node('button');
var $author$project$Css$edge = $elm$html$Html$Attributes$class('edge');
var $author$project$Css$front = $elm$html$Html$Attributes$class('front');
var $author$project$Css$pushable = $elm$html$Html$Attributes$class('pushable');
var $author$project$Css$shadow = $elm$html$Html$Attributes$class('shadow');
var $elm$html$Html$Attributes$type_ = $elm$html$Html$Attributes$stringProperty('type');
var $author$project$Main$buttonSubmit = function (label) {
	return A2(
		$elm$html$Html$button,
		_List_fromArray(
			[
				$author$project$Css$pushable,
				$elm$html$Html$Attributes$type_('submit')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$span,
				_List_fromArray(
					[$author$project$Css$shadow]),
				_List_Nil),
				A2(
				$elm$html$Html$span,
				_List_fromArray(
					[$author$project$Css$edge]),
				_List_Nil),
				A2(
				$elm$html$Html$span,
				_List_fromArray(
					[$author$project$Css$front]),
				_List_fromArray(
					[label]))
			]));
};
var $elm$html$Html$form = _VirtualDom_node('form');
var $elm$html$Html$h1 = _VirtualDom_node('h1');
var $elm$html$Html$input = _VirtualDom_node('input');
var $elm$html$Html$label = _VirtualDom_node('label');
var $elm$html$Html$a = _VirtualDom_node('a');
var $author$project$Css$edgeSecondary = $elm$html$Html$Attributes$class('edgeSecondary');
var $author$project$Css$frontSecondary = $elm$html$Html$Attributes$class('frontSecondary');
var $elm$html$Html$Attributes$href = function (url) {
	return A2(
		$elm$html$Html$Attributes$stringProperty,
		'href',
		_VirtualDom_noJavaScriptUri(url));
};
var $author$project$Main$linkSecondary = F2(
	function (label, route) {
		return A2(
			$elm$html$Html$a,
			_List_fromArray(
				[
					$author$project$Css$pushable,
					$elm$html$Html$Attributes$href(
					$author$project$Main$routeToString(route))
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$shadow]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$edge, $author$project$Css$edgeSecondary]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$front, $author$project$Css$frontSecondary]),
					_List_fromArray(
						[
							$elm$html$Html$text(label)
						]))
				]));
	});
var $author$project$Main$noHtml = $elm$html$Html$text('');
var $elm$html$Html$Events$alwaysStop = function (x) {
	return _Utils_Tuple2(x, true);
};
var $elm$virtual_dom$VirtualDom$MayStopPropagation = function (a) {
	return {$: 'MayStopPropagation', a: a};
};
var $elm$virtual_dom$VirtualDom$on = _VirtualDom_on;
var $elm$html$Html$Events$stopPropagationOn = F2(
	function (event, decoder) {
		return A2(
			$elm$virtual_dom$VirtualDom$on,
			event,
			$elm$virtual_dom$VirtualDom$MayStopPropagation(decoder));
	});
var $elm$json$Json$Decode$at = F2(
	function (fields, decoder) {
		return A3($elm$core$List$foldr, $elm$json$Json$Decode$field, decoder, fields);
	});
var $elm$html$Html$Events$targetValue = A2(
	$elm$json$Json$Decode$at,
	_List_fromArray(
		['target', 'value']),
	$elm$json$Json$Decode$string);
var $elm$html$Html$Events$onInput = function (tagger) {
	return A2(
		$elm$html$Html$Events$stopPropagationOn,
		'input',
		A2(
			$elm$json$Json$Decode$map,
			$elm$html$Html$Events$alwaysStop,
			A2($elm$json$Json$Decode$map, tagger, $elm$html$Html$Events$targetValue)));
};
var $elm$html$Html$Events$alwaysPreventDefault = function (msg) {
	return _Utils_Tuple2(msg, true);
};
var $elm$virtual_dom$VirtualDom$MayPreventDefault = function (a) {
	return {$: 'MayPreventDefault', a: a};
};
var $elm$html$Html$Events$preventDefaultOn = F2(
	function (event, decoder) {
		return A2(
			$elm$virtual_dom$VirtualDom$on,
			event,
			$elm$virtual_dom$VirtualDom$MayPreventDefault(decoder));
	});
var $elm$html$Html$Events$onSubmit = function (msg) {
	return A2(
		$elm$html$Html$Events$preventDefaultOn,
		'submit',
		A2(
			$elm$json$Json$Decode$map,
			$elm$html$Html$Events$alwaysPreventDefault,
			$elm$json$Json$Decode$succeed(msg)));
};
var $elm$html$Html$Attributes$boolProperty = F2(
	function (key, bool) {
		return A2(
			_VirtualDom_property,
			key,
			$elm$json$Json$Encode$bool(bool));
	});
var $elm$html$Html$Attributes$required = $elm$html$Html$Attributes$boolProperty('required');
var $elm$virtual_dom$VirtualDom$property = F2(
	function (key, value) {
		return A2(
			_VirtualDom_property,
			_VirtualDom_noInnerHtmlOrFormAction(key),
			_VirtualDom_noJavaScriptOrHtmlJson(value));
	});
var $elm$html$Html$Attributes$property = $elm$virtual_dom$VirtualDom$property;
var $author$project$Main$setInvalid = function (error) {
	return A2(
		$elm$html$Html$Attributes$property,
		'___setCustomValidity',
		function () {
			if (error.$ === 'Nothing') {
				return $elm$json$Json$Encode$null;
			} else {
				var err = error.a;
				return $elm$json$Json$Encode$string(err);
			}
		}());
};
var $elm$html$Html$Attributes$value = $elm$html$Html$Attributes$stringProperty('value');
var $author$project$Main$viewAddBehavior = function (model) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				A2($elm$html$Html$Attributes$style, 'height', '100svh'),
				A2($elm$html$Html$Attributes$style, 'width', '100dvw'),
				A2($elm$html$Html$Attributes$style, 'display', 'flex'),
				A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
				A2($elm$html$Html$Attributes$style, 'align-items', 'center')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$h1,
				_List_Nil,
				_List_fromArray(
					[
						$elm$html$Html$text('Safety behavior')
					])),
				A2(
				$elm$html$Html$form,
				_List_fromArray(
					[
						$elm$html$Html$Events$onSubmit($author$project$Main$AddBehavior),
						A2($elm$html$Html$Attributes$style, 'padding', '8rem 0.5rem 0 0.5rem'),
						A2($elm$html$Html$Attributes$style, 'width', 'calc(100vw - 1rem)'),
						A2($elm$html$Html$Attributes$style, 'display', 'flex'),
						A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
						A2($elm$html$Html$Attributes$style, 'gap', '4rem')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$label,
						_List_fromArray(
							[
								A2($elm$html$Html$Attributes$style, 'display', 'flex'),
								A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
								A2($elm$html$Html$Attributes$style, 'align-items', 'start')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										A2($elm$html$Html$Attributes$style, 'font-size', '2rem')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Name')
									])),
								A2(
								$elm$html$Html$input,
								_List_fromArray(
									[
										A2($elm$html$Html$Attributes$style, 'font-size', '2rem'),
										A2($elm$html$Html$Attributes$style, 'width', '100%'),
										$elm$html$Html$Attributes$required(true),
										$author$project$Main$setInvalid(
										function () {
											var _v0 = model.addingBehavior;
											if (_v0.$ === 'FailedToSave') {
												var err = _v0.a;
												return $elm$core$Maybe$Just(err);
											} else {
												return $elm$core$Maybe$Nothing;
											}
										}()),
										$elm$html$Html$Attributes$value(model.behaviorNameToAdd),
										$elm$html$Html$Events$onInput($author$project$Main$BehaviorNameToAddChanged)
									]),
								_List_Nil)
							])),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								A2($elm$html$Html$Attributes$style, 'display', 'flex'),
								A2($elm$html$Html$Attributes$style, 'width', '100%'),
								A2($elm$html$Html$Attributes$style, 'justify-content', 'space-between')
							]),
						_List_fromArray(
							[
								A2($author$project$Main$linkSecondary, 'Cancel', $author$project$Main$HomeRoute),
								$author$project$Main$buttonSubmit(
								A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											A2($elm$html$Html$Attributes$style, 'display', 'flex'),
											A2($elm$html$Html$Attributes$style, 'gap', '1rem')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('Add'),
											function () {
											var _v1 = model.addingBehavior;
											if (_v1.$ === 'Saving') {
												return A2(
													$elm$html$Html$div,
													_List_fromArray(
														[
															A2($elm$html$Html$Attributes$style, 'width', '1rem'),
															A2($elm$html$Html$Attributes$style, 'height', '1rem')
														]),
													_List_fromArray(
														[$author$project$Main$spinner]));
											} else {
												return $author$project$Main$noHtml;
											}
										}()
										])))
							]))
					]))
			]));
};
var $author$project$Main$Import = {$: 'Import'};
var $elm$virtual_dom$VirtualDom$Normal = function (a) {
	return {$: 'Normal', a: a};
};
var $elm$html$Html$Events$on = F2(
	function (event, decoder) {
		return A2(
			$elm$virtual_dom$VirtualDom$on,
			event,
			$elm$virtual_dom$VirtualDom$Normal(decoder));
	});
var $elm$html$Html$Events$onClick = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'click',
		$elm$json$Json$Decode$succeed(msg));
};
var $author$project$Main$buttonSecondary = F2(
	function (label, action) {
		return A2(
			$elm$html$Html$button,
			_List_fromArray(
				[
					$author$project$Css$pushable,
					$elm$html$Html$Attributes$type_('button'),
					$elm$html$Html$Events$onClick(action)
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$shadow]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$edge, $author$project$Css$edgeSecondary]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$front, $author$project$Css$frontSecondary]),
					_List_fromArray(
						[
							$elm$html$Html$text(label)
						]))
				]));
	});
var $author$project$Main$linkPrimary = F2(
	function (label, route) {
		return A2(
			$elm$html$Html$a,
			_List_fromArray(
				[
					$author$project$Css$pushable,
					$elm$html$Html$Attributes$href(
					$author$project$Main$routeToString(route))
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$shadow]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$edge]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$front]),
					_List_fromArray(
						[
							$elm$html$Html$text(label)
						]))
				]));
	});
var $author$project$Css$frontSmall = $elm$html$Html$Attributes$class('frontSmall');
var $author$project$Main$linkPrimarySmall = F2(
	function (label, route) {
		return A2(
			$elm$html$Html$a,
			_List_fromArray(
				[
					$author$project$Css$pushable,
					$elm$html$Html$Attributes$href(
					$author$project$Main$routeToString(route))
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$shadow]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$edge]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$front, $author$project$Css$frontSmall]),
					_List_fromArray(
						[
							$elm$html$Html$text(label)
						]))
				]));
	});
var $author$project$Css$frontIcon = $elm$html$Html$Attributes$class('frontIcon');
var $author$project$Main$linkSecondaryIcon = F2(
	function (label, route) {
		return A2(
			$elm$html$Html$a,
			_List_fromArray(
				[
					$author$project$Css$pushable,
					$elm$html$Html$Attributes$href(
					$author$project$Main$routeToString(route))
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$shadow]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$edge, $author$project$Css$edgeSecondary]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$front, $author$project$Css$frontSecondary, $author$project$Css$frontIcon]),
					_List_fromArray(
						[
							$elm$html$Html$text(label)
						]))
				]));
	});
var $author$project$Main$linkSecondarySmall = F2(
	function (label, route) {
		return A2(
			$elm$html$Html$a,
			_List_fromArray(
				[
					$author$project$Css$pushable,
					$elm$html$Html$Attributes$href(
					$author$project$Main$routeToString(route))
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$shadow]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$edge, $author$project$Css$edgeSecondary]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$front, $author$project$Css$frontSecondary, $author$project$Css$frontSmall]),
					_List_fromArray(
						[
							$elm$html$Html$text(label)
						]))
				]));
	});
var $author$project$Main$ResistedBehavior = function (a) {
	return {$: 'ResistedBehavior', a: a};
};
var $author$project$Main$SubmittedToBehavior = function (a) {
	return {$: 'SubmittedToBehavior', a: a};
};
var $author$project$Main$viewBehaviorInList = function (behavior) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				A2($elm$html$Html$Attributes$style, 'width', 'calc(100% - 1rem)'),
				A2($elm$html$Html$Attributes$style, 'padding', '0.5rem 1rem 1rem 1rem'),
				A2($elm$html$Html$Attributes$style, 'margin', '0.5rem'),
				A2($elm$html$Html$Attributes$style, 'border-radius', '0.5rem'),
				A2($elm$html$Html$Attributes$style, 'background', 'hsl(265deg, 100%, 95%)')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						A2($elm$html$Html$Attributes$style, 'display', 'flex'),
						A2($elm$html$Html$Attributes$style, 'justify-content', 'space-between'),
						A2($elm$html$Html$Attributes$style, 'align-items', 'center')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$span,
						_List_Nil,
						_List_fromArray(
							[
								$elm$html$Html$text(behavior.name)
							])),
						A2(
						$author$project$Main$linkSecondaryIcon,
						'✎',
						$author$project$Main$EditBehaviorRoute(behavior.id))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						A2($elm$html$Html$Attributes$style, 'display', 'flex'),
						A2($elm$html$Html$Attributes$style, 'justify-content', 'space-between'),
						A2($elm$html$Html$Attributes$style, 'margin-top', '1rem')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								A2($elm$html$Html$Attributes$style, 'font-size', '6vw'),
								A2($elm$html$Html$Attributes$style, 'align-self', 'center')
							]),
						_List_fromArray(
							[
								A2(
								$author$project$Main$buttonSecondary,
								'Submit',
								$author$project$Main$SubmittedToBehavior(behavior.id))
							])),
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								A2($elm$html$Html$Attributes$style, 'font-size', '6vw'),
								A2($elm$html$Html$Attributes$style, 'align-self', 'center')
							]),
						_List_fromArray(
							[
								A2(
								$author$project$Main$buttonSecondary,
								'Resist',
								$author$project$Main$ResistedBehavior(behavior.id))
							]))
					]))
			]));
};
var $author$project$Main$viewBehaviorList = function (model) {
	var _v0 = model.safetyBehaviors;
	if (!_v0.b) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					A2($elm$html$Html$Attributes$style, 'height', '100vh'),
					A2($elm$html$Html$Attributes$style, 'width', '100vw'),
					A2($elm$html$Html$Attributes$style, 'display', 'flex'),
					A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
					A2($elm$html$Html$Attributes$style, 'font-size', '7vw'),
					A2($elm$html$Html$Attributes$style, 'align-items', 'center'),
					A2($elm$html$Html$Attributes$style, 'justify-content', 'center')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$h1,
					_List_Nil,
					_List_fromArray(
						[
							A2(
							$elm$html$Html$span,
							_List_Nil,
							_List_fromArray(
								[
									$elm$html$Html$text('Welcome!')
								]))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							A2($elm$html$Html$Attributes$style, 'display', 'flex'),
							A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
							A2($elm$html$Html$Attributes$style, 'gap', '1rem')
						]),
					_List_fromArray(
						[
							A2($author$project$Main$linkPrimary, 'Start tracking', $author$project$Main$AddBehaviorRoute),
							A2($author$project$Main$buttonSecondary, 'Import (csv)', $author$project$Main$Import)
						]))
				]));
	} else {
		var safetyBehaviors = _v0;
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					A2($elm$html$Html$Attributes$style, 'height', '100vh'),
					A2($elm$html$Html$Attributes$style, 'width', '100vw'),
					A2($elm$html$Html$Attributes$style, 'display', 'flex'),
					A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
					A2($elm$html$Html$Attributes$style, 'gap', '0.125rem'),
					A2($elm$html$Html$Attributes$style, 'font-size', '7vw')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							A2($elm$html$Html$Attributes$style, 'height', '7vh'),
							A2($elm$html$Html$Attributes$style, 'display', 'flex'),
							A2($elm$html$Html$Attributes$style, 'align-items', 'center'),
							A2($elm$html$Html$Attributes$style, 'justify-content', 'space-between'),
							A2($elm$html$Html$Attributes$style, 'padding', '0.5rem')
						]),
					_List_fromArray(
						[
							A2($author$project$Main$linkPrimarySmall, 'Stats', $author$project$Main$StatsRoute),
							A2($author$project$Main$linkSecondarySmall, 'Add safety behavior', $author$project$Main$AddBehaviorRoute),
							A2($author$project$Main$linkSecondaryIcon, '☰', $author$project$Main$SettingsRoute)
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							A2($elm$html$Html$Attributes$style, 'height', '93vh'),
							A2($elm$html$Html$Attributes$style, 'overflow', 'auto')
						]),
					A2($elm$core$List$map, $author$project$Main$viewBehaviorInList, safetyBehaviors))
				]));
	}
};
var $author$project$Main$BehaviorNameEdited = function (a) {
	return {$: 'BehaviorNameEdited', a: a};
};
var $author$project$Main$CancelDeleteBehavior = {$: 'CancelDeleteBehavior'};
var $author$project$Main$ConfirmDeleteBehavior = function (a) {
	return {$: 'ConfirmDeleteBehavior', a: a};
};
var $author$project$Main$DeleteBehavior = function (a) {
	return {$: 'DeleteBehavior', a: a};
};
var $author$project$Main$InsertResist = {$: 'InsertResist'};
var $author$project$Main$InsertSubmit = {$: 'InsertSubmit'};
var $author$project$Main$RemoveResist = function (a) {
	return {$: 'RemoveResist', a: a};
};
var $author$project$Main$RemoveSubmit = function (a) {
	return {$: 'RemoveSubmit', a: a};
};
var $author$project$Main$ResistToInsertChanged = function (a) {
	return {$: 'ResistToInsertChanged', a: a};
};
var $author$project$Main$SaveBehavior = function (a) {
	return {$: 'SaveBehavior', a: a};
};
var $author$project$Main$SubmitToInsertChanged = function (a) {
	return {$: 'SubmitToInsertChanged', a: a};
};
var $author$project$Css$edgeDanger = $elm$html$Html$Attributes$class('edgeDanger');
var $author$project$Css$frontDanger = $elm$html$Html$Attributes$class('frontDanger');
var $author$project$Main$buttonDanger = F2(
	function (label, action) {
		return A2(
			$elm$html$Html$button,
			_List_fromArray(
				[
					$author$project$Css$pushable,
					$elm$html$Html$Attributes$type_('button'),
					$elm$html$Html$Events$onClick(action)
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$shadow]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$edge, $author$project$Css$edgeDanger]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$front, $author$project$Css$frontDanger]),
					_List_fromArray(
						[
							$elm$html$Html$text(label)
						]))
				]));
	});
var $author$project$Main$buttonPrimary = F2(
	function (label, action) {
		return A2(
			$elm$html$Html$button,
			_List_fromArray(
				[
					$author$project$Css$pushable,
					$elm$html$Html$Attributes$type_('button'),
					$elm$html$Html$Events$onClick(action)
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$shadow]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$edge]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$front]),
					_List_fromArray(
						[label]))
				]));
	});
var $author$project$Main$buttonPrimarySmall = F2(
	function (label, action) {
		return A2(
			$elm$html$Html$button,
			_List_fromArray(
				[
					$author$project$Css$pushable,
					$elm$html$Html$Attributes$type_('button'),
					$elm$html$Html$Events$onClick(action)
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$shadow]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$edge]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$front, $author$project$Css$frontSmall]),
					_List_fromArray(
						[
							$elm$html$Html$text(label)
						]))
				]));
	});
var $author$project$Main$buttonSecondarySmall = F2(
	function (label, action) {
		return A2(
			$elm$html$Html$button,
			_List_fromArray(
				[
					$author$project$Css$pushable,
					$elm$html$Html$Attributes$type_('button'),
					$elm$html$Html$Events$onClick(action)
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$shadow]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$edge, $author$project$Css$edgeSecondary]),
					_List_Nil),
					A2(
					$elm$html$Html$span,
					_List_fromArray(
						[$author$project$Css$front, $author$project$Css$frontSecondary, $author$project$Css$frontSmall]),
					_List_fromArray(
						[
							$elm$html$Html$text(label)
						]))
				]));
	});
var $elm$html$Html$details = _VirtualDom_node('details');
var $elm$html$Html$li = _VirtualDom_node('li');
var $elm$html$Html$ol = _VirtualDom_node('ol');
var $ryan_haskell$date_format$DateFormat$DayOfMonthSuffix = {$: 'DayOfMonthSuffix'};
var $ryan_haskell$date_format$DateFormat$dayOfMonthSuffix = $ryan_haskell$date_format$DateFormat$DayOfMonthSuffix;
var $ryan_haskell$date_format$DateFormat$MonthNameAbbreviated = {$: 'MonthNameAbbreviated'};
var $ryan_haskell$date_format$DateFormat$monthNameAbbreviated = $ryan_haskell$date_format$DateFormat$MonthNameAbbreviated;
var $author$project$Main$prettyDateFormatter = $ryan_haskell$date_format$DateFormat$format(
	_List_fromArray(
		[
			$ryan_haskell$date_format$DateFormat$monthNameAbbreviated,
			$ryan_haskell$date_format$DateFormat$text(' '),
			$ryan_haskell$date_format$DateFormat$dayOfMonthSuffix,
			$ryan_haskell$date_format$DateFormat$text(', '),
			$ryan_haskell$date_format$DateFormat$yearNumber,
			$ryan_haskell$date_format$DateFormat$text(' at '),
			$ryan_haskell$date_format$DateFormat$hourNumber,
			$ryan_haskell$date_format$DateFormat$text(':'),
			$ryan_haskell$date_format$DateFormat$minuteFixed,
			$ryan_haskell$date_format$DateFormat$text(' '),
			$ryan_haskell$date_format$DateFormat$amPmUppercase
		]));
var $elm$html$Html$summary = _VirtualDom_node('summary');
var $author$project$Main$viewEditBehavior = F2(
	function (id, model) {
		var _v0 = model.behaviorEditing;
		if (_v0.$ === 'Nothing') {
			return A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						A2($elm$html$Html$Attributes$style, 'display', 'flex'),
						A2($elm$html$Html$Attributes$style, 'justify-content', 'center'),
						A2($elm$html$Html$Attributes$style, 'padding', '5rem 1rem 0 1rem')
					]),
				_List_fromArray(
					[
						A2($author$project$Main$linkSecondary, 'Sorry, looks like we made a mistake', $author$project$Main$HomeRoute)
					]));
		} else {
			var behaviorEditing = _v0.a;
			return A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						A2($elm$html$Html$Attributes$style, 'height', '100svh'),
						A2($elm$html$Html$Attributes$style, 'width', '100dvw'),
						A2($elm$html$Html$Attributes$style, 'display', 'flex'),
						A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
						A2($elm$html$Html$Attributes$style, 'align-items', 'center')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$h1,
						_List_Nil,
						_List_fromArray(
							[
								A2(
								$elm$html$Html$span,
								_List_Nil,
								_List_fromArray(
									[
										$elm$html$Html$text('Editing: ')
									])),
								A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										A2($elm$html$Html$Attributes$style, 'font-weight', 'normal')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text(behaviorEditing.old.name)
									]))
							])),
						A2(
						$elm$html$Html$form,
						_List_fromArray(
							[
								$elm$html$Html$Events$onSubmit(
								$author$project$Main$SaveBehavior(id)),
								A2($elm$html$Html$Attributes$style, 'padding', '0 0.5rem'),
								A2($elm$html$Html$Attributes$style, 'width', 'calc(100vw - 1rem)'),
								A2($elm$html$Html$Attributes$style, 'height', '100vh'),
								A2($elm$html$Html$Attributes$style, 'display', 'flex'),
								A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
								A2($elm$html$Html$Attributes$style, 'gap', '4rem')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$label,
								_List_fromArray(
									[
										A2($elm$html$Html$Attributes$style, 'display', 'flex'),
										A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
										A2($elm$html$Html$Attributes$style, 'align-items', 'start')
									]),
								_List_fromArray(
									[
										A2(
										$elm$html$Html$span,
										_List_fromArray(
											[
												A2($elm$html$Html$Attributes$style, 'font-size', '2rem')
											]),
										_List_fromArray(
											[
												$elm$html$Html$text('Name')
											])),
										A2(
										$elm$html$Html$input,
										_List_fromArray(
											[
												A2($elm$html$Html$Attributes$style, 'font-size', '2rem'),
												A2($elm$html$Html$Attributes$style, 'width', '100%'),
												$elm$html$Html$Attributes$required(true),
												$author$project$Main$setInvalid(
												function () {
													var _v1 = model.editingBehavior;
													if (_v1.$ === 'FailedToSave') {
														var err = _v1.a;
														return $elm$core$Maybe$Just(err);
													} else {
														return $elm$core$Maybe$Nothing;
													}
												}()),
												$elm$html$Html$Attributes$value(behaviorEditing._new.name),
												$elm$html$Html$Events$onInput($author$project$Main$BehaviorNameEdited)
											]),
										_List_Nil)
									])),
								A2(
								$elm$html$Html$details,
								_List_fromArray(
									[
										A2($elm$html$Html$Attributes$style, 'width', '100%'),
										A2($elm$html$Html$Attributes$style, 'padding', '1rem'),
										A2($elm$html$Html$Attributes$style, 'border', '1px solid black'),
										A2($elm$html$Html$Attributes$style, 'border-radius', '1rem')
									]),
								_List_fromArray(
									[
										A2(
										$elm$html$Html$summary,
										_List_fromArray(
											[
												A2($elm$html$Html$Attributes$style, 'font-size', '1.5rem')
											]),
										_List_fromArray(
											[
												$elm$html$Html$text('Submits')
											])),
										A2(
										$elm$html$Html$ol,
										_List_fromArray(
											[
												A2($elm$html$Html$Attributes$style, 'list-style', 'none'),
												A2($elm$html$Html$Attributes$style, 'display', 'flex'),
												A2($elm$html$Html$Attributes$style, 'flex-direction', 'column')
											]),
										A2(
											$elm$core$List$cons,
											A2(
												$elm$html$Html$li,
												_List_fromArray(
													[
														A2($elm$html$Html$Attributes$style, 'display', 'flex'),
														A2($elm$html$Html$Attributes$style, 'justify-content', 'space-between'),
														A2($elm$html$Html$Attributes$style, 'margin-top', '0.75rem')
													]),
												_List_fromArray(
													[
														A2(
														$elm$html$Html$input,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$type_('datetime-local'),
																$elm$html$Html$Attributes$value(behaviorEditing.submitToInsert),
																$elm$html$Html$Events$onInput($author$project$Main$SubmitToInsertChanged)
															]),
														_List_Nil),
														A2($author$project$Main$buttonPrimarySmall, 'Insert', $author$project$Main$InsertSubmit)
													])),
											A2(
												$elm$core$List$map,
												function (submit) {
													return A2(
														$elm$html$Html$li,
														_List_fromArray(
															[
																A2($elm$html$Html$Attributes$style, 'display', 'flex'),
																A2($elm$html$Html$Attributes$style, 'justify-content', 'space-between'),
																A2($elm$html$Html$Attributes$style, 'margin-top', '0.75rem')
															]),
														_List_fromArray(
															[
																$elm$html$Html$text(
																A2($author$project$Main$prettyDateFormatter, model.zone, submit)),
																A2(
																$author$project$Main$buttonSecondarySmall,
																'Remove',
																$author$project$Main$RemoveSubmit(submit))
															]));
												},
												behaviorEditing._new.submits)))
									])),
								A2(
								$elm$html$Html$details,
								_List_fromArray(
									[
										A2($elm$html$Html$Attributes$style, 'width', '100%'),
										A2($elm$html$Html$Attributes$style, 'padding', '1rem'),
										A2($elm$html$Html$Attributes$style, 'border', '1px solid black'),
										A2($elm$html$Html$Attributes$style, 'border-radius', '1rem')
									]),
								_List_fromArray(
									[
										A2(
										$elm$html$Html$summary,
										_List_fromArray(
											[
												A2($elm$html$Html$Attributes$style, 'font-size', '1.5rem')
											]),
										_List_fromArray(
											[
												$elm$html$Html$text('Resists')
											])),
										A2(
										$elm$html$Html$ol,
										_List_fromArray(
											[
												A2($elm$html$Html$Attributes$style, 'list-style', 'none'),
												A2($elm$html$Html$Attributes$style, 'display', 'flex'),
												A2($elm$html$Html$Attributes$style, 'flex-direction', 'column')
											]),
										A2(
											$elm$core$List$cons,
											A2(
												$elm$html$Html$li,
												_List_fromArray(
													[
														A2($elm$html$Html$Attributes$style, 'display', 'flex'),
														A2($elm$html$Html$Attributes$style, 'justify-content', 'space-between'),
														A2($elm$html$Html$Attributes$style, 'margin-top', '0.75rem')
													]),
												_List_fromArray(
													[
														A2(
														$elm$html$Html$input,
														_List_fromArray(
															[
																$elm$html$Html$Attributes$type_('datetime-local'),
																$elm$html$Html$Attributes$value(behaviorEditing.resistToInsert),
																$elm$html$Html$Events$onInput($author$project$Main$ResistToInsertChanged)
															]),
														_List_Nil),
														A2($author$project$Main$buttonPrimarySmall, 'Insert', $author$project$Main$InsertResist)
													])),
											A2(
												$elm$core$List$map,
												function (resist) {
													return A2(
														$elm$html$Html$li,
														_List_fromArray(
															[
																A2($elm$html$Html$Attributes$style, 'display', 'flex'),
																A2($elm$html$Html$Attributes$style, 'justify-content', 'space-between'),
																A2($elm$html$Html$Attributes$style, 'margin-top', '0.75rem')
															]),
														_List_fromArray(
															[
																$elm$html$Html$text(
																A2($author$project$Main$prettyDateFormatter, model.zone, resist)),
																A2(
																$author$project$Main$buttonSecondarySmall,
																'Remove',
																$author$project$Main$RemoveResist(resist))
															]));
												},
												behaviorEditing._new.resists)))
									])),
								function () {
								var _v2 = model.confirmDelete;
								if (_v2.$ === 'Nothing') {
									return A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												A2($elm$html$Html$Attributes$style, 'display', 'flex'),
												A2($elm$html$Html$Attributes$style, 'width', '100%'),
												A2($elm$html$Html$Attributes$style, 'justify-content', 'space-between')
											]),
										_List_fromArray(
											[
												A2($author$project$Main$linkSecondary, 'Cancel', $author$project$Main$HomeRoute),
												A2(
												$author$project$Main$buttonPrimary,
												$elm$html$Html$text('Save'),
												$author$project$Main$SaveBehavior(id))
											]));
								} else {
									return $author$project$Main$noHtml;
								}
							}(),
								function () {
								var _v3 = model.confirmDelete;
								if (_v3.$ === 'Nothing') {
									return A2(
										$author$project$Main$buttonDanger,
										'Delete',
										$author$project$Main$DeleteBehavior(id));
								} else {
									return A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												A2($elm$html$Html$Attributes$style, 'display', 'flex'),
												A2($elm$html$Html$Attributes$style, 'width', '100%'),
												A2($elm$html$Html$Attributes$style, 'justify-content', 'space-between')
											]),
										_List_fromArray(
											[
												A2($author$project$Main$buttonSecondary, 'Keep', $author$project$Main$CancelDeleteBehavior),
												A2(
												$author$project$Main$buttonDanger,
												'Yes, Delete',
												$author$project$Main$ConfirmDeleteBehavior(id))
											]));
								}
							}()
							]))
					]));
		}
	});
var $author$project$Main$Export = {$: 'Export'};
var $author$project$Main$viewMenu = A2(
	$elm$html$Html$div,
	_List_fromArray(
		[
			A2($elm$html$Html$Attributes$style, 'height', '100vh'),
			A2($elm$html$Html$Attributes$style, 'width', '100vw'),
			A2($elm$html$Html$Attributes$style, 'display', 'flex'),
			A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
			A2($elm$html$Html$Attributes$style, 'gap', '0.125rem'),
			A2($elm$html$Html$Attributes$style, 'font-size', '7vw')
		]),
	_List_fromArray(
		[
			A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					A2($elm$html$Html$Attributes$style, 'height', '7vh'),
					A2($elm$html$Html$Attributes$style, 'display', 'flex'),
					A2($elm$html$Html$Attributes$style, 'align-items', 'center'),
					A2($elm$html$Html$Attributes$style, 'justify-content', 'space-between'),
					A2($elm$html$Html$Attributes$style, 'padding', '0.5rem')
				]),
			_List_fromArray(
				[
					A2($author$project$Main$linkSecondarySmall, 'Back', $author$project$Main$HomeRoute)
				])),
			A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					A2($elm$html$Html$Attributes$style, 'height', '93vh'),
					A2($elm$html$Html$Attributes$style, 'overflow', 'auto'),
					A2($elm$html$Html$Attributes$style, 'padding', '1rem'),
					A2($elm$html$Html$Attributes$style, 'display', 'flex'),
					A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
					A2($elm$html$Html$Attributes$style, 'gap', '2rem')
				]),
			_List_fromArray(
				[
					A2($author$project$Main$buttonSecondary, 'Export (csv)', $author$project$Main$Export),
					A2($author$project$Main$buttonSecondary, 'Import (csv)', $author$project$Main$Import)
				]))
		]));
var $justinmimbs$time_extra$Time$Extra$Day = {$: 'Day'};
var $elm$html$Html$br = _VirtualDom_node('br');
var $terezka$elm_charts$Internal$Svg$Event = F2(
	function (name, handler) {
		return {handler: handler, name: name};
	});
var $elm$core$List$any = F2(
	function (isOkay, list) {
		any:
		while (true) {
			if (!list.b) {
				return false;
			} else {
				var x = list.a;
				var xs = list.b;
				if (isOkay(x)) {
					return true;
				} else {
					var $temp$isOkay = isOkay,
						$temp$list = xs;
					isOkay = $temp$isOkay;
					list = $temp$list;
					continue any;
				}
			}
		}
	});
var $terezka$elm_charts$Chart$GridElement = function (a) {
	return {$: 'GridElement', a: a};
};
var $terezka$elm_charts$Internal$Helpers$apply = F2(
	function (attrs, _default) {
		var apply_ = F2(
			function (_v0, a) {
				var f = _v0.a;
				return f(a);
			});
		return A3($elm$core$List$foldl, apply_, _default, attrs);
	});
var $terezka$elm_charts$Internal$Helpers$Attribute = function (a) {
	return {$: 'Attribute', a: a};
};
var $terezka$elm_charts$Internal$Svg$Circle = {$: 'Circle'};
var $terezka$elm_charts$Chart$Attributes$circle = $terezka$elm_charts$Internal$Helpers$Attribute(
	function (config) {
		return _Utils_update(
			config,
			{
				shape: $elm$core$Maybe$Just($terezka$elm_charts$Internal$Svg$Circle)
			});
	});
var $elm$svg$Svg$Attributes$class = _VirtualDom_attribute('class');
var $terezka$elm_charts$Chart$Attributes$color = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return (v === '') ? config : _Utils_update(
				config,
				{color: v});
		});
};
var $elm$core$List$concatMap = F2(
	function (f, list) {
		return $elm$core$List$concat(
			A2($elm$core$List$map, f, list));
	});
var $terezka$elm_charts$Internal$Helpers$darkGray = 'rgb(200 200 200)';
var $terezka$elm_charts$Chart$Attributes$dashed = function (value) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{dashed: value});
		});
};
var $terezka$elm_charts$Internal$Helpers$pink = '#ea60df';
var $terezka$elm_charts$Internal$Svg$defaultDot = {border: '', borderOpacity: 1, borderWidth: 0, color: $terezka$elm_charts$Internal$Helpers$pink, hideOverflow: false, highlight: 0, highlightColor: '', highlightWidth: 5, opacity: 1, shape: $elm$core$Maybe$Nothing, size: 6};
var $elm$svg$Svg$trustedNode = _VirtualDom_nodeNS('http://www.w3.org/2000/svg');
var $elm$svg$Svg$circle = $elm$svg$Svg$trustedNode('circle');
var $elm$svg$Svg$Attributes$cx = _VirtualDom_attribute('cx');
var $elm$svg$Svg$Attributes$cy = _VirtualDom_attribute('cy');
var $elm$svg$Svg$Attributes$d = _VirtualDom_attribute('d');
var $elm$svg$Svg$Attributes$fill = _VirtualDom_attribute('fill');
var $elm$svg$Svg$Attributes$fillOpacity = _VirtualDom_attribute('fill-opacity');
var $elm$core$String$fromFloat = _String_fromNumber;
var $elm$svg$Svg$g = $elm$svg$Svg$trustedNode('g');
var $elm$svg$Svg$Attributes$height = _VirtualDom_attribute('height');
var $terezka$elm_charts$Internal$Svg$isWithinPlane = F3(
	function (plane, x, y) {
		return _Utils_eq(
			A3($elm$core$Basics$clamp, plane.x.min, plane.x.max, x),
			x) && _Utils_eq(
			A3($elm$core$Basics$clamp, plane.y.min, plane.y.max, y),
			y);
	});
var $elm$svg$Svg$path = $elm$svg$Svg$trustedNode('path');
var $elm$core$Basics$pi = _Basics_pi;
var $elm$core$Basics$sqrt = _Basics_sqrt;
var $terezka$elm_charts$Internal$Svg$plusPath = F4(
	function (area_, off, x_, y_) {
		var side = $elm$core$Basics$sqrt(area_ / 4) + off;
		var r6 = side / 2;
		var r3 = side;
		return A2(
			$elm$core$String$join,
			' ',
			_List_fromArray(
				[
					'M' + ($elm$core$String$fromFloat(x_ - r6) + (' ' + $elm$core$String$fromFloat(((y_ - r3) - r6) + off))),
					'v' + $elm$core$String$fromFloat(r3 - off),
					'h' + $elm$core$String$fromFloat((-r3) + off),
					'v' + $elm$core$String$fromFloat(r3),
					'h' + $elm$core$String$fromFloat(r3 - off),
					'v' + $elm$core$String$fromFloat(r3 - off),
					'h' + $elm$core$String$fromFloat(r3),
					'v' + $elm$core$String$fromFloat((-r3) + off),
					'h' + $elm$core$String$fromFloat(r3 - off),
					'v' + $elm$core$String$fromFloat(-r3),
					'h' + $elm$core$String$fromFloat((-r3) + off),
					'v' + $elm$core$String$fromFloat((-r3) + off),
					'h' + $elm$core$String$fromFloat(-r3),
					'v' + $elm$core$String$fromFloat(r3 - off)
				]));
	});
var $elm$svg$Svg$Attributes$r = _VirtualDom_attribute('r');
var $elm$svg$Svg$rect = $elm$svg$Svg$trustedNode('rect');
var $elm$svg$Svg$Attributes$stroke = _VirtualDom_attribute('stroke');
var $elm$svg$Svg$Attributes$strokeOpacity = _VirtualDom_attribute('stroke-opacity');
var $elm$svg$Svg$Attributes$strokeWidth = _VirtualDom_attribute('stroke-width');
var $elm$svg$Svg$text = $elm$virtual_dom$VirtualDom$text;
var $terezka$elm_charts$Internal$Coordinates$innerLength = function (axis) {
	return A2($elm$core$Basics$max, 1, (axis.length - axis.marginMin) - axis.marginMax);
};
var $terezka$elm_charts$Internal$Coordinates$innerWidth = function (plane) {
	return $terezka$elm_charts$Internal$Coordinates$innerLength(plane.x);
};
var $terezka$elm_charts$Internal$Coordinates$range = function (axis) {
	var diff = axis.max - axis.min;
	return (diff > 0) ? diff : 1;
};
var $terezka$elm_charts$Internal$Coordinates$scaleSVGX = F2(
	function (plane, value) {
		var range_ = $terezka$elm_charts$Internal$Coordinates$range(plane.x);
		return ((plane.x.flip ? (range_ - value) : value) * $terezka$elm_charts$Internal$Coordinates$innerWidth(plane)) / range_;
	});
var $terezka$elm_charts$Internal$Coordinates$toSVGX = F2(
	function (plane, value) {
		return A2($terezka$elm_charts$Internal$Coordinates$scaleSVGX, plane, value - plane.x.min) + plane.x.marginMin;
	});
var $terezka$elm_charts$Internal$Coordinates$innerHeight = function (plane) {
	return $terezka$elm_charts$Internal$Coordinates$innerLength(plane.y);
};
var $terezka$elm_charts$Internal$Coordinates$scaleSVGY = F2(
	function (plane, value) {
		var range_ = $terezka$elm_charts$Internal$Coordinates$range(plane.y);
		return ((plane.y.flip ? (range_ - value) : value) * $terezka$elm_charts$Internal$Coordinates$innerHeight(plane)) / range_;
	});
var $terezka$elm_charts$Internal$Coordinates$toSVGY = F2(
	function (plane, value) {
		return A2($terezka$elm_charts$Internal$Coordinates$scaleSVGY, plane, plane.y.max - value) + plane.y.marginMin;
	});
var $elm$svg$Svg$Attributes$transform = _VirtualDom_attribute('transform');
var $elm$core$Basics$degrees = function (angleInDegrees) {
	return (angleInDegrees * $elm$core$Basics$pi) / 180;
};
var $elm$core$Basics$tan = _Basics_tan;
var $terezka$elm_charts$Internal$Svg$trianglePath = F4(
	function (area_, off, x_, y_) {
		var side = $elm$core$Basics$sqrt(
			(area_ * 4) / $elm$core$Basics$sqrt(3)) + (off * $elm$core$Basics$sqrt(3));
		var height = ($elm$core$Basics$sqrt(3) * side) / 2;
		var fromMiddle = height - (($elm$core$Basics$tan(
			$elm$core$Basics$degrees(30)) * side) / 2);
		return A2(
			$elm$core$String$join,
			' ',
			_List_fromArray(
				[
					'M' + ($elm$core$String$fromFloat(x_) + (' ' + $elm$core$String$fromFloat(y_ - fromMiddle))),
					'l' + ($elm$core$String$fromFloat((-side) / 2) + (' ' + $elm$core$String$fromFloat(height))),
					'h' + $elm$core$String$fromFloat(side),
					'z'
				]));
	});
var $elm$svg$Svg$Attributes$width = _VirtualDom_attribute('width');
var $elm$svg$Svg$Attributes$clipPath = _VirtualDom_attribute('clip-path');
var $terezka$elm_charts$Internal$Coordinates$toId = function (plane) {
	var numToStr = A2(
		$elm$core$Basics$composeR,
		$elm$core$String$fromFloat,
		A2($elm$core$String$replace, '.', '-'));
	return A2(
		$elm$core$String$join,
		'_',
		_List_fromArray(
			[
				'elm-charts__id',
				numToStr(plane.x.length),
				numToStr(plane.x.min),
				numToStr(plane.x.max),
				numToStr(plane.x.marginMin),
				numToStr(plane.x.marginMax),
				numToStr(plane.y.length),
				numToStr(plane.y.min),
				numToStr(plane.y.max),
				numToStr(plane.y.marginMin),
				numToStr(plane.y.marginMax)
			]));
};
var $terezka$elm_charts$Internal$Svg$withinChartArea = function (plane) {
	return $elm$svg$Svg$Attributes$clipPath(
		'url(#' + ($terezka$elm_charts$Internal$Coordinates$toId(plane) + ')'));
};
var $elm$svg$Svg$Attributes$x = _VirtualDom_attribute('x');
var $elm$svg$Svg$Attributes$y = _VirtualDom_attribute('y');
var $terezka$elm_charts$Internal$Svg$dot = F5(
	function (plane, toX, toY, config, datum_) {
		var yOrg = toY(datum_);
		var y_ = A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, yOrg);
		var xOrg = toX(datum_);
		var x_ = A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, xOrg);
		var styleAttrs = _List_fromArray(
			[
				$elm$svg$Svg$Attributes$stroke(
				(config.border === '') ? config.color : config.border),
				$elm$svg$Svg$Attributes$strokeWidth(
				$elm$core$String$fromFloat(config.borderWidth)),
				$elm$svg$Svg$Attributes$strokeOpacity(
				$elm$core$String$fromFloat(config.borderOpacity)),
				$elm$svg$Svg$Attributes$fillOpacity(
				$elm$core$String$fromFloat(config.opacity)),
				$elm$svg$Svg$Attributes$fill(config.color),
				$elm$svg$Svg$Attributes$class('elm-charts__dot'),
				config.hideOverflow ? $terezka$elm_charts$Internal$Svg$withinChartArea(plane) : $elm$svg$Svg$Attributes$class('')
			]);
		var showDot = A3($terezka$elm_charts$Internal$Svg$isWithinPlane, plane, xOrg, yOrg) || config.hideOverflow;
		var highlightColor = (config.highlightColor === '') ? config.color : config.highlightColor;
		var highlightAttrs = _List_fromArray(
			[
				$elm$svg$Svg$Attributes$stroke(highlightColor),
				$elm$svg$Svg$Attributes$strokeWidth(
				$elm$core$String$fromFloat(config.highlightWidth)),
				$elm$svg$Svg$Attributes$strokeOpacity(
				$elm$core$String$fromFloat(config.highlight)),
				$elm$svg$Svg$Attributes$fill('transparent'),
				$elm$svg$Svg$Attributes$class('elm-charts__dot-highlight')
			]);
		var view = F3(
			function (toEl, highlightOff, toAttrs) {
				return (config.highlight > 0) ? A2(
					$elm$svg$Svg$g,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$class('elm-charts__dot-container')
						]),
					_List_fromArray(
						[
							A2(
							toEl,
							_Utils_ap(
								toAttrs(highlightOff),
								highlightAttrs),
							_List_Nil),
							A2(
							toEl,
							_Utils_ap(
								toAttrs(0),
								styleAttrs),
							_List_Nil)
						])) : A2(
					toEl,
					_Utils_ap(
						toAttrs(0),
						styleAttrs),
					_List_Nil);
			});
		var area_ = (2 * $elm$core$Basics$pi) * config.size;
		if (!showDot) {
			return $elm$svg$Svg$text('');
		} else {
			var _v0 = config.shape;
			if (_v0.$ === 'Nothing') {
				return $elm$svg$Svg$text('');
			} else {
				switch (_v0.a.$) {
					case 'Circle':
						var _v1 = _v0.a;
						return A3(
							view,
							$elm$svg$Svg$circle,
							config.highlightWidth / 2,
							function (off) {
								var radius = $elm$core$Basics$sqrt(area_ / $elm$core$Basics$pi);
								return _List_fromArray(
									[
										$elm$svg$Svg$Attributes$cx(
										$elm$core$String$fromFloat(x_)),
										$elm$svg$Svg$Attributes$cy(
										$elm$core$String$fromFloat(y_)),
										$elm$svg$Svg$Attributes$r(
										$elm$core$String$fromFloat(radius + off))
									]);
							});
					case 'Triangle':
						var _v2 = _v0.a;
						return A3(
							view,
							$elm$svg$Svg$path,
							config.highlightWidth,
							function (off) {
								return _List_fromArray(
									[
										$elm$svg$Svg$Attributes$d(
										A4($terezka$elm_charts$Internal$Svg$trianglePath, area_, off, x_, y_))
									]);
							});
					case 'Square':
						var _v3 = _v0.a;
						return A3(
							view,
							$elm$svg$Svg$rect,
							config.highlightWidth,
							function (off) {
								var side = $elm$core$Basics$sqrt(area_);
								var sideOff = side + off;
								return _List_fromArray(
									[
										$elm$svg$Svg$Attributes$x(
										$elm$core$String$fromFloat(x_ - (sideOff / 2))),
										$elm$svg$Svg$Attributes$y(
										$elm$core$String$fromFloat(y_ - (sideOff / 2))),
										$elm$svg$Svg$Attributes$width(
										$elm$core$String$fromFloat(sideOff)),
										$elm$svg$Svg$Attributes$height(
										$elm$core$String$fromFloat(sideOff))
									]);
							});
					case 'Diamond':
						var _v4 = _v0.a;
						return A3(
							view,
							$elm$svg$Svg$rect,
							config.highlightWidth,
							function (off) {
								var side = $elm$core$Basics$sqrt(area_);
								var sideOff = side + off;
								return _List_fromArray(
									[
										$elm$svg$Svg$Attributes$x(
										$elm$core$String$fromFloat(x_ - (sideOff / 2))),
										$elm$svg$Svg$Attributes$y(
										$elm$core$String$fromFloat(y_ - (sideOff / 2))),
										$elm$svg$Svg$Attributes$width(
										$elm$core$String$fromFloat(sideOff)),
										$elm$svg$Svg$Attributes$height(
										$elm$core$String$fromFloat(sideOff)),
										$elm$svg$Svg$Attributes$transform(
										'rotate(45 ' + ($elm$core$String$fromFloat(x_) + (' ' + ($elm$core$String$fromFloat(y_) + ')'))))
									]);
							});
					case 'Cross':
						var _v5 = _v0.a;
						return A3(
							view,
							$elm$svg$Svg$path,
							config.highlightWidth,
							function (off) {
								return _List_fromArray(
									[
										$elm$svg$Svg$Attributes$d(
										A4($terezka$elm_charts$Internal$Svg$plusPath, area_, off, x_, y_)),
										$elm$svg$Svg$Attributes$transform(
										'rotate(45 ' + ($elm$core$String$fromFloat(x_) + (' ' + ($elm$core$String$fromFloat(y_) + ')'))))
									]);
							});
					default:
						var _v6 = _v0.a;
						return A3(
							view,
							$elm$svg$Svg$path,
							config.highlightWidth,
							function (off) {
								return _List_fromArray(
									[
										$elm$svg$Svg$Attributes$d(
										A4($terezka$elm_charts$Internal$Svg$plusPath, area_, off, x_, y_))
									]);
							});
				}
			}
		}
	});
var $terezka$elm_charts$Chart$Svg$dot = F4(
	function (plane, toX, toY, edits) {
		return A4(
			$terezka$elm_charts$Internal$Svg$dot,
			plane,
			toX,
			toY,
			A2($terezka$elm_charts$Internal$Helpers$apply, edits, $terezka$elm_charts$Internal$Svg$defaultDot));
	});
var $terezka$elm_charts$Internal$Helpers$gray = '#EFF2FA';
var $terezka$elm_charts$Internal$Svg$defaultLine = {attrs: _List_Nil, _break: false, color: 'rgb(210, 210, 210)', dashed: _List_Nil, flip: false, hideOverflow: false, opacity: 1, tickDirection: -90, tickLength: 0, width: 1, x1: $elm$core$Maybe$Nothing, x2: $elm$core$Maybe$Nothing, x2Svg: $elm$core$Maybe$Nothing, xOff: 0, y1: $elm$core$Maybe$Nothing, y2: $elm$core$Maybe$Nothing, y2Svg: $elm$core$Maybe$Nothing, yOff: 0};
var $terezka$elm_charts$Internal$Commands$Line = F2(
	function (a, b) {
		return {$: 'Line', a: a, b: b};
	});
var $terezka$elm_charts$Internal$Commands$Move = F2(
	function (a, b) {
		return {$: 'Move', a: a, b: b};
	});
var $elm$core$Basics$cos = _Basics_cos;
var $terezka$elm_charts$Internal$Commands$joinCommands = function (commands) {
	return A2($elm$core$String$join, ' ', commands);
};
var $terezka$elm_charts$Internal$Commands$stringBoolInt = function (bool) {
	return bool ? '1' : '0';
};
var $terezka$elm_charts$Internal$Commands$stringPoint = function (_v0) {
	var x = _v0.a;
	var y = _v0.b;
	return $elm$core$String$fromFloat(x) + (' ' + $elm$core$String$fromFloat(y));
};
var $terezka$elm_charts$Internal$Commands$stringPoints = function (points) {
	return A2(
		$elm$core$String$join,
		',',
		A2($elm$core$List$map, $terezka$elm_charts$Internal$Commands$stringPoint, points));
};
var $terezka$elm_charts$Internal$Commands$stringCommand = function (command) {
	switch (command.$) {
		case 'Move':
			var x = command.a;
			var y = command.b;
			return 'M' + $terezka$elm_charts$Internal$Commands$stringPoint(
				_Utils_Tuple2(x, y));
		case 'Line':
			var x = command.a;
			var y = command.b;
			return 'L' + $terezka$elm_charts$Internal$Commands$stringPoint(
				_Utils_Tuple2(x, y));
		case 'CubicBeziers':
			var cx1 = command.a;
			var cy1 = command.b;
			var cx2 = command.c;
			var cy2 = command.d;
			var x = command.e;
			var y = command.f;
			return 'C' + $terezka$elm_charts$Internal$Commands$stringPoints(
				_List_fromArray(
					[
						_Utils_Tuple2(cx1, cy1),
						_Utils_Tuple2(cx2, cy2),
						_Utils_Tuple2(x, y)
					]));
		case 'CubicBeziersShort':
			var cx1 = command.a;
			var cy1 = command.b;
			var x = command.c;
			var y = command.d;
			return 'Q' + $terezka$elm_charts$Internal$Commands$stringPoints(
				_List_fromArray(
					[
						_Utils_Tuple2(cx1, cy1),
						_Utils_Tuple2(x, y)
					]));
		case 'QuadraticBeziers':
			var cx1 = command.a;
			var cy1 = command.b;
			var x = command.c;
			var y = command.d;
			return 'Q' + $terezka$elm_charts$Internal$Commands$stringPoints(
				_List_fromArray(
					[
						_Utils_Tuple2(cx1, cy1),
						_Utils_Tuple2(x, y)
					]));
		case 'QuadraticBeziersShort':
			var x = command.a;
			var y = command.b;
			return 'T' + $terezka$elm_charts$Internal$Commands$stringPoint(
				_Utils_Tuple2(x, y));
		case 'Arc':
			var rx = command.a;
			var ry = command.b;
			var xAxisRotation = command.c;
			var largeArcFlag = command.d;
			var sweepFlag = command.e;
			var x = command.f;
			var y = command.g;
			return 'A ' + $terezka$elm_charts$Internal$Commands$joinCommands(
				_List_fromArray(
					[
						$terezka$elm_charts$Internal$Commands$stringPoint(
						_Utils_Tuple2(rx, ry)),
						$elm$core$String$fromInt(xAxisRotation),
						$terezka$elm_charts$Internal$Commands$stringBoolInt(largeArcFlag),
						$terezka$elm_charts$Internal$Commands$stringBoolInt(sweepFlag),
						$terezka$elm_charts$Internal$Commands$stringPoint(
						_Utils_Tuple2(x, y))
					]));
		default:
			return 'Z';
	}
};
var $terezka$elm_charts$Internal$Commands$Arc = F7(
	function (a, b, c, d, e, f, g) {
		return {$: 'Arc', a: a, b: b, c: c, d: d, e: e, f: f, g: g};
	});
var $terezka$elm_charts$Internal$Commands$Close = {$: 'Close'};
var $terezka$elm_charts$Internal$Commands$CubicBeziers = F6(
	function (a, b, c, d, e, f) {
		return {$: 'CubicBeziers', a: a, b: b, c: c, d: d, e: e, f: f};
	});
var $terezka$elm_charts$Internal$Commands$CubicBeziersShort = F4(
	function (a, b, c, d) {
		return {$: 'CubicBeziersShort', a: a, b: b, c: c, d: d};
	});
var $terezka$elm_charts$Internal$Commands$QuadraticBeziers = F4(
	function (a, b, c, d) {
		return {$: 'QuadraticBeziers', a: a, b: b, c: c, d: d};
	});
var $terezka$elm_charts$Internal$Commands$QuadraticBeziersShort = F2(
	function (a, b) {
		return {$: 'QuadraticBeziersShort', a: a, b: b};
	});
var $terezka$elm_charts$Internal$Commands$translate = F2(
	function (plane, command) {
		switch (command.$) {
			case 'Move':
				var x = command.a;
				var y = command.b;
				return A2(
					$terezka$elm_charts$Internal$Commands$Move,
					A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, x),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, y));
			case 'Line':
				var x = command.a;
				var y = command.b;
				return A2(
					$terezka$elm_charts$Internal$Commands$Line,
					A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, x),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, y));
			case 'CubicBeziers':
				var cx1 = command.a;
				var cy1 = command.b;
				var cx2 = command.c;
				var cy2 = command.d;
				var x = command.e;
				var y = command.f;
				return A6(
					$terezka$elm_charts$Internal$Commands$CubicBeziers,
					A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, cx1),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, cy1),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, cx2),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, cy2),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, x),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, y));
			case 'CubicBeziersShort':
				var cx1 = command.a;
				var cy1 = command.b;
				var x = command.c;
				var y = command.d;
				return A4(
					$terezka$elm_charts$Internal$Commands$CubicBeziersShort,
					A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, cx1),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, cy1),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, x),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, y));
			case 'QuadraticBeziers':
				var cx1 = command.a;
				var cy1 = command.b;
				var x = command.c;
				var y = command.d;
				return A4(
					$terezka$elm_charts$Internal$Commands$QuadraticBeziers,
					A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, cx1),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, cy1),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, x),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, y));
			case 'QuadraticBeziersShort':
				var x = command.a;
				var y = command.b;
				return A2(
					$terezka$elm_charts$Internal$Commands$QuadraticBeziersShort,
					A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, x),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, y));
			case 'Arc':
				var rx = command.a;
				var ry = command.b;
				var xAxisRotation = command.c;
				var largeArcFlag = command.d;
				var sweepFlag = command.e;
				var x = command.f;
				var y = command.g;
				return A7(
					$terezka$elm_charts$Internal$Commands$Arc,
					rx,
					ry,
					xAxisRotation,
					largeArcFlag,
					sweepFlag,
					A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, x),
					A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, y));
			default:
				return $terezka$elm_charts$Internal$Commands$Close;
		}
	});
var $terezka$elm_charts$Internal$Commands$description = F2(
	function (plane, commands) {
		return $terezka$elm_charts$Internal$Commands$joinCommands(
			A2(
				$elm$core$List$map,
				A2(
					$elm$core$Basics$composeR,
					$terezka$elm_charts$Internal$Commands$translate(plane),
					$terezka$elm_charts$Internal$Commands$stringCommand),
				commands));
	});
var $terezka$elm_charts$Internal$Coordinates$scaleCartesianX = F2(
	function (plane, value) {
		return (value * $terezka$elm_charts$Internal$Coordinates$range(plane.x)) / $terezka$elm_charts$Internal$Coordinates$innerWidth(plane);
	});
var $terezka$elm_charts$Internal$Svg$lengthInCartesianX = $terezka$elm_charts$Internal$Coordinates$scaleCartesianX;
var $terezka$elm_charts$Internal$Coordinates$scaleCartesianY = F2(
	function (plane, value) {
		return (value * $terezka$elm_charts$Internal$Coordinates$range(plane.y)) / $terezka$elm_charts$Internal$Coordinates$innerHeight(plane);
	});
var $terezka$elm_charts$Internal$Svg$lengthInCartesianY = $terezka$elm_charts$Internal$Coordinates$scaleCartesianY;
var $elm$core$Basics$sin = _Basics_sin;
var $elm$svg$Svg$Attributes$strokeDasharray = _VirtualDom_attribute('stroke-dasharray');
var $elm$virtual_dom$VirtualDom$mapAttribute = _VirtualDom_mapAttribute;
var $elm$html$Html$Attributes$map = $elm$virtual_dom$VirtualDom$mapAttribute;
var $terezka$elm_charts$Internal$Svg$withAttrs = F3(
	function (attrs, toEl, defaultAttrs) {
		return toEl(
			_Utils_ap(
				defaultAttrs,
				A2(
					$elm$core$List$map,
					$elm$html$Html$Attributes$map($elm$core$Basics$never),
					attrs)));
	});
var $terezka$elm_charts$Internal$Svg$line = F2(
	function (plane, config) {
		var angle = $elm$core$Basics$degrees(config.tickDirection);
		var _v0 = function () {
			var _v3 = _Utils_Tuple3(
				_Utils_Tuple2(config.x1, config.x2),
				_Utils_Tuple2(config.y1, config.y2),
				_Utils_Tuple2(config.x2Svg, config.y2Svg));
			if (_v3.a.a.$ === 'Just') {
				if (_v3.a.b.$ === 'Just') {
					if (_v3.b.a.$ === 'Nothing') {
						if (_v3.b.b.$ === 'Nothing') {
							var _v4 = _v3.a;
							var a = _v4.a.a;
							var b = _v4.b.a;
							var _v5 = _v3.b;
							var _v6 = _v5.a;
							var _v7 = _v5.b;
							return _Utils_Tuple2(
								_Utils_Tuple2(a, b),
								_Utils_Tuple2(plane.y.min, plane.y.min));
						} else {
							var _v38 = _v3.a;
							var a = _v38.a.a;
							var b = _v38.b.a;
							var _v39 = _v3.b;
							var _v40 = _v39.a;
							var c = _v39.b.a;
							return _Utils_Tuple2(
								_Utils_Tuple2(a, b),
								_Utils_Tuple2(c, c));
						}
					} else {
						if (_v3.b.b.$ === 'Nothing') {
							var _v41 = _v3.a;
							var a = _v41.a.a;
							var b = _v41.b.a;
							var _v42 = _v3.b;
							var c = _v42.a.a;
							var _v43 = _v42.b;
							return _Utils_Tuple2(
								_Utils_Tuple2(a, b),
								_Utils_Tuple2(c, c));
						} else {
							return _Utils_Tuple2(
								_Utils_Tuple2(
									A2($elm$core$Maybe$withDefault, plane.x.min, config.x1),
									A2($elm$core$Maybe$withDefault, plane.x.max, config.x2)),
								_Utils_Tuple2(
									A2($elm$core$Maybe$withDefault, plane.y.min, config.y1),
									A2($elm$core$Maybe$withDefault, plane.y.max, config.y2)));
						}
					}
				} else {
					if (_v3.b.a.$ === 'Nothing') {
						if (_v3.b.b.$ === 'Nothing') {
							var _v8 = _v3.a;
							var a = _v8.a.a;
							var _v9 = _v8.b;
							var _v10 = _v3.b;
							var _v11 = _v10.a;
							var _v12 = _v10.b;
							return _Utils_Tuple2(
								_Utils_Tuple2(a, a),
								_Utils_Tuple2(plane.y.min, plane.y.max));
						} else {
							if (_v3.c.a.$ === 'Just') {
								if (_v3.c.b.$ === 'Just') {
									var _v51 = _v3.a;
									var a = _v51.a.a;
									var _v52 = _v51.b;
									var _v53 = _v3.b;
									var _v54 = _v53.a;
									var b = _v53.b.a;
									var _v55 = _v3.c;
									var xOff = _v55.a.a;
									var yOff = _v55.b.a;
									return _Utils_Tuple2(
										_Utils_Tuple2(
											a,
											a + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, xOff)),
										_Utils_Tuple2(
											b,
											b + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, yOff)));
								} else {
									var _v56 = _v3.a;
									var a = _v56.a.a;
									var _v57 = _v56.b;
									var _v58 = _v3.b;
									var _v59 = _v58.a;
									var b = _v58.b.a;
									var _v60 = _v3.c;
									var xOff = _v60.a.a;
									var _v61 = _v60.b;
									return _Utils_Tuple2(
										_Utils_Tuple2(
											a,
											a + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, xOff)),
										_Utils_Tuple2(b, b));
								}
							} else {
								if (_v3.c.b.$ === 'Nothing') {
									var _v44 = _v3.a;
									var a = _v44.a.a;
									var _v45 = _v44.b;
									var _v46 = _v3.b;
									var _v47 = _v46.a;
									var b = _v46.b.a;
									var _v48 = _v3.c;
									var _v49 = _v48.a;
									var _v50 = _v48.b;
									return _Utils_Tuple2(
										_Utils_Tuple2(a, plane.x.max),
										_Utils_Tuple2(b, b));
								} else {
									var _v62 = _v3.a;
									var a = _v62.a.a;
									var _v63 = _v62.b;
									var _v64 = _v3.b;
									var _v65 = _v64.a;
									var b = _v64.b.a;
									var _v66 = _v3.c;
									var _v67 = _v66.a;
									var yOff = _v66.b.a;
									return _Utils_Tuple2(
										_Utils_Tuple2(a, a),
										_Utils_Tuple2(
											b,
											b + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, yOff)));
								}
							}
						}
					} else {
						if (_v3.b.b.$ === 'Just') {
							var _v35 = _v3.a;
							var c = _v35.a.a;
							var _v36 = _v35.b;
							var _v37 = _v3.b;
							var a = _v37.a.a;
							var b = _v37.b.a;
							return _Utils_Tuple2(
								_Utils_Tuple2(c, c),
								_Utils_Tuple2(a, b));
						} else {
							if (_v3.c.a.$ === 'Just') {
								if (_v3.c.b.$ === 'Just') {
									var _v75 = _v3.a;
									var a = _v75.a.a;
									var _v76 = _v75.b;
									var _v77 = _v3.b;
									var b = _v77.a.a;
									var _v78 = _v77.b;
									var _v79 = _v3.c;
									var xOff = _v79.a.a;
									var yOff = _v79.b.a;
									return _Utils_Tuple2(
										_Utils_Tuple2(
											a,
											a + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, xOff)),
										_Utils_Tuple2(
											b,
											b + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, yOff)));
								} else {
									var _v80 = _v3.a;
									var a = _v80.a.a;
									var _v81 = _v80.b;
									var _v82 = _v3.b;
									var b = _v82.a.a;
									var _v83 = _v82.b;
									var _v84 = _v3.c;
									var xOff = _v84.a.a;
									var _v85 = _v84.b;
									return _Utils_Tuple2(
										_Utils_Tuple2(
											a,
											a + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, xOff)),
										_Utils_Tuple2(b, b));
								}
							} else {
								if (_v3.c.b.$ === 'Nothing') {
									var _v68 = _v3.a;
									var a = _v68.a.a;
									var _v69 = _v68.b;
									var _v70 = _v3.b;
									var b = _v70.a.a;
									var _v71 = _v70.b;
									var _v72 = _v3.c;
									var _v73 = _v72.a;
									var _v74 = _v72.b;
									return _Utils_Tuple2(
										_Utils_Tuple2(a, plane.x.max),
										_Utils_Tuple2(b, b));
								} else {
									var _v86 = _v3.a;
									var a = _v86.a.a;
									var _v87 = _v86.b;
									var _v88 = _v3.b;
									var b = _v88.a.a;
									var _v89 = _v88.b;
									var _v90 = _v3.c;
									var _v91 = _v90.a;
									var yOff = _v90.b.a;
									return _Utils_Tuple2(
										_Utils_Tuple2(a, a),
										_Utils_Tuple2(
											b,
											b + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, yOff)));
								}
							}
						}
					}
				}
			} else {
				if (_v3.a.b.$ === 'Just') {
					if (_v3.b.a.$ === 'Nothing') {
						if (_v3.b.b.$ === 'Nothing') {
							var _v13 = _v3.a;
							var _v14 = _v13.a;
							var b = _v13.b.a;
							var _v15 = _v3.b;
							var _v16 = _v15.a;
							var _v17 = _v15.b;
							return _Utils_Tuple2(
								_Utils_Tuple2(b, b),
								_Utils_Tuple2(plane.y.min, plane.y.max));
						} else {
							if (_v3.c.a.$ === 'Just') {
								if (_v3.c.b.$ === 'Just') {
									var _v99 = _v3.a;
									var _v100 = _v99.a;
									var a = _v99.b.a;
									var _v101 = _v3.b;
									var _v102 = _v101.a;
									var b = _v101.b.a;
									var _v103 = _v3.c;
									var xOff = _v103.a.a;
									var yOff = _v103.b.a;
									return _Utils_Tuple2(
										_Utils_Tuple2(
											a,
											a + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, xOff)),
										_Utils_Tuple2(
											b,
											b + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, yOff)));
								} else {
									var _v104 = _v3.a;
									var _v105 = _v104.a;
									var a = _v104.b.a;
									var _v106 = _v3.b;
									var _v107 = _v106.a;
									var b = _v106.b.a;
									var _v108 = _v3.c;
									var xOff = _v108.a.a;
									var _v109 = _v108.b;
									return _Utils_Tuple2(
										_Utils_Tuple2(
											a,
											a + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, xOff)),
										_Utils_Tuple2(b, b));
								}
							} else {
								if (_v3.c.b.$ === 'Nothing') {
									var _v92 = _v3.a;
									var _v93 = _v92.a;
									var a = _v92.b.a;
									var _v94 = _v3.b;
									var _v95 = _v94.a;
									var b = _v94.b.a;
									var _v96 = _v3.c;
									var _v97 = _v96.a;
									var _v98 = _v96.b;
									return _Utils_Tuple2(
										_Utils_Tuple2(a, plane.x.max),
										_Utils_Tuple2(b, b));
								} else {
									var _v110 = _v3.a;
									var _v111 = _v110.a;
									var a = _v110.b.a;
									var _v112 = _v3.b;
									var _v113 = _v112.a;
									var b = _v112.b.a;
									var _v114 = _v3.c;
									var _v115 = _v114.a;
									var yOff = _v114.b.a;
									return _Utils_Tuple2(
										_Utils_Tuple2(a, a),
										_Utils_Tuple2(
											b,
											b + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, yOff)));
								}
							}
						}
					} else {
						if (_v3.b.b.$ === 'Just') {
							var _v32 = _v3.a;
							var _v33 = _v32.a;
							var c = _v32.b.a;
							var _v34 = _v3.b;
							var a = _v34.a.a;
							var b = _v34.b.a;
							return _Utils_Tuple2(
								_Utils_Tuple2(c, c),
								_Utils_Tuple2(a, b));
						} else {
							if (_v3.c.a.$ === 'Just') {
								if (_v3.c.b.$ === 'Just') {
									var _v123 = _v3.a;
									var _v124 = _v123.a;
									var a = _v123.b.a;
									var _v125 = _v3.b;
									var b = _v125.a.a;
									var _v126 = _v125.b;
									var _v127 = _v3.c;
									var xOff = _v127.a.a;
									var yOff = _v127.b.a;
									return _Utils_Tuple2(
										_Utils_Tuple2(
											a,
											a + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, xOff)),
										_Utils_Tuple2(
											b,
											b + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, yOff)));
								} else {
									var _v128 = _v3.a;
									var _v129 = _v128.a;
									var a = _v128.b.a;
									var _v130 = _v3.b;
									var b = _v130.a.a;
									var _v131 = _v130.b;
									var _v132 = _v3.c;
									var xOff = _v132.a.a;
									var _v133 = _v132.b;
									return _Utils_Tuple2(
										_Utils_Tuple2(
											a,
											a + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, xOff)),
										_Utils_Tuple2(b, b));
								}
							} else {
								if (_v3.c.b.$ === 'Nothing') {
									var _v116 = _v3.a;
									var _v117 = _v116.a;
									var a = _v116.b.a;
									var _v118 = _v3.b;
									var b = _v118.a.a;
									var _v119 = _v118.b;
									var _v120 = _v3.c;
									var _v121 = _v120.a;
									var _v122 = _v120.b;
									return _Utils_Tuple2(
										_Utils_Tuple2(a, plane.x.max),
										_Utils_Tuple2(b, b));
								} else {
									var _v134 = _v3.a;
									var _v135 = _v134.a;
									var a = _v134.b.a;
									var _v136 = _v3.b;
									var b = _v136.a.a;
									var _v137 = _v136.b;
									var _v138 = _v3.c;
									var _v139 = _v138.a;
									var yOff = _v138.b.a;
									return _Utils_Tuple2(
										_Utils_Tuple2(a, a),
										_Utils_Tuple2(
											b,
											b + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, yOff)));
								}
							}
						}
					}
				} else {
					if (_v3.b.a.$ === 'Just') {
						if (_v3.b.b.$ === 'Just') {
							var _v18 = _v3.a;
							var _v19 = _v18.a;
							var _v20 = _v18.b;
							var _v21 = _v3.b;
							var a = _v21.a.a;
							var b = _v21.b.a;
							return _Utils_Tuple2(
								_Utils_Tuple2(plane.x.min, plane.x.min),
								_Utils_Tuple2(a, b));
						} else {
							var _v22 = _v3.a;
							var _v23 = _v22.a;
							var _v24 = _v22.b;
							var _v25 = _v3.b;
							var a = _v25.a.a;
							var _v26 = _v25.b;
							return _Utils_Tuple2(
								_Utils_Tuple2(plane.x.min, plane.x.max),
								_Utils_Tuple2(a, a));
						}
					} else {
						if (_v3.b.b.$ === 'Just') {
							var _v27 = _v3.a;
							var _v28 = _v27.a;
							var _v29 = _v27.b;
							var _v30 = _v3.b;
							var _v31 = _v30.a;
							var b = _v30.b.a;
							return _Utils_Tuple2(
								_Utils_Tuple2(plane.x.min, plane.x.max),
								_Utils_Tuple2(b, b));
						} else {
							var _v140 = _v3.a;
							var _v141 = _v140.a;
							var _v142 = _v140.b;
							var _v143 = _v3.b;
							var _v144 = _v143.a;
							var _v145 = _v143.b;
							return _Utils_Tuple2(
								_Utils_Tuple2(plane.x.min, plane.x.max),
								_Utils_Tuple2(plane.y.min, plane.y.max));
						}
					}
				}
			}
		}();
		var _v1 = _v0.a;
		var x1 = _v1.a;
		var x2 = _v1.b;
		var _v2 = _v0.b;
		var y1 = _v2.a;
		var y2 = _v2.b;
		var x1_ = x1 + A2($terezka$elm_charts$Internal$Svg$lengthInCartesianX, plane, config.xOff);
		var x2_ = x2 + A2($terezka$elm_charts$Internal$Svg$lengthInCartesianX, plane, config.xOff);
		var y1_ = y1 - A2($terezka$elm_charts$Internal$Svg$lengthInCartesianY, plane, config.yOff);
		var y2_ = y2 - A2($terezka$elm_charts$Internal$Svg$lengthInCartesianY, plane, config.yOff);
		var _v146 = (config.tickLength > 0) ? _Utils_Tuple2(
			A2(
				$terezka$elm_charts$Internal$Svg$lengthInCartesianX,
				plane,
				$elm$core$Basics$cos(angle) * config.tickLength),
			A2(
				$terezka$elm_charts$Internal$Svg$lengthInCartesianY,
				plane,
				$elm$core$Basics$sin(angle) * config.tickLength)) : _Utils_Tuple2(0, 0);
		var tickOffsetX = _v146.a;
		var tickOffsetY = _v146.b;
		var cmds = config.flip ? _Utils_ap(
			(config.tickLength > 0) ? _List_fromArray(
				[
					A2($terezka$elm_charts$Internal$Commands$Move, x2_ + tickOffsetX, y2_ + tickOffsetY),
					A2($terezka$elm_charts$Internal$Commands$Line, x2_, y2_)
				]) : _List_fromArray(
				[
					A2($terezka$elm_charts$Internal$Commands$Move, x2_, y2_)
				]),
			_Utils_ap(
				config._break ? _List_fromArray(
					[
						A2($terezka$elm_charts$Internal$Commands$Line, x2_, y1_),
						A2($terezka$elm_charts$Internal$Commands$Line, x1_, y1_)
					]) : _List_fromArray(
					[
						A2($terezka$elm_charts$Internal$Commands$Line, x1_, y1_)
					]),
				(config.tickLength > 0) ? _List_fromArray(
					[
						A2($terezka$elm_charts$Internal$Commands$Line, x1_ + tickOffsetX, y1_ + tickOffsetY)
					]) : _List_Nil)) : _Utils_ap(
			(config.tickLength > 0) ? _List_fromArray(
				[
					A2($terezka$elm_charts$Internal$Commands$Move, x1_ + tickOffsetX, y1_ + tickOffsetY),
					A2($terezka$elm_charts$Internal$Commands$Line, x1_, y1_)
				]) : _List_fromArray(
				[
					A2($terezka$elm_charts$Internal$Commands$Move, x1_, y1_)
				]),
			_Utils_ap(
				config._break ? _List_fromArray(
					[
						A2($terezka$elm_charts$Internal$Commands$Line, x1_, y2_),
						A2($terezka$elm_charts$Internal$Commands$Line, x2_, y2_)
					]) : _List_fromArray(
					[
						A2($terezka$elm_charts$Internal$Commands$Line, x2_, y2_)
					]),
				(config.tickLength > 0) ? _List_fromArray(
					[
						A2($terezka$elm_charts$Internal$Commands$Line, x2_ + tickOffsetX, y2_ + tickOffsetY)
					]) : _List_Nil));
		return A4(
			$terezka$elm_charts$Internal$Svg$withAttrs,
			config.attrs,
			$elm$svg$Svg$path,
			_List_fromArray(
				[
					$elm$svg$Svg$Attributes$class('elm-charts__line'),
					$elm$svg$Svg$Attributes$fill('transparent'),
					$elm$svg$Svg$Attributes$stroke(config.color),
					$elm$svg$Svg$Attributes$strokeWidth(
					$elm$core$String$fromFloat(config.width)),
					$elm$svg$Svg$Attributes$strokeOpacity(
					$elm$core$String$fromFloat(config.opacity)),
					$elm$svg$Svg$Attributes$strokeDasharray(
					A2(
						$elm$core$String$join,
						' ',
						A2($elm$core$List$map, $elm$core$String$fromFloat, config.dashed))),
					$elm$svg$Svg$Attributes$d(
					A2($terezka$elm_charts$Internal$Commands$description, plane, cmds)),
					config.hideOverflow ? $terezka$elm_charts$Internal$Svg$withinChartArea(plane) : $elm$svg$Svg$Attributes$class('')
				]),
			_List_Nil);
	});
var $terezka$elm_charts$Chart$Svg$line = F2(
	function (plane, edits) {
		return A2(
			$terezka$elm_charts$Internal$Svg$line,
			plane,
			A2($terezka$elm_charts$Internal$Helpers$apply, edits, $terezka$elm_charts$Internal$Svg$defaultLine));
	});
var $elm$core$List$member = F2(
	function (x, xs) {
		return A2(
			$elm$core$List$any,
			function (a) {
				return _Utils_eq(a, x);
			},
			xs);
	});
var $terezka$elm_charts$Chart$Attributes$size = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{size: v});
		});
};
var $terezka$elm_charts$Chart$Attributes$width = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{width: v});
		});
};
var $terezka$elm_charts$Chart$Attributes$x1 = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{
					x1: $elm$core$Maybe$Just(v)
				});
		});
};
var $terezka$elm_charts$Chart$Attributes$y1 = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{
					y1: $elm$core$Maybe$Just(v)
				});
		});
};
var $terezka$elm_charts$Chart$grid = function (edits) {
	var config = A2(
		$terezka$elm_charts$Internal$Helpers$apply,
		edits,
		{color: '', dashed: _List_Nil, dotGrid: false, width: 0});
	var width = (!config.width) ? (config.dotGrid ? 0.5 : 1) : config.width;
	var color = $elm$core$String$isEmpty(config.color) ? (config.dotGrid ? $terezka$elm_charts$Internal$Helpers$darkGray : $terezka$elm_charts$Internal$Helpers$gray) : config.color;
	var toDot = F4(
		function (vs, p, x, y) {
			return (A2($elm$core$List$member, x, vs.xAxis) || A2($elm$core$List$member, y, vs.yAxis)) ? $elm$core$Maybe$Nothing : $elm$core$Maybe$Just(
				A5(
					$terezka$elm_charts$Chart$Svg$dot,
					p,
					function ($) {
						return $.x;
					},
					function ($) {
						return $.y;
					},
					_List_fromArray(
						[
							$terezka$elm_charts$Chart$Attributes$color(color),
							$terezka$elm_charts$Chart$Attributes$size(width),
							$terezka$elm_charts$Chart$Attributes$circle
						]),
					{x: x, y: y}));
		});
	var toXGrid = F3(
		function (vs, p, v) {
			return A2($elm$core$List$member, v, vs.xAxis) ? $elm$core$Maybe$Nothing : $elm$core$Maybe$Just(
				A2(
					$terezka$elm_charts$Chart$Svg$line,
					p,
					_List_fromArray(
						[
							$terezka$elm_charts$Chart$Attributes$color(color),
							$terezka$elm_charts$Chart$Attributes$width(width),
							$terezka$elm_charts$Chart$Attributes$x1(v),
							$terezka$elm_charts$Chart$Attributes$dashed(config.dashed)
						])));
		});
	var toYGrid = F3(
		function (vs, p, v) {
			return A2($elm$core$List$member, v, vs.yAxis) ? $elm$core$Maybe$Nothing : $elm$core$Maybe$Just(
				A2(
					$terezka$elm_charts$Chart$Svg$line,
					p,
					_List_fromArray(
						[
							$terezka$elm_charts$Chart$Attributes$color(color),
							$terezka$elm_charts$Chart$Attributes$width(width),
							$terezka$elm_charts$Chart$Attributes$y1(v),
							$terezka$elm_charts$Chart$Attributes$dashed(config.dashed)
						])));
		});
	return $terezka$elm_charts$Chart$GridElement(
		F2(
			function (p, vs) {
				return A2(
					$elm$svg$Svg$g,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$class('elm-charts__grid')
						]),
					config.dotGrid ? A2(
						$elm$core$List$concatMap,
						function (x) {
							return A2(
								$elm$core$List$filterMap,
								A3(toDot, vs, p, x),
								vs.ys);
						},
						vs.xs) : _List_fromArray(
						[
							A2(
							$elm$svg$Svg$g,
							_List_fromArray(
								[
									$elm$svg$Svg$Attributes$class('elm-charts__x-grid')
								]),
							A2(
								$elm$core$List$filterMap,
								A2(toXGrid, vs, p),
								vs.xs)),
							A2(
							$elm$svg$Svg$g,
							_List_fromArray(
								[
									$elm$svg$Svg$Attributes$class('elm-charts__y-grid')
								]),
							A2(
								$elm$core$List$filterMap,
								A2(toYGrid, vs, p),
								vs.ys))
						]));
			}));
};
var $terezka$elm_charts$Chart$addGridIfNone = function (elements) {
	var isGrid = function (el) {
		if (el.$ === 'GridElement') {
			return true;
		} else {
			return false;
		}
	};
	return A2($elm$core$List$any, isGrid, elements) ? elements : A2(
		$elm$core$List$cons,
		$terezka$elm_charts$Chart$grid(_List_Nil),
		elements);
};
var $terezka$elm_charts$Chart$addIndexes = F2(
	function (planeConfig, startIndex) {
		var toIndexedElements = F2(
			function (element, _v0) {
				var allElements = _v0.a;
				var index = _v0.b;
				switch (element.$) {
					case 'Indexed':
						var func = element.a;
						var _v2 = A2(func, planeConfig, index);
						var indexedElement = _v2.a;
						var nextIndex = _v2.b;
						return _Utils_Tuple2(
							_Utils_ap(
								allElements,
								_List_fromArray(
									[indexedElement])),
							nextIndex);
					case 'ListOfElements':
						var elements = element.a;
						return A3(
							$elm$core$List$foldl,
							toIndexedElements,
							_Utils_Tuple2(allElements, index),
							elements);
					default:
						return _Utils_Tuple2(
							_Utils_ap(
								allElements,
								_List_fromArray(
									[element])),
							index);
				}
			});
		return A2(
			$elm$core$List$foldl,
			toIndexedElements,
			_Utils_Tuple2(_List_Nil, startIndex));
	});
var $elm$svg$Svg$clipPath = $elm$svg$Svg$trustedNode('clipPath');
var $K_Adam$elm_dom$DOM$offsetHeight = A2($elm$json$Json$Decode$field, 'offsetHeight', $elm$json$Json$Decode$float);
var $K_Adam$elm_dom$DOM$offsetWidth = A2($elm$json$Json$Decode$field, 'offsetWidth', $elm$json$Json$Decode$float);
var $K_Adam$elm_dom$DOM$offsetLeft = A2($elm$json$Json$Decode$field, 'offsetLeft', $elm$json$Json$Decode$float);
var $elm$json$Json$Decode$null = _Json_decodeNull;
var $elm$json$Json$Decode$oneOf = _Json_oneOf;
var $K_Adam$elm_dom$DOM$offsetParent = F2(
	function (x, decoder) {
		return $elm$json$Json$Decode$oneOf(
			_List_fromArray(
				[
					A2(
					$elm$json$Json$Decode$field,
					'offsetParent',
					$elm$json$Json$Decode$null(x)),
					A2($elm$json$Json$Decode$field, 'offsetParent', decoder)
				]));
	});
var $K_Adam$elm_dom$DOM$offsetTop = A2($elm$json$Json$Decode$field, 'offsetTop', $elm$json$Json$Decode$float);
var $K_Adam$elm_dom$DOM$scrollLeft = A2($elm$json$Json$Decode$field, 'scrollLeft', $elm$json$Json$Decode$float);
var $K_Adam$elm_dom$DOM$scrollTop = A2($elm$json$Json$Decode$field, 'scrollTop', $elm$json$Json$Decode$float);
var $K_Adam$elm_dom$DOM$position = F2(
	function (x, y) {
		return A2(
			$elm$json$Json$Decode$andThen,
			function (_v0) {
				var x_ = _v0.a;
				var y_ = _v0.b;
				return A2(
					$K_Adam$elm_dom$DOM$offsetParent,
					_Utils_Tuple2(x_, y_),
					A2($K_Adam$elm_dom$DOM$position, x_, y_));
			},
			A5(
				$elm$json$Json$Decode$map4,
				F4(
					function (scrollLeftP, scrollTopP, offsetLeftP, offsetTopP) {
						return _Utils_Tuple2((x + offsetLeftP) - scrollLeftP, (y + offsetTopP) - scrollTopP);
					}),
				$K_Adam$elm_dom$DOM$scrollLeft,
				$K_Adam$elm_dom$DOM$scrollTop,
				$K_Adam$elm_dom$DOM$offsetLeft,
				$K_Adam$elm_dom$DOM$offsetTop));
	});
var $K_Adam$elm_dom$DOM$boundingClientRect = A4(
	$elm$json$Json$Decode$map3,
	F3(
		function (_v0, width, height) {
			var x = _v0.a;
			var y = _v0.b;
			return {height: height, left: x, top: y, width: width};
		}),
	A2($K_Adam$elm_dom$DOM$position, 0, 0),
	$K_Adam$elm_dom$DOM$offsetWidth,
	$K_Adam$elm_dom$DOM$offsetHeight);
var $K_Adam$elm_dom$DOM$parentElement = function (decoder) {
	return A2($elm$json$Json$Decode$field, 'parentElement', decoder);
};
function $terezka$elm_charts$Internal$Svg$cyclic$decodePosition() {
	return $elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				$K_Adam$elm_dom$DOM$boundingClientRect,
				$elm$json$Json$Decode$lazy(
				function (_v0) {
					return $K_Adam$elm_dom$DOM$parentElement(
						$terezka$elm_charts$Internal$Svg$cyclic$decodePosition());
				})
			]));
}
try {
	var $terezka$elm_charts$Internal$Svg$decodePosition = $terezka$elm_charts$Internal$Svg$cyclic$decodePosition();
	$terezka$elm_charts$Internal$Svg$cyclic$decodePosition = function () {
		return $terezka$elm_charts$Internal$Svg$decodePosition;
	};
} catch ($) {
	throw 'Some top-level definitions from `Internal.Svg` are causing infinite recursion:\n\n  ┌─────┐\n  │    decodePosition\n  └─────┘\n\nThese errors are very tricky, so read https://elm-lang.org/0.19.1/bad-recursion to learn how to fix it!';}
var $terezka$elm_charts$Internal$Coordinates$toCartesianX = F2(
	function (plane, value) {
		return plane.x.flip ? (($terezka$elm_charts$Internal$Coordinates$range(plane.x) - A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, value - plane.x.marginMin)) + plane.x.min) : (A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, value - plane.x.marginMin) + plane.x.min);
	});
var $terezka$elm_charts$Internal$Coordinates$toCartesianY = F2(
	function (plane, value) {
		return plane.y.flip ? (A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, value - plane.y.marginMin) + plane.y.min) : (($terezka$elm_charts$Internal$Coordinates$range(plane.y) - A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, value - plane.y.marginMin)) + plane.y.min);
	});
var $terezka$elm_charts$Internal$Svg$fromSvg = F2(
	function (plane, point) {
		return {
			x: A2($terezka$elm_charts$Internal$Coordinates$toCartesianX, plane, point.x),
			y: A2($terezka$elm_charts$Internal$Coordinates$toCartesianY, plane, point.y)
		};
	});
var $K_Adam$elm_dom$DOM$target = function (decoder) {
	return A2($elm$json$Json$Decode$field, 'target', decoder);
};
var $terezka$elm_charts$Internal$Svg$decoder = F2(
	function (plane, toMsg) {
		var handle = F3(
			function (mouseX, mouseY, box) {
				var yPrev = plane.y;
				var xPrev = plane.x;
				var widthPercent = box.width / plane.x.length;
				var heightPercent = box.height / plane.y.length;
				var newPlane = _Utils_update(
					plane,
					{
						x: _Utils_update(
							xPrev,
							{length: box.width, marginMax: plane.x.marginMax * widthPercent, marginMin: plane.x.marginMin * widthPercent}),
						y: _Utils_update(
							yPrev,
							{length: box.height, marginMax: plane.y.marginMax * heightPercent, marginMin: plane.y.marginMin * heightPercent})
					});
				var searched = A2(
					$terezka$elm_charts$Internal$Svg$fromSvg,
					newPlane,
					{x: mouseX - box.left, y: mouseY - box.top});
				return A3(toMsg, plane, newPlane, searched);
			});
		return A4(
			$elm$json$Json$Decode$map3,
			handle,
			A2($elm$json$Json$Decode$field, 'pageX', $elm$json$Json$Decode$float),
			A2($elm$json$Json$Decode$field, 'pageY', $elm$json$Json$Decode$float),
			$K_Adam$elm_dom$DOM$target($terezka$elm_charts$Internal$Svg$decodePosition));
	});
var $elm$svg$Svg$defs = $elm$svg$Svg$trustedNode('defs');
var $elm$svg$Svg$Attributes$id = _VirtualDom_attribute('id');
var $elm$svg$Svg$Events$on = $elm$html$Html$Events$on;
var $elm$svg$Svg$svg = $elm$svg$Svg$trustedNode('svg');
var $elm$svg$Svg$Attributes$viewBox = _VirtualDom_attribute('viewBox');
var $terezka$elm_charts$Internal$Svg$container = F5(
	function (plane, config, below, chartEls, above) {
		var toEvent = function (event) {
			return A2(
				$elm$svg$Svg$Events$on,
				event.name,
				A2($terezka$elm_charts$Internal$Svg$decoder, plane, event.handler));
		};
		var svgAttrsSize = function () {
			var _v0 = config.viewport;
			if (_v0.$ === 'Just') {
				var viewport = _v0.a;
				return _List_fromArray(
					[
						$elm$svg$Svg$Attributes$viewBox(
						'0 0 ' + ($elm$core$String$fromInt(viewport.width) + (' ' + $elm$core$String$fromInt(viewport.height)))),
						A2($elm$html$Html$Attributes$style, 'display', 'block')
					]);
			} else {
				return _List_fromArray(
					[
						$elm$svg$Svg$Attributes$viewBox(
						'0 0 ' + ($elm$core$String$fromFloat(plane.x.length) + (' ' + $elm$core$String$fromFloat(plane.y.length)))),
						A2($elm$html$Html$Attributes$style, 'display', 'block')
					]);
			}
		}();
		var htmlAttrsSize = _List_fromArray(
			[
				A2($elm$html$Html$Attributes$style, 'width', '100%'),
				A2($elm$html$Html$Attributes$style, 'height', '100%')
			]);
		var htmlAttrsDefault = _List_fromArray(
			[
				$elm$html$Html$Attributes$class('elm-charts__container-inner')
			]);
		var htmlAttrs = _Utils_ap(
			htmlAttrsDefault,
			_Utils_ap(htmlAttrsSize, config.htmlAttrs));
		var chartPosition = _List_fromArray(
			[
				$elm$svg$Svg$Attributes$x(
				$elm$core$String$fromFloat(plane.x.marginMin)),
				$elm$svg$Svg$Attributes$y(
				$elm$core$String$fromFloat(plane.y.marginMin)),
				$elm$svg$Svg$Attributes$width(
				$elm$core$String$fromFloat(
					$terezka$elm_charts$Internal$Coordinates$innerWidth(plane))),
				$elm$svg$Svg$Attributes$height(
				$elm$core$String$fromFloat(
					$terezka$elm_charts$Internal$Coordinates$innerHeight(plane))),
				$elm$svg$Svg$Attributes$fill('transparent')
			]);
		var clipPathDefs = A2(
			$elm$svg$Svg$defs,
			_List_Nil,
			_List_fromArray(
				[
					A2(
					$elm$svg$Svg$clipPath,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$id(
							$terezka$elm_charts$Internal$Coordinates$toId(plane))
						]),
					_List_fromArray(
						[
							A2($elm$svg$Svg$rect, chartPosition, _List_Nil)
						]))
				]));
		var catcher = A2(
			$elm$svg$Svg$rect,
			_Utils_ap(
				chartPosition,
				A2($elm$core$List$map, toEvent, config.events)),
			_List_Nil);
		var chart = A2(
			$elm$svg$Svg$svg,
			_Utils_ap(svgAttrsSize, config.attrs),
			_Utils_ap(
				_List_fromArray(
					[clipPathDefs]),
				_Utils_ap(
					chartEls,
					_List_fromArray(
						[catcher]))));
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('elm-charts__container'),
					A2($elm$html$Html$Attributes$style, 'position', 'relative')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					htmlAttrs,
					_Utils_ap(
						below,
						_Utils_ap(
							_List_fromArray(
								[chart]),
							above)))
				]));
	});
var $terezka$elm_charts$Internal$Coordinates$Position = F4(
	function (x1, x2, y1, y2) {
		return {x1: x1, x2: x2, y1: y1, y2: y2};
	});
var $elm$core$Basics$min = F2(
	function (x, y) {
		return (_Utils_cmp(x, y) < 0) ? x : y;
	});
var $terezka$elm_charts$Internal$Coordinates$foldPosition = F2(
	function (func, data) {
		var fold = F2(
			function (datum, posM) {
				if (posM.$ === 'Just') {
					var pos = posM.a;
					return $elm$core$Maybe$Just(
						{
							x1: A2(
								$elm$core$Basics$min,
								func(datum).x1,
								pos.x1),
							x2: A2(
								$elm$core$Basics$max,
								func(datum).x2,
								pos.x2),
							y1: A2(
								$elm$core$Basics$min,
								func(datum).y1,
								pos.y1),
							y2: A2(
								$elm$core$Basics$max,
								func(datum).y2,
								pos.y2)
						});
				} else {
					return $elm$core$Maybe$Just(
						func(datum));
				}
			});
		return A2(
			$elm$core$Maybe$withDefault,
			A4($terezka$elm_charts$Internal$Coordinates$Position, 0, 0, 0, 0),
			A3($elm$core$List$foldl, fold, $elm$core$Maybe$Nothing, data));
	});
var $terezka$elm_charts$Chart$Attributes$lowest = F2(
	function (v, edit) {
		return $terezka$elm_charts$Internal$Helpers$Attribute(
			function (b) {
				return _Utils_update(
					b,
					{
						min: A3(edit, v, b.min, b.dataMin)
					});
			});
	});
var $terezka$elm_charts$Chart$Attributes$orLower = F3(
	function (least, real, _v0) {
		return (_Utils_cmp(real, least) > 0) ? least : real;
	});
var $terezka$elm_charts$Chart$definePlane = F2(
	function (config, elements) {
		var width = A2($elm$core$Basics$max, 1, (config.width - config.padding.left) - config.padding.right);
		var toLimit = F5(
			function (length, marginMin, marginMax, min, max) {
				return {dataMax: max, dataMin: min, flip: false, length: length, marginMax: marginMax, marginMin: marginMin, max: max, min: min};
			});
		var height = A2($elm$core$Basics$max, 1, (config.height - config.padding.bottom) - config.padding.top);
		var fixSingles = function (bs) {
			return _Utils_eq(bs.min, bs.max) ? _Utils_update(
				bs,
				{max: bs.min + 10}) : bs;
		};
		var collectLimits = F2(
			function (el, acc) {
				switch (el.$) {
					case 'Indexed':
						return acc;
					case 'SeriesElement':
						var lims = el.a;
						return _Utils_ap(
							acc,
							_List_fromArray(
								[lims]));
					case 'BarsElement':
						var lims = el.a;
						return _Utils_ap(
							acc,
							_List_fromArray(
								[lims]));
					case 'CustomElement':
						var lims = el.a;
						return _Utils_ap(
							acc,
							_List_fromArray(
								[lims]));
					case 'AxisElement':
						return acc;
					case 'TicksElement':
						return acc;
					case 'TickElement':
						return acc;
					case 'LabelsElement':
						return acc;
					case 'LabelElement':
						return acc;
					case 'GridElement':
						return acc;
					case 'SubElements':
						return acc;
					case 'ListOfElements':
						var subs = el.a;
						return A3($elm$core$List$foldl, collectLimits, acc, subs);
					case 'ScaleElement':
						return acc;
					case 'SvgElement':
						return acc;
					default:
						return acc;
				}
			});
		var limits_ = function (pos) {
			return function (_v5) {
				var x = _v5.x;
				var y = _v5.y;
				return {
					x: fixSingles(x),
					y: fixSingles(y)
				};
			}(
				{
					x: A5(toLimit, width, config.margin.left, config.margin.right, pos.x1, pos.x2),
					y: A5(toLimit, height, config.margin.top, config.margin.bottom, pos.y1, pos.y2)
				});
		}(
			A2(
				$terezka$elm_charts$Internal$Coordinates$foldPosition,
				$elm$core$Basics$identity,
				A3($elm$core$List$foldl, collectLimits, _List_Nil, elements)));
		var calcRange = function () {
			var _v4 = config.range;
			if (!_v4.b) {
				return limits_.x;
			} else {
				var some = _v4;
				return A2($terezka$elm_charts$Internal$Helpers$apply, some, limits_.x);
			}
		}();
		var calcDomain = function () {
			var _v3 = config.domain;
			if (!_v3.b) {
				return A2(
					$terezka$elm_charts$Internal$Helpers$apply,
					_List_fromArray(
						[
							A2($terezka$elm_charts$Chart$Attributes$lowest, 0, $terezka$elm_charts$Chart$Attributes$orLower)
						]),
					limits_.y);
			} else {
				var some = _v3;
				return A2($terezka$elm_charts$Internal$Helpers$apply, some, limits_.y);
			}
		}();
		var unpadded = {x: calcRange, y: calcDomain};
		var scalePadX = $terezka$elm_charts$Internal$Coordinates$scaleCartesianX(unpadded);
		var xMax = calcRange.max + scalePadX(
			calcRange.flip ? config.padding.left : config.padding.right);
		var xMin = calcRange.min - scalePadX(
			calcRange.flip ? config.padding.right : config.padding.left);
		var scalePadY = $terezka$elm_charts$Internal$Coordinates$scaleCartesianY(unpadded);
		var yMax = calcDomain.max + scalePadY(
			calcDomain.flip ? config.padding.bottom : config.padding.top);
		var yMin = calcDomain.min - scalePadY(
			calcDomain.flip ? config.padding.top : config.padding.bottom);
		var _v1 = function () {
			var _v2 = config.viewport;
			if (_v2.$ === 'Just') {
				var vp = _v2.a;
				return _Utils_Tuple2(vp.width / config.width, vp.height / config.height);
			} else {
				return _Utils_Tuple2(1, 1);
			}
		}();
		var ratioX = _v1.a;
		var ratioY = _v1.b;
		return {
			x: _Utils_update(
				calcRange,
				{
					length: config.width * ratioX,
					max: A2($elm$core$Basics$max, xMin, xMax),
					min: A2($elm$core$Basics$min, xMin, xMax)
				}),
			y: _Utils_update(
				calcDomain,
				{
					length: config.height * ratioY,
					max: A2($elm$core$Basics$max, yMin, yMax),
					min: A2($elm$core$Basics$min, yMin, yMax)
				})
		};
	});
var $terezka$elm_charts$Chart$getItems = F3(
	function (topLevel, plane, elements) {
		var toItems = F2(
			function (el, acc) {
				switch (el.$) {
					case 'Indexed':
						return acc;
					case 'SeriesElement':
						var item = el.b;
						return _Utils_ap(
							acc,
							A2(item, topLevel, plane));
					case 'BarsElement':
						var item = el.b;
						return _Utils_ap(
							acc,
							A2(item, topLevel, plane));
					case 'CustomElement':
						var item = el.b;
						return _Utils_ap(
							acc,
							_List_fromArray(
								[
									A2(item, topLevel, plane)
								]));
					case 'AxisElement':
						var func = el.a;
						return acc;
					case 'TicksElement':
						return acc;
					case 'TickElement':
						return acc;
					case 'LabelsElement':
						return acc;
					case 'LabelElement':
						return acc;
					case 'GridElement':
						return acc;
					case 'SubElements':
						return acc;
					case 'ListOfElements':
						var subs = el.a;
						return A3($elm$core$List$foldl, toItems, acc, subs);
					case 'ScaleElement':
						var items = el.b;
						return _Utils_ap(
							acc,
							items(topLevel));
					case 'SvgElement':
						return acc;
					default:
						return acc;
				}
			});
		return A3($elm$core$List$foldl, toItems, _List_Nil, elements);
	});
var $terezka$elm_charts$Chart$getLegends = function (elements) {
	var toLegends = F2(
		function (el, acc) {
			switch (el.$) {
				case 'Indexed':
					return acc;
				case 'SeriesElement':
					var legends = el.c;
					return _Utils_ap(acc, legends);
				case 'BarsElement':
					var legends = el.c;
					return _Utils_ap(acc, legends);
				case 'CustomElement':
					return acc;
				case 'AxisElement':
					return acc;
				case 'TicksElement':
					return acc;
				case 'TickElement':
					return acc;
				case 'LabelsElement':
					return acc;
				case 'LabelElement':
					return acc;
				case 'GridElement':
					return acc;
				case 'SubElements':
					return acc;
				case 'ListOfElements':
					var subs = el.a;
					return A3($elm$core$List$foldl, toLegends, acc, subs);
				case 'ScaleElement':
					var legends = el.c;
					return _Utils_ap(acc, legends);
				case 'SvgElement':
					return acc;
				default:
					return acc;
			}
		});
	return A3($elm$core$List$foldl, toLegends, _List_Nil, elements);
};
var $terezka$elm_charts$Chart$TickValues = F4(
	function (xAxis, yAxis, xs, ys) {
		return {xAxis: xAxis, xs: xs, yAxis: yAxis, ys: ys};
	});
var $terezka$elm_charts$Chart$getTickValues = F3(
	function (plane, items, elements) {
		var toValues = F2(
			function (el, acc) {
				switch (el.$) {
					case 'Indexed':
						return acc;
					case 'SeriesElement':
						return acc;
					case 'BarsElement':
						var func = el.d;
						return A2(func, plane, acc);
					case 'CustomElement':
						return acc;
					case 'AxisElement':
						var func = el.a;
						return A2(func, plane, acc);
					case 'TicksElement':
						var func = el.a;
						return A2(func, plane, acc);
					case 'TickElement':
						var toC = el.a;
						var func = el.b;
						return A3(
							func,
							plane,
							toC(plane),
							acc);
					case 'LabelsElement':
						var toC = el.a;
						var func = el.b;
						return A3(
							func,
							plane,
							toC(plane),
							acc);
					case 'LabelElement':
						var toC = el.a;
						var func = el.b;
						return A3(
							func,
							plane,
							toC(plane),
							acc);
					case 'SubElements':
						var func = el.a;
						return A3(
							$elm$core$List$foldl,
							toValues,
							acc,
							A2(func, plane, items));
					case 'GridElement':
						return acc;
					case 'ListOfElements':
						var subs = el.a;
						return A3($elm$core$List$foldl, toValues, acc, subs);
					case 'ScaleElement':
						return acc;
					case 'SvgElement':
						return acc;
					default:
						return acc;
				}
			});
		return A3(
			$elm$core$List$foldl,
			toValues,
			A4($terezka$elm_charts$Chart$TickValues, _List_Nil, _List_Nil, _List_Nil, _List_Nil),
			elements);
	});
var $elm$svg$Svg$Attributes$style = _VirtualDom_attribute('style');
var $terezka$elm_charts$Chart$viewElements = F6(
	function (topLevel, plane, tickValues, allItems, allLegends, elements) {
		var viewOne = F2(
			function (el, _v0) {
				var before = _v0.a;
				var chart_ = _v0.b;
				var after = _v0.c;
				switch (el.$) {
					case 'Indexed':
						return _Utils_Tuple3(before, chart_, after);
					case 'SeriesElement':
						var view = el.d;
						return _Utils_Tuple3(
							before,
							A2(
								$elm$core$List$cons,
								A2(view, topLevel, plane),
								chart_),
							after);
					case 'BarsElement':
						var view = el.e;
						return _Utils_Tuple3(
							before,
							A2(
								$elm$core$List$cons,
								A2(view, topLevel, plane),
								chart_),
							after);
					case 'CustomElement':
						var view = el.c;
						return _Utils_Tuple3(
							before,
							A2(
								$elm$core$List$cons,
								A2(view, topLevel, plane),
								chart_),
							after);
					case 'AxisElement':
						var view = el.b;
						return _Utils_Tuple3(
							before,
							A2(
								$elm$core$List$cons,
								view(plane),
								chart_),
							after);
					case 'TicksElement':
						var view = el.b;
						return _Utils_Tuple3(
							before,
							A2(
								$elm$core$List$cons,
								view(plane),
								chart_),
							after);
					case 'TickElement':
						var toC = el.a;
						var view = el.c;
						return _Utils_Tuple3(
							before,
							A2(
								$elm$core$List$cons,
								A2(
									view,
									plane,
									toC(plane)),
								chart_),
							after);
					case 'LabelsElement':
						var toC = el.a;
						var view = el.c;
						return _Utils_Tuple3(
							before,
							A2(
								$elm$core$List$cons,
								A2(
									view,
									plane,
									toC(plane)),
								chart_),
							after);
					case 'LabelElement':
						var toC = el.a;
						var view = el.c;
						return _Utils_Tuple3(
							before,
							A2(
								$elm$core$List$cons,
								A2(
									view,
									plane,
									toC(plane)),
								chart_),
							after);
					case 'GridElement':
						var view = el.a;
						return _Utils_Tuple3(
							before,
							A2(
								$elm$core$List$cons,
								A2(view, plane, tickValues),
								chart_),
							after);
					case 'SubElements':
						var func = el.a;
						return A3(
							$elm$core$List$foldr,
							viewOne,
							_Utils_Tuple3(before, chart_, after),
							A2(func, plane, allItems));
					case 'ListOfElements':
						var els = el.a;
						return A3(
							$elm$core$List$foldr,
							viewOne,
							_Utils_Tuple3(before, chart_, after),
							els);
					case 'ScaleElement':
						var view = el.d;
						return function (_v2) {
							var b = _v2.a;
							var c = _v2.b;
							var e = _v2.c;
							return _Utils_Tuple3(
								_Utils_ap(b, before),
								_Utils_ap(c, chart_),
								_Utils_ap(e, after));
						}(
							view(topLevel));
					case 'SvgElement':
						var view = el.a;
						return _Utils_Tuple3(
							before,
							A2(
								$elm$core$List$cons,
								view(plane),
								chart_),
							after);
					default:
						var view = el.a;
						return _Utils_Tuple3(
							($elm$core$List$length(chart_) > 0) ? A2(
								$elm$core$List$cons,
								A2(view, plane, allLegends),
								before) : before,
							chart_,
							($elm$core$List$length(chart_) > 0) ? after : A2(
								$elm$core$List$cons,
								A2(view, plane, allLegends),
								after));
				}
			});
		return A3(
			$elm$core$List$foldr,
			viewOne,
			_Utils_Tuple3(_List_Nil, _List_Nil, _List_Nil),
			elements);
	});
var $terezka$elm_charts$Chart$chartAndPlane = F2(
	function (edits, unindexedElements) {
		var config = A2(
			$terezka$elm_charts$Internal$Helpers$apply,
			edits,
			{
				attrs: _List_fromArray(
					[
						$elm$svg$Svg$Attributes$style('overflow: visible;')
					]),
				domain: _List_Nil,
				events: _List_Nil,
				height: 300,
				htmlAttrs: _List_Nil,
				margin: {bottom: 0, left: 0, right: 0, top: 0},
				padding: {bottom: 0, left: 0, right: 0, top: 0},
				range: _List_Nil,
				viewport: $elm$core$Maybe$Nothing,
				width: 300
			});
		var planeConfig = {domain: config.domain, height: config.height, margin: config.margin, padding: config.padding, range: config.range, viewport: config.viewport, width: config.width};
		var _v0 = A3($terezka$elm_charts$Chart$addIndexes, planeConfig, 0, unindexedElements);
		var indexedElements = _v0.a;
		var elements = $terezka$elm_charts$Chart$addGridIfNone(indexedElements);
		var legends = $terezka$elm_charts$Chart$getLegends(elements);
		var plane = A2($terezka$elm_charts$Chart$definePlane, planeConfig, elements);
		var items = A3($terezka$elm_charts$Chart$getItems, plane, plane, elements);
		var toEvent = function (_v3) {
			var event_ = _v3.a;
			var _v2 = event_.decoder;
			var decoder = _v2.a;
			return A2(
				$terezka$elm_charts$Internal$Svg$Event,
				event_.name,
				decoder(items));
		};
		var tickValues = A3($terezka$elm_charts$Chart$getTickValues, plane, items, elements);
		var _v1 = A6($terezka$elm_charts$Chart$viewElements, plane, plane, tickValues, items, legends, elements);
		var beforeEls = _v1.a;
		var chartEls = _v1.b;
		var afterEls = _v1.c;
		return _Utils_Tuple2(
			A5(
				$terezka$elm_charts$Internal$Svg$container,
				plane,
				{
					attrs: config.attrs,
					events: A2($elm$core$List$map, toEvent, config.events),
					htmlAttrs: config.htmlAttrs,
					viewport: config.viewport
				},
				beforeEls,
				chartEls,
				afterEls),
			plane);
	});
var $terezka$elm_charts$Chart$chart = F2(
	function (edits, unindexedElements) {
		return A2($terezka$elm_charts$Chart$chartAndPlane, edits, unindexedElements).a;
	});
var $terezka$elm_charts$Internal$Svg$Column = {$: 'Column'};
var $terezka$elm_charts$Chart$Attributes$column = $terezka$elm_charts$Internal$Helpers$Attribute(
	function (config) {
		return _Utils_update(
			config,
			{alignment: $terezka$elm_charts$Internal$Svg$Column});
	});
var $terezka$elm_charts$Chart$Attributes$exactly = F3(
	function (exact, _v0, _v1) {
		return exact;
	});
var $justinmimbs$date$Date$Day = {$: 'Day'};
var $justinmimbs$date$Date$Friday = {$: 'Friday'};
var $justinmimbs$date$Date$Monday = {$: 'Monday'};
var $justinmimbs$date$Date$Month = {$: 'Month'};
var $justinmimbs$date$Date$Quarter = {$: 'Quarter'};
var $justinmimbs$date$Date$Saturday = {$: 'Saturday'};
var $justinmimbs$date$Date$Sunday = {$: 'Sunday'};
var $justinmimbs$date$Date$Thursday = {$: 'Thursday'};
var $justinmimbs$date$Date$Tuesday = {$: 'Tuesday'};
var $justinmimbs$date$Date$Wednesday = {$: 'Wednesday'};
var $justinmimbs$date$Date$Week = {$: 'Week'};
var $justinmimbs$date$Date$Year = {$: 'Year'};
var $justinmimbs$date$Date$weekdayNumber = function (_v0) {
	var rd = _v0.a;
	var _v1 = A2($elm$core$Basics$modBy, 7, rd);
	if (!_v1) {
		return 7;
	} else {
		var n = _v1;
		return n;
	}
};
var $justinmimbs$date$Date$weekdayToNumber = function (wd) {
	switch (wd.$) {
		case 'Mon':
			return 1;
		case 'Tue':
			return 2;
		case 'Wed':
			return 3;
		case 'Thu':
			return 4;
		case 'Fri':
			return 5;
		case 'Sat':
			return 6;
		default:
			return 7;
	}
};
var $justinmimbs$date$Date$daysSincePreviousWeekday = F2(
	function (wd, date) {
		return A2(
			$elm$core$Basics$modBy,
			7,
			($justinmimbs$date$Date$weekdayNumber(date) + 7) - $justinmimbs$date$Date$weekdayToNumber(wd));
	});
var $justinmimbs$date$Date$firstOfMonth = F2(
	function (y, m) {
		return $justinmimbs$date$Date$RD(
			($justinmimbs$date$Date$daysBeforeYear(y) + A2($justinmimbs$date$Date$daysBeforeMonth, y, m)) + 1);
	});
var $justinmimbs$date$Date$firstOfYear = function (y) {
	return $justinmimbs$date$Date$RD(
		$justinmimbs$date$Date$daysBeforeYear(y) + 1);
};
var $justinmimbs$date$Date$monthToQuarter = function (m) {
	return (($justinmimbs$date$Date$monthToNumber(m) + 2) / 3) | 0;
};
var $justinmimbs$date$Date$quarter = A2($elm$core$Basics$composeR, $justinmimbs$date$Date$month, $justinmimbs$date$Date$monthToQuarter);
var $justinmimbs$date$Date$quarterToMonth = function (q) {
	return $justinmimbs$date$Date$numberToMonth((q * 3) - 2);
};
var $justinmimbs$date$Date$floor = F2(
	function (interval, date) {
		var rd = date.a;
		switch (interval.$) {
			case 'Year':
				return $justinmimbs$date$Date$firstOfYear(
					$justinmimbs$date$Date$year(date));
			case 'Quarter':
				return A2(
					$justinmimbs$date$Date$firstOfMonth,
					$justinmimbs$date$Date$year(date),
					$justinmimbs$date$Date$quarterToMonth(
						$justinmimbs$date$Date$quarter(date)));
			case 'Month':
				return A2(
					$justinmimbs$date$Date$firstOfMonth,
					$justinmimbs$date$Date$year(date),
					$justinmimbs$date$Date$month(date));
			case 'Week':
				return $justinmimbs$date$Date$RD(
					rd - A2($justinmimbs$date$Date$daysSincePreviousWeekday, $elm$time$Time$Mon, date));
			case 'Monday':
				return $justinmimbs$date$Date$RD(
					rd - A2($justinmimbs$date$Date$daysSincePreviousWeekday, $elm$time$Time$Mon, date));
			case 'Tuesday':
				return $justinmimbs$date$Date$RD(
					rd - A2($justinmimbs$date$Date$daysSincePreviousWeekday, $elm$time$Time$Tue, date));
			case 'Wednesday':
				return $justinmimbs$date$Date$RD(
					rd - A2($justinmimbs$date$Date$daysSincePreviousWeekday, $elm$time$Time$Wed, date));
			case 'Thursday':
				return $justinmimbs$date$Date$RD(
					rd - A2($justinmimbs$date$Date$daysSincePreviousWeekday, $elm$time$Time$Thu, date));
			case 'Friday':
				return $justinmimbs$date$Date$RD(
					rd - A2($justinmimbs$date$Date$daysSincePreviousWeekday, $elm$time$Time$Fri, date));
			case 'Saturday':
				return $justinmimbs$date$Date$RD(
					rd - A2($justinmimbs$date$Date$daysSincePreviousWeekday, $elm$time$Time$Sat, date));
			case 'Sunday':
				return $justinmimbs$date$Date$RD(
					rd - A2($justinmimbs$date$Date$daysSincePreviousWeekday, $elm$time$Time$Sun, date));
			default:
				return date;
		}
	});
var $justinmimbs$time_extra$Time$Extra$floorDate = F3(
	function (dateInterval, zone, posix) {
		return A3(
			$justinmimbs$time_extra$Time$Extra$posixFromDateTime,
			zone,
			A2(
				$justinmimbs$date$Date$floor,
				dateInterval,
				A2($justinmimbs$date$Date$fromPosix, zone, posix)),
			0);
	});
var $justinmimbs$time_extra$Time$Extra$floor = F3(
	function (interval, zone, posix) {
		switch (interval.$) {
			case 'Millisecond':
				return posix;
			case 'Second':
				return A3(
					$justinmimbs$time_extra$Time$Extra$posixFromDateTime,
					zone,
					A2($justinmimbs$date$Date$fromPosix, zone, posix),
					A4(
						$justinmimbs$time_extra$Time$Extra$timeFromClock,
						A2($elm$time$Time$toHour, zone, posix),
						A2($elm$time$Time$toMinute, zone, posix),
						A2($elm$time$Time$toSecond, zone, posix),
						0));
			case 'Minute':
				return A3(
					$justinmimbs$time_extra$Time$Extra$posixFromDateTime,
					zone,
					A2($justinmimbs$date$Date$fromPosix, zone, posix),
					A4(
						$justinmimbs$time_extra$Time$Extra$timeFromClock,
						A2($elm$time$Time$toHour, zone, posix),
						A2($elm$time$Time$toMinute, zone, posix),
						0,
						0));
			case 'Hour':
				return A3(
					$justinmimbs$time_extra$Time$Extra$posixFromDateTime,
					zone,
					A2($justinmimbs$date$Date$fromPosix, zone, posix),
					A4(
						$justinmimbs$time_extra$Time$Extra$timeFromClock,
						A2($elm$time$Time$toHour, zone, posix),
						0,
						0,
						0));
			case 'Day':
				return A3($justinmimbs$time_extra$Time$Extra$floorDate, $justinmimbs$date$Date$Day, zone, posix);
			case 'Month':
				return A3($justinmimbs$time_extra$Time$Extra$floorDate, $justinmimbs$date$Date$Month, zone, posix);
			case 'Year':
				return A3($justinmimbs$time_extra$Time$Extra$floorDate, $justinmimbs$date$Date$Year, zone, posix);
			case 'Quarter':
				return A3($justinmimbs$time_extra$Time$Extra$floorDate, $justinmimbs$date$Date$Quarter, zone, posix);
			case 'Week':
				return A3($justinmimbs$time_extra$Time$Extra$floorDate, $justinmimbs$date$Date$Week, zone, posix);
			case 'Monday':
				return A3($justinmimbs$time_extra$Time$Extra$floorDate, $justinmimbs$date$Date$Monday, zone, posix);
			case 'Tuesday':
				return A3($justinmimbs$time_extra$Time$Extra$floorDate, $justinmimbs$date$Date$Tuesday, zone, posix);
			case 'Wednesday':
				return A3($justinmimbs$time_extra$Time$Extra$floorDate, $justinmimbs$date$Date$Wednesday, zone, posix);
			case 'Thursday':
				return A3($justinmimbs$time_extra$Time$Extra$floorDate, $justinmimbs$date$Date$Thursday, zone, posix);
			case 'Friday':
				return A3($justinmimbs$time_extra$Time$Extra$floorDate, $justinmimbs$date$Date$Friday, zone, posix);
			case 'Saturday':
				return A3($justinmimbs$time_extra$Time$Extra$floorDate, $justinmimbs$date$Date$Saturday, zone, posix);
			default:
				return A3($justinmimbs$time_extra$Time$Extra$floorDate, $justinmimbs$date$Date$Sunday, zone, posix);
		}
	});
var $terezka$elm_charts$Chart$Attributes$fontSize = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{
					fontSize: $elm$core$Maybe$Just(v)
				});
		});
};
var $terezka$elm_charts$Chart$Attributes$height = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{height: v});
		});
};
var $terezka$elm_charts$Chart$Attributes$highest = F2(
	function (v, edit) {
		return $terezka$elm_charts$Internal$Helpers$Attribute(
			function (b) {
				return _Utils_update(
					b,
					{
						max: A3(edit, v, b.max, b.dataMax)
					});
			});
	});
var $terezka$elm_charts$Internal$Svg$Linear = {$: 'Linear'};
var $terezka$elm_charts$Chart$Attributes$linear = $terezka$elm_charts$Internal$Helpers$Attribute(
	function (config) {
		return _Utils_update(
			config,
			{
				method: $elm$core$Maybe$Just($terezka$elm_charts$Internal$Svg$Linear)
			});
	});
var $terezka$elm_charts$Internal$Property$NotStacked = function (a) {
	return {$: 'NotStacked', a: a};
};
var $terezka$elm_charts$Internal$Property$notStacked = F3(
	function (toY, interpolation, presentation) {
		return $terezka$elm_charts$Internal$Property$NotStacked(
			{
				interpolation: interpolation,
				presentation: presentation,
				toY: toY,
				toYSum: toY,
				tooltipName: $elm$core$Maybe$Nothing,
				tooltipText: function (datum) {
					return A2(
						$elm$core$Maybe$withDefault,
						'N/A',
						A2(
							$elm$core$Maybe$map,
							$elm$core$String$fromFloat,
							toY(datum)));
				},
				variation: F2(
					function (_v0, _v1) {
						return _List_Nil;
					})
			});
	});
var $terezka$elm_charts$Chart$interpolated = F2(
	function (y, inter) {
		return A2(
			$terezka$elm_charts$Internal$Property$notStacked,
			A2($elm$core$Basics$composeR, y, $elm$core$Maybe$Just),
			_Utils_ap(
				_List_fromArray(
					[$terezka$elm_charts$Chart$Attributes$linear]),
				inter));
	});
var $terezka$elm_charts$Internal$Svg$Ints = {$: 'Ints'};
var $terezka$elm_charts$Chart$Attributes$ints = $terezka$elm_charts$Internal$Helpers$Attribute(
	function (config) {
		return _Utils_update(
			config,
			{generate: $terezka$elm_charts$Internal$Svg$Ints});
	});
var $terezka$elm_charts$Chart$HtmlElement = function (a) {
	return {$: 'HtmlElement', a: a};
};
var $terezka$elm_charts$Internal$Coordinates$Axis = F8(
	function (length, marginMin, marginMax, dataMin, dataMax, min, max, flip) {
		return {dataMax: dataMax, dataMin: dataMin, flip: flip, length: length, marginMax: marginMax, marginMin: marginMin, max: max, min: min};
	});
var $elm$core$Basics$abs = function (n) {
	return (n < 0) ? (-n) : n;
};
var $elm$svg$Svg$line = $elm$svg$Svg$trustedNode('line');
var $elm$svg$Svg$linearGradient = $elm$svg$Svg$trustedNode('linearGradient');
var $elm$svg$Svg$Attributes$offset = _VirtualDom_attribute('offset');
var $elm$svg$Svg$pattern = $elm$svg$Svg$trustedNode('pattern');
var $elm$svg$Svg$Attributes$patternTransform = _VirtualDom_attribute('patternTransform');
var $elm$svg$Svg$Attributes$patternUnits = _VirtualDom_attribute('patternUnits');
var $elm$svg$Svg$stop = $elm$svg$Svg$trustedNode('stop');
var $elm$svg$Svg$Attributes$stopColor = _VirtualDom_attribute('stop-color');
var $elm$svg$Svg$Attributes$x1 = _VirtualDom_attribute('x1');
var $elm$svg$Svg$Attributes$x2 = _VirtualDom_attribute('x2');
var $elm$svg$Svg$Attributes$y1 = _VirtualDom_attribute('y1');
var $elm$svg$Svg$Attributes$y2 = _VirtualDom_attribute('y2');
var $terezka$elm_charts$Internal$Svg$toPattern = F2(
	function (defaultColor, design) {
		var toPatternId = function (props) {
			return A3(
				$elm$core$String$replace,
				'(',
				'-',
				A3(
					$elm$core$String$replace,
					')',
					'-',
					A3(
						$elm$core$String$replace,
						'.',
						'-',
						A3(
							$elm$core$String$replace,
							',',
							'-',
							A3(
								$elm$core$String$replace,
								' ',
								'-',
								A2(
									$elm$core$String$join,
									'-',
									_Utils_ap(
										_List_fromArray(
											[
												'elm-charts__pattern',
												function () {
												switch (design.$) {
													case 'Striped':
														return 'striped';
													case 'Dotted':
														return 'dotted';
													default:
														return 'gradient';
												}
											}()
											]),
										props)))))));
		};
		var toPatternDefs = F4(
			function (id, spacing, rotate, inside) {
				return A2(
					$elm$svg$Svg$defs,
					_List_Nil,
					_List_fromArray(
						[
							A2(
							$elm$svg$Svg$pattern,
							_List_fromArray(
								[
									$elm$svg$Svg$Attributes$id(id),
									$elm$svg$Svg$Attributes$patternUnits('userSpaceOnUse'),
									$elm$svg$Svg$Attributes$width(
									$elm$core$String$fromFloat(spacing)),
									$elm$svg$Svg$Attributes$height(
									$elm$core$String$fromFloat(spacing)),
									$elm$svg$Svg$Attributes$patternTransform(
									'rotate(' + ($elm$core$String$fromFloat(rotate) + ')'))
								]),
							_List_fromArray(
								[inside]))
						]));
			});
		var _v0 = function () {
			switch (design.$) {
				case 'Striped':
					var edits = design.a;
					var config = A2(
						$terezka$elm_charts$Internal$Helpers$apply,
						edits,
						{color: defaultColor, rotate: 45, spacing: 4, width: 3});
					var theId = toPatternId(
						_List_fromArray(
							[
								config.color,
								$elm$core$String$fromFloat(config.width),
								$elm$core$String$fromFloat(config.spacing),
								$elm$core$String$fromFloat(config.rotate)
							]));
					return _Utils_Tuple2(
						A4(
							toPatternDefs,
							theId,
							config.spacing,
							config.rotate,
							A2(
								$elm$svg$Svg$line,
								_List_fromArray(
									[
										$elm$svg$Svg$Attributes$x1('0'),
										$elm$svg$Svg$Attributes$y('0'),
										$elm$svg$Svg$Attributes$x2('0'),
										$elm$svg$Svg$Attributes$y2(
										$elm$core$String$fromFloat(config.spacing)),
										$elm$svg$Svg$Attributes$stroke(config.color),
										$elm$svg$Svg$Attributes$strokeWidth(
										$elm$core$String$fromFloat(config.width))
									]),
								_List_Nil)),
						theId);
				case 'Dotted':
					var edits = design.a;
					var config = A2(
						$terezka$elm_charts$Internal$Helpers$apply,
						edits,
						{color: defaultColor, rotate: 45, spacing: 4, width: 3});
					var theId = toPatternId(
						_List_fromArray(
							[
								config.color,
								$elm$core$String$fromFloat(config.width),
								$elm$core$String$fromFloat(config.spacing),
								$elm$core$String$fromFloat(config.rotate)
							]));
					return _Utils_Tuple2(
						A4(
							toPatternDefs,
							theId,
							config.spacing,
							config.rotate,
							A2(
								$elm$svg$Svg$circle,
								_List_fromArray(
									[
										$elm$svg$Svg$Attributes$fill(config.color),
										$elm$svg$Svg$Attributes$cx(
										$elm$core$String$fromFloat(config.width / 3)),
										$elm$svg$Svg$Attributes$cy(
										$elm$core$String$fromFloat(config.width / 3)),
										$elm$svg$Svg$Attributes$r(
										$elm$core$String$fromFloat(config.width / 3))
									]),
								_List_Nil)),
						theId);
				default:
					var edits = design.a;
					var colors = _Utils_eq(edits, _List_Nil) ? _List_fromArray(
						[defaultColor, 'white']) : edits;
					var theId = toPatternId(colors);
					var totalColors = $elm$core$List$length(colors);
					var toPercentage = function (i) {
						return (i * 100) / (totalColors - 1);
					};
					var toStop = F2(
						function (i, c) {
							return A2(
								$elm$svg$Svg$stop,
								_List_fromArray(
									[
										$elm$svg$Svg$Attributes$offset(
										$elm$core$String$fromFloat(
											toPercentage(i)) + '%'),
										$elm$svg$Svg$Attributes$stopColor(c)
									]),
								_List_Nil);
						});
					return _Utils_Tuple2(
						A2(
							$elm$svg$Svg$defs,
							_List_Nil,
							_List_fromArray(
								[
									A2(
									$elm$svg$Svg$linearGradient,
									_List_fromArray(
										[
											$elm$svg$Svg$Attributes$id(theId),
											$elm$svg$Svg$Attributes$x1('0'),
											$elm$svg$Svg$Attributes$x2('0'),
											$elm$svg$Svg$Attributes$y1('0'),
											$elm$svg$Svg$Attributes$y2('1')
										]),
									A2($elm$core$List$indexedMap, toStop, colors))
								])),
						theId);
			}
		}();
		var patternDefs = _v0.a;
		var patternId = _v0.b;
		return _Utils_Tuple2(patternDefs, 'url(#' + (patternId + ')'));
	});
var $terezka$elm_charts$Internal$Svg$bar = F3(
	function (plane, config, point) {
		var viewBar = F6(
			function (fill, fillOpacity, border, borderWidth, strokeOpacity, cmds) {
				return A4(
					$terezka$elm_charts$Internal$Svg$withAttrs,
					config.attrs,
					$elm$svg$Svg$path,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$class('elm-charts__bar'),
							$elm$svg$Svg$Attributes$fill(fill),
							$elm$svg$Svg$Attributes$fillOpacity(
							$elm$core$String$fromFloat(fillOpacity)),
							$elm$svg$Svg$Attributes$stroke(border),
							$elm$svg$Svg$Attributes$strokeWidth(
							$elm$core$String$fromFloat(borderWidth)),
							$elm$svg$Svg$Attributes$strokeOpacity(
							$elm$core$String$fromFloat(strokeOpacity)),
							$elm$svg$Svg$Attributes$d(
							A2($terezka$elm_charts$Internal$Commands$description, plane, cmds)),
							$terezka$elm_charts$Internal$Svg$withinChartArea(plane)
						]),
					_List_Nil);
			});
		var highlightColor = (config.highlightColor === '') ? config.color : config.highlightColor;
		var borderWidthCarY = A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, config.borderWidth / 2);
		var highlightWidthCarY = borderWidthCarY + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, config.highlightWidth / 2);
		var borderWidthCarX = A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, config.borderWidth / 2);
		var highlightWidthCarX = borderWidthCarX + A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, config.highlightWidth / 2);
		var pos = {
			x1: A2($elm$core$Basics$min, point.x1, point.x2) + borderWidthCarX,
			x2: A2($elm$core$Basics$max, point.x1, point.x2) - borderWidthCarX,
			y1: A2($elm$core$Basics$min, point.y1, point.y2) + borderWidthCarY,
			y2: A2($elm$core$Basics$max, point.y1, point.y2) - borderWidthCarY
		};
		var height = $elm$core$Basics$abs(pos.y2 - pos.y1);
		var highlightPos = {x1: pos.x1 - highlightWidthCarX, x2: pos.x2 + highlightWidthCarX, y1: pos.y1 - highlightWidthCarY, y2: pos.y2 + highlightWidthCarY};
		var width = $elm$core$Basics$abs(pos.x2 - pos.x1);
		var roundingBottom = (A2($terezka$elm_charts$Internal$Coordinates$scaleSVGX, plane, width) * 0.5) * A3($elm$core$Basics$clamp, 0, 1, config.roundBottom);
		var radiusBottomX = A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, roundingBottom);
		var radiusBottomY = A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, roundingBottom);
		var roundingTop = (A2($terezka$elm_charts$Internal$Coordinates$scaleSVGX, plane, width) * 0.5) * A3($elm$core$Basics$clamp, 0, 1, config.roundTop);
		var radiusTopX = A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, plane, roundingTop);
		var radiusTopY = A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, plane, roundingTop);
		var _v0 = ((((height - (radiusTopY * 0.8)) - (radiusBottomY * 0.8)) <= 0) || (((width - (radiusTopX * 0.8)) - (radiusBottomX * 0.8)) <= 0)) ? _Utils_Tuple2(0, 0) : _Utils_Tuple2(config.roundTop, config.roundBottom);
		var roundTop = _v0.a;
		var roundBottom = _v0.b;
		var _v1 = function () {
			if (_Utils_eq(pos.y1, pos.y2)) {
				return _Utils_Tuple2(_List_Nil, _List_Nil);
			} else {
				var _v2 = _Utils_Tuple2(roundTop > 0, roundBottom > 0);
				if (!_v2.a) {
					if (!_v2.b) {
						return _Utils_Tuple2(
							_List_fromArray(
								[
									A2($terezka$elm_charts$Internal$Commands$Move, pos.x1, pos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1, pos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1, pos.y1)
								]),
							_List_fromArray(
								[
									A2($terezka$elm_charts$Internal$Commands$Move, highlightPos.x1, pos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x1, highlightPos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x2, highlightPos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x2, pos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1, pos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1, pos.y1)
								]));
					} else {
						return _Utils_Tuple2(
							_List_fromArray(
								[
									A2($terezka$elm_charts$Internal$Commands$Move, pos.x1 + radiusBottomX, pos.y1),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingBottom, roundingBottom, -45, false, true, pos.x1, pos.y1 + radiusBottomY),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1, pos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y1 + radiusBottomY),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingBottom, roundingBottom, -45, false, true, pos.x2 - radiusBottomX, pos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1 + radiusBottomX, pos.y1)
								]),
							_List_fromArray(
								[
									A2($terezka$elm_charts$Internal$Commands$Move, highlightPos.x1 + radiusBottomX, highlightPos.y1),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingBottom, roundingBottom, -45, false, true, highlightPos.x1, highlightPos.y1 + radiusBottomY),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x1, highlightPos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x2, highlightPos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x2, highlightPos.y1 + radiusBottomY),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingBottom, roundingBottom, -45, false, true, highlightPos.x2 - radiusBottomX, highlightPos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x1 + radiusBottomX, highlightPos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2 - radiusBottomX, pos.y1),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingBottom, roundingBottom, -45, false, false, pos.x2, pos.y1 + radiusBottomY),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1, pos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1, pos.y1 + radiusBottomY),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y1)
								]));
					}
				} else {
					if (!_v2.b) {
						return _Utils_Tuple2(
							_List_fromArray(
								[
									A2($terezka$elm_charts$Internal$Commands$Move, pos.x1, pos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1, pos.y2 - radiusTopY),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingTop, roundingTop, -45, false, true, pos.x1 + radiusTopX, pos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2 - radiusTopX, pos.y2),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingTop, roundingTop, -45, false, true, pos.x2, pos.y2 - radiusTopY),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1, pos.y1)
								]),
							_List_fromArray(
								[
									A2($terezka$elm_charts$Internal$Commands$Move, highlightPos.x1, pos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x1, highlightPos.y2 - radiusTopY),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingTop, roundingTop, -45, false, true, highlightPos.x1 + radiusTopX, highlightPos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x2 - radiusTopX, highlightPos.y2),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingTop, roundingTop, -45, false, true, highlightPos.x2, highlightPos.y2 - radiusTopY),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x2, pos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y2 - radiusTopY),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingTop, roundingTop, -45, false, false, pos.x2 - radiusTopX, pos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1 + radiusTopX, pos.y2),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingTop, roundingTop, -45, false, false, pos.x1, pos.y2 - radiusTopY),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1, pos.y1)
								]));
					} else {
						return _Utils_Tuple2(
							_List_fromArray(
								[
									A2($terezka$elm_charts$Internal$Commands$Move, pos.x1 + radiusBottomX, pos.y1),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingBottom, roundingBottom, -45, false, true, pos.x1, pos.y1 + radiusBottomY),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1, pos.y2 - radiusTopY),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingTop, roundingTop, -45, false, true, pos.x1 + radiusTopX, pos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2 - radiusTopX, pos.y2),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingTop, roundingTop, -45, false, true, pos.x2, pos.y2 - radiusTopY),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y1 + radiusBottomY),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingBottom, roundingBottom, -45, false, true, pos.x2 - radiusBottomX, pos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1 + radiusBottomX, pos.y1)
								]),
							_List_fromArray(
								[
									A2($terezka$elm_charts$Internal$Commands$Move, highlightPos.x1 + radiusBottomX, highlightPos.y1),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingBottom, roundingBottom, -45, false, true, highlightPos.x1, highlightPos.y1 + radiusBottomY),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x1, highlightPos.y2 - radiusTopY),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingTop, roundingTop, -45, false, true, highlightPos.x1 + radiusTopX, highlightPos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x2 - radiusTopX, highlightPos.y2),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingTop, roundingTop, -45, false, true, highlightPos.x2, highlightPos.y2 - radiusTopY),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x2, highlightPos.y1 + radiusBottomY),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingBottom, roundingBottom, -45, false, true, highlightPos.x2 - radiusBottomX, highlightPos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, highlightPos.x1 + radiusBottomX, highlightPos.y1),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2 - radiusBottomX, pos.y1),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingBottom, roundingBottom, -45, false, false, pos.x2, pos.y1 + radiusBottomY),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y2 - radiusTopY),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingTop, roundingTop, -45, false, false, pos.x2 - radiusTopX, pos.y2),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1 + radiusTopX, pos.y2),
									A7($terezka$elm_charts$Internal$Commands$Arc, roundingTop, roundingTop, -45, false, false, pos.x1, pos.y2 - radiusTopY),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x1, pos.y1 + radiusBottomY),
									A2($terezka$elm_charts$Internal$Commands$Line, pos.x2, pos.y1)
								]));
					}
				}
			}
		}();
		var commands = _v1.a;
		var highlightCommands = _v1.b;
		var viewAuraBar = function (fill) {
			return (!config.highlight) ? A6(viewBar, fill, config.opacity, config.border, config.borderWidth, 1, commands) : A2(
				$elm$svg$Svg$g,
				_List_fromArray(
					[
						$elm$svg$Svg$Attributes$class('elm-charts__bar-with-highlight')
					]),
				_List_fromArray(
					[
						A6(viewBar, highlightColor, config.highlight, 'transparent', 0, 0, highlightCommands),
						A6(viewBar, fill, config.opacity, config.border, config.borderWidth, 1, commands)
					]));
		};
		var _v3 = config.design;
		if (_v3.$ === 'Nothing') {
			return viewAuraBar(config.color);
		} else {
			var design = _v3.a;
			var _v4 = A2($terezka$elm_charts$Internal$Svg$toPattern, config.color, design);
			var patternDefs = _v4.a;
			var fill = _v4.b;
			return A2(
				$elm$svg$Svg$g,
				_List_fromArray(
					[
						$elm$svg$Svg$Attributes$class('elm-charts__bar-with-pattern')
					]),
				_List_fromArray(
					[
						patternDefs,
						viewAuraBar(fill)
					]));
		}
	});
var $terezka$elm_charts$Internal$Svg$barLegend = F2(
	function (config, barConfig) {
		var fontStyle = function () {
			var _v0 = config.fontSize;
			if (_v0.$ === 'Just') {
				var size_ = _v0.a;
				return A2(
					$elm$html$Html$Attributes$style,
					'font-size',
					$elm$core$String$fromInt(size_) + 'px');
			} else {
				return A2($elm$html$Html$Attributes$style, '', '');
			}
		}();
		var fakePlane = {
			x: A8($terezka$elm_charts$Internal$Coordinates$Axis, config.width, 0, 0, 0, 10, 0, 10, false),
			y: A8($terezka$elm_charts$Internal$Coordinates$Axis, config.height, 0, 0, 0, 10, 0, 10, false)
		};
		return A2(
			$elm$html$Html$div,
			_Utils_ap(
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('elm-charts__legend'),
						A2($elm$html$Html$Attributes$style, 'display', 'flex'),
						A2($elm$html$Html$Attributes$style, 'align-items', 'center')
					]),
				config.htmlAttrs),
			_List_fromArray(
				[
					A2(
					$elm$svg$Svg$svg,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$width(
							$elm$core$String$fromFloat(config.width)),
							$elm$svg$Svg$Attributes$height(
							$elm$core$String$fromFloat(config.height))
						]),
					_List_fromArray(
						[
							A3(
							$terezka$elm_charts$Internal$Svg$bar,
							fakePlane,
							barConfig,
							{x1: 0, x2: 10, y1: 0, y2: 10})
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							fontStyle,
							A2(
							$elm$html$Html$Attributes$style,
							'margin-left',
							$elm$core$String$fromFloat(config.spacing) + 'px'),
							$elm$html$Html$Attributes$class('elm-charts__legend__label')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(config.title)
						]))
				]));
	});
var $terezka$elm_charts$Internal$Svg$defaultBar = {attrs: _List_Nil, border: 'white', borderWidth: 0, color: $terezka$elm_charts$Internal$Helpers$pink, design: $elm$core$Maybe$Nothing, highlight: 0, highlightColor: '', highlightWidth: 10, opacity: 1, roundBottom: 0, roundTop: 0};
var $terezka$elm_charts$Internal$Svg$defaultBarLegend = {color: '#808BAB', fontSize: $elm$core$Maybe$Nothing, height: 10, htmlAttrs: _List_Nil, spacing: 10, title: '', width: 10, xOff: 0, yOff: 0};
var $terezka$elm_charts$Chart$Svg$barLegend = F2(
	function (edits, barAttrs) {
		return A2(
			$terezka$elm_charts$Internal$Svg$barLegend,
			A2($terezka$elm_charts$Internal$Helpers$apply, edits, $terezka$elm_charts$Internal$Svg$defaultBarLegend),
			A2($terezka$elm_charts$Internal$Helpers$apply, barAttrs, $terezka$elm_charts$Internal$Svg$defaultBar));
	});
var $terezka$elm_charts$Internal$Svg$Row = {$: 'Row'};
var $terezka$elm_charts$Internal$Svg$defaultLegends = {alignment: $terezka$elm_charts$Internal$Svg$Row, anchor: $elm$core$Maybe$Nothing, background: '', border: '', borderWidth: 0, htmlAttrs: _List_Nil, spacing: 10, xOff: 0, yOff: 0};
var $elm$virtual_dom$VirtualDom$node = function (tag) {
	return _VirtualDom_node(
		_VirtualDom_noScript(tag));
};
var $elm$html$Html$node = $elm$virtual_dom$VirtualDom$node;
var $terezka$elm_charts$Internal$Svg$positionHtml = F7(
	function (plane, x, y, xOff, yOff, attrs, content) {
		var yPercentage = ((A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, y) - yOff) * 100) / plane.y.length;
		var xPercentage = ((A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, x) + xOff) * 100) / plane.x.length;
		var posititonStyles = _List_fromArray(
			[
				A2(
				$elm$html$Html$Attributes$style,
				'left',
				$elm$core$String$fromFloat(xPercentage) + '%'),
				A2(
				$elm$html$Html$Attributes$style,
				'top',
				$elm$core$String$fromFloat(yPercentage) + '%'),
				A2($elm$html$Html$Attributes$style, 'margin-right', '-400px'),
				A2($elm$html$Html$Attributes$style, 'position', 'absolute')
			]);
		return A2(
			$elm$html$Html$div,
			_Utils_ap(posititonStyles, attrs),
			content);
	});
var $terezka$elm_charts$Internal$Svg$legendsAt = F5(
	function (plane, x, y, config, children) {
		var otherAttrs = _List_fromArray(
			[
				$elm$html$Html$Attributes$class('elm-charts__legends'),
				A2($elm$html$Html$Attributes$style, 'background', config.background),
				A2($elm$html$Html$Attributes$style, 'border-color', config.border),
				A2(
				$elm$html$Html$Attributes$style,
				'border-width',
				$elm$core$String$fromFloat(config.borderWidth) + 'px'),
				A2($elm$html$Html$Attributes$style, 'border-style', 'solid')
			]);
		var anchorAttrs = function () {
			var _v2 = config.anchor;
			if (_v2.$ === 'Nothing') {
				return _List_fromArray(
					[
						A2($elm$html$Html$Attributes$style, 'transform', 'translate(-0%, 0%)')
					]);
			} else {
				switch (_v2.a.$) {
					case 'End':
						var _v3 = _v2.a;
						return _List_fromArray(
							[
								A2($elm$html$Html$Attributes$style, 'transform', 'translate(-100%, 0%)')
							]);
					case 'Start':
						var _v4 = _v2.a;
						return _List_fromArray(
							[
								A2($elm$html$Html$Attributes$style, 'transform', 'translate(-0%, 0%)')
							]);
					default:
						var _v5 = _v2.a;
						return _List_fromArray(
							[
								A2($elm$html$Html$Attributes$style, 'transform', 'translate(-50%, 0%)')
							]);
				}
			}
		}();
		var _v0 = function () {
			var _v1 = config.alignment;
			if (_v1.$ === 'Row') {
				return _Utils_Tuple2(
					_List_fromArray(
						[
							A2($elm$html$Html$Attributes$style, 'display', 'flex'),
							A2($elm$html$Html$Attributes$style, 'align-items', 'center')
						]),
					'right');
			} else {
				return _Utils_Tuple2(
					_List_fromArray(
						[
							A2($elm$html$Html$Attributes$style, 'display', 'flex'),
							A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
							A2($elm$html$Html$Attributes$style, 'align-items', 'baseline')
						]),
					'bottom');
			}
		}();
		var alignmentAttrs = _v0.a;
		var direction = _v0.b;
		var paddingStyle = ' .elm-charts__legends .elm-charts__legend {\n              margin-' + (direction + (':' + ($elm$core$String$fromFloat(config.spacing) + ('px;\n            }\n\n            .elm-charts__legends .elm-charts__legend:last-child {\n              margin-' + (direction + ': 0px;\n            }\n        ')))));
		return A7(
			$terezka$elm_charts$Internal$Svg$positionHtml,
			plane,
			x,
			y,
			config.xOff,
			-config.yOff,
			_Utils_ap(
				anchorAttrs,
				_Utils_ap(
					alignmentAttrs,
					_Utils_ap(otherAttrs, config.htmlAttrs))),
			A2(
				$elm$core$List$cons,
				A3(
					$elm$html$Html$node,
					'style',
					_List_Nil,
					_List_fromArray(
						[
							$elm$html$Html$text(paddingStyle)
						])),
				children));
	});
var $terezka$elm_charts$Chart$Svg$legendsAt = F4(
	function (plane, x, y, edits) {
		return A4(
			$terezka$elm_charts$Internal$Svg$legendsAt,
			plane,
			x,
			y,
			A2($terezka$elm_charts$Internal$Helpers$apply, edits, $terezka$elm_charts$Internal$Svg$defaultLegends));
	});
var $terezka$elm_charts$Internal$Svg$defaultInterpolation = {attrs: _List_Nil, color: $terezka$elm_charts$Internal$Helpers$pink, dashed: _List_Nil, design: $elm$core$Maybe$Nothing, method: $elm$core$Maybe$Nothing, opacity: 0, width: 1};
var $terezka$elm_charts$Internal$Svg$defaultLineLegend = {color: '#808BAB', fontSize: $elm$core$Maybe$Nothing, height: 16, htmlAttrs: _List_Nil, spacing: 10, title: '', width: 30, xOff: 0, yOff: 0};
var $terezka$elm_charts$Internal$Svg$Point = F2(
	function (x, y) {
		return {x: x, y: y};
	});
var $elm$svg$Svg$Attributes$fillRule = _VirtualDom_attribute('fill-rule');
var $terezka$elm_charts$Internal$Interpolation$linear = $elm$core$List$map(
	$elm$core$List$map(
		function (_v0) {
			var x = _v0.x;
			var y = _v0.y;
			return A2($terezka$elm_charts$Internal$Commands$Line, x, y);
		}));
var $terezka$elm_charts$Internal$Interpolation$First = {$: 'First'};
var $terezka$elm_charts$Internal$Interpolation$Previous = function (a) {
	return {$: 'Previous', a: a};
};
var $terezka$elm_charts$Internal$Interpolation$monotoneCurve = F4(
	function (point0, point1, tangent0, tangent1) {
		var dx = (point1.x - point0.x) / 3;
		return A6($terezka$elm_charts$Internal$Commands$CubicBeziers, point0.x + dx, point0.y + (dx * tangent0), point1.x - dx, point1.y - (dx * tangent1), point1.x, point1.y);
	});
var $terezka$elm_charts$Internal$Interpolation$slope2 = F3(
	function (point0, point1, t) {
		var h = point1.x - point0.x;
		return (!(!h)) ? ((((3 * (point1.y - point0.y)) / h) - t) / 2) : t;
	});
var $elm$core$Basics$isNaN = _Basics_isNaN;
var $terezka$elm_charts$Internal$Interpolation$sign = function (x) {
	return (x < 0) ? (-1) : 1;
};
var $terezka$elm_charts$Internal$Interpolation$toH = F2(
	function (h0, h1) {
		return (!h0) ? ((h1 < 0) ? (0 * (-1)) : h1) : h0;
	});
var $terezka$elm_charts$Internal$Interpolation$slope3 = F3(
	function (point0, point1, point2) {
		var h1 = point2.x - point1.x;
		var h0 = point1.x - point0.x;
		var s0h = A2($terezka$elm_charts$Internal$Interpolation$toH, h0, h1);
		var s0 = (point1.y - point0.y) / s0h;
		var s1h = A2($terezka$elm_charts$Internal$Interpolation$toH, h1, h0);
		var s1 = (point2.y - point1.y) / s1h;
		var p = ((s0 * h1) + (s1 * h0)) / (h0 + h1);
		var slope = ($terezka$elm_charts$Internal$Interpolation$sign(s0) + $terezka$elm_charts$Internal$Interpolation$sign(s1)) * A2(
			$elm$core$Basics$min,
			A2(
				$elm$core$Basics$min,
				$elm$core$Basics$abs(s0),
				$elm$core$Basics$abs(s1)),
			0.5 * $elm$core$Basics$abs(p));
		return $elm$core$Basics$isNaN(slope) ? 0 : slope;
	});
var $terezka$elm_charts$Internal$Interpolation$monotonePart = F2(
	function (points, _v0) {
		var tangent = _v0.a;
		var commands = _v0.b;
		var _v1 = _Utils_Tuple2(tangent, points);
		_v1$4:
		while (true) {
			if (_v1.a.$ === 'First') {
				if (_v1.b.b && _v1.b.b.b) {
					if (_v1.b.b.b.b) {
						var _v2 = _v1.a;
						var _v3 = _v1.b;
						var p0 = _v3.a;
						var _v4 = _v3.b;
						var p1 = _v4.a;
						var _v5 = _v4.b;
						var p2 = _v5.a;
						var rest = _v5.b;
						var t1 = A3($terezka$elm_charts$Internal$Interpolation$slope3, p0, p1, p2);
						var t0 = A3($terezka$elm_charts$Internal$Interpolation$slope2, p0, p1, t1);
						return A2(
							$terezka$elm_charts$Internal$Interpolation$monotonePart,
							A2(
								$elm$core$List$cons,
								p1,
								A2($elm$core$List$cons, p2, rest)),
							_Utils_Tuple2(
								$terezka$elm_charts$Internal$Interpolation$Previous(t1),
								_Utils_ap(
									commands,
									_List_fromArray(
										[
											A4($terezka$elm_charts$Internal$Interpolation$monotoneCurve, p0, p1, t0, t1)
										]))));
					} else {
						var _v9 = _v1.a;
						var _v10 = _v1.b;
						var p0 = _v10.a;
						var _v11 = _v10.b;
						var p1 = _v11.a;
						var t1 = A3($terezka$elm_charts$Internal$Interpolation$slope3, p0, p1, p1);
						return _Utils_Tuple2(
							$terezka$elm_charts$Internal$Interpolation$Previous(t1),
							_Utils_ap(
								commands,
								_List_fromArray(
									[
										A4($terezka$elm_charts$Internal$Interpolation$monotoneCurve, p0, p1, t1, t1),
										A2($terezka$elm_charts$Internal$Commands$Line, p1.x, p1.y)
									])));
					}
				} else {
					break _v1$4;
				}
			} else {
				if (_v1.b.b && _v1.b.b.b) {
					if (_v1.b.b.b.b) {
						var t0 = _v1.a.a;
						var _v6 = _v1.b;
						var p0 = _v6.a;
						var _v7 = _v6.b;
						var p1 = _v7.a;
						var _v8 = _v7.b;
						var p2 = _v8.a;
						var rest = _v8.b;
						var t1 = A3($terezka$elm_charts$Internal$Interpolation$slope3, p0, p1, p2);
						return A2(
							$terezka$elm_charts$Internal$Interpolation$monotonePart,
							A2(
								$elm$core$List$cons,
								p1,
								A2($elm$core$List$cons, p2, rest)),
							_Utils_Tuple2(
								$terezka$elm_charts$Internal$Interpolation$Previous(t1),
								_Utils_ap(
									commands,
									_List_fromArray(
										[
											A4($terezka$elm_charts$Internal$Interpolation$monotoneCurve, p0, p1, t0, t1)
										]))));
					} else {
						var t0 = _v1.a.a;
						var _v12 = _v1.b;
						var p0 = _v12.a;
						var _v13 = _v12.b;
						var p1 = _v13.a;
						var t1 = A3($terezka$elm_charts$Internal$Interpolation$slope3, p0, p1, p1);
						return _Utils_Tuple2(
							$terezka$elm_charts$Internal$Interpolation$Previous(t1),
							_Utils_ap(
								commands,
								_List_fromArray(
									[
										A4($terezka$elm_charts$Internal$Interpolation$monotoneCurve, p0, p1, t0, t1),
										A2($terezka$elm_charts$Internal$Commands$Line, p1.x, p1.y)
									])));
					}
				} else {
					break _v1$4;
				}
			}
		}
		return _Utils_Tuple2(tangent, commands);
	});
var $terezka$elm_charts$Internal$Interpolation$monotoneSection = F2(
	function (points, _v0) {
		var tangent = _v0.a;
		var acc = _v0.b;
		var _v1 = function () {
			if (points.b) {
				var p0 = points.a;
				var rest = points.b;
				return A2(
					$terezka$elm_charts$Internal$Interpolation$monotonePart,
					A2($elm$core$List$cons, p0, rest),
					_Utils_Tuple2(
						tangent,
						_List_fromArray(
							[
								A2($terezka$elm_charts$Internal$Commands$Line, p0.x, p0.y)
							])));
			} else {
				return _Utils_Tuple2(tangent, _List_Nil);
			}
		}();
		var t0 = _v1.a;
		var commands = _v1.b;
		return _Utils_Tuple2(
			t0,
			A2($elm$core$List$cons, commands, acc));
	});
var $terezka$elm_charts$Internal$Interpolation$monotone = function (sections) {
	return A3(
		$elm$core$List$foldr,
		$terezka$elm_charts$Internal$Interpolation$monotoneSection,
		_Utils_Tuple2($terezka$elm_charts$Internal$Interpolation$First, _List_Nil),
		sections).b;
};
var $terezka$elm_charts$Internal$Interpolation$Point = F2(
	function (x, y) {
		return {x: x, y: y};
	});
var $terezka$elm_charts$Internal$Interpolation$after = F2(
	function (a, b) {
		return _List_fromArray(
			[
				a,
				A2($terezka$elm_charts$Internal$Interpolation$Point, b.x, a.y),
				b
			]);
	});
var $terezka$elm_charts$Internal$Interpolation$stepped = function (sections) {
	var expand = F2(
		function (result, section) {
			expand:
			while (true) {
				if (section.b) {
					if (section.b.b) {
						var a = section.a;
						var _v1 = section.b;
						var b = _v1.a;
						var rest = _v1.b;
						var $temp$result = _Utils_ap(
							result,
							A2($terezka$elm_charts$Internal$Interpolation$after, a, b)),
							$temp$section = A2($elm$core$List$cons, b, rest);
						result = $temp$result;
						section = $temp$section;
						continue expand;
					} else {
						var last = section.a;
						return result;
					}
				} else {
					return result;
				}
			}
		});
	return A2(
		$elm$core$List$map,
		A2(
			$elm$core$Basics$composeR,
			expand(_List_Nil),
			$elm$core$List$map(
				function (_v2) {
					var x = _v2.x;
					var y = _v2.y;
					return A2($terezka$elm_charts$Internal$Commands$Line, x, y);
				})),
		sections);
};
var $terezka$elm_charts$Internal$Svg$last = function (list) {
	return $elm$core$List$head(
		A2(
			$elm$core$List$drop,
			$elm$core$List$length(list) - 1,
			list));
};
var $terezka$elm_charts$Internal$Svg$withBorder = F2(
	function (stuff, func) {
		if (stuff.b) {
			var first = stuff.a;
			var rest = stuff.b;
			return $elm$core$Maybe$Just(
				A2(
					func,
					first,
					A2(
						$elm$core$Maybe$withDefault,
						first,
						$terezka$elm_charts$Internal$Svg$last(rest))));
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $terezka$elm_charts$Internal$Svg$toCommands = F4(
	function (method, toX, toY, data) {
		var toSets = F2(
			function (ps, cmds) {
				return A2(
					$terezka$elm_charts$Internal$Svg$withBorder,
					ps,
					F2(
						function (first, last_) {
							return _Utils_Tuple3(first, cmds, last_);
						}));
			});
		var fold = F2(
			function (datum_, acc) {
				var _v1 = toY(datum_);
				if (_v1.$ === 'Just') {
					var y_ = _v1.a;
					if (acc.b) {
						var latest = acc.a;
						var rest = acc.b;
						return A2(
							$elm$core$List$cons,
							_Utils_ap(
								latest,
								_List_fromArray(
									[
										{
										x: toX(datum_),
										y: y_
									}
									])),
							rest);
					} else {
						return A2(
							$elm$core$List$cons,
							_List_fromArray(
								[
									{
									x: toX(datum_),
									y: y_
								}
								]),
							acc);
					}
				} else {
					return A2($elm$core$List$cons, _List_Nil, acc);
				}
			});
		var points = $elm$core$List$reverse(
			A3($elm$core$List$foldl, fold, _List_Nil, data));
		var commands = function () {
			switch (method.$) {
				case 'Linear':
					return $terezka$elm_charts$Internal$Interpolation$linear(points);
				case 'Monotone':
					return $terezka$elm_charts$Internal$Interpolation$monotone(points);
				default:
					return $terezka$elm_charts$Internal$Interpolation$stepped(points);
			}
		}();
		return A2(
			$elm$core$List$filterMap,
			$elm$core$Basics$identity,
			A3($elm$core$List$map2, toSets, points, commands));
	});
var $terezka$elm_charts$Internal$Svg$area = F6(
	function (plane, toX, toY2M, toY, config, data) {
		var _v0 = function () {
			var _v1 = config.design;
			if (_v1.$ === 'Nothing') {
				return _Utils_Tuple2(
					$elm$svg$Svg$text(''),
					config.color);
			} else {
				var design = _v1.a;
				return A2($terezka$elm_charts$Internal$Svg$toPattern, config.color, design);
			}
		}();
		var patternDefs = _v0.a;
		var fill = _v0.b;
		var view = function (cmds) {
			return A4(
				$terezka$elm_charts$Internal$Svg$withAttrs,
				config.attrs,
				$elm$svg$Svg$path,
				_List_fromArray(
					[
						$elm$svg$Svg$Attributes$class('elm-charts__area-section'),
						$elm$svg$Svg$Attributes$fill(fill),
						$elm$svg$Svg$Attributes$fillOpacity(
						$elm$core$String$fromFloat(config.opacity)),
						$elm$svg$Svg$Attributes$strokeWidth('0'),
						$elm$svg$Svg$Attributes$fillRule('evenodd'),
						$elm$svg$Svg$Attributes$d(
						A2($terezka$elm_charts$Internal$Commands$description, plane, cmds)),
						$terezka$elm_charts$Internal$Svg$withinChartArea(plane)
					]),
				_List_Nil);
		};
		var withUnder = F2(
			function (_v5, _v6) {
				var firstBottom = _v5.a;
				var cmdsBottom = _v5.b;
				var endBottom = _v5.c;
				var firstTop = _v6.a;
				var cmdsTop = _v6.b;
				var endTop = _v6.c;
				return view(
					_Utils_ap(
						_List_fromArray(
							[
								A2($terezka$elm_charts$Internal$Commands$Move, firstBottom.x, firstBottom.y),
								A2($terezka$elm_charts$Internal$Commands$Line, firstTop.x, firstTop.y)
							]),
						_Utils_ap(
							cmdsTop,
							_Utils_ap(
								_List_fromArray(
									[
										A2($terezka$elm_charts$Internal$Commands$Move, firstBottom.x, firstBottom.y)
									]),
								_Utils_ap(
									cmdsBottom,
									_List_fromArray(
										[
											A2($terezka$elm_charts$Internal$Commands$Line, endTop.x, endTop.y)
										]))))));
			});
		var withoutUnder = function (_v4) {
			var first = _v4.a;
			var cmds = _v4.b;
			var end = _v4.c;
			return view(
				_Utils_ap(
					_List_fromArray(
						[
							A2($terezka$elm_charts$Internal$Commands$Move, first.x, 0),
							A2($terezka$elm_charts$Internal$Commands$Line, first.x, first.y)
						]),
					_Utils_ap(
						cmds,
						_List_fromArray(
							[
								A2($terezka$elm_charts$Internal$Commands$Line, end.x, 0)
							]))));
		};
		if (config.opacity <= 0) {
			return $elm$svg$Svg$text('');
		} else {
			var _v2 = config.method;
			if (_v2.$ === 'Nothing') {
				return $elm$svg$Svg$text('');
			} else {
				var method = _v2.a;
				return A2(
					$elm$svg$Svg$g,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$class('elm-charts__area-sections')
						]),
					function () {
						if (toY2M.$ === 'Nothing') {
							return A2(
								$elm$core$List$cons,
								patternDefs,
								A2(
									$elm$core$List$map,
									withoutUnder,
									A4($terezka$elm_charts$Internal$Svg$toCommands, method, toX, toY, data)));
						} else {
							var toY2 = toY2M.a;
							return A2(
								$elm$core$List$cons,
								patternDefs,
								A3(
									$elm$core$List$map2,
									withUnder,
									A4($terezka$elm_charts$Internal$Svg$toCommands, method, toX, toY2, data),
									A4($terezka$elm_charts$Internal$Svg$toCommands, method, toX, toY, data)));
						}
					}());
			}
		}
	});
var $terezka$elm_charts$Internal$Svg$interpolation = F5(
	function (plane, toX, toY, config, data) {
		var view = function (_v1) {
			var first = _v1.a;
			var cmds = _v1.b;
			return A4(
				$terezka$elm_charts$Internal$Svg$withAttrs,
				config.attrs,
				$elm$svg$Svg$path,
				_List_fromArray(
					[
						$elm$svg$Svg$Attributes$class('elm-charts__interpolation-section'),
						$elm$svg$Svg$Attributes$fill('transparent'),
						$elm$svg$Svg$Attributes$stroke(config.color),
						$elm$svg$Svg$Attributes$strokeDasharray(
						A2(
							$elm$core$String$join,
							' ',
							A2($elm$core$List$map, $elm$core$String$fromFloat, config.dashed))),
						$elm$svg$Svg$Attributes$strokeWidth(
						$elm$core$String$fromFloat(config.width)),
						$elm$svg$Svg$Attributes$d(
						A2(
							$terezka$elm_charts$Internal$Commands$description,
							plane,
							A2(
								$elm$core$List$cons,
								A2($terezka$elm_charts$Internal$Commands$Move, first.x, first.y),
								cmds))),
						$terezka$elm_charts$Internal$Svg$withinChartArea(plane)
					]),
				_List_Nil);
		};
		var _v0 = config.method;
		if (_v0.$ === 'Nothing') {
			return $elm$svg$Svg$text('');
		} else {
			var method = _v0.a;
			return A2(
				$elm$svg$Svg$g,
				_List_fromArray(
					[
						$elm$svg$Svg$Attributes$class('elm-charts__interpolation-sections')
					]),
				A2(
					$elm$core$List$map,
					view,
					A4($terezka$elm_charts$Internal$Svg$toCommands, method, toX, toY, data)));
		}
	});
var $terezka$elm_charts$Internal$Svg$toRadius = F2(
	function (size_, shape) {
		var area_ = (2 * $elm$core$Basics$pi) * size_;
		switch (shape.$) {
			case 'Circle':
				return $elm$core$Basics$sqrt(area_ / $elm$core$Basics$pi);
			case 'Triangle':
				var side = $elm$core$Basics$sqrt(
					(area_ * 4) / $elm$core$Basics$sqrt(3));
				return $elm$core$Basics$sqrt(3) * side;
			case 'Square':
				return $elm$core$Basics$sqrt(area_) / 2;
			case 'Diamond':
				return $elm$core$Basics$sqrt(area_) / 2;
			case 'Cross':
				return $elm$core$Basics$sqrt(area_ / 4);
			default:
				return $elm$core$Basics$sqrt(area_ / 4);
		}
	});
var $terezka$elm_charts$Internal$Svg$lineLegend = F3(
	function (config, interConfig, dotConfig) {
		var topMargin = function () {
			var _v1 = dotConfig.shape;
			if (_v1.$ === 'Just') {
				var shape = _v1.a;
				return A2($terezka$elm_charts$Internal$Svg$toRadius, dotConfig.size, shape);
			} else {
				return 0;
			}
		}();
		var fontStyle = function () {
			var _v0 = config.fontSize;
			if (_v0.$ === 'Just') {
				var size_ = _v0.a;
				return A2(
					$elm$html$Html$Attributes$style,
					'font-size',
					$elm$core$String$fromInt(size_) + 'px');
			} else {
				return A2($elm$html$Html$Attributes$style, '', '');
			}
		}();
		var fakePlane = {
			x: A8($terezka$elm_charts$Internal$Coordinates$Axis, config.width, 0, 0, 0, 10, 0, 10, false),
			y: A8($terezka$elm_charts$Internal$Coordinates$Axis, config.height, 0, 0, 0, 10, 0, 10, false)
		};
		var bottomMargin = (!interConfig.opacity) ? topMargin : 0;
		return A2(
			$elm$html$Html$div,
			_Utils_ap(
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('elm-charts__legend'),
						A2($elm$html$Html$Attributes$style, 'display', 'flex'),
						A2($elm$html$Html$Attributes$style, 'align-items', 'center')
					]),
				config.htmlAttrs),
			_List_fromArray(
				[
					A2(
					$elm$svg$Svg$svg,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$width(
							$elm$core$String$fromFloat(config.width)),
							$elm$svg$Svg$Attributes$height(
							$elm$core$String$fromFloat(config.height))
						]),
					_List_fromArray(
						[
							A5(
							$terezka$elm_charts$Internal$Svg$interpolation,
							fakePlane,
							function ($) {
								return $.x;
							},
							A2(
								$elm$core$Basics$composeR,
								function ($) {
									return $.y;
								},
								$elm$core$Maybe$Just),
							interConfig,
							_List_fromArray(
								[
									A2($terezka$elm_charts$Internal$Svg$Point, 0, 5),
									A2($terezka$elm_charts$Internal$Svg$Point, 10, 5)
								])),
							A6(
							$terezka$elm_charts$Internal$Svg$area,
							fakePlane,
							function ($) {
								return $.x;
							},
							$elm$core$Maybe$Nothing,
							A2(
								$elm$core$Basics$composeR,
								function ($) {
									return $.y;
								},
								$elm$core$Maybe$Just),
							interConfig,
							_List_fromArray(
								[
									A2($terezka$elm_charts$Internal$Svg$Point, 0, 5),
									A2($terezka$elm_charts$Internal$Svg$Point, 10, 5)
								])),
							A5(
							$terezka$elm_charts$Internal$Svg$dot,
							fakePlane,
							function ($) {
								return $.x;
							},
							function ($) {
								return $.y;
							},
							dotConfig,
							A2($terezka$elm_charts$Internal$Svg$Point, 5, 5))
						])),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							fontStyle,
							A2(
							$elm$html$Html$Attributes$style,
							'margin-left',
							$elm$core$String$fromFloat(config.spacing) + 'px'),
							$elm$html$Html$Attributes$class('elm-charts__legend__label')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(config.title)
						]))
				]));
	});
var $terezka$elm_charts$Chart$Attributes$opacity = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{opacity: v});
		});
};
var $terezka$elm_charts$Chart$Svg$lineLegend = F3(
	function (edits, interAttrsOrg, dotAttrsOrg) {
		var interpolationConfigOrg = A2($terezka$elm_charts$Internal$Helpers$apply, interAttrsOrg, $terezka$elm_charts$Internal$Svg$defaultInterpolation);
		var dotConfigOrg = A2($terezka$elm_charts$Internal$Helpers$apply, dotAttrsOrg, $terezka$elm_charts$Internal$Svg$defaultDot);
		var adjustWidth = function (config) {
			return _Utils_update(
				config,
				{width: 10});
		};
		var _v0 = function () {
			var _v1 = _Utils_Tuple2(interpolationConfigOrg.method, dotConfigOrg.shape);
			if (_v1.a.$ === 'Just') {
				if (_v1.b.$ === 'Nothing') {
					var _v2 = _v1.b;
					return _Utils_Tuple3(
						dotAttrsOrg,
						interAttrsOrg,
						A2(
							$elm$core$List$cons,
							$terezka$elm_charts$Chart$Attributes$width(10),
							edits));
				} else {
					return _Utils_Tuple3(
						dotAttrsOrg,
						A2(
							$elm$core$List$cons,
							$terezka$elm_charts$Chart$Attributes$opacity(0),
							interAttrsOrg),
						edits);
				}
			} else {
				if (_v1.b.$ === 'Nothing') {
					var _v3 = _v1.a;
					var _v4 = _v1.b;
					return _Utils_Tuple3(
						A2($elm$core$List$cons, $terezka$elm_charts$Chart$Attributes$circle, dotAttrsOrg),
						A2($elm$core$List$cons, $terezka$elm_charts$Chart$Attributes$linear, interAttrsOrg),
						A2(
							$elm$core$List$cons,
							$terezka$elm_charts$Chart$Attributes$width(10),
							edits));
				} else {
					var _v5 = _v1.a;
					return _Utils_Tuple3(
						A2($elm$core$List$cons, $terezka$elm_charts$Chart$Attributes$circle, dotAttrsOrg),
						interAttrsOrg,
						A2(
							$elm$core$List$cons,
							$terezka$elm_charts$Chart$Attributes$width(10),
							edits));
				}
			}
		}();
		var dotAttrs = _v0.a;
		var interAttrs = _v0.b;
		var lineLegendAttrs = _v0.c;
		return A3(
			$terezka$elm_charts$Internal$Svg$lineLegend,
			A2($terezka$elm_charts$Internal$Helpers$apply, lineLegendAttrs, $terezka$elm_charts$Internal$Svg$defaultLineLegend),
			A2($terezka$elm_charts$Internal$Helpers$apply, interAttrs, $terezka$elm_charts$Internal$Svg$defaultInterpolation),
			A2($terezka$elm_charts$Internal$Helpers$apply, dotAttrs, $terezka$elm_charts$Internal$Svg$defaultDot));
	});
var $terezka$elm_charts$Chart$Attributes$title = function (value) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{title: value});
		});
};
var $terezka$elm_charts$Chart$legendsAt = F4(
	function (toX, toY, attrs, children) {
		return $terezka$elm_charts$Chart$HtmlElement(
			F2(
				function (p, legends) {
					var viewLegend = function (legend) {
						if (legend.$ === 'BarLegend') {
							var name = legend.a;
							var barAttrs = legend.b;
							return A2(
								$terezka$elm_charts$Chart$Svg$barLegend,
								A2(
									$elm$core$List$cons,
									$terezka$elm_charts$Chart$Attributes$title(name),
									children),
								barAttrs);
						} else {
							var name = legend.a;
							var interAttrs = legend.b;
							var dotAttrs = legend.c;
							return A3(
								$terezka$elm_charts$Chart$Svg$lineLegend,
								A2(
									$elm$core$List$cons,
									$terezka$elm_charts$Chart$Attributes$title(name),
									children),
								interAttrs,
								dotAttrs);
						}
					};
					return A5(
						$terezka$elm_charts$Chart$Svg$legendsAt,
						p,
						toX(p.x),
						toY(p.y),
						attrs,
						A2($elm$core$List$map, viewLegend, legends));
				}));
	});
var $terezka$elm_charts$Chart$Attributes$moveDown = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{yOff: config.yOff + v});
		});
};
var $terezka$elm_charts$Chart$Attributes$moveRight = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{xOff: config.xOff + v});
		});
};
var $terezka$elm_charts$Internal$Property$Stacked = function (a) {
	return {$: 'Stacked', a: a};
};
var $terezka$elm_charts$Internal$Property$name = F2(
	function (newName, property) {
		var update = function (config) {
			return _Utils_update(
				config,
				{
					tooltipName: $elm$core$Maybe$Just(newName)
				});
		};
		if (property.$ === 'NotStacked') {
			var config = property.a;
			return $terezka$elm_charts$Internal$Property$NotStacked(
				update(config));
		} else {
			var configs = property.a;
			return $terezka$elm_charts$Internal$Property$Stacked(
				A2($elm$core$List$map, update, configs));
		}
	});
var $terezka$elm_charts$Chart$named = function (name) {
	return $terezka$elm_charts$Internal$Property$name(name);
};
var $terezka$elm_charts$Chart$Attributes$padding = function (value) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{padding: value});
		});
};
var $author$project$Main$prettyDayFormatter = $ryan_haskell$date_format$DateFormat$format(
	_List_fromArray(
		[
			$ryan_haskell$date_format$DateFormat$monthNameAbbreviated,
			$ryan_haskell$date_format$DateFormat$text(' '),
			$ryan_haskell$date_format$DateFormat$dayOfMonthSuffix
		]));
var $terezka$elm_charts$Chart$Attributes$range = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{range: v});
		});
};
var $terezka$elm_charts$Chart$Attributes$rotate = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{rotate: config.rotate + v});
		});
};
var $terezka$elm_charts$Chart$Indexed = function (a) {
	return {$: 'Indexed', a: a};
};
var $terezka$elm_charts$Chart$SeriesElement = F4(
	function (a, b, c, d) {
		return {$: 'SeriesElement', a: a, b: b, c: c, d: d};
	});
var $terezka$elm_charts$Internal$Many$getMembers = function (_v0) {
	var _v1 = _v0.a;
	var x = _v1.a;
	var xs = _v1.b;
	return A2($elm$core$List$cons, x, xs);
};
var $terezka$elm_charts$Internal$Item$Rendered = F2(
	function (a, b) {
		return {$: 'Rendered', a: a, b: b};
	});
var $terezka$elm_charts$Internal$Item$map = F2(
	function (func, _v0) {
		var meta = _v0.a;
		var item = _v0.b;
		return A2(
			$terezka$elm_charts$Internal$Item$Rendered,
			{
				color: meta.color,
				datum: func(meta.datum),
				identification: meta.identification,
				isReal: meta.isReal,
				name: meta.name,
				presentation: meta.presentation,
				toAny: meta.toAny,
				tooltipText: meta.tooltipText,
				x1: meta.x1,
				x2: meta.x2,
				y: meta.y
			},
			item);
	});
var $elm$virtual_dom$VirtualDom$map = _VirtualDom_map;
var $elm$svg$Svg$map = $elm$virtual_dom$VirtualDom$map;
var $terezka$elm_charts$Internal$Item$render = function (_v0) {
	var item = _v0.b;
	return item.render(_Utils_Tuple0);
};
var $terezka$elm_charts$Internal$Legend$LineLegend = F3(
	function (a, b, c) {
		return {$: 'LineLegend', a: a, b: b, c: c};
	});
var $terezka$elm_charts$Chart$Attributes$border = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{border: v});
		});
};
var $terezka$elm_charts$Internal$Helpers$noChange = $terezka$elm_charts$Internal$Helpers$Attribute($elm$core$Basics$identity);
var $terezka$elm_charts$Internal$Property$toConfigs = function (property) {
	if (property.$ === 'NotStacked') {
		var config = property.a;
		return _List_fromArray(
			[config]);
	} else {
		var configs = property.a;
		return configs;
	}
};
var $terezka$elm_charts$Internal$Helpers$blue = '#12A5ED';
var $terezka$elm_charts$Internal$Helpers$brown = '#871c1c';
var $terezka$elm_charts$Internal$Helpers$green = '#71c614';
var $terezka$elm_charts$Internal$Helpers$moss = '#92b42c';
var $terezka$elm_charts$Internal$Helpers$orange = '#FF8400';
var $terezka$elm_charts$Internal$Helpers$purple = '#7b4dff';
var $terezka$elm_charts$Internal$Helpers$red = '#F5325B';
var $elm$core$Dict$sizeHelp = F2(
	function (n, dict) {
		sizeHelp:
		while (true) {
			if (dict.$ === 'RBEmpty_elm_builtin') {
				return n;
			} else {
				var left = dict.d;
				var right = dict.e;
				var $temp$n = A2($elm$core$Dict$sizeHelp, n + 1, right),
					$temp$dict = left;
				n = $temp$n;
				dict = $temp$dict;
				continue sizeHelp;
			}
		}
	});
var $elm$core$Dict$size = function (dict) {
	return A2($elm$core$Dict$sizeHelp, 0, dict);
};
var $terezka$elm_charts$Internal$Helpers$toDefault = F3(
	function (_default, items, index) {
		var dict = $elm$core$Dict$fromList(
			A2($elm$core$List$indexedMap, $elm$core$Tuple$pair, items));
		var numOfItems = $elm$core$Dict$size(dict);
		var itemIndex = index % numOfItems;
		return A2(
			$elm$core$Maybe$withDefault,
			_default,
			A2($elm$core$Dict$get, itemIndex, dict));
	});
var $terezka$elm_charts$Internal$Helpers$turquoise = '#22d2ba';
var $terezka$elm_charts$Internal$Helpers$yellow = '#FFCA00';
var $terezka$elm_charts$Internal$Helpers$toDefaultColor = A2(
	$terezka$elm_charts$Internal$Helpers$toDefault,
	$terezka$elm_charts$Internal$Helpers$pink,
	_List_fromArray(
		[$terezka$elm_charts$Internal$Helpers$purple, $terezka$elm_charts$Internal$Helpers$pink, $terezka$elm_charts$Internal$Helpers$blue, $terezka$elm_charts$Internal$Helpers$green, $terezka$elm_charts$Internal$Helpers$red, $terezka$elm_charts$Internal$Helpers$yellow, $terezka$elm_charts$Internal$Helpers$turquoise, $terezka$elm_charts$Internal$Helpers$orange, $terezka$elm_charts$Internal$Helpers$moss, $terezka$elm_charts$Internal$Helpers$brown]));
var $terezka$elm_charts$Internal$Legend$toDotLegends = F2(
	function (elIndex, properties) {
		var toInterConfig = function (attrs) {
			return A2($terezka$elm_charts$Internal$Helpers$apply, attrs, $terezka$elm_charts$Internal$Svg$defaultInterpolation);
		};
		var toDotLegend = F3(
			function (props, prop, colorIndex) {
				var defaultOpacity = ($elm$core$List$length(props) > 1) ? 0.4 : 0;
				var interAttr = _Utils_ap(
					_List_fromArray(
						[
							$terezka$elm_charts$Chart$Attributes$color(
							$terezka$elm_charts$Internal$Helpers$toDefaultColor(colorIndex)),
							$terezka$elm_charts$Chart$Attributes$opacity(defaultOpacity)
						]),
					prop.interpolation);
				var interConfig = toInterConfig(interAttr);
				var defaultName = 'Property #' + $elm$core$String$fromInt(colorIndex + 1);
				var defaultAttrs = _List_fromArray(
					[
						$terezka$elm_charts$Chart$Attributes$color(interConfig.color),
						$terezka$elm_charts$Chart$Attributes$border(interConfig.color),
						_Utils_eq(interConfig.method, $elm$core$Maybe$Nothing) ? $terezka$elm_charts$Chart$Attributes$circle : $terezka$elm_charts$Internal$Helpers$noChange
					]);
				var dotAttrs = _Utils_ap(defaultAttrs, prop.presentation);
				return A3(
					$terezka$elm_charts$Internal$Legend$LineLegend,
					A2($elm$core$Maybe$withDefault, defaultName, prop.tooltipName),
					interAttr,
					dotAttrs);
			});
		return A2(
			$elm$core$List$indexedMap,
			F2(
				function (propIndex, f) {
					return f(elIndex + propIndex);
				}),
			A2(
				$elm$core$List$concatMap,
				function (ps) {
					return A2(
						$elm$core$List$map,
						toDotLegend(ps),
						ps);
				},
				A2($elm$core$List$map, $terezka$elm_charts$Internal$Property$toConfigs, properties)));
	});
var $terezka$elm_charts$Internal$Item$Dot = function (a) {
	return {$: 'Dot', a: a};
};
var $terezka$elm_charts$Internal$Coordinates$Point = F2(
	function (x, y) {
		return {x: x, y: y};
	});
var $terezka$elm_charts$Internal$Coordinates$convertX = F3(
	function (topLevel, plane, x) {
		return topLevel.x.min + ($terezka$elm_charts$Internal$Coordinates$range(topLevel.x) * ((x - plane.x.min) / $terezka$elm_charts$Internal$Coordinates$range(plane.x)));
	});
var $terezka$elm_charts$Internal$Coordinates$convertY = F3(
	function (topLevel, plane, y) {
		return topLevel.y.min + ($terezka$elm_charts$Internal$Coordinates$range(topLevel.y) * ((y - plane.y.min) / $terezka$elm_charts$Internal$Coordinates$range(plane.y)));
	});
var $terezka$elm_charts$Internal$Coordinates$convertPos = F3(
	function (topLevel, plane, pos) {
		return {
			x1: A3($terezka$elm_charts$Internal$Coordinates$convertX, topLevel, plane, pos.x1),
			x2: A3($terezka$elm_charts$Internal$Coordinates$convertX, topLevel, plane, pos.x2),
			y1: A3($terezka$elm_charts$Internal$Coordinates$convertY, topLevel, plane, pos.y1),
			y2: A3($terezka$elm_charts$Internal$Coordinates$convertY, topLevel, plane, pos.y2)
		};
	});
var $terezka$elm_charts$Internal$Item$getLimits = function (_v0) {
	var item = _v0.b;
	return item.limits;
};
var $terezka$elm_charts$Internal$Item$getPosition = function (_v0) {
	var item = _v0.b;
	return item.position;
};
var $elm$core$Maybe$map2 = F3(
	function (func, ma, mb) {
		if (ma.$ === 'Nothing') {
			return $elm$core$Maybe$Nothing;
		} else {
			var a = ma.a;
			if (mb.$ === 'Nothing') {
				return $elm$core$Maybe$Nothing;
			} else {
				var b = mb.a;
				return $elm$core$Maybe$Just(
					A2(func, a, b));
			}
		}
	});
var $elm$html$Html$table = _VirtualDom_node('table');
var $terezka$elm_charts$Internal$Produce$toDefaultName = F2(
	function (ids, name) {
		return A2(
			$elm$core$Maybe$withDefault,
			'Property #' + $elm$core$String$fromInt(ids.absoluteIndex + 1),
			name);
	});
var $terezka$elm_charts$Internal$Item$tooltip = function (_v0) {
	var item = _v0.b;
	return item.tooltip(_Utils_Tuple0);
};
var $elm$html$Html$td = _VirtualDom_node('td');
var $elm$html$Html$tr = _VirtualDom_node('tr');
var $terezka$elm_charts$Internal$Produce$tooltipRow = F3(
	function (color, title, text) {
		return A2(
			$elm$html$Html$tr,
			_List_Nil,
			_List_fromArray(
				[
					A2(
					$elm$html$Html$td,
					_List_fromArray(
						[
							A2($elm$html$Html$Attributes$style, 'color', color),
							A2($elm$html$Html$Attributes$style, 'padding', '0'),
							A2($elm$html$Html$Attributes$style, 'padding-right', '3px')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(title + ':')
						])),
					A2(
					$elm$html$Html$td,
					_List_fromArray(
						[
							A2($elm$html$Html$Attributes$style, 'text-align', 'right'),
							A2($elm$html$Html$Attributes$style, 'padding', '0')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(text)
						]))
				]));
	});
var $elm$core$List$unzip = function (pairs) {
	var step = F2(
		function (_v0, _v1) {
			var x = _v0.a;
			var y = _v0.b;
			var xs = _v1.a;
			var ys = _v1.b;
			return _Utils_Tuple2(
				A2($elm$core$List$cons, x, xs),
				A2($elm$core$List$cons, y, ys));
		});
	return A3(
		$elm$core$List$foldr,
		step,
		_Utils_Tuple2(_List_Nil, _List_Nil),
		pairs);
};
var $terezka$elm_charts$Internal$Helpers$withFirst = F2(
	function (xs, func) {
		if (xs.b) {
			var x = xs.a;
			var rest = xs.b;
			return $elm$core$Maybe$Just(
				A2(func, x, rest));
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $terezka$elm_charts$Internal$Produce$toDotSeries = F4(
	function (elementIndex, toX, properties, data) {
		var forEachDataPoint = F9(
			function (absoluteIndex, stackSeriesConfigIndex, lineSeriesConfigIndex, lineSeriesConfig, interpolationConfig, defaultColor, defaultOpacity, dataIndex, datum) {
				var y = A2(
					$elm$core$Maybe$withDefault,
					0,
					lineSeriesConfig.toYSum(datum));
				var x = toX(datum);
				var limits = {x1: x, x2: x, y1: y, y2: y};
				var identification = {absoluteIndex: absoluteIndex, dataIndex: dataIndex, elementIndex: elementIndex, seriesIndex: lineSeriesConfigIndex, stackIndex: stackSeriesConfigIndex};
				var defaultAttrs = _List_fromArray(
					[
						$terezka$elm_charts$Chart$Attributes$color(interpolationConfig.color),
						$terezka$elm_charts$Chart$Attributes$border(interpolationConfig.color),
						_Utils_eq(interpolationConfig.method, $elm$core$Maybe$Nothing) ? $terezka$elm_charts$Chart$Attributes$circle : $terezka$elm_charts$Internal$Helpers$noChange
					]);
				var dotAttrs = _Utils_ap(
					defaultAttrs,
					_Utils_ap(
						lineSeriesConfig.presentation,
						A2(lineSeriesConfig.variation, identification, datum)));
				var dotConfig = A2($terezka$elm_charts$Internal$Helpers$apply, dotAttrs, $terezka$elm_charts$Internal$Svg$defaultDot);
				var radius = A2(
					$elm$core$Maybe$withDefault,
					0,
					A2(
						$elm$core$Maybe$map,
						$terezka$elm_charts$Internal$Svg$toRadius(dotConfig.size),
						dotConfig.shape));
				var tooltipTextColor = (dotConfig.color === 'white') ? ((dotConfig.border === 'white') ? interpolationConfig.color : dotConfig.border) : dotConfig.color;
				return _Utils_Tuple2(
					limits,
					F2(
						function (topLevel, localPlane) {
							var radiusY = A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianY, localPlane, radius);
							var radiusX = A2($terezka$elm_charts$Internal$Coordinates$scaleCartesianX, localPlane, radius);
							var position = {x1: x - radiusX, x2: x + radiusX, y1: y - radiusY, y2: y + radiusY};
							return A2(
								$terezka$elm_charts$Internal$Item$Rendered,
								{
									color: tooltipTextColor,
									datum: datum,
									identification: identification,
									isReal: !_Utils_eq(
										lineSeriesConfig.toY(datum),
										$elm$core$Maybe$Nothing),
									name: lineSeriesConfig.tooltipName,
									presentation: $terezka$elm_charts$Internal$Item$Dot(dotConfig),
									toAny: $elm$core$Basics$identity,
									tooltipText: lineSeriesConfig.tooltipText(datum),
									x1: x,
									x2: x,
									y: y
								},
								{
									limits: limits,
									limitsTop: A3($terezka$elm_charts$Internal$Coordinates$convertPos, topLevel, localPlane, limits),
									localPlane: localPlane,
									planeTop: topLevel,
									position: position,
									positionTop: A3($terezka$elm_charts$Internal$Coordinates$convertPos, topLevel, localPlane, position),
									render: function (_v11) {
										var _v12 = lineSeriesConfig.toY(datum);
										if (_v12.$ === 'Nothing') {
											return $elm$svg$Svg$text('');
										} else {
											return A5(
												$terezka$elm_charts$Internal$Svg$dot,
												localPlane,
												function ($) {
													return $.x;
												},
												function ($) {
													return $.y;
												},
												dotConfig,
												A2($terezka$elm_charts$Internal$Coordinates$Point, x, y));
										}
									},
									tooltip: function (_v13) {
										return _List_fromArray(
											[
												A3(
												$terezka$elm_charts$Internal$Produce$tooltipRow,
												tooltipTextColor,
												A2($terezka$elm_charts$Internal$Produce$toDefaultName, identification, lineSeriesConfig.tooltipName),
												lineSeriesConfig.tooltipText(datum))
											]);
									}
								});
						}));
			});
		var forEachLine = F5(
			function (isStacked, absoluteIndex, stackSeriesConfigIndex, lineSeriesConfigIndex, lineSeriesConfig) {
				var defaultOpacity = isStacked ? 0.4 : 0;
				var absoluteIndexNew = absoluteIndex + lineSeriesConfigIndex;
				var defaultColor = $terezka$elm_charts$Internal$Helpers$toDefaultColor(absoluteIndexNew);
				var interpolationAttrs = _List_fromArray(
					[
						$terezka$elm_charts$Chart$Attributes$color(defaultColor),
						$terezka$elm_charts$Chart$Attributes$opacity(defaultOpacity)
					]);
				var interpolationConfig = A2(
					$terezka$elm_charts$Internal$Helpers$apply,
					_Utils_ap(interpolationAttrs, lineSeriesConfig.interpolation),
					$terezka$elm_charts$Internal$Svg$defaultInterpolation);
				var viewSeries = F2(
					function (plane, dotItems) {
						var toBottom = function (datum) {
							return A3(
								$elm$core$Maybe$map2,
								F2(
									function (y, ySum) {
										return ySum - y;
									}),
								lineSeriesConfig.toY(datum),
								lineSeriesConfig.toYSum(datum));
						};
						return A2(
							$elm$svg$Svg$g,
							_List_fromArray(
								[
									$elm$svg$Svg$Attributes$class('elm-charts__series')
								]),
							_List_fromArray(
								[
									A6(
									$terezka$elm_charts$Internal$Svg$area,
									plane,
									toX,
									$elm$core$Maybe$Just(toBottom),
									lineSeriesConfig.toYSum,
									interpolationConfig,
									data),
									A5($terezka$elm_charts$Internal$Svg$interpolation, plane, toX, lineSeriesConfig.toYSum, interpolationConfig, data),
									A2(
									$elm$svg$Svg$g,
									_List_fromArray(
										[
											$elm$svg$Svg$Attributes$class('elm-charts__dots')
										]),
									A2($elm$core$List$map, $terezka$elm_charts$Internal$Item$render, dotItems))
								]));
					});
				var _v8 = $elm$core$List$unzip(
					A2(
						$elm$core$List$indexedMap,
						A7(forEachDataPoint, absoluteIndexNew, stackSeriesConfigIndex, lineSeriesConfigIndex, lineSeriesConfig, interpolationConfig, defaultColor, defaultOpacity),
						data));
				var limits = _v8.a;
				var toDotItems = _v8.b;
				return _Utils_Tuple2(
					limits,
					F2(
						function (topLevel, localPlane) {
							var dotItems = A2(
								$elm$core$List$map,
								function (i) {
									return A2(i, topLevel, localPlane);
								},
								toDotItems);
							return A2(
								$terezka$elm_charts$Internal$Helpers$withFirst,
								dotItems,
								F2(
									function (first, rest) {
										var groupPosition = A2($terezka$elm_charts$Internal$Coordinates$foldPosition, $terezka$elm_charts$Internal$Item$getPosition, dotItems);
										var groupLimits = A2($terezka$elm_charts$Internal$Coordinates$foldPosition, $terezka$elm_charts$Internal$Item$getLimits, dotItems);
										return A2(
											$terezka$elm_charts$Internal$Item$Rendered,
											_Utils_Tuple2(first, rest),
											{
												limits: groupLimits,
												limitsTop: A3($terezka$elm_charts$Internal$Coordinates$convertPos, topLevel, localPlane, groupLimits),
												localPlane: localPlane,
												planeTop: topLevel,
												position: groupPosition,
												positionTop: A3($terezka$elm_charts$Internal$Coordinates$convertPos, topLevel, localPlane, groupPosition),
												render: function (_v9) {
													return A2(viewSeries, localPlane, dotItems);
												},
												tooltip: function (_v10) {
													return _List_fromArray(
														[
															A2(
															$elm$html$Html$table,
															_List_fromArray(
																[
																	A2($elm$html$Html$Attributes$style, 'margin', '0')
																]),
															A2($elm$core$List$concatMap, $terezka$elm_charts$Internal$Item$tooltip, dotItems))
														]);
												}
											});
									}));
						}));
			});
		var forEachStackSeriesConfig = F2(
			function (stackSeriesConfig, _v6) {
				var absoluteIndex = _v6.a;
				var stackSeriesConfigIndex = _v6.b;
				var _v7 = _v6.c;
				var limits = _v7.a;
				var items = _v7.b;
				var _v4 = $elm$core$List$unzip(
					function () {
						if (stackSeriesConfig.$ === 'NotStacked') {
							var lineSeriesConfig = stackSeriesConfig.a;
							return _List_fromArray(
								[
									A5(forEachLine, false, absoluteIndex, stackSeriesConfigIndex, 0, lineSeriesConfig)
								]);
						} else {
							var lineSeriesConfigs = stackSeriesConfig.a;
							return A2(
								$elm$core$List$indexedMap,
								A3(forEachLine, true, absoluteIndex, stackSeriesConfigIndex),
								lineSeriesConfigs);
						}
					}());
				var newLimits = _v4.a;
				var lineItems = _v4.b;
				return _Utils_Tuple3(
					absoluteIndex + $elm$core$List$length(lineItems),
					stackSeriesConfigIndex + 1,
					_Utils_Tuple2(
						_Utils_ap(
							limits,
							$elm$core$List$concat(newLimits)),
						F2(
							function (topLevel, localPlane) {
								return _Utils_ap(
									A2(items, topLevel, localPlane),
									A2(
										$elm$core$List$filterMap,
										$elm$core$Basics$identity,
										A2(
											$elm$core$List$map,
											function (i) {
												return A2(i, topLevel, localPlane);
											},
											lineItems)));
							})));
			});
		return function (_v2) {
			var newElementIndex = _v2.a;
			var _v3 = _v2.c;
			var limits = _v3.a;
			var items = _v3.b;
			return _Utils_Tuple3(newElementIndex, limits, items);
		}(
			A3(
				$elm$core$List$foldl,
				forEachStackSeriesConfig,
				_Utils_Tuple3(
					elementIndex,
					0,
					_Utils_Tuple2(
						_List_Nil,
						F2(
							function (_v0, _v1) {
								return _List_Nil;
							}))),
				properties));
	});
var $terezka$elm_charts$Chart$seriesMap = F4(
	function (mapData, toX, properties, data) {
		return $terezka$elm_charts$Chart$Indexed(
			F2(
				function (_v0, index) {
					var legends = A2($terezka$elm_charts$Internal$Legend$toDotLegends, index, properties);
					var _v1 = A4($terezka$elm_charts$Internal$Produce$toDotSeries, index, toX, properties, data);
					var newElementIndex = _v1.a;
					var limits = _v1.b;
					var items = _v1.c;
					var toItems = F2(
						function (topLevel, localPlane) {
							return A2(
								$elm$core$List$concatMap,
								A2(
									$elm$core$Basics$composeR,
									$terezka$elm_charts$Internal$Many$getMembers,
									$elm$core$List$map(
										$terezka$elm_charts$Internal$Item$map(mapData))),
								A2(items, topLevel, localPlane));
						});
					return _Utils_Tuple2(
						A4(
							$terezka$elm_charts$Chart$SeriesElement,
							A2($terezka$elm_charts$Internal$Coordinates$foldPosition, $elm$core$Basics$identity, limits),
							toItems,
							legends,
							F2(
								function (topLevel, p) {
									return A2(
										$elm$svg$Svg$map,
										$elm$core$Basics$never,
										A2(
											$elm$svg$Svg$g,
											_List_fromArray(
												[
													$elm$svg$Svg$Attributes$class('elm-charts__dot-series')
												]),
											A2(
												$elm$core$List$map,
												$terezka$elm_charts$Internal$Item$render,
												A2(items, topLevel, p))));
								})),
						newElementIndex);
				}));
	});
var $terezka$elm_charts$Chart$series = F3(
	function (toX, properties, data) {
		return A4($terezka$elm_charts$Chart$seriesMap, $elm$core$Basics$identity, toX, properties, data);
	});
var $terezka$elm_charts$Chart$Attributes$spacing = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{spacing: v});
		});
};
var $terezka$elm_charts$Internal$Svg$Times = function (a) {
	return {$: 'Times', a: a};
};
var $terezka$elm_charts$Chart$Attributes$times = function (zone) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{
					generate: $terezka$elm_charts$Internal$Svg$Times(zone)
				});
		});
};
var $terezka$elm_charts$Chart$AxisElement = F2(
	function (a, b) {
		return {$: 'AxisElement', a: a, b: b};
	});
var $elm$svg$Svg$Attributes$points = _VirtualDom_attribute('points');
var $elm$svg$Svg$polygon = $elm$svg$Svg$trustedNode('polygon');
var $terezka$elm_charts$Internal$Svg$position = F6(
	function (plane, rotation, x_, y_, xOff_, yOff_) {
		return $elm$svg$Svg$Attributes$transform(
			'translate(' + ($elm$core$String$fromFloat(
				A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, x_) + xOff_) + (',' + ($elm$core$String$fromFloat(
				A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, y_) + yOff_) + (') rotate(' + ($elm$core$String$fromFloat(rotation) + ')'))))));
	});
var $terezka$elm_charts$Internal$Svg$arrow = F3(
	function (plane, config, point) {
		var points_ = '0,0 ' + ($elm$core$String$fromFloat(config.length) + (',' + ($elm$core$String$fromFloat(config.width) + (' 0, ' + $elm$core$String$fromFloat(config.width * 2)))));
		var commands = 'rotate(' + ($elm$core$String$fromFloat(config.rotate) + (') translate(0 ' + ($elm$core$String$fromFloat(-config.width) + ') ')));
		return A2(
			$elm$svg$Svg$g,
			_List_fromArray(
				[
					$elm$svg$Svg$Attributes$class('elm-charts__arrow'),
					A6($terezka$elm_charts$Internal$Svg$position, plane, 0, point.x, point.y, config.xOff, config.yOff)
				]),
			_List_fromArray(
				[
					A4(
					$terezka$elm_charts$Internal$Svg$withAttrs,
					config.attrs,
					$elm$svg$Svg$polygon,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$fill(config.color),
							$elm$svg$Svg$Attributes$points(points_),
							$elm$svg$Svg$Attributes$transform(commands)
						]),
					_List_Nil)
				]));
	});
var $terezka$elm_charts$Internal$Svg$defaultArrow = {attrs: _List_Nil, color: 'rgb(210, 210, 210)', length: 7, rotate: 0, width: 4, xOff: 0, yOff: 0};
var $terezka$elm_charts$Chart$Svg$arrow = F2(
	function (plane, edits) {
		return A2(
			$terezka$elm_charts$Internal$Svg$arrow,
			plane,
			A2($terezka$elm_charts$Internal$Helpers$apply, edits, $terezka$elm_charts$Internal$Svg$defaultArrow));
	});
var $terezka$elm_charts$Chart$Attributes$attrs = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{attrs: v});
		});
};
var $terezka$elm_charts$Chart$Attributes$x2 = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{
					x2: $elm$core$Maybe$Just(v)
				});
		});
};
var $terezka$elm_charts$Chart$Attributes$zero = function (b) {
	return A3($elm$core$Basics$clamp, b.min, b.max, 0);
};
var $terezka$elm_charts$Chart$xAxis = function (edits) {
	var config = A2(
		$terezka$elm_charts$Internal$Helpers$apply,
		edits,
		{arrow: true, attrs: _List_Nil, color: '', limits: _List_Nil, pinned: $terezka$elm_charts$Chart$Attributes$zero, width: 1});
	var addTickValues = F2(
		function (p, ts) {
			return _Utils_update(
				ts,
				{
					yAxis: A2(
						$elm$core$List$cons,
						config.pinned(p.y),
						ts.yAxis)
				});
		});
	return A2(
		$terezka$elm_charts$Chart$AxisElement,
		addTickValues,
		function (p) {
			var xLimit = A2($terezka$elm_charts$Internal$Helpers$apply, config.limits, p.x);
			return A2(
				$elm$svg$Svg$g,
				_List_fromArray(
					[
						$elm$svg$Svg$Attributes$class('elm-charts__x-axis')
					]),
				_List_fromArray(
					[
						A2(
						$terezka$elm_charts$Chart$Svg$line,
						p,
						_List_fromArray(
							[
								$terezka$elm_charts$Chart$Attributes$color(config.color),
								$terezka$elm_charts$Chart$Attributes$width(config.width),
								$terezka$elm_charts$Chart$Attributes$y1(
								config.pinned(p.y)),
								$terezka$elm_charts$Chart$Attributes$x1(
								A2($elm$core$Basics$max, p.x.min, xLimit.min)),
								$terezka$elm_charts$Chart$Attributes$x2(
								A2($elm$core$Basics$min, p.x.max, xLimit.max)),
								$terezka$elm_charts$Chart$Attributes$attrs(config.attrs)
							])),
						config.arrow ? A3(
						$terezka$elm_charts$Chart$Svg$arrow,
						p,
						_List_fromArray(
							[
								$terezka$elm_charts$Chart$Attributes$color(config.color),
								p.x.flip ? $terezka$elm_charts$Chart$Attributes$rotate(180) : $terezka$elm_charts$Chart$Attributes$rotate(0)
							]),
						{
							x: xLimit.max,
							y: config.pinned(p.y)
						}) : $elm$svg$Svg$text('')
					]));
		});
};
var $terezka$elm_charts$Internal$Svg$Floats = {$: 'Floats'};
var $terezka$elm_charts$Chart$LabelsElement = F3(
	function (a, b, c) {
		return {$: 'LabelsElement', a: a, b: b, c: c};
	});
var $terezka$elm_charts$Internal$Svg$defaultLabel = {anchor: $elm$core$Maybe$Nothing, attrs: _List_Nil, border: 'white', borderWidth: 0, color: '#808BAB', ellipsis: $elm$core$Maybe$Nothing, fontSize: $elm$core$Maybe$Nothing, hideOverflow: false, rotate: 0, uppercase: false, xOff: 0, yOff: 0};
var $terezka$elm_charts$Internal$Svg$Generator = function (a) {
	return {$: 'Generator', a: a};
};
var $terezka$intervals$Intervals$Around = function (a) {
	return {$: 'Around', a: a};
};
var $terezka$intervals$Intervals$around = $terezka$intervals$Intervals$Around;
var $terezka$intervals$Intervals$ceilingTo = F2(
	function (prec, number) {
		return prec * $elm$core$Basics$ceiling(number / prec);
	});
var $terezka$intervals$Intervals$getBeginning = F2(
	function (min, interval) {
		var multiple = min / interval;
		return _Utils_eq(
			multiple,
			$elm$core$Basics$round(multiple)) ? min : A2($terezka$intervals$Intervals$ceilingTo, interval, min);
	});
var $myrho$elm_round$Round$addSign = F2(
	function (signed, str) {
		var isNotZero = A2(
			$elm$core$List$any,
			function (c) {
				return (!_Utils_eq(
					c,
					_Utils_chr('0'))) && (!_Utils_eq(
					c,
					_Utils_chr('.')));
			},
			$elm$core$String$toList(str));
		return _Utils_ap(
			(signed && isNotZero) ? '-' : '',
			str);
	});
var $elm$core$Char$fromCode = _Char_fromCode;
var $myrho$elm_round$Round$increaseNum = function (_v0) {
	var head = _v0.a;
	var tail = _v0.b;
	if (_Utils_eq(
		head,
		_Utils_chr('9'))) {
		var _v1 = $elm$core$String$uncons(tail);
		if (_v1.$ === 'Nothing') {
			return '01';
		} else {
			var headtail = _v1.a;
			return A2(
				$elm$core$String$cons,
				_Utils_chr('0'),
				$myrho$elm_round$Round$increaseNum(headtail));
		}
	} else {
		var c = $elm$core$Char$toCode(head);
		return ((c >= 48) && (c < 57)) ? A2(
			$elm$core$String$cons,
			$elm$core$Char$fromCode(c + 1),
			tail) : '0';
	}
};
var $elm$core$Basics$isInfinite = _Basics_isInfinite;
var $elm$core$String$padRight = F3(
	function (n, _char, string) {
		return _Utils_ap(
			string,
			A2(
				$elm$core$String$repeat,
				n - $elm$core$String$length(string),
				$elm$core$String$fromChar(_char)));
	});
var $elm$core$String$reverse = _String_reverse;
var $myrho$elm_round$Round$splitComma = function (str) {
	var _v0 = A2($elm$core$String$split, '.', str);
	if (_v0.b) {
		if (_v0.b.b) {
			var before = _v0.a;
			var _v1 = _v0.b;
			var after = _v1.a;
			return _Utils_Tuple2(before, after);
		} else {
			var before = _v0.a;
			return _Utils_Tuple2(before, '0');
		}
	} else {
		return _Utils_Tuple2('0', '0');
	}
};
var $myrho$elm_round$Round$toDecimal = function (fl) {
	var _v0 = A2(
		$elm$core$String$split,
		'e',
		$elm$core$String$fromFloat(
			$elm$core$Basics$abs(fl)));
	if (_v0.b) {
		if (_v0.b.b) {
			var num = _v0.a;
			var _v1 = _v0.b;
			var exp = _v1.a;
			var e = A2(
				$elm$core$Maybe$withDefault,
				0,
				$elm$core$String$toInt(
					A2($elm$core$String$startsWith, '+', exp) ? A2($elm$core$String$dropLeft, 1, exp) : exp));
			var _v2 = $myrho$elm_round$Round$splitComma(num);
			var before = _v2.a;
			var after = _v2.b;
			var total = _Utils_ap(before, after);
			var zeroed = (e < 0) ? A2(
				$elm$core$Maybe$withDefault,
				'0',
				A2(
					$elm$core$Maybe$map,
					function (_v3) {
						var a = _v3.a;
						var b = _v3.b;
						return a + ('.' + b);
					},
					A2(
						$elm$core$Maybe$map,
						$elm$core$Tuple$mapFirst($elm$core$String$fromChar),
						$elm$core$String$uncons(
							_Utils_ap(
								A2(
									$elm$core$String$repeat,
									$elm$core$Basics$abs(e),
									'0'),
								total))))) : A3(
				$elm$core$String$padRight,
				e + 1,
				_Utils_chr('0'),
				total);
			return _Utils_ap(
				(fl < 0) ? '-' : '',
				zeroed);
		} else {
			var num = _v0.a;
			return _Utils_ap(
				(fl < 0) ? '-' : '',
				num);
		}
	} else {
		return '';
	}
};
var $myrho$elm_round$Round$roundFun = F3(
	function (functor, s, fl) {
		if ($elm$core$Basics$isInfinite(fl) || $elm$core$Basics$isNaN(fl)) {
			return $elm$core$String$fromFloat(fl);
		} else {
			var signed = fl < 0;
			var _v0 = $myrho$elm_round$Round$splitComma(
				$myrho$elm_round$Round$toDecimal(
					$elm$core$Basics$abs(fl)));
			var before = _v0.a;
			var after = _v0.b;
			var r = $elm$core$String$length(before) + s;
			var normalized = _Utils_ap(
				A2($elm$core$String$repeat, (-r) + 1, '0'),
				A3(
					$elm$core$String$padRight,
					r,
					_Utils_chr('0'),
					_Utils_ap(before, after)));
			var totalLen = $elm$core$String$length(normalized);
			var roundDigitIndex = A2($elm$core$Basics$max, 1, r);
			var increase = A2(
				functor,
				signed,
				A3($elm$core$String$slice, roundDigitIndex, totalLen, normalized));
			var remains = A3($elm$core$String$slice, 0, roundDigitIndex, normalized);
			var num = increase ? $elm$core$String$reverse(
				A2(
					$elm$core$Maybe$withDefault,
					'1',
					A2(
						$elm$core$Maybe$map,
						$myrho$elm_round$Round$increaseNum,
						$elm$core$String$uncons(
							$elm$core$String$reverse(remains))))) : remains;
			var numLen = $elm$core$String$length(num);
			var numZeroed = (num === '0') ? num : ((s <= 0) ? _Utils_ap(
				num,
				A2(
					$elm$core$String$repeat,
					$elm$core$Basics$abs(s),
					'0')) : ((_Utils_cmp(
				s,
				$elm$core$String$length(after)) < 0) ? (A3($elm$core$String$slice, 0, numLen - s, num) + ('.' + A3($elm$core$String$slice, numLen - s, numLen, num))) : _Utils_ap(
				before + '.',
				A3(
					$elm$core$String$padRight,
					s,
					_Utils_chr('0'),
					after))));
			return A2($myrho$elm_round$Round$addSign, signed, numZeroed);
		}
	});
var $myrho$elm_round$Round$round = $myrho$elm_round$Round$roundFun(
	F2(
		function (signed, str) {
			var _v0 = $elm$core$String$uncons(str);
			if (_v0.$ === 'Nothing') {
				return false;
			} else {
				if ('5' === _v0.a.a.valueOf()) {
					if (_v0.a.b === '') {
						var _v1 = _v0.a;
						return !signed;
					} else {
						var _v2 = _v0.a;
						return true;
					}
				} else {
					var _v3 = _v0.a;
					var _int = _v3.a;
					return function (i) {
						return ((i > 53) && signed) || ((i >= 53) && (!signed));
					}(
						$elm$core$Char$toCode(_int));
				}
			}
		}));
var $elm$core$String$toFloat = _String_toFloat;
var $terezka$intervals$Intervals$correctFloat = function (prec) {
	return A2(
		$elm$core$Basics$composeR,
		$myrho$elm_round$Round$round(prec),
		A2(
			$elm$core$Basics$composeR,
			$elm$core$String$toFloat,
			$elm$core$Maybe$withDefault(0)));
};
var $terezka$intervals$Intervals$getMultiples = F3(
	function (magnitude, allowDecimals, hasTickAmount) {
		var defaults = hasTickAmount ? _List_fromArray(
			[1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) : _List_fromArray(
			[1, 2, 2.5, 5, 10]);
		return allowDecimals ? defaults : ((magnitude === 1) ? A2(
			$elm$core$List$filter,
			function (n) {
				return _Utils_eq(
					$elm$core$Basics$round(n),
					n);
			},
			defaults) : ((magnitude <= 0.1) ? _List_fromArray(
			[1 / magnitude]) : defaults));
	});
var $terezka$intervals$Intervals$getPrecision = function (number) {
	var _v0 = A2(
		$elm$core$String$split,
		'e',
		$elm$core$String$fromFloat(number));
	if ((_v0.b && _v0.b.b) && (!_v0.b.b.b)) {
		var before = _v0.a;
		var _v1 = _v0.b;
		var after = _v1.a;
		return $elm$core$Basics$abs(
			A2(
				$elm$core$Maybe$withDefault,
				0,
				$elm$core$String$toInt(after)));
	} else {
		var _v2 = A2(
			$elm$core$String$split,
			'.',
			$elm$core$String$fromFloat(number));
		if ((_v2.b && _v2.b.b) && (!_v2.b.b.b)) {
			var before = _v2.a;
			var _v3 = _v2.b;
			var after = _v3.a;
			return $elm$core$String$length(after);
		} else {
			return 0;
		}
	}
};
var $elm$core$Basics$e = _Basics_e;
var $elm$core$Basics$pow = _Basics_pow;
var $terezka$intervals$Intervals$toMagnitude = function (num) {
	return A2(
		$elm$core$Basics$pow,
		10,
		$elm$core$Basics$floor(
			A2($elm$core$Basics$logBase, $elm$core$Basics$e, num) / A2($elm$core$Basics$logBase, $elm$core$Basics$e, 10)));
};
var $terezka$intervals$Intervals$getInterval = F3(
	function (intervalRaw, allowDecimals, hasTickAmount) {
		var magnitude = $terezka$intervals$Intervals$toMagnitude(intervalRaw);
		var multiples = A3($terezka$intervals$Intervals$getMultiples, magnitude, allowDecimals, hasTickAmount);
		var normalized = intervalRaw / magnitude;
		var findMultipleExact = function (multiples_) {
			findMultipleExact:
			while (true) {
				if (multiples_.b) {
					var m1 = multiples_.a;
					var rest = multiples_.b;
					if (_Utils_cmp(m1 * magnitude, intervalRaw) > -1) {
						return m1;
					} else {
						var $temp$multiples_ = rest;
						multiples_ = $temp$multiples_;
						continue findMultipleExact;
					}
				} else {
					return 1;
				}
			}
		};
		var findMultiple = function (multiples_) {
			findMultiple:
			while (true) {
				if (multiples_.b) {
					if (multiples_.b.b) {
						var m1 = multiples_.a;
						var _v2 = multiples_.b;
						var m2 = _v2.a;
						var rest = _v2.b;
						if (_Utils_cmp(normalized, (m1 + m2) / 2) < 1) {
							return m1;
						} else {
							var $temp$multiples_ = A2($elm$core$List$cons, m2, rest);
							multiples_ = $temp$multiples_;
							continue findMultiple;
						}
					} else {
						var m1 = multiples_.a;
						var rest = multiples_.b;
						if (_Utils_cmp(normalized, m1) < 1) {
							return m1;
						} else {
							var $temp$multiples_ = rest;
							multiples_ = $temp$multiples_;
							continue findMultiple;
						}
					}
				} else {
					return 1;
				}
			}
		};
		var multiple = hasTickAmount ? findMultipleExact(multiples) : findMultiple(multiples);
		var precision = $terezka$intervals$Intervals$getPrecision(magnitude) + $terezka$intervals$Intervals$getPrecision(multiple);
		return A2($terezka$intervals$Intervals$correctFloat, precision, multiple * magnitude);
	});
var $terezka$intervals$Intervals$positions = F5(
	function (range, beginning, interval, m, acc) {
		positions:
		while (true) {
			var nextPosition = A2(
				$terezka$intervals$Intervals$correctFloat,
				$terezka$intervals$Intervals$getPrecision(interval),
				beginning + (m * interval));
			if (_Utils_cmp(nextPosition, range.max) > 0) {
				return acc;
			} else {
				var $temp$range = range,
					$temp$beginning = beginning,
					$temp$interval = interval,
					$temp$m = m + 1,
					$temp$acc = _Utils_ap(
					acc,
					_List_fromArray(
						[nextPosition]));
				range = $temp$range;
				beginning = $temp$beginning;
				interval = $temp$interval;
				m = $temp$m;
				acc = $temp$acc;
				continue positions;
			}
		}
	});
var $terezka$intervals$Intervals$values = F4(
	function (allowDecimals, exact, amountRough, range) {
		var intervalRough = (range.max - range.min) / amountRough;
		var interval = A3($terezka$intervals$Intervals$getInterval, intervalRough, allowDecimals, exact);
		var intervalSafe = (!interval) ? 1 : interval;
		var beginning = A2($terezka$intervals$Intervals$getBeginning, range.min, intervalSafe);
		var amountRoughSafe = (!amountRough) ? 1 : amountRough;
		return A5($terezka$intervals$Intervals$positions, range, beginning, intervalSafe, 0, _List_Nil);
	});
var $terezka$intervals$Intervals$floats = function (amount) {
	if (amount.$ === 'Exactly') {
		var number = amount.a;
		return A3($terezka$intervals$Intervals$values, true, true, number);
	} else {
		var number = amount.a;
		return A3($terezka$intervals$Intervals$values, true, false, number);
	}
};
var $terezka$elm_charts$Internal$Svg$floats = $terezka$elm_charts$Internal$Svg$Generator(
	F2(
		function (i, b) {
			return A2(
				$terezka$intervals$Intervals$floats,
				$terezka$intervals$Intervals$around(i),
				{max: b.max, min: b.min});
		}));
var $terezka$elm_charts$Chart$Svg$floats = $terezka$elm_charts$Internal$Svg$floats;
var $ryan_haskell$date_format$DateFormat$HourMilitaryFixed = {$: 'HourMilitaryFixed'};
var $ryan_haskell$date_format$DateFormat$hourMilitaryFixed = $ryan_haskell$date_format$DateFormat$HourMilitaryFixed;
var $terezka$elm_charts$Internal$Svg$formatClock = $ryan_haskell$date_format$DateFormat$format(
	_List_fromArray(
		[
			$ryan_haskell$date_format$DateFormat$hourMilitaryFixed,
			$ryan_haskell$date_format$DateFormat$text(':'),
			$ryan_haskell$date_format$DateFormat$minuteFixed
		]));
var $ryan_haskell$date_format$DateFormat$MillisecondFixed = {$: 'MillisecondFixed'};
var $ryan_haskell$date_format$DateFormat$millisecondFixed = $ryan_haskell$date_format$DateFormat$MillisecondFixed;
var $ryan_haskell$date_format$DateFormat$SecondFixed = {$: 'SecondFixed'};
var $ryan_haskell$date_format$DateFormat$secondFixed = $ryan_haskell$date_format$DateFormat$SecondFixed;
var $terezka$elm_charts$Internal$Svg$formatClockMillis = $ryan_haskell$date_format$DateFormat$format(
	_List_fromArray(
		[
			$ryan_haskell$date_format$DateFormat$hourMilitaryFixed,
			$ryan_haskell$date_format$DateFormat$text(':'),
			$ryan_haskell$date_format$DateFormat$minuteFixed,
			$ryan_haskell$date_format$DateFormat$text(':'),
			$ryan_haskell$date_format$DateFormat$secondFixed,
			$ryan_haskell$date_format$DateFormat$text(':'),
			$ryan_haskell$date_format$DateFormat$millisecondFixed
		]));
var $terezka$elm_charts$Internal$Svg$formatClockSecond = $ryan_haskell$date_format$DateFormat$format(
	_List_fromArray(
		[
			$ryan_haskell$date_format$DateFormat$hourMilitaryFixed,
			$ryan_haskell$date_format$DateFormat$text(':'),
			$ryan_haskell$date_format$DateFormat$minuteFixed,
			$ryan_haskell$date_format$DateFormat$text(':'),
			$ryan_haskell$date_format$DateFormat$secondFixed
		]));
var $terezka$elm_charts$Internal$Svg$formatDate = $ryan_haskell$date_format$DateFormat$format(
	_List_fromArray(
		[
			$ryan_haskell$date_format$DateFormat$monthNumber,
			$ryan_haskell$date_format$DateFormat$text('/'),
			$ryan_haskell$date_format$DateFormat$dayOfMonthNumber
		]));
var $terezka$elm_charts$Internal$Svg$formatMonth = $ryan_haskell$date_format$DateFormat$format(
	_List_fromArray(
		[$ryan_haskell$date_format$DateFormat$monthNameAbbreviated]));
var $ryan_haskell$date_format$DateFormat$DayOfWeekNameFull = {$: 'DayOfWeekNameFull'};
var $ryan_haskell$date_format$DateFormat$dayOfWeekNameFull = $ryan_haskell$date_format$DateFormat$DayOfWeekNameFull;
var $terezka$elm_charts$Internal$Svg$formatWeekday = $ryan_haskell$date_format$DateFormat$format(
	_List_fromArray(
		[$ryan_haskell$date_format$DateFormat$dayOfWeekNameFull]));
var $terezka$elm_charts$Internal$Svg$formatYear = $ryan_haskell$date_format$DateFormat$format(
	_List_fromArray(
		[$ryan_haskell$date_format$DateFormat$yearNumber]));
var $terezka$elm_charts$Internal$Svg$formatTime = F2(
	function (zone, time) {
		var _v0 = A2($elm$core$Maybe$withDefault, time.unit, time.change);
		switch (_v0.$) {
			case 'Millisecond':
				return A2($terezka$elm_charts$Internal$Svg$formatClockMillis, zone, time.timestamp);
			case 'Second':
				return A2($terezka$elm_charts$Internal$Svg$formatClockSecond, zone, time.timestamp);
			case 'Minute':
				return A2($terezka$elm_charts$Internal$Svg$formatClock, zone, time.timestamp);
			case 'Hour':
				return A2($terezka$elm_charts$Internal$Svg$formatClock, zone, time.timestamp);
			case 'Day':
				return (time.multiple === 7) ? A2($terezka$elm_charts$Internal$Svg$formatWeekday, zone, time.timestamp) : A2($terezka$elm_charts$Internal$Svg$formatDate, zone, time.timestamp);
			case 'Month':
				return A2($terezka$elm_charts$Internal$Svg$formatMonth, zone, time.timestamp);
			default:
				return A2($terezka$elm_charts$Internal$Svg$formatYear, zone, time.timestamp);
		}
	});
var $terezka$elm_charts$Chart$Svg$formatTime = $terezka$elm_charts$Internal$Svg$formatTime;
var $terezka$elm_charts$Internal$Svg$generate = F3(
	function (amount, _v0, limits) {
		var func = _v0.a;
		return A2(func, amount, limits);
	});
var $terezka$elm_charts$Chart$Svg$generate = $terezka$elm_charts$Internal$Svg$generate;
var $terezka$intervals$Intervals$ints = F2(
	function (amount, range) {
		return A2(
			$elm$core$List$map,
			$elm$core$Basics$round,
			function () {
				if (amount.$ === 'Exactly') {
					var number = amount.a;
					return A4($terezka$intervals$Intervals$values, false, true, number, range);
				} else {
					var number = amount.a;
					return A4($terezka$intervals$Intervals$values, false, false, number, range);
				}
			}());
	});
var $terezka$elm_charts$Internal$Svg$ints = $terezka$elm_charts$Internal$Svg$Generator(
	F2(
		function (i, b) {
			return A2(
				$terezka$intervals$Intervals$ints,
				$terezka$intervals$Intervals$around(i),
				{max: b.max, min: b.min});
		}));
var $terezka$elm_charts$Chart$Svg$ints = $terezka$elm_charts$Internal$Svg$ints;
var $terezka$intervals$Intervals$Day = {$: 'Day'};
var $terezka$intervals$Intervals$Hour = {$: 'Hour'};
var $terezka$intervals$Intervals$Millisecond = {$: 'Millisecond'};
var $terezka$intervals$Intervals$Minute = {$: 'Minute'};
var $terezka$intervals$Intervals$Month = {$: 'Month'};
var $terezka$intervals$Intervals$Second = {$: 'Second'};
var $terezka$intervals$Intervals$Year = {$: 'Year'};
var $justinmimbs$date$Date$Days = {$: 'Days'};
var $justinmimbs$time_extra$Time$Extra$Millisecond = {$: 'Millisecond'};
var $justinmimbs$time_extra$Time$Extra$Month = {$: 'Month'};
var $justinmimbs$date$Date$Months = {$: 'Months'};
var $justinmimbs$date$Date$add = F3(
	function (unit, n, _v0) {
		var rd = _v0.a;
		switch (unit.$) {
			case 'Years':
				return A3(
					$justinmimbs$date$Date$add,
					$justinmimbs$date$Date$Months,
					12 * n,
					$justinmimbs$date$Date$RD(rd));
			case 'Months':
				var date = $justinmimbs$date$Date$toCalendarDate(
					$justinmimbs$date$Date$RD(rd));
				var wholeMonths = ((12 * (date.year - 1)) + ($justinmimbs$date$Date$monthToNumber(date.month) - 1)) + n;
				var m = $justinmimbs$date$Date$numberToMonth(
					A2($elm$core$Basics$modBy, 12, wholeMonths) + 1);
				var y = A2($justinmimbs$date$Date$floorDiv, wholeMonths, 12) + 1;
				return $justinmimbs$date$Date$RD(
					($justinmimbs$date$Date$daysBeforeYear(y) + A2($justinmimbs$date$Date$daysBeforeMonth, y, m)) + A2(
						$elm$core$Basics$min,
						date.day,
						A2($justinmimbs$date$Date$daysInMonth, y, m)));
			case 'Weeks':
				return $justinmimbs$date$Date$RD(rd + (7 * n));
			default:
				return $justinmimbs$date$Date$RD(rd + n);
		}
	});
var $justinmimbs$time_extra$Time$Extra$add = F4(
	function (interval, n, zone, posix) {
		add:
		while (true) {
			switch (interval.$) {
				case 'Millisecond':
					return $elm$time$Time$millisToPosix(
						$elm$time$Time$posixToMillis(posix) + n);
				case 'Second':
					var $temp$interval = $justinmimbs$time_extra$Time$Extra$Millisecond,
						$temp$n = n * 1000,
						$temp$zone = zone,
						$temp$posix = posix;
					interval = $temp$interval;
					n = $temp$n;
					zone = $temp$zone;
					posix = $temp$posix;
					continue add;
				case 'Minute':
					var $temp$interval = $justinmimbs$time_extra$Time$Extra$Millisecond,
						$temp$n = n * 60000,
						$temp$zone = zone,
						$temp$posix = posix;
					interval = $temp$interval;
					n = $temp$n;
					zone = $temp$zone;
					posix = $temp$posix;
					continue add;
				case 'Hour':
					var $temp$interval = $justinmimbs$time_extra$Time$Extra$Millisecond,
						$temp$n = n * 3600000,
						$temp$zone = zone,
						$temp$posix = posix;
					interval = $temp$interval;
					n = $temp$n;
					zone = $temp$zone;
					posix = $temp$posix;
					continue add;
				case 'Day':
					return A3(
						$justinmimbs$time_extra$Time$Extra$posixFromDateTime,
						zone,
						A3(
							$justinmimbs$date$Date$add,
							$justinmimbs$date$Date$Days,
							n,
							A2($justinmimbs$date$Date$fromPosix, zone, posix)),
						A2($justinmimbs$time_extra$Time$Extra$timeFromPosix, zone, posix));
				case 'Month':
					return A3(
						$justinmimbs$time_extra$Time$Extra$posixFromDateTime,
						zone,
						A3(
							$justinmimbs$date$Date$add,
							$justinmimbs$date$Date$Months,
							n,
							A2($justinmimbs$date$Date$fromPosix, zone, posix)),
						A2($justinmimbs$time_extra$Time$Extra$timeFromPosix, zone, posix));
				case 'Year':
					var $temp$interval = $justinmimbs$time_extra$Time$Extra$Month,
						$temp$n = n * 12,
						$temp$zone = zone,
						$temp$posix = posix;
					interval = $temp$interval;
					n = $temp$n;
					zone = $temp$zone;
					posix = $temp$posix;
					continue add;
				case 'Quarter':
					var $temp$interval = $justinmimbs$time_extra$Time$Extra$Month,
						$temp$n = n * 3,
						$temp$zone = zone,
						$temp$posix = posix;
					interval = $temp$interval;
					n = $temp$n;
					zone = $temp$zone;
					posix = $temp$posix;
					continue add;
				case 'Week':
					var $temp$interval = $justinmimbs$time_extra$Time$Extra$Day,
						$temp$n = n * 7,
						$temp$zone = zone,
						$temp$posix = posix;
					interval = $temp$interval;
					n = $temp$n;
					zone = $temp$zone;
					posix = $temp$posix;
					continue add;
				default:
					var weekday = interval;
					var $temp$interval = $justinmimbs$time_extra$Time$Extra$Day,
						$temp$n = n * 7,
						$temp$zone = zone,
						$temp$posix = posix;
					interval = $temp$interval;
					n = $temp$n;
					zone = $temp$zone;
					posix = $temp$posix;
					continue add;
			}
		}
	});
var $justinmimbs$time_extra$Time$Extra$Week = {$: 'Week'};
var $justinmimbs$time_extra$Time$Extra$ceiling = F3(
	function (interval, zone, posix) {
		var floored = A3($justinmimbs$time_extra$Time$Extra$floor, interval, zone, posix);
		return _Utils_eq(floored, posix) ? posix : A4($justinmimbs$time_extra$Time$Extra$add, interval, 1, zone, floored);
	});
var $terezka$intervals$Intervals$Time$ceilingDay = F3(
	function (zone, mult, stamp) {
		return (mult === 7) ? A3($justinmimbs$time_extra$Time$Extra$ceiling, $justinmimbs$time_extra$Time$Extra$Week, zone, stamp) : A3($justinmimbs$time_extra$Time$Extra$ceiling, $justinmimbs$time_extra$Time$Extra$Day, zone, stamp);
	});
var $justinmimbs$time_extra$Time$Extra$Hour = {$: 'Hour'};
var $justinmimbs$time_extra$Time$Extra$posixToParts = F2(
	function (zone, posix) {
		return {
			day: A2($elm$time$Time$toDay, zone, posix),
			hour: A2($elm$time$Time$toHour, zone, posix),
			millisecond: A2($elm$time$Time$toMillis, zone, posix),
			minute: A2($elm$time$Time$toMinute, zone, posix),
			month: A2($elm$time$Time$toMonth, zone, posix),
			second: A2($elm$time$Time$toSecond, zone, posix),
			year: A2($elm$time$Time$toYear, zone, posix)
		};
	});
var $terezka$intervals$Intervals$Time$ceilingHour = F3(
	function (zone, mult, stamp) {
		var parts = A2(
			$justinmimbs$time_extra$Time$Extra$posixToParts,
			zone,
			A3($justinmimbs$time_extra$Time$Extra$ceiling, $justinmimbs$time_extra$Time$Extra$Hour, zone, stamp));
		var rem = parts.hour % mult;
		var _new = A2($justinmimbs$time_extra$Time$Extra$partsToPosix, zone, parts);
		return (!rem) ? _new : A4($justinmimbs$time_extra$Time$Extra$add, $justinmimbs$time_extra$Time$Extra$Hour, mult - rem, zone, _new);
	});
var $justinmimbs$time_extra$Time$Extra$Minute = {$: 'Minute'};
var $terezka$intervals$Intervals$Time$ceilingMinute = F3(
	function (zone, mult, stamp) {
		var parts = A2(
			$justinmimbs$time_extra$Time$Extra$posixToParts,
			zone,
			A3($justinmimbs$time_extra$Time$Extra$ceiling, $justinmimbs$time_extra$Time$Extra$Minute, zone, stamp));
		var rem = parts.minute % mult;
		var _new = A2($justinmimbs$time_extra$Time$Extra$partsToPosix, zone, parts);
		return (!rem) ? _new : A4($justinmimbs$time_extra$Time$Extra$add, $justinmimbs$time_extra$Time$Extra$Minute, mult - rem, zone, _new);
	});
var $terezka$intervals$Intervals$Time$intAsMonth = function (_int) {
	switch (_int) {
		case 1:
			return $elm$time$Time$Jan;
		case 2:
			return $elm$time$Time$Feb;
		case 3:
			return $elm$time$Time$Mar;
		case 4:
			return $elm$time$Time$Apr;
		case 5:
			return $elm$time$Time$May;
		case 6:
			return $elm$time$Time$Jun;
		case 7:
			return $elm$time$Time$Jul;
		case 8:
			return $elm$time$Time$Aug;
		case 9:
			return $elm$time$Time$Sep;
		case 10:
			return $elm$time$Time$Oct;
		case 11:
			return $elm$time$Time$Nov;
		case 12:
			return $elm$time$Time$Dec;
		default:
			return $elm$time$Time$Dec;
	}
};
var $terezka$intervals$Intervals$Time$monthAsInt = function (month) {
	switch (month.$) {
		case 'Jan':
			return 1;
		case 'Feb':
			return 2;
		case 'Mar':
			return 3;
		case 'Apr':
			return 4;
		case 'May':
			return 5;
		case 'Jun':
			return 6;
		case 'Jul':
			return 7;
		case 'Aug':
			return 8;
		case 'Sep':
			return 9;
		case 'Oct':
			return 10;
		case 'Nov':
			return 11;
		default:
			return 12;
	}
};
var $terezka$intervals$Intervals$Time$ceilingMonth = F3(
	function (zone, mult, stamp) {
		var parts = A2(
			$justinmimbs$time_extra$Time$Extra$posixToParts,
			zone,
			A3($justinmimbs$time_extra$Time$Extra$ceiling, $justinmimbs$time_extra$Time$Extra$Month, zone, stamp));
		var monthInt = $terezka$intervals$Intervals$Time$monthAsInt(parts.month);
		var rem = (monthInt - 1) % mult;
		var newMonth = (!rem) ? monthInt : ((monthInt - rem) + mult);
		return A2(
			$justinmimbs$time_extra$Time$Extra$partsToPosix,
			zone,
			(newMonth > 12) ? _Utils_update(
				parts,
				{
					month: $terezka$intervals$Intervals$Time$intAsMonth(newMonth - 12),
					year: parts.year + 1
				}) : _Utils_update(
				parts,
				{
					month: $terezka$intervals$Intervals$Time$intAsMonth(newMonth)
				}));
	});
var $terezka$intervals$Intervals$Time$ceilingMs = F3(
	function (zone, mult, stamp) {
		var parts = A2($justinmimbs$time_extra$Time$Extra$posixToParts, zone, stamp);
		var rem = parts.millisecond % mult;
		return (!rem) ? A2($justinmimbs$time_extra$Time$Extra$partsToPosix, zone, parts) : A4($justinmimbs$time_extra$Time$Extra$add, $justinmimbs$time_extra$Time$Extra$Millisecond, mult - rem, zone, stamp);
	});
var $justinmimbs$time_extra$Time$Extra$Second = {$: 'Second'};
var $terezka$intervals$Intervals$Time$ceilingSecond = F3(
	function (zone, mult, stamp) {
		var parts = A2(
			$justinmimbs$time_extra$Time$Extra$posixToParts,
			zone,
			A3($justinmimbs$time_extra$Time$Extra$ceiling, $justinmimbs$time_extra$Time$Extra$Second, zone, stamp));
		var rem = parts.second % mult;
		var _new = A2($justinmimbs$time_extra$Time$Extra$partsToPosix, zone, parts);
		return (!rem) ? _new : A4($justinmimbs$time_extra$Time$Extra$add, $justinmimbs$time_extra$Time$Extra$Second, mult - rem, zone, _new);
	});
var $justinmimbs$time_extra$Time$Extra$Year = {$: 'Year'};
var $terezka$intervals$Intervals$Time$ceilingYear = F3(
	function (zone, mult, stamp) {
		var parts = A2(
			$justinmimbs$time_extra$Time$Extra$posixToParts,
			zone,
			A3($justinmimbs$time_extra$Time$Extra$ceiling, $justinmimbs$time_extra$Time$Extra$Year, zone, stamp));
		var rem = parts.year % mult;
		var newYear = (!rem) ? parts.year : ((parts.year - rem) + mult);
		return A2(
			$justinmimbs$time_extra$Time$Extra$partsToPosix,
			zone,
			_Utils_update(
				parts,
				{year: newYear}));
	});
var $terezka$intervals$Intervals$Time$ceilingUnit = F3(
	function (zone, unit, mult) {
		switch (unit.$) {
			case 'Millisecond':
				return A2($terezka$intervals$Intervals$Time$ceilingMs, zone, mult);
			case 'Second':
				return A2($terezka$intervals$Intervals$Time$ceilingSecond, zone, mult);
			case 'Minute':
				return A2($terezka$intervals$Intervals$Time$ceilingMinute, zone, mult);
			case 'Hour':
				return A2($terezka$intervals$Intervals$Time$ceilingHour, zone, mult);
			case 'Day':
				return A2($terezka$intervals$Intervals$Time$ceilingDay, zone, mult);
			case 'Month':
				return A2($terezka$intervals$Intervals$Time$ceilingMonth, zone, mult);
			default:
				return A2($terezka$intervals$Intervals$Time$ceilingYear, zone, mult);
		}
	});
var $terezka$intervals$Intervals$Time$Day = {$: 'Day'};
var $terezka$intervals$Intervals$Time$Hour = {$: 'Hour'};
var $terezka$intervals$Intervals$Time$Millisecond = {$: 'Millisecond'};
var $terezka$intervals$Intervals$Time$Minute = {$: 'Minute'};
var $terezka$intervals$Intervals$Time$Month = {$: 'Month'};
var $terezka$intervals$Intervals$Time$Second = {$: 'Second'};
var $terezka$intervals$Intervals$Time$Year = {$: 'Year'};
var $terezka$intervals$Intervals$Time$getChange = F3(
	function (zone, a, b) {
		var bP = A2($justinmimbs$time_extra$Time$Extra$posixToParts, zone, b);
		var aP = A2($justinmimbs$time_extra$Time$Extra$posixToParts, zone, a);
		return (!_Utils_eq(aP.year, bP.year)) ? $terezka$intervals$Intervals$Time$Year : ((!_Utils_eq(aP.month, bP.month)) ? $terezka$intervals$Intervals$Time$Month : ((!_Utils_eq(aP.day, bP.day)) ? $terezka$intervals$Intervals$Time$Day : ((!_Utils_eq(aP.hour, bP.hour)) ? $terezka$intervals$Intervals$Time$Hour : ((!_Utils_eq(aP.minute, bP.minute)) ? $terezka$intervals$Intervals$Time$Minute : ((!_Utils_eq(aP.second, bP.second)) ? $terezka$intervals$Intervals$Time$Second : $terezka$intervals$Intervals$Time$Millisecond)))));
	});
var $danhandrea$elm_time_extra$Util$isLeapYear = function (year) {
	return (!A2($elm$core$Basics$modBy, 400, year)) || ((!(!A2($elm$core$Basics$modBy, 100, year))) && (!A2($elm$core$Basics$modBy, 4, year)));
};
var $danhandrea$elm_time_extra$Month$days = F2(
	function (year, month) {
		switch (month.$) {
			case 'Jan':
				return 31;
			case 'Feb':
				return $danhandrea$elm_time_extra$Util$isLeapYear(year) ? 29 : 28;
			case 'Mar':
				return 31;
			case 'Apr':
				return 30;
			case 'May':
				return 31;
			case 'Jun':
				return 30;
			case 'Jul':
				return 31;
			case 'Aug':
				return 31;
			case 'Sep':
				return 30;
			case 'Oct':
				return 31;
			case 'Nov':
				return 30;
			default:
				return 31;
		}
	});
var $danhandrea$elm_time_extra$TimeExtra$daysInMonth = $danhandrea$elm_time_extra$Month$days;
var $terezka$intervals$Intervals$Time$toMs = $elm$time$Time$posixToMillis;
var $terezka$intervals$Intervals$Time$getDiff = F3(
	function (zone, a, b) {
		var _v0 = (_Utils_cmp(
			$terezka$intervals$Intervals$Time$toMs(a),
			$terezka$intervals$Intervals$Time$toMs(b)) < 0) ? _Utils_Tuple2(
			A2($justinmimbs$time_extra$Time$Extra$posixToParts, zone, a),
			A2($justinmimbs$time_extra$Time$Extra$posixToParts, zone, b)) : _Utils_Tuple2(
			A2($justinmimbs$time_extra$Time$Extra$posixToParts, zone, b),
			A2($justinmimbs$time_extra$Time$Extra$posixToParts, zone, a));
		var aP = _v0.a;
		var bP = _v0.b;
		var dMsX = bP.millisecond - aP.millisecond;
		var dMs = (dMsX < 0) ? (1000 + dMsX) : dMsX;
		var dSecondX = (bP.second - aP.second) + ((dMsX < 0) ? (-1) : 0);
		var dMinuteX = (bP.minute - aP.minute) + ((dSecondX < 0) ? (-1) : 0);
		var dHourX = (bP.hour - aP.hour) + ((dMinuteX < 0) ? (-1) : 0);
		var dDayX = (bP.day - aP.day) + ((dHourX < 0) ? (-1) : 0);
		var dDay = (dDayX < 0) ? (A2($danhandrea$elm_time_extra$TimeExtra$daysInMonth, bP.year, bP.month) + dDayX) : dDayX;
		var dMonthX = ($terezka$intervals$Intervals$Time$monthAsInt(bP.month) - $terezka$intervals$Intervals$Time$monthAsInt(aP.month)) + ((dDayX < 0) ? (-1) : 0);
		var dMonth = (dMonthX < 0) ? (12 + dMonthX) : dMonthX;
		var dHour = (dHourX < 0) ? (24 + dHourX) : dHourX;
		var dMinute = (dMinuteX < 0) ? (60 + dMinuteX) : dMinuteX;
		var dSecond = (dSecondX < 0) ? (60 + dSecondX) : dSecondX;
		var dYearX = (bP.year - aP.year) + ((dMonthX < 0) ? (-1) : 0);
		var dYear = (dYearX < 0) ? ($terezka$intervals$Intervals$Time$monthAsInt(bP.month) + dYearX) : dYearX;
		return {day: dDay, hour: dHour, millisecond: dMs, minute: dMinute, month: dMonth, second: dSecond, year: dYear};
	});
var $terezka$intervals$Intervals$Time$oneSecond = 1000;
var $terezka$intervals$Intervals$Time$oneMinute = $terezka$intervals$Intervals$Time$oneSecond * 60;
var $terezka$intervals$Intervals$Time$oneHour = $terezka$intervals$Intervals$Time$oneMinute * 60;
var $terezka$intervals$Intervals$Time$oneDay = $terezka$intervals$Intervals$Time$oneHour * 24;
var $terezka$intervals$Intervals$Time$oneMs = 1;
var $terezka$intervals$Intervals$Time$getNumOfTicks = F5(
	function (zone, unit, mult, a, b) {
		var div = F2(
			function (n1, n2) {
				return $elm$core$Basics$floor(n1 / n2);
			});
		var timeDiff = function (ms) {
			var ceiled = A4($terezka$intervals$Intervals$Time$ceilingUnit, zone, unit, mult, a);
			return (_Utils_cmp(
				$terezka$intervals$Intervals$Time$toMs(ceiled),
				$terezka$intervals$Intervals$Time$toMs(b)) > 0) ? (-1) : A2(
				div,
				A2(
					div,
					$terezka$intervals$Intervals$Time$toMs(b) - $terezka$intervals$Intervals$Time$toMs(ceiled),
					ms),
				mult);
		};
		var diff = function (property) {
			var ceiled = A4($terezka$intervals$Intervals$Time$ceilingUnit, zone, unit, mult, a);
			return (_Utils_cmp(
				$terezka$intervals$Intervals$Time$toMs(ceiled),
				$terezka$intervals$Intervals$Time$toMs(b)) > 0) ? (-1) : A2(
				div,
				property(
					A3($terezka$intervals$Intervals$Time$getDiff, zone, ceiled, b)),
				mult);
		};
		switch (unit.$) {
			case 'Millisecond':
				return timeDiff($terezka$intervals$Intervals$Time$oneMs) + 1;
			case 'Second':
				return timeDiff($terezka$intervals$Intervals$Time$oneSecond) + 1;
			case 'Minute':
				return timeDiff($terezka$intervals$Intervals$Time$oneMinute) + 1;
			case 'Hour':
				return timeDiff($terezka$intervals$Intervals$Time$oneHour) + 1;
			case 'Day':
				return timeDiff($terezka$intervals$Intervals$Time$oneDay) + 1;
			case 'Month':
				return diff(
					function (d) {
						return d.month + (d.year * 12);
					}) + 1;
			default:
				return diff(
					function ($) {
						return $.year;
					}) + 1;
		}
	});
var $terezka$intervals$Intervals$Time$largerUnit = function (unit) {
	switch (unit.$) {
		case 'Millisecond':
			return $elm$core$Maybe$Just($terezka$intervals$Intervals$Time$Second);
		case 'Second':
			return $elm$core$Maybe$Just($terezka$intervals$Intervals$Time$Minute);
		case 'Minute':
			return $elm$core$Maybe$Just($terezka$intervals$Intervals$Time$Hour);
		case 'Hour':
			return $elm$core$Maybe$Just($terezka$intervals$Intervals$Time$Day);
		case 'Day':
			return $elm$core$Maybe$Just($terezka$intervals$Intervals$Time$Month);
		case 'Month':
			return $elm$core$Maybe$Just($terezka$intervals$Intervals$Time$Year);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $terezka$intervals$Intervals$Time$niceMultiples = function (unit) {
	switch (unit.$) {
		case 'Millisecond':
			return _List_fromArray(
				[1, 2, 5, 10, 20, 25, 50, 100, 200, 500]);
		case 'Second':
			return _List_fromArray(
				[1, 2, 5, 10, 15, 30]);
		case 'Minute':
			return _List_fromArray(
				[1, 2, 5, 10, 15, 30]);
		case 'Hour':
			return _List_fromArray(
				[1, 2, 3, 4, 6, 8, 12]);
		case 'Day':
			return _List_fromArray(
				[1, 2, 3, 7, 14]);
		case 'Month':
			return _List_fromArray(
				[1, 2, 3, 4, 6]);
		default:
			return _List_fromArray(
				[1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000, 10000, 1000000, 10000000]);
	}
};
var $terezka$intervals$Intervals$Time$toBestUnit = F4(
	function (zone, amount, min, max) {
		var toNice = function (unit) {
			toNice:
			while (true) {
				var niceNums = $terezka$intervals$Intervals$Time$niceMultiples(unit);
				var maybeNiceNum = A2(
					$elm$core$List$filter,
					function (n) {
						return _Utils_cmp(
							A5($terezka$intervals$Intervals$Time$getNumOfTicks, zone, unit, n, min, max),
							amount) < 1;
					},
					niceNums);
				var div = F2(
					function (n1, n2) {
						return $elm$core$Basics$ceiling(n1 / n2);
					});
				var _v0 = $elm$core$List$head(maybeNiceNum);
				if (_v0.$ === 'Just') {
					var niceNum = _v0.a;
					return _Utils_Tuple2(unit, niceNum);
				} else {
					var _v1 = $terezka$intervals$Intervals$Time$largerUnit(unit);
					if (_v1.$ === 'Just') {
						var larger = _v1.a;
						var $temp$unit = larger;
						unit = $temp$unit;
						continue toNice;
					} else {
						return _Utils_Tuple2($terezka$intervals$Intervals$Time$Year, 100000000);
					}
				}
			}
		};
		return toNice($terezka$intervals$Intervals$Time$Millisecond);
	});
var $terezka$intervals$Intervals$Time$toExtraUnit = function (unit) {
	switch (unit.$) {
		case 'Millisecond':
			return $justinmimbs$time_extra$Time$Extra$Millisecond;
		case 'Second':
			return $justinmimbs$time_extra$Time$Extra$Second;
		case 'Minute':
			return $justinmimbs$time_extra$Time$Extra$Minute;
		case 'Hour':
			return $justinmimbs$time_extra$Time$Extra$Hour;
		case 'Day':
			return $justinmimbs$time_extra$Time$Extra$Day;
		case 'Month':
			return $justinmimbs$time_extra$Time$Extra$Month;
		default:
			return $justinmimbs$time_extra$Time$Extra$Year;
	}
};
var $terezka$intervals$Intervals$Time$unitToInt = function (unit) {
	switch (unit.$) {
		case 'Millisecond':
			return 0;
		case 'Second':
			return 1;
		case 'Minute':
			return 2;
		case 'Hour':
			return 3;
		case 'Day':
			return 4;
		case 'Month':
			return 5;
		default:
			return 6;
	}
};
var $terezka$intervals$Intervals$Time$values = F4(
	function (zone, maxMmount, min, max) {
		var _v0 = A4($terezka$intervals$Intervals$Time$toBestUnit, zone, maxMmount, min, max);
		var unit = _v0.a;
		var mult = _v0.b;
		var amount = A5($terezka$intervals$Intervals$Time$getNumOfTicks, zone, unit, mult, min, max);
		var initial = A4($terezka$intervals$Intervals$Time$ceilingUnit, zone, unit, mult, min);
		var tUnit = $terezka$intervals$Intervals$Time$toExtraUnit(unit);
		var toTick = F3(
			function (x, timestamp, change) {
				return {
					change: (_Utils_cmp(
						$terezka$intervals$Intervals$Time$unitToInt(change),
						$terezka$intervals$Intervals$Time$unitToInt(unit)) > 0) ? $elm$core$Maybe$Just(change) : $elm$core$Maybe$Nothing,
					isFirst: !x,
					multiple: mult,
					timestamp: timestamp,
					unit: unit,
					zone: zone
				};
			});
		var toTicks = F2(
			function (xs, acc) {
				toTicks:
				while (true) {
					if (xs.b) {
						var x = xs.a;
						var rest = xs.b;
						var prev = A4($justinmimbs$time_extra$Time$Extra$add, tUnit, (x - 1) * mult, zone, initial);
						var curr = A4($justinmimbs$time_extra$Time$Extra$add, tUnit, x * mult, zone, initial);
						var change = A3($terezka$intervals$Intervals$Time$getChange, zone, prev, curr);
						var $temp$xs = rest,
							$temp$acc = A2(
							$elm$core$List$cons,
							A3(toTick, x, curr, change),
							acc);
						xs = $temp$xs;
						acc = $temp$acc;
						continue toTicks;
					} else {
						return acc;
					}
				}
			});
		return $elm$core$List$reverse(
			A2(
				toTicks,
				A2($elm$core$List$range, 0, amount - 1),
				_List_Nil));
	});
var $terezka$intervals$Intervals$times = F3(
	function (zone, amount, range) {
		var toUnit = function (unit) {
			switch (unit.$) {
				case 'Millisecond':
					return $terezka$intervals$Intervals$Millisecond;
				case 'Second':
					return $terezka$intervals$Intervals$Second;
				case 'Minute':
					return $terezka$intervals$Intervals$Minute;
				case 'Hour':
					return $terezka$intervals$Intervals$Hour;
				case 'Day':
					return $terezka$intervals$Intervals$Day;
				case 'Month':
					return $terezka$intervals$Intervals$Month;
				default:
					return $terezka$intervals$Intervals$Year;
			}
		};
		var translateUnit = function (time) {
			return {
				change: A2($elm$core$Maybe$map, toUnit, time.change),
				isFirst: time.isFirst,
				multiple: time.multiple,
				timestamp: time.timestamp,
				unit: toUnit(time.unit),
				zone: time.zone
			};
		};
		var fromMs = function (ts) {
			return $elm$time$Time$millisToPosix(
				$elm$core$Basics$round(ts));
		};
		return A2(
			$elm$core$List$map,
			translateUnit,
			A4(
				$terezka$intervals$Intervals$Time$values,
				zone,
				amount,
				fromMs(range.min),
				fromMs(range.max)));
	});
var $terezka$elm_charts$Internal$Svg$times = function (zone) {
	return $terezka$elm_charts$Internal$Svg$Generator(
		F2(
			function (i, b) {
				return A3(
					$terezka$intervals$Intervals$times,
					zone,
					i,
					{max: b.max, min: b.min});
			}));
};
var $terezka$elm_charts$Chart$Svg$times = $terezka$elm_charts$Internal$Svg$times;
var $terezka$elm_charts$Chart$generateValues = F4(
	function (amount, tick, maybeFormat, axis) {
		var toTickValues = F2(
			function (toValue, toString) {
				return $elm$core$List$map(
					function (i) {
						return {
							label: function () {
								if (maybeFormat.$ === 'Just') {
									var formatter = maybeFormat.a;
									return formatter(
										toValue(i));
								} else {
									return toString(i);
								}
							}(),
							value: toValue(i)
						};
					});
			});
		switch (tick.$) {
			case 'Floats':
				return A3(
					toTickValues,
					$elm$core$Basics$identity,
					$elm$core$String$fromFloat,
					A3($terezka$elm_charts$Chart$Svg$generate, amount, $terezka$elm_charts$Chart$Svg$floats, axis));
			case 'Ints':
				return A3(
					toTickValues,
					$elm$core$Basics$toFloat,
					$elm$core$String$fromInt,
					A3($terezka$elm_charts$Chart$Svg$generate, amount, $terezka$elm_charts$Chart$Svg$ints, axis));
			default:
				var zone = tick.a;
				return A3(
					toTickValues,
					A2(
						$elm$core$Basics$composeL,
						A2($elm$core$Basics$composeL, $elm$core$Basics$toFloat, $elm$time$Time$posixToMillis),
						function ($) {
							return $.timestamp;
						}),
					$terezka$elm_charts$Chart$Svg$formatTime(zone),
					A3(
						$terezka$elm_charts$Chart$Svg$generate,
						amount,
						$terezka$elm_charts$Chart$Svg$times(zone),
						axis));
		}
	});
var $elm$virtual_dom$VirtualDom$attribute = F2(
	function (key, value) {
		return A2(
			_VirtualDom_attribute,
			_VirtualDom_noOnOrFormAction(key),
			_VirtualDom_noJavaScriptOrHtmlUri(value));
	});
var $elm$html$Html$Attributes$attribute = $elm$virtual_dom$VirtualDom$attribute;
var $elm$svg$Svg$foreignObject = $elm$svg$Svg$trustedNode('foreignObject');
var $elm$svg$Svg$text_ = $elm$svg$Svg$trustedNode('text');
var $elm$svg$Svg$tspan = $elm$svg$Svg$trustedNode('tspan');
var $terezka$elm_charts$Internal$Svg$label = F4(
	function (plane, config, inner, point) {
		var _v0 = config.ellipsis;
		if (_v0.$ === 'Nothing') {
			var withOverflowWrap = function (el) {
				return config.hideOverflow ? A2(
					$elm$svg$Svg$g,
					_List_fromArray(
						[
							$terezka$elm_charts$Internal$Svg$withinChartArea(plane)
						]),
					_List_fromArray(
						[el])) : el;
			};
			var uppercaseStyle = config.uppercase ? 'text-transform: uppercase;' : '';
			var fontStyle = function () {
				var _v5 = config.fontSize;
				if (_v5.$ === 'Just') {
					var size_ = _v5.a;
					return 'font-size: ' + ($elm$core$String$fromInt(size_) + 'px;');
				} else {
					return '';
				}
			}();
			var anchorStyle = function () {
				var _v1 = config.anchor;
				if (_v1.$ === 'Nothing') {
					return 'text-anchor: middle;';
				} else {
					switch (_v1.a.$) {
						case 'End':
							var _v2 = _v1.a;
							return 'text-anchor: end;';
						case 'Start':
							var _v3 = _v1.a;
							return 'text-anchor: start;';
						default:
							var _v4 = _v1.a;
							return 'text-anchor: middle;';
					}
				}
			}();
			return withOverflowWrap(
				A4(
					$terezka$elm_charts$Internal$Svg$withAttrs,
					config.attrs,
					$elm$svg$Svg$text_,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$class('elm-charts__label'),
							$elm$svg$Svg$Attributes$stroke(config.border),
							$elm$svg$Svg$Attributes$strokeWidth(
							$elm$core$String$fromFloat(config.borderWidth)),
							$elm$svg$Svg$Attributes$fill(config.color),
							A6($terezka$elm_charts$Internal$Svg$position, plane, -config.rotate, point.x, point.y, config.xOff, config.yOff),
							$elm$svg$Svg$Attributes$style(
							A2(
								$elm$core$String$join,
								' ',
								_List_fromArray(
									['pointer-events: none;', fontStyle, anchorStyle, uppercaseStyle])))
						]),
					_List_fromArray(
						[
							A2($elm$svg$Svg$tspan, _List_Nil, inner)
						])));
		} else {
			var ellipsis = _v0.a;
			var xOffWithAnchor = function () {
				var _v11 = config.anchor;
				if (_v11.$ === 'Nothing') {
					return config.xOff - (ellipsis.width / 2);
				} else {
					switch (_v11.a.$) {
						case 'End':
							var _v12 = _v11.a;
							return config.xOff - ellipsis.width;
						case 'Start':
							var _v13 = _v11.a;
							return config.xOff;
						default:
							var _v14 = _v11.a;
							return config.xOff - (ellipsis.width / 2);
					}
				}
			}();
			var withOverflowWrap = function (el) {
				return config.hideOverflow ? A2(
					$elm$svg$Svg$g,
					_List_fromArray(
						[
							$terezka$elm_charts$Internal$Svg$withinChartArea(plane)
						]),
					_List_fromArray(
						[el])) : el;
			};
			var uppercaseStyle = config.uppercase ? A2($elm$html$Html$Attributes$style, 'text-transform', 'uppercase') : A2($elm$html$Html$Attributes$style, '', '');
			var fontStyle = function () {
				var _v10 = config.fontSize;
				if (_v10.$ === 'Just') {
					var size_ = _v10.a;
					return A2(
						$elm$html$Html$Attributes$style,
						'font-size',
						$elm$core$String$fromInt(size_) + 'px');
				} else {
					return A2($elm$html$Html$Attributes$style, '', '');
				}
			}();
			var anchorStyle = function () {
				var _v6 = config.anchor;
				if (_v6.$ === 'Nothing') {
					return A2($elm$html$Html$Attributes$style, 'text-align', 'center');
				} else {
					switch (_v6.a.$) {
						case 'End':
							var _v7 = _v6.a;
							return A2($elm$html$Html$Attributes$style, 'text-align', 'right');
						case 'Start':
							var _v8 = _v6.a;
							return A2($elm$html$Html$Attributes$style, 'text-align', 'left');
						default:
							var _v9 = _v6.a;
							return A2($elm$html$Html$Attributes$style, 'text-align', 'center');
					}
				}
			}();
			return withOverflowWrap(
				A4(
					$terezka$elm_charts$Internal$Svg$withAttrs,
					config.attrs,
					$elm$svg$Svg$foreignObject,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$class('elm-charts__label'),
							$elm$svg$Svg$Attributes$class('elm-charts__html-label'),
							$elm$svg$Svg$Attributes$width(
							$elm$core$String$fromFloat(ellipsis.width)),
							$elm$svg$Svg$Attributes$height(
							$elm$core$String$fromFloat(ellipsis.height)),
							A6($terezka$elm_charts$Internal$Svg$position, plane, -config.rotate, point.x, point.y, xOffWithAnchor, config.yOff - 10)
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									A2($elm$html$Html$Attributes$attribute, 'xmlns', 'http://www.w3.org/1999/xhtml'),
									A2($elm$html$Html$Attributes$style, 'white-space', 'nowrap'),
									A2($elm$html$Html$Attributes$style, 'overflow', 'hidden'),
									A2($elm$html$Html$Attributes$style, 'text-overflow', 'ellipsis'),
									A2($elm$html$Html$Attributes$style, 'height', '100%'),
									A2($elm$html$Html$Attributes$style, 'pointer-events', 'none'),
									A2($elm$html$Html$Attributes$style, 'color', config.color),
									fontStyle,
									uppercaseStyle,
									anchorStyle
								]),
							inner)
						])));
		}
	});
var $terezka$elm_charts$Chart$xLabels = function (edits) {
	var toTicks = F2(
		function (p, config) {
			return A4(
				$terezka$elm_charts$Chart$generateValues,
				config.amount,
				config.generate,
				config.format,
				A2($terezka$elm_charts$Internal$Helpers$apply, config.limits, p.x));
		});
	var toTickValues = F3(
		function (p, config, ts) {
			return (!config.grid) ? ts : _Utils_update(
				ts,
				{
					xs: _Utils_ap(
						ts.xs,
						A2(
							$elm$core$List$map,
							function ($) {
								return $.value;
							},
							A2(toTicks, p, config)))
				});
		});
	var toConfig = function (p) {
		return A2(
			$terezka$elm_charts$Internal$Helpers$apply,
			edits,
			{amount: 5, anchor: $elm$core$Maybe$Nothing, attrs: _List_Nil, color: '#808BAB', ellipsis: $elm$core$Maybe$Nothing, flip: false, fontSize: $elm$core$Maybe$Nothing, format: $elm$core$Maybe$Nothing, generate: $terezka$elm_charts$Internal$Svg$Floats, grid: false, hideOverflow: false, limits: _List_Nil, pinned: $terezka$elm_charts$Chart$Attributes$zero, rotate: 0, uppercase: false, xOff: 0, yOff: 18});
	};
	return A3(
		$terezka$elm_charts$Chart$LabelsElement,
		toConfig,
		toTickValues,
		F2(
			function (p, config) {
				var _default = $terezka$elm_charts$Internal$Svg$defaultLabel;
				var toLabel = function (item) {
					return A4(
						$terezka$elm_charts$Internal$Svg$label,
						p,
						_Utils_update(
							_default,
							{
								anchor: config.anchor,
								attrs: config.attrs,
								color: config.color,
								ellipsis: config.ellipsis,
								fontSize: config.fontSize,
								hideOverflow: config.hideOverflow,
								rotate: config.rotate,
								uppercase: config.uppercase,
								xOff: config.xOff,
								yOff: config.flip ? ((-config.yOff) + 10) : config.yOff
							}),
						_List_fromArray(
							[
								$elm$svg$Svg$text(item.label)
							]),
						{
							x: item.value,
							y: config.pinned(p.y)
						});
				};
				return A2(
					$elm$svg$Svg$g,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$class('elm-charts__x-labels')
						]),
					A2(
						$elm$core$List$map,
						toLabel,
						A2(toTicks, p, config)));
			}));
};
var $terezka$elm_charts$Chart$TicksElement = F2(
	function (a, b) {
		return {$: 'TicksElement', a: a, b: b};
	});
var $terezka$elm_charts$Chart$Attributes$length = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{length: v});
		});
};
var $terezka$elm_charts$Internal$Svg$defaultTick = {attrs: _List_Nil, color: 'rgb(210, 210, 210)', length: 5, width: 1};
var $terezka$elm_charts$Internal$Svg$tick = F4(
	function (plane, config, isX, point) {
		return A4(
			$terezka$elm_charts$Internal$Svg$withAttrs,
			config.attrs,
			$elm$svg$Svg$line,
			_List_fromArray(
				[
					$elm$svg$Svg$Attributes$class('elm-charts__tick'),
					$elm$svg$Svg$Attributes$stroke(config.color),
					$elm$svg$Svg$Attributes$strokeWidth(
					$elm$core$String$fromFloat(config.width)),
					$elm$svg$Svg$Attributes$x1(
					$elm$core$String$fromFloat(
						A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, point.x))),
					$elm$svg$Svg$Attributes$x2(
					$elm$core$String$fromFloat(
						A2($terezka$elm_charts$Internal$Coordinates$toSVGX, plane, point.x) + (isX ? 0 : (-config.length)))),
					$elm$svg$Svg$Attributes$y1(
					$elm$core$String$fromFloat(
						A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, point.y))),
					$elm$svg$Svg$Attributes$y2(
					$elm$core$String$fromFloat(
						A2($terezka$elm_charts$Internal$Coordinates$toSVGY, plane, point.y) + (isX ? config.length : 0)))
				]),
			_List_Nil);
	});
var $terezka$elm_charts$Internal$Svg$xTick = F3(
	function (plane, config, point) {
		return A4($terezka$elm_charts$Internal$Svg$tick, plane, config, true, point);
	});
var $terezka$elm_charts$Chart$Svg$xTick = F2(
	function (plane, edits) {
		return A2(
			$terezka$elm_charts$Internal$Svg$xTick,
			plane,
			A2($terezka$elm_charts$Internal$Helpers$apply, edits, $terezka$elm_charts$Internal$Svg$defaultTick));
	});
var $terezka$elm_charts$Chart$xTicks = function (edits) {
	var config = A2(
		$terezka$elm_charts$Internal$Helpers$apply,
		edits,
		{amount: 5, color: '', flip: false, generate: $terezka$elm_charts$Internal$Svg$Floats, grid: true, height: 5, limits: _List_Nil, pinned: $terezka$elm_charts$Chart$Attributes$zero, width: 1});
	var toTicks = function (p) {
		return A2(
			$elm$core$List$map,
			function ($) {
				return $.value;
			},
			A4(
				$terezka$elm_charts$Chart$generateValues,
				config.amount,
				config.generate,
				$elm$core$Maybe$Nothing,
				A2($terezka$elm_charts$Internal$Helpers$apply, config.limits, p.x)));
	};
	var addTickValues = F2(
		function (p, ts) {
			return (!config.grid) ? ts : _Utils_update(
				ts,
				{
					xs: _Utils_ap(
						ts.xs,
						toTicks(p))
				});
		});
	return A2(
		$terezka$elm_charts$Chart$TicksElement,
		addTickValues,
		function (p) {
			var toTick = function (x) {
				return A3(
					$terezka$elm_charts$Chart$Svg$xTick,
					p,
					_List_fromArray(
						[
							$terezka$elm_charts$Chart$Attributes$color(config.color),
							$terezka$elm_charts$Chart$Attributes$length(
							config.flip ? (-config.height) : config.height),
							$terezka$elm_charts$Chart$Attributes$width(config.width)
						]),
					{
						x: x,
						y: config.pinned(p.y)
					});
			};
			return A2(
				$elm$svg$Svg$g,
				_List_fromArray(
					[
						$elm$svg$Svg$Attributes$class('elm-charts__x-ticks')
					]),
				A2(
					$elm$core$List$map,
					toTick,
					toTicks(p)));
		});
};
var $terezka$elm_charts$Chart$Attributes$y2 = function (v) {
	return $terezka$elm_charts$Internal$Helpers$Attribute(
		function (config) {
			return _Utils_update(
				config,
				{
					y2: $elm$core$Maybe$Just(v)
				});
		});
};
var $terezka$elm_charts$Chart$yAxis = function (edits) {
	var config = A2(
		$terezka$elm_charts$Internal$Helpers$apply,
		edits,
		{arrow: true, attrs: _List_Nil, color: '', limits: _List_Nil, pinned: $terezka$elm_charts$Chart$Attributes$zero, width: 1});
	var addTickValues = F2(
		function (p, ts) {
			return _Utils_update(
				ts,
				{
					xAxis: A2(
						$elm$core$List$cons,
						config.pinned(p.x),
						ts.xAxis)
				});
		});
	return A2(
		$terezka$elm_charts$Chart$AxisElement,
		addTickValues,
		function (p) {
			var yLimit = A2($terezka$elm_charts$Internal$Helpers$apply, config.limits, p.y);
			return A2(
				$elm$svg$Svg$g,
				_List_fromArray(
					[
						$elm$svg$Svg$Attributes$class('elm-charts__y-axis')
					]),
				_List_fromArray(
					[
						A2(
						$terezka$elm_charts$Chart$Svg$line,
						p,
						_List_fromArray(
							[
								$terezka$elm_charts$Chart$Attributes$color(config.color),
								$terezka$elm_charts$Chart$Attributes$width(config.width),
								$terezka$elm_charts$Chart$Attributes$x1(
								config.pinned(p.x)),
								$terezka$elm_charts$Chart$Attributes$y1(
								A2($elm$core$Basics$max, p.y.min, yLimit.min)),
								$terezka$elm_charts$Chart$Attributes$y2(
								A2($elm$core$Basics$min, p.y.max, yLimit.max)),
								$terezka$elm_charts$Chart$Attributes$attrs(config.attrs)
							])),
						config.arrow ? A3(
						$terezka$elm_charts$Chart$Svg$arrow,
						p,
						_List_fromArray(
							[
								$terezka$elm_charts$Chart$Attributes$color(config.color),
								p.y.flip ? $terezka$elm_charts$Chart$Attributes$rotate(90) : $terezka$elm_charts$Chart$Attributes$rotate(-90)
							]),
						{
							x: config.pinned(p.x),
							y: yLimit.max
						}) : $elm$svg$Svg$text('')
					]));
		});
};
var $terezka$elm_charts$Internal$Svg$End = {$: 'End'};
var $terezka$elm_charts$Internal$Svg$Start = {$: 'Start'};
var $terezka$elm_charts$Chart$yLabels = function (edits) {
	var toTicks = F2(
		function (p, config) {
			return A4(
				$terezka$elm_charts$Chart$generateValues,
				config.amount,
				config.generate,
				config.format,
				A2($terezka$elm_charts$Internal$Helpers$apply, config.limits, p.y));
		});
	var toTickValues = F3(
		function (p, config, ts) {
			return (!config.grid) ? ts : _Utils_update(
				ts,
				{
					ys: _Utils_ap(
						ts.ys,
						A2(
							$elm$core$List$map,
							function ($) {
								return $.value;
							},
							A2(toTicks, p, config)))
				});
		});
	var toConfig = function (p) {
		return A2(
			$terezka$elm_charts$Internal$Helpers$apply,
			edits,
			{amount: 5, anchor: $elm$core$Maybe$Nothing, attrs: _List_Nil, color: '#808BAB', ellipsis: $elm$core$Maybe$Nothing, flip: false, fontSize: $elm$core$Maybe$Nothing, format: $elm$core$Maybe$Nothing, generate: $terezka$elm_charts$Internal$Svg$Floats, grid: false, hideOverflow: false, limits: _List_Nil, pinned: $terezka$elm_charts$Chart$Attributes$zero, rotate: 0, uppercase: false, xOff: -10, yOff: 3});
	};
	return A3(
		$terezka$elm_charts$Chart$LabelsElement,
		toConfig,
		toTickValues,
		F2(
			function (p, config) {
				var _default = $terezka$elm_charts$Internal$Svg$defaultLabel;
				var toLabel = function (item) {
					return A4(
						$terezka$elm_charts$Internal$Svg$label,
						p,
						_Utils_update(
							_default,
							{
								anchor: function () {
									var _v0 = config.anchor;
									if (_v0.$ === 'Nothing') {
										return $elm$core$Maybe$Just(
											config.flip ? $terezka$elm_charts$Internal$Svg$Start : $terezka$elm_charts$Internal$Svg$End);
									} else {
										var anchor = _v0.a;
										return $elm$core$Maybe$Just(anchor);
									}
								}(),
								attrs: config.attrs,
								color: config.color,
								ellipsis: config.ellipsis,
								fontSize: config.fontSize,
								hideOverflow: config.hideOverflow,
								rotate: config.rotate,
								uppercase: config.uppercase,
								xOff: config.flip ? (-config.xOff) : config.xOff,
								yOff: config.yOff
							}),
						_List_fromArray(
							[
								$elm$svg$Svg$text(item.label)
							]),
						{
							x: config.pinned(p.x),
							y: item.value
						});
				};
				return A2(
					$elm$svg$Svg$g,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$class('elm-charts__y-labels')
						]),
					A2(
						$elm$core$List$map,
						toLabel,
						A2(toTicks, p, config)));
			}));
};
var $author$project$Main$viewSpecificStats = F2(
	function (id, model) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					A2($elm$html$Html$Attributes$style, 'height', '100vh'),
					A2($elm$html$Html$Attributes$style, 'width', '100vw'),
					A2($elm$html$Html$Attributes$style, 'display', 'flex'),
					A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
					A2($elm$html$Html$Attributes$style, 'gap', '0.125rem'),
					A2($elm$html$Html$Attributes$style, 'font-size', '7vw')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							A2($elm$html$Html$Attributes$style, 'height', '7vh'),
							A2($elm$html$Html$Attributes$style, 'display', 'flex'),
							A2($elm$html$Html$Attributes$style, 'align-items', 'center'),
							A2($elm$html$Html$Attributes$style, 'gap', '3rem'),
							A2($elm$html$Html$Attributes$style, 'padding', '0.5rem')
						]),
					_List_fromArray(
						[
							A2($author$project$Main$linkSecondarySmall, 'Back', $author$project$Main$StatsRoute),
							A2(
							$elm$html$Html$span,
							_List_fromArray(
								[
									A2($elm$html$Html$Attributes$style, 'font-size', '2rem')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text('Stats')
								]))
						])),
					function () {
					var _v0 = A2($author$project$Main$findBehaviorById, id, model.safetyBehaviors);
					if (_v0.$ === 'Nothing') {
						return A2($author$project$Main$linkSecondary, 'Sorry, looks like we made a mistake', $author$project$Main$StatsRoute);
					} else {
						var behavior = _v0.a;
						var submits = A2(
							$elm$core$List$map,
							function (submit) {
								return {resist: false, submit: true, timestamp: submit};
							},
							behavior.submits);
						var resists = A2(
							$elm$core$List$map,
							function (resist) {
								return {resist: true, submit: false, timestamp: resist};
							},
							behavior.resists);
						var submitsAndResists = A2(
							$elm$core$List$sortBy,
							A2(
								$elm$core$Basics$composeR,
								function ($) {
									return $.timestamp;
								},
								$elm$time$Time$posixToMillis),
							_Utils_ap(submits, resists));
						var byDay = A3(
							$elm$core$List$foldl,
							function (stat) {
								var inDay = $elm$time$Time$posixToMillis(
									A3($justinmimbs$time_extra$Time$Extra$floor, $justinmimbs$time_extra$Time$Extra$Day, model.zone, stat.timestamp));
								return A2(
									$elm$core$Dict$update,
									inDay,
									function (maybeStats) {
										if (maybeStats.$ === 'Nothing') {
											return $elm$core$Maybe$Just(
												{
													resists: stat.resist ? _List_fromArray(
														[stat.timestamp]) : _List_Nil,
													submits: stat.submit ? _List_fromArray(
														[stat.timestamp]) : _List_Nil
												});
										} else {
											var s = maybeStats.a;
											return $elm$core$Maybe$Just(
												{
													resists: stat.resist ? A2($elm$core$List$cons, stat.timestamp, s.resists) : s.resists,
													submits: stat.submit ? A2($elm$core$List$cons, stat.timestamp, s.submits) : s.submits
												});
										}
									});
							},
							$elm$core$Dict$empty,
							submitsAndResists);
						var byDayList = $elm$core$Dict$toList(byDay);
						return A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									A2($elm$html$Html$Attributes$style, 'display', 'flex'),
									A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
									A2($elm$html$Html$Attributes$style, 'padding', '0.5rem'),
									A2($elm$html$Html$Attributes$style, 'gap', '1rem')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											A2($elm$html$Html$Attributes$style, 'text-decoration', 'underline')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(behavior.name)
										])),
									function () {
									if (!byDayList.b) {
										return $elm$html$Html$text('No submits or resists yet');
									} else {
										var _v2 = byDayList.a;
										var high = _v2.a;
										var low = function () {
											var _v6 = $elm$core$List$reverse(byDayList);
											if (!_v6.b) {
												return high;
											} else {
												var _v7 = _v6.a;
												var l = _v7.a;
												return l;
											}
										}();
										return A2(
											$elm$html$Html$div,
											_List_fromArray(
												[
													A2($elm$html$Html$Attributes$style, 'width', 'calc(100vw - 3rem)'),
													A2($elm$html$Html$Attributes$style, 'margin', '1rem auto 0'),
													A2($elm$html$Html$Attributes$style, 'display', 'flex'),
													A2($elm$html$Html$Attributes$style, 'align-items', 'center'),
													A2($elm$html$Html$Attributes$style, 'justify-content', 'center')
												]),
											_List_fromArray(
												[
													A2(
													$elm$html$Html$div,
													_List_fromArray(
														[
															A2($elm$html$Html$Attributes$style, 'height', '100%'),
															A2($elm$html$Html$Attributes$style, 'width', '100%')
														]),
													_List_fromArray(
														[
															A2(
															$terezka$elm_charts$Chart$chart,
															_List_fromArray(
																[
																	$terezka$elm_charts$Chart$Attributes$height(200),
																	$terezka$elm_charts$Chart$Attributes$padding(
																	{bottom: 0, left: 50, right: 25, top: 0}),
																	$terezka$elm_charts$Chart$Attributes$range(
																	_List_fromArray(
																		[
																			A2($terezka$elm_charts$Chart$Attributes$lowest, low, $terezka$elm_charts$Chart$Attributes$exactly),
																			A2($terezka$elm_charts$Chart$Attributes$highest, high, $terezka$elm_charts$Chart$Attributes$exactly)
																		]))
																]),
															_List_fromArray(
																[
																	$terezka$elm_charts$Chart$xAxis(_List_Nil),
																	$terezka$elm_charts$Chart$xTicks(
																	_List_fromArray(
																		[
																			$terezka$elm_charts$Chart$Attributes$times(model.zone)
																		])),
																	$terezka$elm_charts$Chart$xLabels(
																	_List_fromArray(
																		[
																			$terezka$elm_charts$Chart$Attributes$times(model.zone),
																			$terezka$elm_charts$Chart$Attributes$rotate(90),
																			$terezka$elm_charts$Chart$Attributes$moveDown(22),
																			$terezka$elm_charts$Chart$Attributes$moveRight(8),
																			$terezka$elm_charts$Chart$Attributes$fontSize(16)
																		])),
																	$terezka$elm_charts$Chart$yAxis(_List_Nil),
																	$terezka$elm_charts$Chart$yLabels(
																	_List_fromArray(
																		[
																			$terezka$elm_charts$Chart$Attributes$ints,
																			$terezka$elm_charts$Chart$Attributes$fontSize(16)
																		])),
																	A3(
																	$terezka$elm_charts$Chart$series,
																	function (_v3) {
																		var t = _v3.a;
																		return t;
																	},
																	_List_fromArray(
																		[
																			A2(
																			$terezka$elm_charts$Chart$named,
																			'Submits',
																			A3(
																				$terezka$elm_charts$Chart$interpolated,
																				function (_v4) {
																					var d = _v4.b;
																					return $elm$core$List$length(d.submits);
																				},
																				_List_Nil,
																				_List_Nil)),
																			A2(
																			$terezka$elm_charts$Chart$named,
																			'Resists',
																			A3(
																				$terezka$elm_charts$Chart$interpolated,
																				function (_v5) {
																					var d = _v5.b;
																					return $elm$core$List$length(d.resists);
																				},
																				_List_Nil,
																				_List_Nil))
																		]),
																	$elm$core$List$reverse(byDayList)),
																	A4(
																	$terezka$elm_charts$Chart$legendsAt,
																	function ($) {
																		return $.min;
																	},
																	function ($) {
																		return $.max;
																	},
																	_List_fromArray(
																		[
																			$terezka$elm_charts$Chart$Attributes$column,
																			$terezka$elm_charts$Chart$Attributes$moveRight(15),
																			$terezka$elm_charts$Chart$Attributes$spacing(5)
																		]),
																	_List_fromArray(
																		[
																			$terezka$elm_charts$Chart$Attributes$width(20),
																			$terezka$elm_charts$Chart$Attributes$fontSize(16)
																		]))
																]))
														]))
												]));
									}
								}(),
									A2(
									$elm$html$Html$ol,
									_List_fromArray(
										[
											A2($elm$html$Html$Attributes$style, 'list-style', 'none'),
											A2($elm$html$Html$Attributes$style, 'display', 'flex'),
											A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
											A2($elm$html$Html$Attributes$style, 'gap', '1rem'),
											A2($elm$html$Html$Attributes$style, 'margin-top', '6rem')
										]),
									A2(
										$elm$core$List$map,
										function (_v8) {
											var d = _v8.a;
											var s = _v8.b;
											return A2(
												$elm$html$Html$li,
												_List_Nil,
												_List_fromArray(
													[
														A2(
														$elm$html$Html$span,
														_List_Nil,
														_List_fromArray(
															[
																$elm$html$Html$text(
																A2(
																	$author$project$Main$prettyDayFormatter,
																	model.zone,
																	$elm$time$Time$millisToPosix(d)))
															])),
														A2($elm$html$Html$br, _List_Nil, _List_Nil),
														A2(
														$elm$html$Html$span,
														_List_Nil,
														_List_fromArray(
															[
																$elm$html$Html$text('Submits: '),
																$elm$html$Html$text(
																$elm$core$String$fromInt(
																	$elm$core$List$length(s.submits))),
																$elm$html$Html$text(', Resists: '),
																$elm$html$Html$text(
																$elm$core$String$fromInt(
																	$elm$core$List$length(s.resists)))
															]))
													]));
										},
										$elm$core$List$reverse(byDayList)))
								]));
					}
				}()
				]));
	});
var $elm$html$Html$ul = _VirtualDom_node('ul');
var $author$project$Main$viewBehaviorStats = F2(
	function (model, behavior) {
		var dayStart = A3($justinmimbs$time_extra$Time$Extra$floor, $justinmimbs$time_extra$Time$Extra$Day, model.zone, model.today);
		var dayStartMillis = $elm$time$Time$posixToMillis(dayStart);
		var nextDayStartMillis = $elm$time$Time$posixToMillis(
			A4($justinmimbs$time_extra$Time$Extra$add, $justinmimbs$time_extra$Time$Extra$Day, 1, model.zone, dayStart));
		var prevDayStartMillis = $elm$time$Time$posixToMillis(
			A4($justinmimbs$time_extra$Time$Extra$add, $justinmimbs$time_extra$Time$Extra$Day, -1, model.zone, dayStart));
		return A2(
			$elm$html$Html$li,
			_List_fromArray(
				[
					A2($elm$html$Html$Attributes$style, 'border', '1px solid black'),
					A2($elm$html$Html$Attributes$style, 'border-radius', '1rem'),
					A2($elm$html$Html$Attributes$style, 'padding', '0.5rem 1rem')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							A2($elm$html$Html$Attributes$style, 'display', 'flex'),
							A2($elm$html$Html$Attributes$style, 'align-items', 'center'),
							A2($elm$html$Html$Attributes$style, 'justify-content', 'space-between')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$span,
							_List_fromArray(
								[
									A2($elm$html$Html$Attributes$style, 'text-decoration', 'underline')
								]),
							_List_fromArray(
								[
									$elm$html$Html$text(behavior.name)
								])),
							A2(
							$author$project$Main$linkSecondarySmall,
							'more',
							$author$project$Main$StatRoute(behavior.id))
						])),
					A2($elm$html$Html$br, _List_Nil, _List_Nil),
					$elm$html$Html$text('Submits:'),
					A2($elm$html$Html$br, _List_Nil, _List_Nil),
					A2(
					$elm$html$Html$span,
					_List_Nil,
					_List_fromArray(
						[
							$elm$html$Html$text(
							$elm$core$String$fromInt(
								$elm$core$List$length(
									A2(
										$elm$core$List$filter,
										function (submit) {
											var subMiilis = $elm$time$Time$posixToMillis(submit);
											return (_Utils_cmp(subMiilis, prevDayStartMillis) > -1) && (_Utils_cmp(subMiilis, dayStartMillis) < 0);
										},
										behavior.submits)))),
							$elm$html$Html$text(' yesterday, '),
							$elm$html$Html$text(
							$elm$core$String$fromInt(
								$elm$core$List$length(
									A2(
										$elm$core$List$filter,
										function (submit) {
											var subMiilis = $elm$time$Time$posixToMillis(submit);
											return (_Utils_cmp(subMiilis, dayStartMillis) > -1) && (_Utils_cmp(subMiilis, nextDayStartMillis) < 0);
										},
										behavior.submits)))),
							$elm$html$Html$text(' today')
						])),
					A2($elm$html$Html$br, _List_Nil, _List_Nil),
					$elm$html$Html$text('Resists:'),
					A2($elm$html$Html$br, _List_Nil, _List_Nil),
					A2(
					$elm$html$Html$span,
					_List_Nil,
					_List_fromArray(
						[
							$elm$html$Html$text(
							$elm$core$String$fromInt(
								$elm$core$List$length(
									A2(
										$elm$core$List$filter,
										function (resist) {
											var subMiilis = $elm$time$Time$posixToMillis(resist);
											return (_Utils_cmp(subMiilis, prevDayStartMillis) > -1) && (_Utils_cmp(subMiilis, dayStartMillis) < 0);
										},
										behavior.resists)))),
							$elm$html$Html$text(' yesterday, '),
							$elm$html$Html$text(
							$elm$core$String$fromInt(
								$elm$core$List$length(
									A2(
										$elm$core$List$filter,
										function (resist) {
											var subMiilis = $elm$time$Time$posixToMillis(resist);
											return (_Utils_cmp(subMiilis, dayStartMillis) > -1) && (_Utils_cmp(subMiilis, nextDayStartMillis) < 0);
										},
										behavior.resists)))),
							$elm$html$Html$text(' today')
						]))
				]));
	});
var $author$project$Main$viewStats = function (model) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				A2($elm$html$Html$Attributes$style, 'height', '100vh'),
				A2($elm$html$Html$Attributes$style, 'width', '100vw'),
				A2($elm$html$Html$Attributes$style, 'display', 'flex'),
				A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
				A2($elm$html$Html$Attributes$style, 'gap', '0.125rem'),
				A2($elm$html$Html$Attributes$style, 'font-size', '7vw')
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						A2($elm$html$Html$Attributes$style, 'height', '7vh'),
						A2($elm$html$Html$Attributes$style, 'display', 'flex'),
						A2($elm$html$Html$Attributes$style, 'align-items', 'center'),
						A2($elm$html$Html$Attributes$style, 'gap', '3rem'),
						A2($elm$html$Html$Attributes$style, 'padding', '0.5rem')
					]),
				_List_fromArray(
					[
						A2($author$project$Main$linkSecondarySmall, 'Back', $author$project$Main$HomeRoute),
						A2(
						$elm$html$Html$span,
						_List_fromArray(
							[
								A2($elm$html$Html$Attributes$style, 'font-size', '2rem')
							]),
						_List_fromArray(
							[
								$elm$html$Html$text('Stats')
							]))
					])),
				A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						A2($elm$html$Html$Attributes$style, 'height', '93vh'),
						A2($elm$html$Html$Attributes$style, 'overflow', 'auto'),
						A2($elm$html$Html$Attributes$style, 'padding', '1rem'),
						A2($elm$html$Html$Attributes$style, 'display', 'flex'),
						A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
						A2($elm$html$Html$Attributes$style, 'gap', '2rem')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$ul,
						_List_fromArray(
							[
								A2($elm$html$Html$Attributes$style, 'list-style', 'none'),
								A2($elm$html$Html$Attributes$style, 'display', 'flex'),
								A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
								A2($elm$html$Html$Attributes$style, 'gap', '1rem')
							]),
						A2(
							$elm$core$List$map,
							$author$project$Main$viewBehaviorStats(model),
							model.safetyBehaviors))
					]))
			]));
};
var $author$project$Main$viewApp = function (app) {
	switch (app.$) {
		case 'StartupFailure':
			return A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						A2($elm$html$Html$Attributes$style, 'height', '100svh'),
						A2($elm$html$Html$Attributes$style, 'width', '100dvw'),
						A2($elm$html$Html$Attributes$style, 'display', 'flex'),
						A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
						A2($elm$html$Html$Attributes$style, 'align-items', 'center'),
						A2($elm$html$Html$Attributes$style, 'justify-content', 'center')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								A2($elm$html$Html$Attributes$style, 'background-color', 'hsl(265deg 88.5% 60%)'),
								A2($elm$html$Html$Attributes$style, 'padding', '1rem 2rem'),
								A2($elm$html$Html$Attributes$style, 'border-radius', '1rem'),
								A2($elm$html$Html$Attributes$style, 'display', 'flex'),
								A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
								A2($elm$html$Html$Attributes$style, 'align-items', 'center'),
								A2($elm$html$Html$Attributes$style, 'justify-content', 'center'),
								A2($elm$html$Html$Attributes$style, 'gap', '1rem')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$h2,
								_List_fromArray(
									[
										A2($elm$html$Html$Attributes$style, 'color', 'white')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Initialization failure,')
									])),
								A2(
								$elm$html$Html$h3,
								_List_fromArray(
									[
										A2($elm$html$Html$Attributes$style, 'color', 'white')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('try reloading the page')
									]))
							]))
					]));
		case 'Initializing':
			return A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						A2($elm$html$Html$Attributes$style, 'height', '100svh'),
						A2($elm$html$Html$Attributes$style, 'width', '100dvw'),
						A2($elm$html$Html$Attributes$style, 'display', 'flex'),
						A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
						A2($elm$html$Html$Attributes$style, 'align-items', 'center'),
						A2($elm$html$Html$Attributes$style, 'justify-content', 'center')
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								A2($elm$html$Html$Attributes$style, 'background-color', 'hsl(265deg 88.5% 60%)'),
								A2($elm$html$Html$Attributes$style, 'padding', '2rem 4rem'),
								A2($elm$html$Html$Attributes$style, 'border-radius', '1rem'),
								A2($elm$html$Html$Attributes$style, 'display', 'flex'),
								A2($elm$html$Html$Attributes$style, 'flex-direction', 'column'),
								A2($elm$html$Html$Attributes$style, 'align-items', 'center'),
								A2($elm$html$Html$Attributes$style, 'justify-content', 'center'),
								A2($elm$html$Html$Attributes$style, 'gap', '3rem')
							]),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$h2,
								_List_fromArray(
									[
										A2($elm$html$Html$Attributes$style, 'color', 'white')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text('Booting up')
									])),
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										A2($elm$html$Html$Attributes$style, 'width', '3rem'),
										A2($elm$html$Html$Attributes$style, 'height', '3rem')
									]),
								_List_fromArray(
									[$author$project$Main$spinner]))
							]))
					]));
		default:
			var model = app.a;
			var _v1 = model.route;
			switch (_v1.$) {
				case 'HomeRoute':
					return $author$project$Main$viewBehaviorList(model);
				case 'AddBehaviorRoute':
					return $author$project$Main$viewAddBehavior(model);
				case 'EditBehaviorRoute':
					var id = _v1.a;
					return A2($author$project$Main$viewEditBehavior, id, model);
				case 'SettingsRoute':
					return $author$project$Main$viewMenu;
				case 'StatsRoute':
					return $author$project$Main$viewStats(model);
				default:
					var id = _v1.a;
					return A2($author$project$Main$viewSpecificStats, id, model);
			}
	}
};
var $author$project$Main$view = function (app) {
	return {
		body: _List_fromArray(
			[
				$author$project$Main$viewApp(app)
			]),
		title: 'Safety Behavior Tracker'
	};
};
var $author$project$Main$main = $elm$browser$Browser$application(
	{init: $author$project$Main$init, onUrlChange: $author$project$Main$UrlChanged, onUrlRequest: $author$project$Main$UrlRequested, subscriptions: $author$project$Main$subscriptions, update: $author$project$Main$update, view: $author$project$Main$view});
_Platform_export({'Main':{'init':$author$project$Main$main(
	A2(
		$elm$json$Json$Decode$andThen,
		function (seed4) {
			return A2(
				$elm$json$Json$Decode$andThen,
				function (seed3) {
					return A2(
						$elm$json$Json$Decode$andThen,
						function (seed2) {
							return A2(
								$elm$json$Json$Decode$andThen,
								function (seed1) {
									return $elm$json$Json$Decode$succeed(
										{seed1: seed1, seed2: seed2, seed3: seed3, seed4: seed4});
								},
								A2($elm$json$Json$Decode$field, 'seed1', $elm$json$Json$Decode$int));
						},
						A2($elm$json$Json$Decode$field, 'seed2', $elm$json$Json$Decode$int));
				},
				A2($elm$json$Json$Decode$field, 'seed3', $elm$json$Json$Decode$int));
		},
		A2($elm$json$Json$Decode$field, 'seed4', $elm$json$Json$Decode$int)))(0)}});}(this));