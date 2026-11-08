import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./ui.jsx";

// Render common Markdown formatting without injecting raw HTML.
function renderInline(source, keyPrefix = "inline") {
  const tokenPattern =
    /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;

  const parts = String(source).split(tokenPattern);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (!part) return null;

    if (
      (part.startsWith("**") && part.endsWith("**")) ||
      (part.startsWith("__") && part.endsWith("__"))
    ) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    if (
      (part.startsWith("*") && part.endsWith("*")) ||
      (part.startsWith("_") && part.endsWith("_"))
    ) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code className="md-inline-code" key={key}>
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("[") && part.includes("](")) {
      const match = part.match(
        /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/
      );

      if (match) {
        return (
          <a
            key={key}
            href={match[2]}
            target="_blank"
            rel="noreferrer"
          >
            {match[1]}
          </a>
        );
      }
    }

    return part;
  });
}

function MarkdownMessage({ content }) {
  const lines = String(content ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n");

  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Code blocks
    if (/^\s*```/.test(line)) {
      const code = [];
      i++;

      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        code.push(lines[i++]);
      }

      if (i < lines.length) i++;

      blocks.push(
        <pre className="md-code-block" key={`code-${i}`}>
          <code>{code.join("\n")}</code>
        </pre>
      );

      continue;
    }

    // Headings
    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/);

    if (heading) {
      const level = heading[1].length;
      const Tag = `h${level}`;

      blocks.push(
        <Tag className="md-heading" key={`heading-${i}`}>
          {renderInline(heading[2], `h-${i}`)}
        </Tag>
      );

      i++;
      continue;
    }

    // Horizontal rules
    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push(
        <hr className="md-rule" key={`rule-${i++}`} />
      );
      continue;
    }

    // Blockquotes
    if (/^\s*>/.test(line)) {
      const quote = [];

      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quote.push(lines[i++].replace(/^\s*>\s?/, ""));
      }

      blocks.push(
        <blockquote className="md-quote" key={`quote-${i}`}>
          {quote.map((q, n) => (
            <p key={n}>
              {renderInline(q, `q-${i}-${n}`)}
            </p>
          ))}
        </blockquote>
      );

      continue;
    }

    // Numbered and bullet lists
    const isOrdered = /^\s*\d+[.)]\s+/.test(line);
    const isUnordered = /^\s*[-*+]\s+/.test(line);

    if (isOrdered || isUnordered) {
      const items = [];

      const pattern = isOrdered
        ? /^\s*\d+[.)]\s+(.*)$/
        : /^\s*[-*+]\s+(.*)$/;

      while (i < lines.length && pattern.test(lines[i])) {
        items.push(lines[i++].match(pattern)[1]);
      }

      const List = isOrdered ? "ol" : "ul";

      blocks.push(
        <List className="md-list" key={`list-${i}`}>
          {items.map((item, n) => (
            <li key={n}>
              {renderInline(item, `li-${i}-${n}`)}
            </li>
          ))}
        </List>
      );

      continue;
    }

    // Paragraphs
    const paragraph = [line];
    i++;

    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*(#{1,6}\s|```|>|[-*+]\s|\d+[.)]\s|---+\s*$)/.test(
        lines[i]
      )
    ) {
      paragraph.push(lines[i++]);
    }

    blocks.push(
      <p className="md-paragraph" key={`p-${i}`}>
        {paragraph.map((part, n) => (
          <React.Fragment key={n}>
            {n > 0 && <br />}
            {renderInline(part, `p-${i}-${n}`)}
          </React.Fragment>
        ))}
      </p>
    );
  }

  return <div className="md-content">{blocks}</div>;
}

const CHIPS = [
  "List customers",
  "Show pending orders",
  "Update an order status",
  "Generate a business report",
  "Create a customer",
];

