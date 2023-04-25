
// ui state

import { FidgetPincherOptions } from './FidgetPincher/core-impl';

interface State {
  showCss: boolean;
  selectDemo: 'canvas' | 'css' | 'fabric';
  myCssStyle: 'css1' | 'css2';
  myFabricTouch: 'enabled' | 'disabled';
  fidgetPincherOptions: {
    [key: string]: boolean;
  };
}

function defaultState(): State {
  return {
    showCss: true,
    selectDemo: 'canvas',
    myCssStyle: 'css1',
    myFabricTouch: 'enabled',
    fidgetPincherOptions: {},
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
          document.getElementById('select-mycss-style-container') as HTMLDivElement,
        ],
      },
      fabric: {
        button: document.getElementById('select-myfabric') as HTMLButtonElement,
        targets: [
          document.getElementById('myfabric-container') as HTMLDivElement,
          document.getElementById('select-myfabric-touch-container') as HTMLDivElement,
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
  {
    name: 'myFabricTouch',
    buttons: {
      enabled: {
        button: document.getElementById('select-myfabric-touch-enabled') as HTMLButtonElement,
        targets: [
          document.getElementById('myfabric-touch-controls') as HTMLDivElement,
        ],
      },
      disabled: {
        button: document.getElementById('select-myfabric-touch-disabled') as HTMLButtonElement,
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

// setup fidget pincher options
function defaultFidgetPincherOptions(): Partial<FidgetPincherOptions> {
  return {
    enableInertia: true,
    enableTranslateInertia: true,
    enableFidgetSpinInertia: true,
    enablePinchInertia: true,
  }
}

const stateFidgetPincherOptionsChangedCallbacks: (() => void)[] = [];
export function addStateFidgetPincherOptionsChangedCallback(onFidgetPincherOptionsChanged: () => void) {
  stateFidgetPincherOptionsChangedCallbacks.push(onFidgetPincherOptionsChanged);
}

export function stateGetFidgetPincherOptions(): Partial<FidgetPincherOptions> {
  return {
    ...defaultFidgetPincherOptions(),
    ...state.fidgetPincherOptions,
  };
}

const fidgetPincherOptionsContainer = document.getElementById('fidget-pincher-options-container') as HTMLElement;
for (const [key, value] of Object.entries(stateGetFidgetPincherOptions())) {
  if (fidgetPincherOptionsContainer.children.length > 0) {
    fidgetPincherOptionsContainer.appendChild(document.createElement('br'));
  }
  const label = document.createElement('label');
  label.classList.add('bg-amber-200')
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = value as boolean;
  const span = document.createElement('span');
  function updateSpan() {
    label.classList.toggle('line-through', !checkbox.checked);
    span.textContent = ` ${key}: ${checkbox.checked}, `;
  }
  updateSpan();

  label.appendChild(checkbox);
  label.appendChild(span);

  checkbox.addEventListener('change', () => {
    state.fidgetPincherOptions[key] = checkbox.checked;
    updateSpan();
    for (const onFidgetPincherOptionsChanged of stateFidgetPincherOptionsChangedCallbacks) {
      try {
        onFidgetPincherOptionsChanged();
      } catch (e) {
        console.error(e);
      }
    }
  });

  fidgetPincherOptionsContainer.appendChild(label);

}
