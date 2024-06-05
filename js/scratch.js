export function initialDeal(deck, columns) {
  let num = 54;
  let colIdx = 0;
  for (let i = 0; i < num; i++) {
    columns[colIdx].push(deck.shift());
    colIdx === 9 ? colIdx = 0 : colIdx += 1;
  }
  console.log("Initial deal:", columns); 
}

export function isCompleteSequence(cards) {
  return cards.every((card, index) => parseId(card.id).value === 13 - index);
}

export function parseId(cardId) {
  const [suit, value] = cardId.split('-');
  return { suit, value: parseInt(value) };
}
