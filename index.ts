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
}

function defaultState(): State {
  return {
    showCss: true,
    selectDemo: 'canvas',
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

const checkboxShowcss = document.getElementById('checkbox-showcss') as HTMLInputElement;
const showcssContainer = document.getElementById('showcss-container') as HTMLDivElement;
const selectDemos = {
  canvas: {
    button: document.getElementById('select-mycanvas') as HTMLButtonElement,
    target: document.getElementById('mycanvas-container') as HTMLDivElement,
  },
  css: {
    button: document.getElementById('select-mycss') as HTMLButtonElement,
    target: document.getElementById('mycss-container') as HTMLDivElement,
  },
  fabric: {
    button: document.getElementById('select-myfabric') as HTMLButtonElement,
    target: document.getElementById('myfabric-container') as HTMLDivElement,
  }
};

// update ui base on state
function stateUpdate() {
  checkboxShowcss.checked = state.showCss;
  showcssContainer.style.display = state.showCss ? 'block' : 'none';
  for (const [key, { button, target }] of Object.entries(selectDemos)) {
    const selected = key === state.selectDemo;
    button.classList.toggle('b-indigo-600!', selected);
    button.classList.toggle('hover:bg-white!', selected);
    button.classList.toggle('text-indigo-600!', selected);
    target.style.display = selected ? 'block' : 'none';
  }
}
stateUpdate();

// add event listeners
checkboxShowcss.addEventListener('change', (e) => {
  state.showCss = checkboxShowcss.checked;
  stateUpdate();
  saveState();
});
for (const [key, { button }] of Object.entries(selectDemos)) {
  button.addEventListener('click', (e) => {
    state.selectDemo = key as State['selectDemo'];
    stateUpdate();
    saveState();
  });
}
