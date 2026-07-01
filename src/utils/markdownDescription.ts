import MarkdownIt from "markdown-it";
import katex from "katex";
import sanitizeHtml from "sanitize-html";

const markdownParser = new MarkdownIt({
    breaks: true,
    html: false,
    linkify: true,
});

markdownParser.block.ruler.before("paragraph", "description_math_block", (state, startLine, endLine, silent) => {
    const lineStart = state.bMarks[startLine] + state.tShift[startLine];
    const lineEnd = state.eMarks[startLine];
    const firstLine = state.src.slice(lineStart, lineEnd).trim();

    if (!firstLine.startsWith("$$")) return false;
    if (silent) return true;

    let content = firstLine.slice(2);
    let nextLine = startLine;
    let foundEnd = false;

    if (content.trimEnd().endsWith("$$")) {
        content = content.trimEnd().slice(0, -2);
        foundEnd = true;
    } else {
        for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
            const start = state.bMarks[nextLine] + state.tShift[nextLine];
            const end = state.eMarks[nextLine];
            const line = state.src.slice(start, end);
            const closingIndex = line.indexOf("$$");

            if (closingIndex >= 0) {
                content += `\n${line.slice(0, closingIndex)}`;
                foundEnd = true;
                break;
            }

            content += `\n${line}`;
        }
    }

    if (!foundEnd) return false;

    const token = state.push("html_block", "", 0);
    token.content = katex.renderToString(content.trim(), {
        displayMode: true,
        throwOnError: false,
    });
    token.map = [startLine, nextLine + 1];
    state.line = nextLine + 1;
    return true;
});

markdownParser.inline.ruler.before("escape", "description_math_inline", (state, silent) => {
    const start = state.pos;

    if (state.src.charCodeAt(start) !== 0x24 || state.src.charCodeAt(start + 1) === 0x24) {
        return false;
    }

    let end = start + 1;
    while ((end = state.src.indexOf("$", end)) !== -1) {
        if (state.src.charCodeAt(end - 1) !== 0x5c) break;
        end++;
    }

    if (end === -1 || end === start + 1) return false;
    if (silent) return true;

    const token = state.push("html_inline", "", 0);
    token.content = katex.renderToString(state.src.slice(start + 1, end), {
        displayMode: false,
        throwOnError: false,
    });
    state.pos = end + 1;
    return true;
});

const allowedDescriptionTags = [
    "p",
    "br",
    "strong",
    "em",
    "a",
    "code",
    "s",
    "del",
    "ul",
    "ol",
    "li",
    "span",
    "math",
    "semantics",
    "annotation",
    "mrow",
    "mi",
    "mn",
    "mo",
    "ms",
    "mtext",
    "mspace",
    "mfrac",
    "msqrt",
    "mroot",
    "msup",
    "msub",
    "msubsup",
    "mover",
    "munder",
    "munderover",
    "mtable",
    "mtr",
    "mtd",
];

export function renderDescriptionMarkdown(value?: string) {
    if (!value) return "";

    return sanitizeHtml(markdownParser.render(value), {
        allowedTags: allowedDescriptionTags,
        allowedAttributes: {
            a: ["href", "title", "target", "rel"],
            span: ["class", "style", "aria-hidden"],
            math: ["xmlns"],
            annotation: ["encoding"],
        },
        allowedStyles: {
            span: {
                height: [/^[\d.]+em$/],
                "vertical-align": [/^-?[\d.]+em$/],
                top: [/^-?[\d.]+em$/],
                "margin-left": [/^-?[\d.]+em$/],
                "margin-right": [/^-?[\d.]+em$/],
            },
        },
        transformTags: {
            a: sanitizeHtml.simpleTransform("a", {
                rel: "noopener noreferrer",
                target: "_blank",
            }),
        },
    });
}

export function descriptionMarkdownToText(value?: string) {
    if (!value) return "";

    return sanitizeHtml(markdownParser.render(value), {
        allowedTags: [],
        allowedAttributes: {},
    })
        .replace(/\s+/g, " ")
        .trim();
}
