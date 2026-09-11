import type { Questionnaire } from "./types.ts";

/**
 * Panel text dictionary. Both locales must declare the same keys; the explicit
 * interface below is what enforces that at compile time. Agent-authored question
 * content is never translated and therefore never appears here.
 */
interface GlimpsePanelText {
  allQuestions: string;
  answeredOf: string;
  badgeOptional: string;
  badgeRecommended: string;
  badgeRequired: string;
  cancel: string;
  confirm: string;
  customPlaceholder: string;
  customTitle: string;
  dataBroken: string;
  emptyAnswer: string;
  errorRequired: string;
  hintStack: readonly (readonly [
    string,
    string,
  ])[];
  hintStep: readonly (readonly [
    string,
    string,
  ])[];
  lang: string;
  langTitle: string;
  next: string;
  prev: string;
  reviewCount: string;
  reviewFeedback: string;
  reviewFeedbackPlaceholder: string;
  reviewLead: string;
  round: string;
  stepMode: string;
  stepOf: string;
  submit: string;
  textPlaceholder: string;
  textPlaceholderOptional: string;
  typeInfo: string;
  typeMulti: string;
  typeSingle: string;
  typeText: string;
  variant: string;
  variantTitle: string;
}

export const GLIMPSE_PANEL_TEXT = {
  en: {
    allQuestions: "All questions",
    answeredOf: "{done} / {total} answered",
    badgeOptional: "optional",
    badgeRecommended: "recommended",
    badgeRequired: "required",
    cancel: "Cancel",
    confirm: "Confirm",
    customPlaceholder: "Type your own answer…",
    customTitle: "Custom…",
    dataBroken: "Malformed question data, cannot render: ",
    emptyAnswer: "Not answered",
    errorRequired: "Required: answer this before continuing.",
    lang: "中",
    langTitle: "切换到简体中文",
    next: "Next →",
    prev: "← Back",
    reviewCount: "Review / {n}",
    reviewFeedback: "Anything else to add?",
    reviewFeedbackPlaceholder: "Optional",
    reviewLead: "These are your answers. Click any row to go back and change it.",
    round: "Round {n}",
    stepMode: "Stepped",
    stepOf: "Question {i} / {n}",
    submit: "Submit",
    textPlaceholder: "Type your answer…",
    textPlaceholderOptional: "Optional",
    typeInfo: "info",
    typeMulti: "multiple",
    typeSingle: "single",
    typeText: "text",
    variant: "Stacked",
    variantTitle: "Switch to stacked layout",
    hintStack: [
      [
        "tab",
        "switch option",
      ],
      [
        "esc",
        "cancel",
      ],
      [
        "⌘⏎",
        "submit",
      ],
    ],
    hintStep: [
      [
        "⏎",
        "next",
      ],
      [
        "esc",
        "cancel",
      ],
      [
        "⌘⏎",
        "submit",
      ],
    ],
  },
  zh: {
    allQuestions: "全部问题",
    answeredOf: "已答 {done} / {total}",
    badgeOptional: "可留空",
    badgeRecommended: "推荐",
    badgeRequired: "必答",
    cancel: "取消",
    confirm: "确认",
    customPlaceholder: "输入你的答案…",
    customTitle: "自定义…",
    dataBroken: "题目数据损坏, 无法渲染: ",
    emptyAnswer: "未作答",
    errorRequired: "必答: 请先作答再继续。",
    lang: "EN",
    langTitle: "Switch to English",
    next: "下一步 →",
    prev: "← 上一步",
    reviewCount: "确认 / {n}",
    reviewFeedback: "还有别的补充吗?",
    reviewFeedbackPlaceholder: "可留空",
    // biome-ignore lint/security/noSecrets: Chinese interface copy, not a credential.
    reviewLead: "下面是你的全部答案。点任意一条可以回到该题修改。",
    round: "第 {n} 轮",
    stepMode: "分步",
    stepOf: "问题 {i} / {n}",
    submit: "提交",
    textPlaceholder: "输入你的回答…",
    textPlaceholderOptional: "可留空",
    typeInfo: "说明",
    typeMulti: "多选",
    typeSingle: "单选",
    typeText: "文本",
    variant: "单页",
    variantTitle: "切换为单页布局",
    hintStack: [
      [
        "tab",
        "切换选项",
      ],
      [
        "esc",
        "取消",
      ],
      [
        "⌘⏎",
        "提交",
      ],
    ],
    hintStep: [
      [
        "⏎",
        "下一步",
      ],
      [
        "esc",
        "取消",
      ],
      [
        "⌘⏎",
        "提交",
      ],
    ],
  },
} satisfies Record<"zh" | "en", GlimpsePanelText>;

