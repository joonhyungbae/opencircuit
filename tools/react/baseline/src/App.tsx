import { SlideDeck } from "./SlideDeck";
import deck from "./deck.json";
import type { Deck } from "./SlideKit";

export function App() {
  return <SlideDeck deck={deck as Deck} />;
}
