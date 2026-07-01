import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const markdownParser = new MarkdownIt({
    breaks: true,
    html: false,
    linkify: true,
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
];

export function renderDescriptionMarkdown(value?: string) {
    if (!value) return "";

    return sanitizeHtml(markdownParser.render(value), {
        allowedTags: allowedDescriptionTags,
        allowedAttributes: {
            a: ["href", "title", "target", "rel"],
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