/**
 * Panel stylesheet. Two semantic token sets decide the look: the light set lives
 * on `:root`, the dark set on `[data-theme="dark"]`. Components must reference
 * tokens only, never literals, so a theme swap cannot leave a stray color behind.
 * See `DESIGN.md` for the provenance of each value.
 */
export const GLIMPSE_PANEL_CSS = `:root {
  color-scheme: light dark;
  --background: oklch(0.9711 0.0074 80.7211);
  --foreground: oklch(0.3 0.0358 30.2042);
  --muted: oklch(0.937 0.0142 74.4218);
  --muted-foreground: oklch(0.4495 0.0486 39.211);
  --accent: oklch(0.8952 0.0504 146.0366);
  --accent-foreground: oklch(0.4254 0.1159 144.3078);
  --primary: oklch(0.5234 0.1347 144.1672);
  --primary-foreground: oklch(1 0 0);
  --destructive: oklch(0.5386 0.1937 26.7249);
  --border: oklch(0.8805 0.0208 74.6428);
  --input: oklch(0.8805 0.0208 74.6428);
  --ring: oklch(0.5234 0.1347 144.1672);
  --popover: oklch(0.9711 0.0074 80.7211);
  --popover-foreground: oklch(0.3 0.0358 30.2042);
  --font-sans: Montserrat, ui-sans-serif, system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-mono: "Source Code Pro", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --radius: 0.5rem;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --dur: 140ms;
  --ease: cubic-bezier(.25, .1, .25, 1);
}
[data-theme="dark"] {
  color-scheme: dark;
  --background: oklch(0.2679 0.0036 106.6427);
  --foreground: oklch(0.8074 0.0142 93.0137);
  --muted: oklch(0.2213 0.0038 106.707);
  --muted-foreground: oklch(0.7713 0.0169 99.0657);
  --accent: oklch(0.213 0.0078 95.4245);
  --accent-foreground: oklch(0.9663 0.008 98.8792);
  --primary: oklch(0.6724 0.1308 38.7559);
  --primary-foreground: oklch(1 0 0);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --border: oklch(0.3618 0.0101 106.8928);
  --input: oklch(0.4336 0.0113 100.2195);
  --ring: oklch(0.6724 0.1308 38.7559);
  --popover: oklch(0.3085 0.0035 106.6039);
  --popover-foreground: oklch(0.9211 0.004 106.4781);
}
[data-theme="light"] { color-scheme: light; }

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  font: 13.5px/1.55 var(--font-sans);
  background: transparent;
  color: var(--foreground);
  -webkit-user-select: none;
  user-select: none;
}
input, textarea { -webkit-user-select: text; user-select: text; font: inherit; }
:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }

.gd-shell {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100vh;
  color: var(--popover-foreground);
  background: color-mix(in srgb, var(--popover) 88%, transparent);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  backdrop-filter: blur(24px) saturate(1.4);
}
.gd-titlebar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
}
.gd-title { font-weight: 700; letter-spacing: .01em; }
.chip {
  flex: none;
  padding: 2px 8px;
  font-size: 11.5px;
  color: var(--muted-foreground);
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.gd-stepbar {
  flex: none;
  position: relative;
  padding: 12px 20px 14px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--background) 55%, transparent);
}
.gd-steprow { display: flex; align-items: center; gap: 14px; }
.gd-stepcount { flex: none; font-size: 17px; font-weight: 650; letter-spacing: .01em; }
.gd-dots { flex: 1; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.gd-dot {
  width: 30px;
  height: 30px;
  padding: 0;
  font: 600 13px var(--font-sans);
  color: var(--muted-foreground);
  cursor: pointer;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: 999px;
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease), border-color var(--dur) var(--ease);
}
.gd-dot:hover { background: var(--accent); color: var(--accent-foreground); }
.gd-dot[data-state="answered"] { color: var(--primary); border-color: var(--primary); }
.gd-dot[data-state="current"] { color: var(--primary-foreground); background: var(--primary); border-color: var(--primary); }
.gd-stepmeta { flex: none; font-size: 13px; color: var(--muted-foreground); font-variant-numeric: tabular-nums; }
.gd-stepmeta b { color: var(--foreground); font-weight: 650; }
.gd-track { position: absolute; left: 0; right: 0; bottom: -1px; height: 3px; background: var(--muted); }
.gd-track i { display: block; width: 0; height: 100%; background: var(--primary); transition: width var(--dur) var(--ease); }
.gd-content { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 20px; }
.gd-inner { max-width: 660px; margin: 0 auto; min-height: 100%; }
.gd-footer {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  border-top: 1px solid var(--border);
  background: color-mix(in srgb, var(--background) 80%, transparent);
  -webkit-backdrop-filter: blur(24px);
  backdrop-filter: blur(24px);
}
.hints { flex: 1; font-size: 12px; color: var(--muted-foreground); }
kbd {
  font: 11.5px var(--font-mono);
  padding: 2px 6px;
  color: var(--foreground);
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.btn {
  min-height: 40px;
  padding: 9px 20px;
  font: 600 14px var(--font-sans);
  color: var(--foreground);
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background var(--dur) var(--ease), filter var(--dur) var(--ease);
}
.btn:hover { background: var(--accent); color: var(--accent-foreground); }
.btn-primary { color: var(--primary-foreground); background: var(--primary); border-color: transparent; }
.btn-primary:hover { color: var(--primary-foreground); background: var(--primary); filter: brightness(1.08); }
.btn.hidden { display: none; }
fieldset { border: 0; margin: 0; padding: 0; }
legend { font-size: 15px; font-weight: 650; line-height: 1.5; margin-bottom: 12px; white-space: pre-wrap; }
label, p { display: block; margin: 8px 0; white-space: pre-wrap; }
textarea, input:not([type="radio"]):not([type="checkbox"]) {
  width: 100%;
  padding: 10px 12px;
  color: var(--foreground);
  background: var(--muted);
  border: 1px solid var(--input);
  border-radius: var(--radius-md);
}
.preview { color: var(--muted-foreground); }
.q-err { display: none; margin-top: 9px; font-size: 12.5px; color: var(--destructive); }
.q.err .q-err { display: block; }`;

