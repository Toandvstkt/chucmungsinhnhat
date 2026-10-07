# A little birthday magic

A responsive birthday microsite made with plain HTML, CSS, and JavaScript.
Bahasa Indonesia is the default. The ID / EN selector switches the experience to English.

## Open it

Double-click `index.html` in a modern browser. No installation or build is needed.
Keep all website files in the same folder. Optional Google Fonts need an
internet connection; the site uses built-in fallback fonts when offline.

## Make it personal

Edit `config.js` with a text editor:

```js
friend: "Alya",
sender: "Your name",
defaultLanguage: "id",
giftUrl: "https://example.com/your-real-present", // optional
```

Leave `giftUrl` empty for the built-in digital treasure: an animated gift,
fireworks, a private message, and a personalized downloadable PNG card.
If you supply an HTTP/HTTPS link, an extra present link appears inside the
final scene only after all five discoveries. It opens in a new tab.

Edit the letters, final gift, and memory captions under both `content.id` and
`content.en`. Use normal quoted JavaScript strings. Paragraphs are separate
items in the `letter` array. Names and messages are rendered as text.

To add photos, create an `assets` folder next to `index.html`, place your photos
there, and set each memory's `image`, for example:

```js
{ title: "Our favorite day", message: "Your message here", image: "assets/photo-1.jpg" }
```

Use the same photo paths in both language sections. Portrait or square photos
work well. Photos automatically replace the supplied CSS illustrations.
If a photo cannot load, the original illustration stays available.

## What is included

- Floating balloons, parallax, drifting motes, pointer stardust, touch ripples,
  a reading progress line, flickering candles, a scrolling ribbon, staggered
  reveals, flip cards, flowers, and canvas confetti.
- Three individually clickable candles and a one-click blow-out option.
- A sealed letter, three memory cards, and five flower wishes.
- Five hidden discoveries requiring tracing, holding, scratching, a color
  sequence, and peeling a paper corner. Ordinary button clicks do not solve them.
- A journal of cryptic clues, without buttons that take you to the answers.
- A locked final present that opens into a full-screen night sky with fireworks,
  an animated gift opening, a special message, and a downloadable keepsake.
- A downloadable 1200 × 1500 PNG keepsake with the recipient/sender names.
- A quiet synthesized birthday melody that tries to play on entry. Browsers
  that block audible autoplay start it on the first touch, click, or action key.
  The music button pauses/resumes it. A manual pause disables automatic restart
  for this visit; returning from a hidden tab resumes only if not manually paused.
  Set `autoplayMusic: false` in `config.js` to use manual start instead.
- Browser-local language and discovery progress; reset from the journal.
- Native dialogs, keyboard controls, labels, and reduced-motion support.

## Sharing

Upload `index.html`, `styles.css`, `hunt.css`, `translations.js`, `config.js`,
`app.js`, and `hunt.js`
(plus your optional `assets` folder) together to any static website host.
Alternatively, share this folder as a ZIP; the recipient can extract it and
open `index.html`. The files do not require a backend or account.

The preview registered through Sites is private to its owner by default.
It needs an access change before someone else can view that hosted preview.
The ZIP source works independently of Sites.

## Spoilers for the creator

1. Trace the three tiny constellation stars above the hero card in a single
   drag, starting at the left star, passing the high middle star, and ending
   at the right star. A tap alone does not solve it.
2. Open the letter and hold its flower watermark for two full seconds. A brief
   tap or interrupted hold does not solve it. This reveals "gold → violet → rose."
3. Rub away at least 38% of the silver postage stamp near the night-sky postcard.
   The moon underneath is the third treasure.
4. Tap the garden flowers in the revealed color order: yellow, purple, pink.
   The wrong order resets the sequence; individual flowers still share wishes.
5. Drag the folded corner at the very end of the page about 65 px to the left.
   The moon under the paper is the final treasure. A click does not solve it.

Keyboard alternatives: focus the constellation and press ArrowRight three
times; hold Space on the letter watermark for two seconds; press Space repeatedly
on the silver stamp; select the three flowers in order; press ArrowLeft three
times on the paper corner. These controls have localized screen-reader labels.

The gift button is disabled until all five discoveries are complete. Basic
candle, letter-opening, and postcard-flipping interactions are separate from
the hunt. Changing languages does not reset puzzle progress.

Progress is saved only in the current browser, not to a server. Choose
"Start exploring again" / "Mulai menjelajah lagi" in the journal and tap twice
within five seconds to reset. Testing in a private window is another option.

Secret hiding here is playful discovery, not access control: someone who
inspects the source can read the final message or optional gift URL. There is no microphone access;
blowing out candles is done by touch or click.
