const STYLE_ID = 'gcbrun-button-style';
const BUTTON_MARKER_ATTR = 'data-gcbrun-button';
const BUTTON_CLASS = 'gcbrun-insert-button';
const COMMAND_TEXT = '/gcbrun';

let injectTimeoutId = null;

function isPullRequestPage() {
  return /^\/[^/]+\/[^/]+\/pull\/\d+/.test(window.location.pathname);
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${BUTTON_CLASS} {
      margin-right: 8px;
    }
  `;

  document.head.appendChild(style);
}

function getCommentTextarea(submitButton) {
  const form = submitButton.closest('form');
  if (!form) {
    return null;
  }

  return form.querySelector('textarea.js-comment-field, textarea[name="comment[body]"], textarea');
}

function appendCommand(textarea) {
  const currentValue = textarea.value;
  const trimmedValue = currentValue.trim();

  if (trimmedValue.includes(COMMAND_TEXT)) {
    textarea.focus();
    return;
  }

  if (trimmedValue.length === 0) {
    textarea.value = COMMAND_TEXT;
  } else if (currentValue.endsWith('\n')) {
    textarea.value = `${currentValue}${COMMAND_TEXT}`;
  } else {
    textarea.value = `${currentValue}\n${COMMAND_TEXT}`;
  }

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

function submitComment(submitButton) {
  if (submitButton.disabled) {
    return;
  }

  const form = submitButton.closest('form');
  if (!form) {
    return;
  }

  if (typeof form.requestSubmit === 'function') {
    form.requestSubmit(submitButton);
    return;
  }

  submitButton.click();
}

function createGcbrunButton(submitButton) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `btn ${BUTTON_CLASS}`;
  button.textContent = COMMAND_TEXT;
  button.setAttribute(BUTTON_MARKER_ATTR, 'true');

  button.addEventListener('click', () => {
    const textarea = getCommentTextarea(submitButton);
    if (!textarea) {
      return;
    }

    appendCommand(textarea);
    submitComment(submitButton);
  });

  return button;
}

function isCommentSubmitButton(button) {
  return button.textContent?.trim() === 'Comment';
}

function injectButtons() {
  if (!isPullRequestPage()) {
    return;
  }

  injectStyles();

  const submitButtons = Array.from(
    document.querySelectorAll('form button.btn-primary[type="submit"]')
  ).filter(isCommentSubmitButton);

  submitButtons.forEach((submitButton) => {
    const previousElement = submitButton.previousElementSibling;
    const hasButton = previousElement?.getAttribute(BUTTON_MARKER_ATTR) === 'true';

    if (hasButton) {
      return;
    }

    submitButton.parentElement?.insertBefore(createGcbrunButton(submitButton), submitButton);
  });
}

function scheduleInject() {
  if (injectTimeoutId !== null) {
    return;
  }

  injectTimeoutId = window.setTimeout(() => {
    injectTimeoutId = null;
    injectButtons();
  }, 100);
}

const observer = new MutationObserver(() => {
  scheduleInject();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

injectButtons();
