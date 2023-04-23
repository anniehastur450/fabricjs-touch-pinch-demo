// Import stylesheets
import './style.css';

// Write TypeScript code!
const appDiv: HTMLElement = document.getElementById('app')!;
appDiv.innerHTML = `<h1>TypeScript Starter</h1>`;

import './mycanvas'
import './mycss'
import './myfabric'

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

const checkboxShowcss = document.getElementById('checkbox-showcss') as HTMLInputElement;
const showcssContainer = document.getElementById('showcss-container') as HTMLDivElement;

interface ButtonGroup {
  name: string;
  buttons: {
    [key: string]: {
      button: HTMLElement;
      targets: HTMLElement[];
    };
  };
}

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

// update ui base on state
function stateUpdate() {
  checkboxShowcss.checked = state.showCss;
  showcssContainer.style.display = state.showCss ? '' : 'none';

  for (const { name, buttons } of buttonGroups) {
    for (const [key, { button, targets }] of Object.entries(buttons)) {
      const selected = key === state[name as keyof State];
      button.classList.toggle('b-indigo-600!', selected);
      button.classList.toggle('hover:bg-white!', selected);
      button.classList.toggle('text-indigo-600!', selected);
      for (const target of targets) {
        target.style.display = selected ? '' : 'none';
      }
    }
  }

  for (const onStateChanged of stateChangedCallbacks) {
    try {
      onStateChanged(state);
    } catch (e) {
      console.error(e);
    }
  }
}
stateUpdate();

// add event listeners
checkboxShowcss.addEventListener('change', (e) => {
  state.showCss = checkboxShowcss.checked;
  stateUpdate();
  saveState();
});
for (const { name, buttons } of buttonGroups) {
  for (const [key, { button }] of Object.entries(buttons)) {
    button.addEventListener('click', (e) => {
      (state as unknown as Record<string, string>)[name] = key;
      stateUpdate();
      saveState();
    });
  }
}

export function addStateChangedCallback(onStateChanged: (state: State) => void) {
  stateChangedCallbacks.push(onStateChanged);
}

export function getState(): State {
  return state;
}