// Chat window + Agent Activity panel.
// The activity panel shows only what the backend reports in toolCalls.
export default function Chat({
  send,
  storageKey,
  inline = false,
  intro,
}) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState(true);

  const conv = useRef(
    (() => {
      try {
        return sessionStorage.getItem(storageKey) || "";
      } catch {
        return "";
      }
    })()
  );

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, busy]);

  const remember = (id) => {
    conv.current = id || "";

    try {
      id
        ? sessionStorage.setItem(storageKey, id)
        : sessionStorage.removeItem(storageKey);
    } catch {
      // Storage unavailable
    }
  };

  async function submit(raw) {
    const message = raw.trim();

    if (!message || busy) return;

    setText("");
    setMsgs((m) => [...m, { role: "user", text: message }]);
    setBusy(true);

    const attempt = () =>
      send({
        message,
        ...(conv.current
          ? { conversationId: conv.current }
          : {}),
      });

    try {
      let r;

      try {
        r = await attempt();
      } catch (e) {
        if (e.code !== "conversation_not_found") throw e;

        remember("");
        r = await attempt();
      }

      remember(r.conversationId);

      setMsgs((m) => [
        ...m,
        {
          role: "agent",
          text: r.reply,
          toolCalls: r.toolCalls || [],
        },
      ]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        {
          role: "agent",
          text: e.message,
          failed: true,
          toolCalls: [],
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const last = [...msgs]
    .reverse()
    .find((m) => m.role === "agent");

  return (
    <div className={`pgb${inline ? " in" : ""}`}>
      <div className="chat">
        <div className="cm">
          <div className="ma">
            {intro ||
              "Hi, I’m the DPathfinder agent. Ask me about customers, orders or reports."}
          </div>

          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div className="mu1" key={i}>
                {m.text}
              </div>
            ) : (
              <div className="ma" key={i}>
                <MarkdownMessage content={m.text} />

                {m.toolCalls.map((t, j) => (
                  <div key={j}>
                    <span
                      className="tag"
                      style={{ margin: "8px 0 0" }}
                    >
                      <Icon
                        n="box"
                        s={14}
                        c="var(--cy)"
                      />
                      {" "}
                      {t.name} {t.ok ? "✓" : "✕"}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

          {busy && (
            <div
              className="ma"
              role="status"
              aria-live="polite"
            >
              Working on it…
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className="chips">
          {CHIPS.map((c) => (
            <button
              type="button"
              key={c}
              className="chip"
              disabled={busy}
              onClick={() => submit(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <form
          className="ci"
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
        >
          <input
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask the agent…"
            aria-label="Message"
          />

          <button
            type="submit"
            className="b bp"
            disabled={busy || !text.trim()}
          >
            Send
          </button>
        </form>
      </div>

      <aside className="act" aria-label="Agent Activity">
        <div className="row sb2">
          <b>Agent Activity</b>

          <button
            type="button"
            className="linkbtn"
            onClick={() => setPanel(!panel)}
            aria-expanded={panel}
          >
            {panel ? "Hide" : "Show"}
          </button>
        </div>

        {panel &&
          (last ? (
            <>
              <div className="ai">
                {last.failed ? "✕ Request failed" : "✓ Request received"}
              </div>

              {last.toolCalls.map((t, i) => (
                <details
                  className="ai"
                  key={i}
                  open={!t.ok}
                >
                  <summary>
                    {t.ok ? "✓" : "✕"} {t.name}
                  </summary>

                  <p className="mu sm">
                    {t.ok
                      ? "Ran successfully in your workspace."
                      : t.error || "The tool failed."}
                  </p>
                </details>
              ))}

              {!last.toolCalls.length && !last.failed && (
                <div className="ai">
                  ✓ No tool was needed
                </div>
              )}

              <div className="ai">
                {last.failed
                  ? "✕ Request failed"
                  : "✓ Response generated"}
              </div>
            </>
          ) : (
            <p className="mu sm">
              Send a message to see which tools the backend ran.
            </p>
          ))}

        <p className="mu sm">
          Shows only what the backend reports. Nothing here is simulated.
        </p>
      </aside>
    </div>
  );
}