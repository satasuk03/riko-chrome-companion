/**
 * Autocomplete dropdown for `/` commands in the chat input.
 * Returns a controller with update(), hide(), and handleKey(e) methods.
 */
export function initAutocomplete(inputEl, containerEl, commands) {
  const dropdown = document.createElement('div');
  dropdown.className = 'cmd-suggestions';
  containerEl.appendChild(dropdown);

  let entries = Object.entries(commands).map(([name, info]) => ({
    name,
    description: info.description,
  }));
  let filtered = [];
  let activeIndex = -1;

  function render() {
    dropdown.innerHTML = '';
    if (filtered.length === 0) {
      dropdown.style.display = 'none';
      return;
    }
    dropdown.style.display = '';
    filtered.forEach((cmd, i) => {
      const item = document.createElement('div');
      item.className = 'cmd-suggestion' + (i === activeIndex ? ' active' : '');

      const nameSpan = document.createElement('span');
      nameSpan.className = 'cmd-suggestion-name';
      nameSpan.textContent = cmd.name;

      const descSpan = document.createElement('span');
      descSpan.className = 'cmd-suggestion-desc';
      descSpan.textContent = cmd.description;

      item.appendChild(nameSpan);
      item.appendChild(descSpan);

      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // keep focus on input
        accept(i);
      });

      dropdown.appendChild(item);
    });
  }

  function accept(index) {
    const cmd = filtered[index];
    if (!cmd) return;
    inputEl.value = cmd.name + ' ';
    hide();
    inputEl.focus();
  }

  function hide() {
    filtered = [];
    activeIndex = -1;
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
  }

  function update() {
    const val = inputEl.value;
    if (!val.startsWith('/')) {
      hide();
      return;
    }
    const prefix = val.split(/\s/)[0].toLowerCase();
    // If the user has already typed a full command + space, hide suggestions
    if (val.includes(' ')) {
      hide();
      return;
    }
    filtered = entries.filter((cmd) => cmd.name.startsWith(prefix));
    activeIndex = filtered.length > 0 ? 0 : -1;
    render();
  }

  function handleKey(e) {
    if (filtered.length === 0) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % filtered.length;
      render();
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
      render();
      return true;
    }
    if (e.key === 'Tab' || e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        accept(activeIndex);
        return true;
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      hide();
      return true;
    }
    return false;
  }

  // Start hidden
  dropdown.style.display = 'none';

  return { update, hide, handleKey };
}