const PANEL_SCRIPT_BODY = `(() => {
  const UI_TEXT = __UI_TEXT__;
  let lang = "zh";
  function t(key, vars) {
    const value = UI_TEXT[lang][key];
    if (typeof value !== "string") return value;
    return value.replace(/\\{(\\w+)\\}/g, (all, name) =>
      vars && Object.hasOwn(vars, name) ? String(vars[name]) : all,
    );
  }

  const data = JSON.parse(document.getElementById("xpi-research-data").textContent);
  const QUESTIONS = data.questionnaire.questions;
  const ANSWERABLE = QUESTIONS.filter((question) => question.type !== "info");
  const state = { page: 0, answers: {} };
  const inner = document.getElementById("inner");

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function isAnswered(question) {
    const value = state.answers[question.id];
    if (question.type === "multi") return Array.isArray(value) && value.length > 0;
    return typeof value === "string" && value.trim().length > 0;
  }
  function setAnswer(question, value) {
    const empty = Array.isArray(value)
      ? value.length === 0
      : typeof value !== "string" || value.trim().length === 0;
    if (empty) delete state.answers[question.id];
    else state.answers[question.id] = value;
  }

  function questionSection(question) {
    const section = el("section", "q");
    section.dataset.qid = question.id;
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = question.prompt;
    fieldset.append(legend);
    if (question.type === "info") {
      fieldset.append(el("p", "q-note", question.prompt));
    } else if (question.type === "text") {
      const input = document.createElement("textarea");
      input.name = question.id;
      input.rows = 3;
      input.placeholder = question.required ? t("textPlaceholder") : t("textPlaceholderOptional");
      input.value = typeof state.answers[question.id] === "string" ? state.answers[question.id] : "";
      fieldset.append(input);
    } else {
      for (const option of question.options) {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = question.type === "multi" ? "checkbox" : "radio";
        input.name = question.id;
        input.value = option.label;
        const saved = state.answers[question.id];
        input.checked =
          question.type === "multi"
            ? Array.isArray(saved) && saved.includes(option.label)
            : saved === option.label;
        label.append(input, document.createTextNode(" " + option.label));
        if (option.description) label.append(el("span", "preview", option.description));
        if (option.preview) label.append(el("p", "preview", option.preview));
        fieldset.append(label);
      }
    }
    section.append(fieldset, el("p", "q-err", t("errorRequired")));
    return section;
  }

  function readStep() {
    const question = QUESTIONS[state.page];
    if (!question || question.type === "info") return;
    if (question.type === "text") {
      const area = inner.querySelector("textarea[name='" + question.id + "']");
      if (area) setAnswer(question, area.value);
      return;
    }
    const checked = [...inner.querySelectorAll("input[name='" + question.id + "']:checked")].map(
      (node) => node.value,
    );
    setAnswer(question, question.type === "multi" ? checked : checked[0]);
  }

  function render() {
    inner.textContent = "";
    const question = QUESTIONS[state.page];
    if (question) inner.append(questionSection(question));
    syncStepbar();
    syncFooter();
  }

  function syncStepbar() {
    document.getElementById("step-count").textContent = t("stepOf", {
      i: state.page + 1,
      n: QUESTIONS.length,
    });

    const dots = document.getElementById("dots");
    dots.textContent = "";
    QUESTIONS.forEach((question, index) => {
      const dot = el("button", "gd-dot", String(index + 1));
      dot.type = "button";
      dot.dataset.goto = String(index);
      const current = index === state.page;
      dot.dataset.state = current ? "current" : isAnswered(question) ? "answered" : "idle";
      if (current) dot.setAttribute("aria-current", "step");
      dots.append(dot);
    });

    const done = ANSWERABLE.filter(isAnswered).length;
    const meta = document.getElementById("step-meta");
    meta.textContent = "";
    const parts = t("answeredOf")
      .replace("{total}", String(ANSWERABLE.length))
      .split("{done}");
    meta.append(
      document.createTextNode(parts[0]),
      el("b", null, String(done)),
      document.createTextNode(parts[1] || ""),
    );
    document.getElementById("track-fill").style.width =
      (ANSWERABLE.length > 0 ? done / ANSWERABLE.length : 0) * 100 + "%";
  }

  function syncFooter() {
    const last = state.page >= QUESTIONS.length - 1;
    document.getElementById("b-prev").classList.toggle("hidden", state.page === 0);
    document.getElementById("b-prev").textContent = t("prev");
    document.getElementById("b-cancel").textContent = t("cancel");
    document.getElementById("b-submit").textContent = last ? t("submit") : t("next");

    const hints = document.getElementById("hints");
    hints.textContent = "";
    t("hintStep").forEach((pair, index) => {
      if (index > 0) hints.append(document.createTextNode(" · "));
      hints.append(el("kbd", null, pair[0]), document.createTextNode(" " + pair[1]));
    });
  }

  function showError(question) {
    const section = inner.querySelector('.q[data-qid="' + question.id + '"]');
    if (section) section.classList.add("err");
  }

  function clearError() {
    for (const section of inner.querySelectorAll(".q.err")) section.classList.remove("err");
  }

  function collect() {
    const answers = {};
    for (const question of ANSWERABLE) {
      if (isAnswered(question)) answers[question.id] = state.answers[question.id];
    }
    return answers;
  }

  function emit(payload) {
    window.parent.postMessage(payload, "*");
  }

  function submit() {
    const missing = ANSWERABLE.find((question) => question.required && !isAnswered(question));
    if (missing) {
      state.page = QUESTIONS.indexOf(missing);
      render();
      showError(missing);
      return;
    }
    emit({ round: data.round, cancelled: false, answers: collect() });
  }

  function goNext() {
    readStep();
    clearError();
    const current = QUESTIONS[state.page];
    if (current && current.required && !isAnswered(current)) {
      showError(current);
      return;
    }
    if (state.page >= QUESTIONS.length - 1) {
      submit();
      return;
    }
    state.page += 1;
    render();
  }

  function goTo(index) {
    readStep();
    state.page = Math.max(0, Math.min(QUESTIONS.length - 1, index));
    render();
  }

  document.getElementById("dots").addEventListener("click", (event) => {
    const dot = event.target.closest(".gd-dot");
    if (dot) goTo(Number(dot.dataset.goto));
  });
  document.getElementById("b-prev").addEventListener("click", () => goTo(state.page - 1));
  document.getElementById("b-submit").addEventListener("click", () => goNext());
  document.getElementById("b-cancel").addEventListener("click", () => {
    emit({ round: data.round, cancelled: true, answers: {} });
  });
  document.addEventListener("change", () => {
    readStep();
    clearError();
    syncStepbar();
  });
  document.addEventListener("input", (event) => {
    if (event.target.tagName !== "TEXTAREA") return;
    readStep();
    clearError();
    syncStepbar();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      emit({ round: data.round, cancelled: true, answers: {} });
      return;
    }
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      submit();
      return;
    }
    if (event.key === "Enter" && event.target.tagName !== "TEXTAREA") goNext();
  });

  document.getElementById("round-chip").textContent = t("round", { n: data.round });
  render();
})();`;

