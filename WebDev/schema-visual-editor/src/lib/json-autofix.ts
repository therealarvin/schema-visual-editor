export function autofixJson(jsonString: string): { fixed: string; changes: string[] } {
  const changes: string[] = [];
  let fixed = jsonString;

  // Remove BOM if present
  if (fixed.charCodeAt(0) === 0xFEFF) {
    fixed = fixed.slice(1);
    changes.push('Removed BOM character');
  }

  // Remove JavaScript-style comments
  const singleLineComments = fixed.match(/\/\/.*$/gm);
  if (singleLineComments) {
    fixed = fixed.replace(/\/\/.*$/gm, '');
    changes.push(`Removed ${singleLineComments.length} single-line comments`);
  }

  const multiLineComments = fixed.match(/\/\*[\s\S]*?\*\//g);
  if (multiLineComments) {
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
    changes.push(`Removed ${multiLineComments.length} multi-line comments`);
  }

  // Fix unquoted property names
  const unquotedProps = fixed.match(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g);
  if (unquotedProps) {
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
    changes.push(`Fixed ${unquotedProps.length} unquoted property names`);
  }

  // Remove trailing commas
  const trailingCommas = fixed.match(/,(\s*[}\]])/g);
  if (trailingCommas) {
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    changes.push(`Removed ${trailingCommas.length} trailing commas`);
  }

  // Fix single quotes to double quotes
  // This is tricky - we need to avoid replacing single quotes inside strings
  let inString = false;
  let escaped = false;
  let newFixed = '';
  let singleQuotesFixed = 0;

  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i];
    const prevChar = i > 0 ? fixed[i - 1] : '';

    if (!escaped && char === '"') {
      inString = !inString;
    }

    if (!inString && char === "'" && 
        (i === 0 || /[\s,\[\{:]/.test(prevChar)) &&
        (i + 1 < fixed.length && fixed[i + 1] !== "'")) {
      // Find the closing single quote
      let j = i + 1;
      let foundClosing = false;
      while (j < fixed.length) {
        if (fixed[j] === "'" && fixed[j - 1] !== '\\') {
          foundClosing = true;
          break;
        }
        j++;
      }
      if (foundClosing) {
        newFixed += '"';
        singleQuotesFixed++;
      } else {
        newFixed += char;
      }
    } else if (!inString && char === "'" && prevChar !== '\\' &&
               i > 0 && fixed[i - 1] !== "'") {
      // This might be a closing single quote
      newFixed += '"';
      singleQuotesFixed++;
    } else {
      newFixed += char;
    }

    escaped = !escaped && char === '\\';
  }

  if (singleQuotesFixed > 0) {
    fixed = newFixed;
    changes.push(`Replaced ${singleQuotesFixed} single quotes with double quotes`);
  }

  // Remove empty objects from arrays
  const emptyObjectsInArrays = fixed.match(/\[\s*{\s*},?\s*\]/g);
  if (emptyObjectsInArrays) {
    fixed = fixed.replace(/,\s*{\s*},/g, ',');
    fixed = fixed.replace(/\[\s*{\s*},/g, '[');
    fixed = fixed.replace(/,\s*{\s*}\s*\]/g, ']');
    fixed = fixed.replace(/\[\s*{\s*}\s*\]/g, '[]');
    changes.push('Removed empty objects from arrays');
  }

  // Fix multiple commas
  const multipleCommas = fixed.match(/,\s*,+/g);
  if (multipleCommas) {
    fixed = fixed.replace(/,\s*,+/g, ',');
    changes.push('Fixed multiple consecutive commas');
  }

  // Remove commas before closing brackets/braces
  fixed = fixed.replace(/,\s*}/g, '}');
  fixed = fixed.replace(/,\s*]/g, ']');

  // Fix missing commas between array elements or object properties
  // This is complex and might not catch all cases
  const lines = fixed.split('\n');
  const fixedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
    
    // Check if current line ends with } or ] and next line starts with { or [ or "
    if ((trimmedLine.endsWith('}') || trimmedLine.endsWith(']') || trimmedLine.endsWith('"')) &&
        (nextLine.startsWith('{') || nextLine.startsWith('[') || nextLine.startsWith('"')) &&
        !trimmedLine.endsWith(',}') && !trimmedLine.endsWith(',]') && !trimmedLine.endsWith('",')) {
      
      // Check if we're not at the end of an array or object
      const afterNextLine = i + 2 < lines.length ? lines[i + 2].trim() : '';
      if (!nextLine.startsWith('}') && !nextLine.startsWith(']') && 
          !afterNextLine.startsWith('}') && !afterNextLine.startsWith(']')) {
        fixedLines.push(line.replace(/([}\]"])$/, '$1,'));
        changes.push(`Added missing comma after line ${i + 1}`);
      } else {
        fixedLines.push(line);
      }
    } else {
      fixedLines.push(line);
    }
  }

  if (fixedLines.join('\n') !== fixed) {
    fixed = fixedLines.join('\n');
  }

  // Try to fix specific error patterns
  // Fix empty objects in the middle of arrays
  fixed = fixed.replace(/({)\s*("formType":)/g, '$1\n  $2');
  
  // Ensure proper formatting
  try {
    const parsed = JSON.parse(fixed);
    fixed = JSON.stringify(parsed, null, 2);
    changes.push('Reformatted JSON');
  } catch (e) {
    // If still invalid, at least we tried
  }

  return { fixed, changes };
}