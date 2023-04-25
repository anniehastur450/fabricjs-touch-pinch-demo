
// ui state

interface State {
  showCss: boolean;
  selectDemo: 'canvas' | 'css' | 'fabric';
  myCssStyle: 'css1' | 'css2';
}

function defaultState(): State {
  return {
    showCss: true,
    selectDemo: 'canvas',
    myCssStyle: 'css1',
  };
}

function loadState(): State {
  let state = defaultState();
  try {
    const saved = localStorage.getItem('state');
    if (saved) {
      const savedState = JSON.parse(saved);
      state = { ...state, ...savedState };
    }
  } catch (e) {
    console.error(e);
  }
  return state;
}

function saveState() {
  try {
    localStorage.setItem('state', JSON.stringify(state));
  } catch (e) {
    console.error(e);
  }
}

let state = loadState();
const stateChangedCallbacks: ((state: State) => void)[] = [];

// ui elements

interface Checkbox {
  name: string;
  checkbox: HTMLInputElement;
  targets: HTMLElement[];
}

interface ButtonGroup {
  name: string;
  buttons: {
    [key: string]: {
      button: HTMLButtonElement;
      targets: HTMLElement[];
    };
  };
}

const checkboxes: Checkbox[] = [
  {
    name: 'showCss',
    checkbox: document.getElementById('checkbox-showcss') as HTMLInputElement,
    targets: [
      document.getElementById('showcss-container') as HTMLDivElement,
    ],
  },
];

const buttonGroups: ButtonGroup[] = [
  {
    name: 'selectDemo',
    buttons: {
      canvas: {
        button: document.getElementById('select-mycanvas') as HTMLButtonElement,
        targets: [
          document.getElementById('mycanvas-container') as HTMLDivElement,
        ],
      },
      css: {
        button: document.getElementById('select-mycss') as HTMLButtonElement,
        targets: [
          document.getElementById('mycss-container') as HTMLDivElement,
          document.getElementById('select-mycss-style-container') as HTMLButtonElement,
        ],
      },
      fabric: {
        button: document.getElementById('select-myfabric') as HTMLButtonElement,
        targets: [
          document.getElementById('myfabric-container') as HTMLDivElement,
        ],
      }
    }
  },
  {
    name: 'myCssStyle',
    buttons: {
      css1: {
        button: document.getElementById('select-mycss-style-css1') as HTMLButtonElement,
        targets: [],
      },
      css2: {
        button: document.getElementById('select-mycss-style-css2') as HTMLButtonElement,
        targets: [],
      },
    }
  },
];

// ui state change handlers

function stateUpdated() {
  for (const { name, checkbox, targets } of checkboxes) {
    const checked: boolean = state[name as keyof State] as boolean;
    checkbox.checked = checked;
    for (const target of targets) {
      target.style.display = checked ? '' : 'none';
    }
  }
  for (const { name, buttons } of buttonGroups) {
    const selected: string = state[name as keyof State] as string;
    for (const [key, { button, targets }] of Object.entries(buttons)) {
      const checked = key === selected;
      button.classList.toggle('b-indigo-600!', checked);
      button.classList.toggle('hover:bg-white!', checked);
      button.classList.toggle('text-indigo-600!', checked);
      for (const target of targets) {
        target.style.display = checked ? '' : 'none';
      }
    }
  }
  saveState();

  for (const onStateChanged of stateChangedCallbacks) {
    try {
      onStateChanged(state);
    } catch (e) {
      console.error(e);
    }
  }
}
stateUpdated();

for (const { name, checkbox } of checkboxes) {
  checkbox.addEventListener('change', () => {
    (state as unknown as Record<string, boolean>)[name] = checkbox.checked;
    stateUpdated();
  });
}

for (const { name, buttons } of buttonGroups) {
  for (const [key, { button }] of Object.entries(buttons)) {
    button.addEventListener('click', () => {
      (state as unknown as Record<string, string>)[name] = key;
      stateUpdated();
    });
  }
}

export function addStateChangedCallback(onStateChanged: (state: State) => void) {
  stateChangedCallbacks.push(onStateChanged);
}

export function getState(): State {
  return state;
}