/**
 * Panel page script. It runs inside the Glimpse webview, where no TypeScript
 * checking applies, so it stays self-contained and quotes every dynamic value
 * through `textContent` instead of building markup.
 */
export const GLIMPSE_PANEL_SCRIPT = PANEL_SCRIPT_BODY.replace(
  "__UI_TEXT__",
  JSON.stringify(GLIMPSE_PANEL_TEXT),
);

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "\\u0026")
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e");
}

/**
 * Render the one-shot questionnaire panel. Questionnaire content is embedded as
 * escaped JSON in a non-executable script element and is rendered by the page
 * script through `textContent`, so agent-authored text can never become markup.
 */
export function renderGlimpseQuestionnaire(
  questionnaire: Questionnaire,
  round: number,
): string {
  const data = escapeHtml(
    JSON.stringify({
      questionnaire,
      round,
    }),
  );
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="color-scheme" content="light dark">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>xpi-research</title>
<style>
${GLIMPSE_PANEL_CSS}
</style>
</head>
<body>
<div class="gd-shell">
  <header class="gd-titlebar">
    <span class="gd-title">xpi-research</span>
    <span class="chip" id="round-chip"></span>
  </header>
  <div class="gd-stepbar">
    <div class="gd-steprow">
      <span class="gd-stepcount" id="step-count"></span>
      <div class="gd-dots" id="dots" role="tablist" aria-label="questions"></div>
      <span class="gd-stepmeta" id="step-meta"></span>
    </div>
    <div class="gd-track"><i id="track-fill"></i></div>
  </div>
  <main class="gd-content"><div class="gd-inner" id="inner"></div></main>
  <footer class="gd-footer">
    <span class="hints" id="hints"></span>
    <button class="btn hidden" id="b-prev" type="button"></button>
    <button class="btn" id="b-cancel" type="button"></button>
    <button class="btn btn-primary" id="b-submit" type="button"></button>
  </footer>
</div>
<script type="application/json" id="xpi-research-data">${data}</script>
<script>
${GLIMPSE_PANEL_SCRIPT}
</script>
</body>
</html>`;
}
