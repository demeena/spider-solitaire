const suits = ['s', 'h', 'c', 'd'];
const values = Array.from({length: 13}, (_, i) => i + 1);

const suitPath = {
  's': "card-deck-css/images/spades/",
  'h': "card-deck-css/images/hearts/",
  'c': "card-deck-css/images/clubs/",
  'd': "card-deck-css/images/diamonds/",
  'b': "card-deck-css/images/backs/blue.svg"
};

let noOfSuits = 1;
let suitsInPlay = suits.slice(0, noOfSuits);
let noOfDecks = 2;
let deck = [];
let columns = Array.from({length: 10}, () => []);
let moveStack = [];
let home = Array.from({length: 8}, () => []);
let moveCounter = 0;

document.querySelector('#deck').addEventListener('click', dealMore);
document.querySelector('#hint-button').addEventListener('click', suggestMove);

function init() {
  buildDeck();
  shuffleDeck();
  initialDeal();

  document.querySelector('#new-game-button').addEventListener('click', () => window.location.reload());
  document.querySelector('#undo-button').addEventListener('click', undoMove);

  document.querySelectorAll('.empty').forEach(emptySlot => {
    emptySlot.addEventListener('dragover', handleDragOver);
    emptySlot.addEventListener('drop', handleDrop);
  });

  updateMoveCounter();
}

function buildDeck() {
  let repeat = (4 / noOfSuits) * noOfDecks;
  for (let i = 0; i < repeat; i++) {
    addSuitsToDeck(suitsInPlay, values);
  }
}

function addSuitsToDeck(suits, values) {
  suits.forEach(suit => {
    addValuesToDeck(suit, values);
  });
}

function addValuesToDeck(suit, values) {
  values.forEach(value => {
    deck.push({ suit, value });
  });
}


function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function initialDeal() {
  dealCards(44, false);
  dealCards(10, true);
}

function createCardElement(card, isFaceUp) {
  const newCard = document.createElement("img");
  newCard.className = `card large ${isFaceUp ? 'fu' : 'fd'}`;
  newCard.id = `${card.suit}-${card.value}`;
  newCard.src = isFaceUp ? `${suitPath[card.suit]}${newCard.id}.svg` : suitPath['b'];
  newCard.draggable = true;
  addDragEvents(newCard);
  return newCard;
}

function dealCards(count, isFaceUp) {
  let colIdx = 0;
  for (let i = 0; i < count; i++) {
    const card = deck.shift();
    columns[colIdx].push(card);
    const newCard = createCardElement(card, isFaceUp);
    document.querySelector(`.column#c0${colIdx}`).appendChild(newCard);
    colIdx = (colIdx + 1) % 10;
  }
}

function dealMore() {
  if (columns.some(col => col.length === 0)) {
    alert('пустая ячейка!заполните ее.');
    return;
  }

  for (let i = 0; i < 10 && deck.length > 0; i++) {
    const card = deck.shift();
    columns[i].push(card);
    const newCard = createCardElement(card, true);
    document.querySelector(`.column#c0${i}`).appendChild(newCard);
  }
}

function isFaceUp(card) {
  return card.classList.contains('fu');
}

function addDragEvents(card) {
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragover', handleDragOver);
  card.addEventListener('drop', handleDrop);
  card.addEventListener('dragend', handleDragEnd);
}

function handleDragStart(evt) {
  if (!isFaceUp(evt.target)) return;

  const cardId = evt.target.id;
  const columnId = evt.target.parentElement.id;
  const cardIndex = Array.from(evt.target.parentElement.children).indexOf(evt.target);
  const dragData = { cardId, columnId, cardIndex };

  const sourceColumn = document.getElementById(columnId);
  const draggedCards = Array.from(sourceColumn.children).slice(cardIndex);
  if (!isValidSequence(draggedCards)) return;

  evt.dataTransfer.setData("application/json", JSON.stringify(dragData));
}

function isValidSequence(cards) {
  for (let i = 0; i < cards.length - 1; i++) {
    const current = parseId(cards[i].id);
    const next = parseId(cards[i + 1].id);
    if (current.value !== next.value + 1) {
      return false;
    }
  }
  return true;
}

function handleDragOver(evt) {
  evt.preventDefault();
}

function isMoveValid(draggedCard, dropZone) {
  if (dropZone.classList.contains('empty')) return true;

  const lastCard = dropZone.querySelector('.card:last-child');
  if (!lastCard) return true;

  const current = parseId(lastCard.id);
  const dragged = parseId(draggedCard.id);

  return current.value === dragged.value + 1;
}

function handleDrop(evt) {
  evt.preventDefault();
  const dropZone = evt.target.closest('.column') || evt.target.closest('.empty');
  if (!dropZone) return;

  const dragData = JSON.parse(evt.dataTransfer.getData("application/json"));
  const draggedCard = document.getElementById(dragData.cardId);

  if (!draggedCard || !isMoveValid(draggedCard, dropZone)) {
    if (draggedCard) draggedCard.style.visibility = "visible";
    return;
  }

  moveCards(dragData, dropZone);
  moveCounter++;
  updateMoveCounter();
  removeCompleteSequence(dropZone);
  updateData();
  flipCard();
}

