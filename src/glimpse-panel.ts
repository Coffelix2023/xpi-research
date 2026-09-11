import type { Questionnaire } from "./types.ts";

/**
 * Panel stylesheet. Every color, radius and duration used by the panel components
 * must come from these tokens; see `DESIGN.md` for the source of each value.
 */
export const GLIMPSE_PANEL_CSS = `:root { color-scheme: light dark; font: 14px system-ui, sans-serif; }
body { margin: 0; padding: 24px; }
main { max-width: 760px; margin: 0 auto; }
fieldset { border: 0; padding: 0; margin: 0 0 20px; }
legend { font-size: 1.15rem; font-weight: 650; margin-bottom: 12px; }
label, p { display: block; margin: 8px 0; white-space: pre-wrap; }
textarea, input { box-sizing: border-box; width: 100%; padding: 8px; font: inherit; }
button { padding: 8px 14px; margin-right: 8px; }
.preview { opacity: .75; }`;

/**
 * Panel page script. It runs inside the Glimpse webview, where no TypeScript
 * checking applies, so it stays self-contained and quotes every dynamic value
 * through `textContent` instead of building markup.
 */
export const GLIMPSE_PANEL_SCRIPT = `(() => {
  const data = JSON.parse(document.getElementById("xpi-research-data").textContent);
  const form = document.getElementById("questionnaire");
  for (const question of data.questionnaire.questions) {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = question.prompt;
    fieldset.append(legend);
    if (question.type === "info") {
      fieldset.setAttribute("aria-label", question.prompt);
    } else if (question.type === "text") {
      const input = document.createElement("textarea");
      input.name = question.id;
      input.required = question.required;
      fieldset.append(input);
    } else {
      for (const option of question.options) {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = question.type === "multi" ? "checkbox" : "radio";
        input.name = question.id;
        input.value = option.label;
        input.required = question.required && question.type === "single";
        label.append(input, document.createTextNode(" " + option.label));
        if (option.description) {
          const description = document.createElement("span");
          description.className = "preview";
          description.textContent = option.description;
          label.append(description);
        }
        if (option.preview) {
          const preview = document.createElement("p");
          preview.className = "preview";
          preview.textContent = option.preview;
          label.append(preview);
        }
        fieldset.append(label);
      }
    }
    form.append(fieldset);
  }
  const actions = document.createElement("p");
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Submit";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => window.parent.postMessage({ round: data.round, cancelled: true, answers: {} }, "*"));
  actions.append(submit, cancel);
  form.append(actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const answers = {};
    for (const question of data.questionnaire.questions) {
      if (question.type === "info") continue;
      const selected = [...form.elements].filter((element) => element.name === question.id && element.checked);
      if (question.type === "multi") answers[question.id] = selected.map((element) => element.value);
      else if (question.type === "single") answers[question.id] = selected[0]?.value;
      else answers[question.id] = form.elements[question.id].value;
    }
    window.parent.postMessage({ round: data.round, cancelled: false, answers }, "*");
  });
})();`;

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
<html lang="en">
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
<main>
<form id="questionnaire" aria-label="Research questions"></form>
<script type="application/json" id="xpi-research-data">${data}</script>
<script>
${GLIMPSE_PANEL_SCRIPT}
</script>
</body>
</html>`;
}
