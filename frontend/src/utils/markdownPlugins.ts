import MarkdownIt from 'markdown-it';
import katex from 'katex';

export function markdownItKatex(md: MarkdownIt) {
  // Inline math: $...$
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function katexInlineRule(state: any, silent: boolean): boolean {
    const start = state.pos;
    const max = state.posMax;
    if (start + 2 >= max) return false;
    if (state.src.charCodeAt(start) !== 0x24 /* $ */) return false;

    let pos = start + 1;
    let found = false;

    // Look for closing $
    while (pos < max) {
      if (state.src.charCodeAt(pos) === 0x24 /* $ */) {
        found = true;
        break;
      }
      if (state.src.charCodeAt(pos) === 0x0A /* \n */) {
        break;
      }
      pos++;
    }

    if (!found || pos === start + 1) return false;

    const content = state.src.slice(start + 1, pos);

    if (!silent) {
      const token = state.push('katex_inline', 'span', 0);
      token.content = content;
      token.markup = '$';
    }

    state.pos = pos + 1;
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  md.inline.ruler.before('escape', 'katex_inline', katexInlineRule as any);

  // Block math: $$...$$
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function katexBlockRule(state: any, startLine: number, endLine: number, silent: boolean): boolean {
    const start = startLine;
    const end = endLine;
    const marker = '$$';
    let pos = state.bMarks[start] + state.tShift[start];
    let max = state.eMarks[start];

    if (pos + marker.length > max) return false;
    if (state.src.substr(pos, marker.length) !== marker) return false;

    pos += marker.length;
    let firstLine = state.src.slice(pos, max);

    if (firstLine.trim().slice(-marker.length) === marker) {
      // Single line $$math$$
      firstLine = firstLine.trim().slice(0, -marker.length);

      if (!silent) {
        const token = state.push('katex_block', 'div', 0);
        token.content = firstLine;
        token.markup = marker;
        token.map = [start, state.line];
      }

      state.line = start + 1;
      return true;
    }

    // Multi-line block
    let nextLine = start;
    let haveEndMarker = false;

    while (nextLine < end) {
      nextLine++;
      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (pos < max && state.tShift[nextLine] < state.blkIndent) {
        break;
      }

      if (state.src.substr(pos, marker.length) === marker) {
        haveEndMarker = true;
        pos += marker.length;
        pos = state.skipSpaces(pos);
        if (pos < max) break;
        break;
      }
    }

    if (!haveEndMarker) return false;

    const oldParent = state.parentType;
    const oldLineMax = state.lineMax;
    state.parentType = 'container';

    if (!silent) {
      const content = state.getLines(start + 1, nextLine, 0, true);
      const token = state.push('katex_block', 'div', 0);
      token.content = content;
      token.markup = marker;
      token.map = [start, nextLine + 1];
    }

    state.parentType = oldParent;
    state.lineMax = oldLineMax;
    state.line = nextLine + 1;
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  md.block.ruler.before('fence', 'katex_block', katexBlockRule as any);

  // Renderer for inline math
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  md.renderer.rules.katex_inline = (tokens: any, idx: number) => {
    const token = tokens[idx];
    try {
      return katex.renderToString(token.content, {
        displayMode: false,
        throwOnError: false,
        errorColor: '#cc0000',
        strict: 'warn'
      });
    } catch {
      return `<span class="katex-error" style="color: #cc0000;">${md.utils.escapeHtml(token.content)}</span>`;
    }
  };

  // Renderer for block math
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  md.renderer.rules.katex_block = (tokens: any, idx: number) => {
    const token = tokens[idx];
    try {
      return `<div class="katex-block">${katex.renderToString(token.content, {
        displayMode: true,
        throwOnError: false,
        errorColor: '#cc0000',
        strict: 'warn'
      })}</div>`;
    } catch {
      return `<div class="katex-error bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded p-3 my-2">
        <p class="text-red-700 dark:text-red-300 font-semibold">LaTeX Error:</p>
        <pre class="text-red-600 dark:text-red-400 text-sm mt-1">${md.utils.escapeHtml(token.content)}</pre>
      </div>`;
    }
  };
}

// Mermaid plugin for markdown-it
export function markdownItMermaid(md: MarkdownIt) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultRender = md.renderer.rules.fence || function(tokens: any, idx: number, options: any, env: any, renderer: any) {
    return renderer.renderToken(tokens, idx, options);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  md.renderer.rules.fence = function(tokens: any, idx: number, options: any, env: any, self: any) {
    const token = tokens[idx];
    const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
    const langName = info ? info.split(/\s+/g)[0] : '';

    if (langName === 'mermaid') {
      const content = token.content.trim();
      // Generate unique ID for this mermaid diagram
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return `<div class="mermaid-container" data-mermaid-content="${md.utils.escapeHtml(content)}" data-mermaid-id="${id}">
        <div class="mermaid-placeholder bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <div class="text-gray-500 dark:text-gray-400 text-sm">Mermaid diagram will render here</div>
        </div>
      </div>`;
    }

    return defaultRender(tokens, idx, options, env, self);
  };
}