function moveCards(dragData, dropZone) {
  const sourceColumn = document.getElementById(dragData.columnId);
  const draggedCards = Array.from(sourceColumn.children).slice(dragData.cardIndex);

  moveStack.push({ cards: draggedCards, from: sourceColumn, to: dropZone });

  draggedCards.forEach(card => {
    dropZone.appendChild(card);
    card.style.visibility = "visible";
  });
}

function handleDragEnd(evt) {
  evt.target.style.visibility = "visible";
}

function removeCompleteSequence(column) {
  const cards = Array.from(column.querySelectorAll('.card'));
  if (cards.length < 13) return;

  for (let i = 0; i <= cards.length - 13; i++) {
    const sequence = cards.slice(i, i + 13);
    if (isCompleteSequence(sequence)) {
      removeCards(sequence);
      updateHomeWrapper();
      return;
    }
  }
}

function isCompleteSequence(cards) {
  return cards.every((card, index) => parseId(card.id).value === 13 - index);
}

function removeCards(cards) {
  cards.forEach(card => card.remove());
}

function updateHomeWrapper() {
  const homeWrapper = document.querySelector('.home-wrapper');
  const emptyHome = homeWrapper.querySelector('.empty');
  if (emptyHome) {
    emptyHome.src = "card-deck-css/images/spades/s-13.svg";
    emptyHome.classList.remove('empty');
    emptyHome.classList.add('done', 'card', 'large');
  }
}


function isCompleteSequence(cards) {
  return cards.every((card, index) => parseId(card.id).value === 13 - index);
}

function updateData() {
  columns.forEach((_, colIdx) => updateColumn(colIdx));
}

function updateColumn(colIdx) {
  const column = document.getElementById(`c0${colIdx}`);
  let current = column.querySelector('.card');
  columns[colIdx] = [];

  while (current) {
    columns[colIdx].push(parseId(current.id));
    current = current.nextSibling;
  }
}

function flipCard() {
  columns.forEach((_, colIdx) => {
    const col = document.getElementById(`c0${colIdx}`);
    if (col.lastElementChild && !col.lastElementChild.classList.contains('empty') && col.lastElementChild.classList.contains('fd')) {
      const card = parseId(col.lastChild.id);
      col.lastChild.src = `${suitPath[card.suit]}${col.lastChild.id}.svg`;
      col.lastChild.classList.remove('fd');
      col.lastChild.classList.add('fu');
    }
  });
}

function parseId(cardId) {
  const [suit, value] = cardId.split('-');
  return { suit, value: parseInt(value) };
}

function undoMove() {
  const lastMove = moveStack.pop();
  if (lastMove) {
    lastMove.cards.forEach(card => lastMove.from.appendChild(card));
    moveCounter++;
    updateMoveCounter();
  }
}

function updateMoveCounter() {
  const counterElement = document.querySelector('.move-counter');
  if (counterElement) {
    counterElement.textContent = `Ходы: ${moveCounter}`;
  }
}

function suggestMove() {
  const bestMove = findBestMove();
  if (bestMove) {
    highlightSuggestedMove(bestMove.card, bestMove.targetColumn);
  } else {
    alert('Нет доступных ходов.');
  }
}

function findBestMove() {
  let bestMove = null;
  let maxSequenceLength = 0;

  columns.forEach((col, i) => {
    const column = document.getElementById(`c0${i}`);
    const lastCard = column.querySelector('.card:last-child');
    if (lastCard && isFaceUp(lastCard)) {
      columns.forEach((_, j) => {
        if (i !== j) {
          const targetColumn = document.getElementById(`c0${j}`);
          if (isMoveValid(lastCard, targetColumn)) {
            const sequenceLength = getSequenceLength(lastCard);
            if (sequenceLength > maxSequenceLength) {
              bestMove = { card: lastCard, targetColumn: targetColumn };
              maxSequenceLength = sequenceLength;
            }
          }
        }
      });
    }
  });

  return bestMove;
}

function getSequenceLength(card) {
  let sequenceLength = 1;
  let current = parseId(card.id);

  columns.forEach((_, colIdx) => {
    const col = document.getElementById(`c0${colIdx}`);
    const lastCard = col.querySelector('.card:last-child');
    if (lastCard && isFaceUp(lastCard)) {
      const next = parseId(lastCard.id);
      if (current.value === next.value + 1) {
        sequenceLength++;
        current = next;
      }
    }
  });

  return sequenceLength;
}

function highlightSuggestedMove(card, targetColumn) {
  card.style.border = "2px solid red";
  targetColumn.style.border = "2px solid red";
  setTimeout(() => {
    card.style.border = "";
    targetColumn.style.border = "";
  }, 2000);
}

init();
