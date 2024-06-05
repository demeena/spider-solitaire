const suits = ['s', 'h', 'c', 'd'];
const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

const suitPath = {
  's': "card-deck-css/images/spades/",
  'h': "card-deck-css/images/hearts/",
  'c': "card-deck-css/images/clubs/",
  'd': "card-deck-css/images/diamonds/",
  'b': "card-deck-css/images/backs/blue.svg"
}

let noOfSuits = 1;
let suitsInPlay = suits.slice(0, (noOfSuits));

let noOfDecks = 2;
let deck = [];
let columns = [
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
]
let moveStack = [];

let home = {
  0: [],
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
}

let cardRun = [];
let moveCounter = 0;

document.querySelector('#deck').addEventListener('click', dealMore);
document.querySelector('#hint-button').addEventListener('click', suggestMove);

function init() {
  buildDeck();
  shuffleDeck();
  initialDeal();

  document.querySelector('#new-game-button').addEventListener('click', function() {
    window.location.reload();
  });

  document.querySelector('#undo-button').addEventListener('click', undoMove);

  document.querySelectorAll('.empty').forEach(emptySlot => {
    emptySlot.addEventListener('dragover', handleDragOver);
    emptySlot.addEventListener('drop', handleDrop);
  });

  updateMoveCounter();
}

let buildDeck = () => {
  let repeat = (4 / noOfSuits) * noOfDecks;
  for (let i = 0; i < repeat; i++) {
    for (let suit of suitsInPlay) {
      for (let value of values) {
        let obj = {};
        obj.suit = suit;
        obj.value = value;
        deck.push(obj);
      }
    }
  }
}

function shuffleDeck() {
  let i = 0, j = 0, temp = null;

  for (i = deck.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1))
    temp = deck[i]
    deck[i] = deck[j]
    deck[j] = temp
  }
}

function initialDeal() {
  let colIdx = 0;

  for (let i = 0; i < 44; i++) {
    columns[colIdx].push(deck.shift());
    let card = columns[colIdx][columns[colIdx].length - 1];
    let newCard = document.createElement("img");
    newCard.className = "card large fd";
    newCard.id = `${card.suit}-${card.value}`;
    newCard.src = suitPath['b'];
    newCard.draggable = true;
    addDragEvents(newCard);
    document.querySelector(`.column#c0${colIdx}`).appendChild(newCard);
    colIdx === 9 ? colIdx = 0 : colIdx += 1;
  }

  for (let i = 0; i < 10; i++) {
    columns[colIdx].push(deck.shift());
    let card = columns[colIdx][columns[colIdx].length - 1];
    let newCard = document.createElement("img");
    newCard.className = "card large fu";
    newCard.id = `${card.suit}-${card.value}`;
    newCard.src = `${suitPath[card.suit]}${newCard.id}.svg`;
    newCard.draggable = true;
    addDragEvents(newCard);
    document.querySelector(`.column#c0${colIdx}`).appendChild(newCard);
    colIdx === 9 ? colIdx = 0 : colIdx += 1;
  }
}

