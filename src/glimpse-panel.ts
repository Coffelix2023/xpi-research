// biome-ignore-all lint/security/noSecrets: the panel ships Chinese interface copy, which trips the entropy heuristic.
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
  bridgeMissing: string;
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
  themeTitle: string;
  typeInfo: string;
  typeMulti: string;
  typeSingle: string;
  typeText: string;
  variant: string;
  variantTitle: string;
  zoomIn: string;
  zoomInTitle: string;
  zoomOut: string;
  zoomOutTitle: string;
  zoomReset: string;
  zoomResetTitle: string;
}

export const GLIMPSE_PANEL_TEXT = {
  en: {
    allQuestions: "All questions",
    answeredOf: "{done} / {total} answered",
    badgeOptional: "optional",
    badgeRecommended: "recommended",
    badgeRequired: "required",
    bridgeMissing: "Could not deliver this result. Close the window and retry.",
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
    themeTitle: "Toggle dark / light",
    typeInfo: "info",
    typeMulti: "multiple",
    typeSingle: "single",
    typeText: "text",
    variant: "Stacked",
    variantTitle: "Switch to stacked layout",
    zoomIn: "A+",
    zoomInTitle: "Zoom in",
    zoomOut: "A−",
    zoomOutTitle: "Zoom out",
    zoomReset: "⟲",
    zoomResetTitle: "Reset zoom",
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
    bridgeMissing: "无法回传结果。请关闭窗口后重试。",
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
    reviewLead: "下面是你的全部答案。点任意一条可以回到该题修改。",
    round: "第 {n} 轮",
    stepMode: "分步",
    stepOf: "问题 {i} / {n}",
    submit: "提交",
    textPlaceholder: "输入你的回答…",
    textPlaceholderOptional: "可留空",
    themeTitle: "切换暗色 / 亮色",
    typeInfo: "说明",
    typeMulti: "多选",
    typeSingle: "单选",
    typeText: "文本",
    variant: "单页",
    variantTitle: "切换为单页布局",
    zoomIn: "A+",
    zoomInTitle: "放大",
    zoomOut: "A−",
    zoomOutTitle: "缩小",
    zoomReset: "⟲",
    zoomResetTitle: "重置缩放",
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
[data-contrast="true"] { --muted-foreground: var(--foreground); --border: currentColor; }

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
.gd-spacer { flex: 1; }
.chip {
  flex: none;
  padding: 2px 8px;
  font-size: 11.5px;
  color: var(--muted-foreground);
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.gd-toolbtn {
  flex: none;
  min-width: 30px;
  height: 26px;
  padding: 0 9px;
  font: inherit;
  font-size: 12px;
  color: var(--muted-foreground);
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
}
.gd-toolbtn:hover { background: var(--accent); color: var(--accent-foreground); }
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
.gd-inner { max-width: calc(660px / var(--zoom, 1)); margin: 0 auto; min-height: calc(100% / var(--zoom, 1)); zoom: var(--zoom, 1); }

.q { padding-bottom: 20px; }
.q + .q { padding-top: 20px; border-top: 1px solid var(--border); }
.q-head { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; flex-wrap: wrap; }
.q-num {
  flex: none;
  padding: 1px 7px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--primary-foreground);
  background: var(--primary);
  border-radius: var(--radius-sm);
}
.badge {
  flex: none;
  padding: 1px 7px;
  font-size: 11.5px;
  color: var(--muted-foreground);
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.badge.req { color: var(--destructive); border-color: color-mix(in srgb, var(--destructive) 50%, transparent); }
.badge.rec { color: var(--primary); border-color: color-mix(in srgb, var(--primary) 50%, transparent); }
.q-prompt { font-size: 15px; font-weight: 650; line-height: 1.5; white-space: pre-wrap; }
.q-note {
  margin-top: 12px;
  padding: 11px 13px;
  color: var(--muted-foreground);
  white-space: pre-wrap;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.q-err { display: none; margin-top: 9px; font-size: 12.5px; color: var(--destructive); }
.q.err .q-err { display: block; }
.q.err .opt, .q.err .q-input { border-color: var(--destructive); }

.opts { display: flex; flex-direction: column; gap: 7px; margin-top: 12px; }
.opt {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 0 11px;
  padding: 11px 13px;
  cursor: pointer;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: background var(--dur) var(--ease), border-color var(--dur) var(--ease);
}
.opt:hover { background: var(--accent); }
.opt input { align-self: start; width: 16px; height: 16px; margin-top: 3px; accent-color: var(--primary); cursor: pointer; }
.opt:has(input:checked) {
  background: color-mix(in srgb, var(--primary) 16%, var(--muted));
  border-color: var(--primary);
}
.opt-body { min-width: 0; }
.opt-title { display: block; font-weight: 550; white-space: pre-wrap; overflow-wrap: anywhere; }
.opt-title .badge { margin-left: 6px; vertical-align: 1px; }
.opt-desc { margin-top: 4px; font-size: 12.5px; color: var(--muted-foreground); white-space: pre-wrap; overflow-wrap: anywhere; }
.opt-prev {
  margin-top: 7px;
  padding: 9px 11px;
  max-height: 220px;
  overflow: auto;
  font: 12px/1.5 var(--font-mono);
  color: var(--muted-foreground);
  white-space: pre-wrap;
  background: color-mix(in srgb, var(--background) 70%, transparent);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.opt.is-custom .opt-title { color: var(--muted-foreground); font-weight: 500; }
.custom-wrap { display: none; margin: 7px 0 1px; }
.opt.is-custom:has(input:checked) + .custom-wrap { display: block; }
.q-input, .custom-input {
  width: 100%;
  padding: 10px 12px;
  resize: vertical;
  color: var(--foreground);
  background: var(--muted);
  border: 1px solid var(--input);
  border-radius: var(--radius-md);
  line-height: 1.55;
}
.custom-input { font-size: 13px; }
.q-input { margin-top: 12px; }
.q-input::placeholder, .custom-input::placeholder { color: var(--muted-foreground); }

.review-ask { margin-top: 18px; font-size: 13.5px; font-weight: 650; }
.review-list { display: flex; flex-direction: column; gap: 7px; margin-top: 12px; }
.thumb {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 0 11px;
  width: 100%;
  padding: 10px 12px;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: background var(--dur) var(--ease), border-color var(--dur) var(--ease);
}
.thumb:hover { background: var(--accent); }
.thumb-no {
  grid-row: span 2;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted-foreground);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 999px;
}
.thumb-q { overflow: hidden; font-size: 12px; color: var(--muted-foreground); text-overflow: ellipsis; white-space: nowrap; }
.thumb-a { font-size: 13.5px; font-weight: 550; white-space: pre-wrap; overflow-wrap: anywhere; }
.thumb-a.empty { font-weight: 400; font-style: italic; color: var(--muted-foreground); }

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
.hints[data-state="error"] { color: var(--destructive); }
kbd {
  padding: 2px 6px;
  font: 11.5px var(--font-mono);
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

[data-reduce-motion="true"] * { animation: none !important; transition: none !important; }`;

const PANEL_SCRIPT_BODY = `(() => {
  const UI_TEXT = __UI_TEXT__;
  let lang = "zh";
  let themeOverridden = false;
  let zoom = 1;

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
  const REVIEW_INDEX = QUESTIONS.length;
  const TOTAL_PAGES = QUESTIONS.length + 1;
  const state = { page: 0, variant: "step", answers: {}, drafts: {}, feedback: "", error: "" };
  const inner = document.getElementById("inner");

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function typeLabel(type) {
    if (type === "single") return t("typeSingle");
    if (type === "multi") return t("typeMulti");
    if (type === "text") return t("typeText");
    return t("typeInfo");
  }

  function draftOf(question) {
    const draft = state.drafts[question.id];
    return typeof draft === "string" ? draft.trim() : "";
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

  function hasCustom(question) {
    return question.type === "single" || question.type === "multi";
  }

  /** Single source of truth for the option set plus the custom draft. */
  function recompute(question) {
    if (!hasCustom(question)) return;
    const box = questionSection(question.id);
    if (!box) return;
    const custom = box.querySelector(".opt.is-custom input");
    const selected = [...box.querySelectorAll(".opt:not(.is-custom) input:checked")].map(
      (node) => node.value,
    );
    const draft = draftOf(question);
    if (question.type === "single") {
      setAnswer(question, custom && custom.checked ? draft : selected[0]);
      return;
    }
    const answers = selected.slice();
    if (custom && custom.checked && draft !== "") answers.push(draft);
    setAnswer(question, answers);
  }

  function questionSection(questionId) {
    return inner.querySelector('.q[data-qid="' + questionId + '"]');
  }

  function optionNode(question, option) {
    const wrap = el("label", "opt");
    const input = document.createElement("input");
    input.type = question.type === "multi" ? "checkbox" : "radio";
    input.name = question.id;
    input.value = option.label;
    const saved = state.answers[question.id];
    input.checked =
      question.type === "multi"
        ? Array.isArray(saved) && saved.includes(option.label)
        : saved === option.label;

    const body = el("span", "opt-body");
    const title = el("span", "opt-title", option.label);
    if (option.recommended) title.append(el("span", "badge rec", t("badgeRecommended")));
    body.append(title);
    if (option.description) body.append(el("p", "opt-desc", option.description));
    if (option.preview) body.append(el("pre", "opt-prev", option.preview));
    wrap.append(input, body);
    return wrap;
  }

  function customNodes(question) {
    const draft = draftOf(question);
    const saved = state.answers[question.id];
    const active =
      question.type === "multi"
        ? Array.isArray(saved) && draft !== "" && saved.includes(draft)
        : saved === draft && draft !== "";

    const wrap = el("label", "opt is-custom");
    const input = document.createElement("input");
    input.type = question.type === "multi" ? "checkbox" : "radio";
    input.name = question.id;
    input.value = "__custom";
    input.checked = active;
    const body = el("span", "opt-body");
    body.append(el("span", "opt-title", t("customTitle")));
    wrap.append(input, body);

    const box = el("div", "custom-wrap");
    const area = document.createElement("textarea");
    area.className = "custom-input";
    area.rows = 2;
    area.placeholder = t("customPlaceholder");
    area.value = draft;
    area.setAttribute("aria-label", t("customTitle") + " " + question.prompt);
    box.append(area);
    return [wrap, box];
  }

  function questionNode(question, order) {
    const section = el("section", "q");
    section.dataset.qid = question.id;

    const head = el("div", "q-head");
    head.append(el("span", "q-num", "Q" + order), el("span", "badge", typeLabel(question.type)));
    if (question.type !== "info") {
      head.append(
        el(
          "span",
          "badge" + (question.required ? " req" : ""),
          question.required ? t("badgeRequired") : t("badgeOptional"),
        ),
      );
    }
    section.append(head);

    if (question.type === "info") {
      section.append(el("p", "q-note", question.prompt));
      return section;
    }

    section.append(el("p", "q-prompt", question.prompt));
    if (question.type === "text") {
      const area = document.createElement("textarea");
      area.className = "q-input";
      area.name = question.id;
      area.rows = 3;
      area.placeholder = question.required ? t("textPlaceholder") : t("textPlaceholderOptional");
      area.value = typeof state.answers[question.id] === "string" ? state.answers[question.id] : "";
      section.append(area);
    } else {
      const list = el("div", "opts");
      for (const option of question.options) list.append(optionNode(question, option));
      for (const node of customNodes(question)) list.append(node);
      section.append(list);
    }
    section.append(el("p", "q-err", state.error === question.id ? t("errorRequired") : ""));
    if (state.error === question.id) section.classList.add("err");
    return section;
  }

  function thumbNode(question, order) {
    const button = el("button", "thumb");
    button.type = "button";
    button.dataset.goto = String(QUESTIONS.indexOf(question));
    button.append(el("span", "thumb-no", "Q" + order), el("span", "thumb-q", question.prompt));
    if (question.type === "info") {
      button.append(el("span", "thumb-a empty", typeLabel(question.type)));
      return button;
    }
    const value = state.answers[question.id];
    const text = Array.isArray(value) ? value.join(" · ") : value;
    const answered = isAnswered(question);
    button.append(
      el("span", "thumb-a" + (answered ? "" : " empty"), answered ? text : t("emptyAnswer")),
    );
    return button;
  }

  function reviewNode() {
    const section = el("section", "q q-review");
    const head = el("div", "q-head");
    head.append(el("span", "q-num", "✓"), el("span", "badge", t("reviewCount", { n: TOTAL_PAGES })));
    section.append(head, el("p", "q-prompt", t("reviewLead")));

    const list = el("div", "review-list");
    QUESTIONS.forEach((question, index) => list.append(thumbNode(question, index + 1)));
    section.append(list, el("p", "review-ask", t("reviewFeedback")));

    const area = document.createElement("textarea");
    area.className = "q-input";
    area.id = "review-feedback";
    area.rows = 3;
    area.placeholder = t("reviewFeedbackPlaceholder");
    area.value = state.feedback;
    section.append(area);
    return section;
  }

  function render() {
    inner.textContent = "";
    if (state.variant === "stack") {
      QUESTIONS.forEach((question, index) => inner.append(questionNode(question, index + 1)));
      inner.append(reviewNode());
    } else {
      inner.append(
        state.page === REVIEW_INDEX ? reviewNode() : questionNode(QUESTIONS[state.page], state.page + 1),
      );
    }
    syncChrome();
    syncStepbar();
    syncFooter();
  }

  function syncChrome() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.getElementById("round-chip").textContent = t("round", { n: data.round });
    const langButton = document.getElementById("t-lang");
    langButton.textContent = t("lang");
    langButton.title = t("langTitle");
    const variantButton = document.getElementById("t-variant");
    variantButton.textContent = state.variant === "step" ? t("variant") : t("stepMode");
    variantButton.title = t("variantTitle");
    document.getElementById("t-theme").title = t("themeTitle");
    document.getElementById("t-zoom-in").textContent = t("zoomIn");
    document.getElementById("t-zoom-in").title = t("zoomInTitle");
    document.getElementById("t-zoom-out").textContent = t("zoomOut");
    document.getElementById("t-zoom-out").title = t("zoomOutTitle");
    document.getElementById("t-zoom-reset").textContent = t("zoomReset");
    document.getElementById("t-zoom-reset").title = t("zoomResetTitle");
  }

  function syncStepbar() {
    const count = document.getElementById("step-count");
    if (state.variant === "stack") count.textContent = t("allQuestions");
    else if (state.page === REVIEW_INDEX) count.textContent = t("reviewCount", { n: TOTAL_PAGES });
    else count.textContent = t("stepOf", { i: state.page + 1, n: TOTAL_PAGES });

    const dots = document.getElementById("dots");
    dots.textContent = "";
    QUESTIONS.forEach((question, index) => {
      const dot = el("button", "gd-dot", String(index + 1));
      dot.type = "button";
      dot.dataset.goto = String(index);
      const current = state.variant === "step" && index === state.page;
      dot.dataset.state = current ? "current" : isAnswered(question) ? "answered" : "idle";
      if (current) dot.setAttribute("aria-current", "step");
      dots.append(dot);
    });
    const reviewDot = el("button", "gd-dot", "✓");
    reviewDot.type = "button";
    reviewDot.dataset.goto = String(REVIEW_INDEX);
    reviewDot.setAttribute(
      "aria-label",
      t("reviewCount", { n: TOTAL_PAGES }),
    );
    reviewDot.dataset.state =
      state.variant === "step" && state.page === REVIEW_INDEX ? "current" : "idle";
    dots.append(reviewDot);

    const done = ANSWERABLE.filter(isAnswered).length;
    const meta = document.getElementById("step-meta");
    meta.textContent = "";
    const parts = t("answeredOf").replace("{total}", String(ANSWERABLE.length)).split("{done}");
    meta.append(
      document.createTextNode(parts[0]),
      el("b", null, String(done)),
      document.createTextNode(parts[1] || ""),
    );
    document.getElementById("track-fill").style.width =
      (ANSWERABLE.length > 0 ? (done / ANSWERABLE.length) * 100 : 0) + "%";
  }

  function syncFooter() {
    const step = state.variant === "step";
    const onReview = step && state.page === REVIEW_INDEX;
    const last = state.page >= QUESTIONS.length - 1;

    document.getElementById("b-prev").classList.toggle("hidden", !step || state.page === 0);
    document.getElementById("b-prev").textContent = t("prev");
    document.getElementById("b-cancel").textContent = t("cancel");
    document.getElementById("b-submit").textContent = step && !onReview && !last ? t("next") : t("submit");

    const hints = document.getElementById("hints");
    hints.textContent = "";
    if (state.error === "bridge") {
      hints.dataset.state = "error";
      hints.textContent = t("bridgeMissing");
      return;
    }
    hints.dataset.state = "";
    const pairs = t(step ? "hintStep" : "hintStack");
    pairs.forEach((pair, index) => {
      if (index > 0) hints.append(document.createTextNode(" · "));
      const label = index === 0 && onReview ? t("confirm") : pair[1];
      hints.append(el("kbd", null, pair[0]), document.createTextNode(" " + label));
    });
  }

  function readStep() {
    const question = QUESTIONS[state.page];
    if (!question || question.type === "info") return;
    if (question.type === "text") {
      const area = inner.querySelector(".q-input[name='" + question.id + "']");
      if (area) setAnswer(question, area.value);
      return;
    }
    recompute(question);
  }

  function collect() {
    const answers = {};
    for (const question of ANSWERABLE) {
      if (isAnswered(question)) answers[question.id] = state.answers[question.id];
    }
    return answers;
  }

  /** The only place the panel talks back to the host. */
  function emit(payload) {
    const bridge = window.glimpse;
    if (bridge && typeof bridge.send === "function") {
      bridge.send(payload);
      return;
    }
    state.error = "bridge";
    syncFooter();
  }

  function submit() {
    const missing = ANSWERABLE.find((question) => question.required && !isAnswered(question));
    if (missing) {
      state.error = missing.id;
      if (state.variant === "step") state.page = QUESTIONS.indexOf(missing);
      render();
      const node = questionSection(missing.id);
      if (node) node.scrollIntoView({ block: "center" });
      return;
    }
    state.error = "";
    const payload = { round: data.round, cancelled: false, answers: collect() };
    const feedback = state.feedback.trim();
    if (feedback !== "") payload.feedback = feedback;
    emit(payload);
  }

  function goNext() {
    readStep();
    state.error = "";
    const current = QUESTIONS[state.page];
    if (current && current.required && !isAnswered(current)) {
      state.error = current.id;
      render();
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
    const target = Math.max(0, Math.min(REVIEW_INDEX, index));
    if (state.variant === "step") {
      readStep();
      state.error = "";
      state.page = target;
      render();
      return;
    }
    const node =
      target === REVIEW_INDEX
        ? inner.querySelector(".q-review")
        : questionSection(QUESTIONS[target].id);
    if (node) node.scrollIntoView({ block: "start" });
  }

  function setZoom(value) {
    zoom = Math.min(1.5, Math.max(0.8, Math.round(value * 10) / 10));
    // Zoom the content pane only; the title bar, step bar and footer keep their size.
    document.documentElement.style.setProperty("--zoom", String(zoom));
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
  }

  function preferredTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  inner.addEventListener("change", (event) => {
    const input = event.target;
    if (!hasCustomInput(input)) return;
    const question = QUESTIONS.find((item) => item.id === input.name);
    if (!question) return;
    recompute(question);
    state.error = "";
    const area = questionSection(question.id).querySelector(".custom-input");
    const custom = questionSection(question.id).querySelector(".opt.is-custom input");
    if (area && custom && custom.checked) area.focus();
    syncStepbar();
    syncFooter();
  });

  function hasCustomInput(node) {
    return Boolean(node && node.name && node.closest && node.closest(".opts"));
  }

  inner.addEventListener("input", (event) => {
    const node = event.target;
    if (node.id === "review-feedback") {
      state.feedback = node.value;
      return;
    }
    const section = node.closest ? node.closest(".q") : null;
    if (!section) return;
    const question = QUESTIONS.find((item) => item.id === section.dataset.qid);
    if (!question) return;
    if (node.classList.contains("custom-input")) {
      state.drafts[question.id] = node.value;
      recompute(question);
    } else {
      setAnswer(question, node.value);
      state.error = "";
      section.classList.remove("err");
      node.style.height = "auto";
      node.style.height = Math.min(node.scrollHeight, 240) + "px";
    }
    syncStepbar();
  });

  inner.addEventListener("click", (event) => {
    const thumb = event.target.closest(".thumb");
    if (thumb) goTo(Number(thumb.dataset.goto));
  });

  document.getElementById("dots").addEventListener("click", (event) => {
    const dot = event.target.closest(".gd-dot");
    if (dot) goTo(Number(dot.dataset.goto));
  });
  document.getElementById("b-prev").addEventListener("click", () => goTo(state.page - 1));
  document.getElementById("b-submit").addEventListener("click", () =>
    state.variant === "step" ? goNext() : submit(),
  );
  document.getElementById("b-cancel").addEventListener("click", () => {
    emit({ round: data.round, cancelled: true, answers: {} });
  });
  document.getElementById("t-lang").addEventListener("click", () => {
    lang = lang === "zh" ? "en" : "zh";
    render();
  });
  document.getElementById("t-variant").addEventListener("click", () => {
    state.variant = state.variant === "step" ? "stack" : "step";
    state.error = "";
    render();
  });
  document.getElementById("t-theme").addEventListener("click", () => {
    themeOverridden = true;
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
  document.getElementById("t-zoom-in").addEventListener("click", () => setZoom(zoom + 0.1));
  document.getElementById("t-zoom-out").addEventListener("click", () => setZoom(zoom - 0.1));
  document.getElementById("t-zoom-reset").addEventListener("click", () => setZoom(1));

  document.addEventListener("keydown", (event) => {
    const modifier = event.metaKey || event.ctrlKey;
    if (event.key === "Escape") {
      emit({ round: data.round, cancelled: true, answers: {} });
      return;
    }
    if (modifier && (event.key === "+" || event.key === "=")) {
      setZoom(zoom + 0.1);
      event.preventDefault();
      return;
    }
    if (modifier && event.key === "-") {
      setZoom(zoom - 0.1);
      event.preventDefault();
      return;
    }
    if (modifier && event.key === "0") {
      setZoom(1);
      event.preventDefault();
      return;
    }
    if (event.key === "Enter" && modifier) {
      submit();
      return;
    }
    if (event.key === "Enter" && state.variant === "step" && event.target.tagName !== "TEXTAREA") {
      goNext();
    }
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!themeOverridden) applyTheme(preferredTheme());
  });

  applyTheme(preferredTheme());
  document.documentElement.dataset.reduceMotion = String(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  document.documentElement.dataset.contrast = String(
    window.matchMedia("(prefers-contrast: more)").matches,
  );
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
    <span class="gd-spacer"></span>
    <button class="gd-toolbtn" id="t-lang" type="button"></button>
    <button class="gd-toolbtn" id="t-variant" type="button"></button>
    <button class="gd-toolbtn" id="t-theme" type="button">◐</button>
    <button class="gd-toolbtn" id="t-zoom-out" type="button"></button>
    <button class="gd-toolbtn" id="t-zoom-in" type="button"></button>
    <button class="gd-toolbtn" id="t-zoom-reset" type="button"></button>
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
