// Type augmentation for the Virtual Keyboard API (Android Chrome/Edge)
// https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API

interface VirtualKeyboard {
  overlaysContent: boolean;
  boundingRect: DOMRect;
  show(): void;
  hide(): void;
}

interface Navigator {
  virtualKeyboard?: VirtualKeyboard;
}