function dealMore() {
  let anyColumnEmpty = columns.some(col => col.length === 0);
  if (anyColumnEmpty) {
    alert('пустая ячейка!заполните ее.');
    return;
  }

  for (let i = 0; i < 10; i++) {
    if (deck.length > 0) {
      let card = deck.shift();
      columns[i].push(card);
      let newCard = document.createElement("img");
      newCard.className = "card large fu";
      newCard.id = `${card.suit}-${card.value}`;
      newCard.src = `${suitPath[card.suit]}${newCard.id}.svg`;
      newCard.draggable = true;
      addDragEvents(newCard);
      document.querySelector(`.column#c0${i}`).appendChild(newCard);
    }
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
  if (!isValidSequence(draggedCards)) {
    return;
  }

  evt.dataTransfer.setData("application/json", JSON.stringify(dragData));

}


function isValidSequence(cards) {
  for (let i = 0; i < cards.length - 1; i++) {
    let current = parseId(cards[i].id);
    let next = parseId(cards[i + 1].id);
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
  if (dropZone.classList.contains('empty')) {
    return true; 
  }
  
  const lastCard = dropZone.querySelector('.card:last-child');
  if (!lastCard) {
    return true; 
  }

  let current = parseId(lastCard.id);
  let dragged = parseId(draggedCard.id);

  if (current.value === dragged.value + 1) {
    return true;
  } else {
    return false;
  }
}

function handleDrop(evt) {
  evt.preventDefault();
  const dropZone = evt.target.closest('.column') || evt.target.closest('.empty');
  if (!dropZone) {
    return;
  }

  const dragData = JSON.parse(evt.dataTransfer.getData("application/json"));
  const draggedCard = document.getElementById(dragData.cardId);

  if (!draggedCard) {
    return;
  }

  if (isMoveValid(draggedCard, dropZone)) {
    const sourceColumn = document.getElementById(dragData.columnId);
    const draggedCards = Array.from(sourceColumn.children).slice(dragData.cardIndex);

    moveStack.push({cards: draggedCards, from: sourceColumn, to: dropZone});

    draggedCards.forEach(card => {
      dropZone.appendChild(card);
      card.style.visibility = "visible";
    });

    moveCounter++;
    updateMoveCounter();
    removeCompleteSequence(dropZone);
    updateData();
    flipCard();
  } else {
    draggedCard.style.visibility = "visible";
  }
}

function handleDragEnd(evt) {
  evt.target.style.visibility = "visible";
}

function removeCompleteSequence(column) {
  const cards = Array.from(column.querySelectorAll('.card'));
  if (cards.length < 13) return;

  for (let i = 0; i < cards.length - 12; i++) {
    let sequence = cards.slice(i, i + 13);
    if (isCompleteSequence(sequence)) {
      sequence.forEach(card => card.remove());
      const homeWrapper = document.querySelector('.home-wrapper');
      const emptyHome = homeWrapper.querySelector('.empty');
      if (emptyHome) {
        emptyHome.src ="card-deck-css/images/spades/s-13.svg" ;
        emptyHome.classList.remove('empty');
        emptyHome.classList.add('done', 'card', 'large');
      }
      return; 
    }
  }
}

function isCompleteSequence(cards) {
  for (let i = 0; i < 13; i++) {
    if (parseId(cards[i].id).value !== 13 - i) {
      return false;
    }
  }
  return true;
}

function updateData() {
  for (let t = 0; t < 10; t++) {
    updateColumn(t);
  }
}

function updateColumn(col) {
  let column = document.getElementById(`c0${col}`);
  let current = column.querySelector('.card');
  let tempArr = [];

  while (current) {
    let tempCard = parseId(current.id);
    tempArr.push(tempCard);
    current = current.nextSibling;
  }
  columns[col] = tempArr;
} 

function flipCard() {
  for (let i = 0; i < columns.length; i++) {
    let col = document.getElementById(`c0${i}`);
    if (col.lastElementChild.classList.contains('empty')) continue;
    if (col.lastElementChild.classList.contains('fd')) {
      let card = parseId(col.lastChild.id);
      col.lastChild.src = `${suitPath[card.suit]}${col.lastChild.id}.svg`;
      col.lastChild.classList.remove('fd');
      col.lastChild.classList.add('fu');
    }
  }
}

function parseId(cardId) {
  let cardArr = cardId.split('-');
  return {
    'suit': cardArr[0],
    'value': parseInt(cardArr[1])
  }
}

function undoMove() {
  const lastMove = moveStack.pop();
  if (lastMove) {
    lastMove.cards.forEach(card => {
      lastMove.from.appendChild(card);
      card.style.visibility = "visible";
    });
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
  let bestMove = null;
  let maxSequenceLength = 0;

  for (let i = 0; i < columns.length; i++) {
    let column = document.getElementById(`c0${i}`);
    let lastCard = column.querySelector('.card:last-child');
    if (lastCard && isFaceUp(lastCard)) {
      for (let j = 0; j < columns.length; j++) {
        if (i !== j) {
          let targetColumn = document.getElementById(`c0${j}`);
          if (isMoveValid(lastCard, targetColumn)) {
            const sequenceLength = getSequenceLength(lastCard);
            if (sequenceLength > maxSequenceLength) {
              bestMove = { card: lastCard, targetColumn: targetColumn };
              maxSequenceLength = sequenceLength;
            }
          }
        }
      }
    }
  }

  if (bestMove) {
    highlightSuggestedMove(bestMove.card, bestMove.targetColumn);
  } else {
    alert('Нет доступных ходов.');
  }
}

function getSequenceLength(card) {
  let sequenceLength = 1;
  let current = parseId(card.id);

  for (let i = columns.length - 1; i >= 0; i--) {
    let col = document.getElementById(`c0${i}`);
    let lastCard = col.querySelector('.card:last-child');
    if (lastCard && isFaceUp(lastCard)) {
      let next = parseId(lastCard.id);
      if (current.value === next.value + 1) {
        sequenceLength++;
        current = next;
      } else {
        break;
      }
    }
  }

  return sequenceLength;
}

function highlightSuggestedMove(card, targetColumn) {
  card.style.border = "2px solid red";
  setTimeout(() => {
    card.style.border = "";
  }, 2000);
  targetColumn.style.border = "2px solid red";
  setTimeout(() => {
    targetColumn.style.border = "";
  }, 2000);
}

init();
