# AFL Tenable Daily

A lightweight daily AFL guessing game inspired by Tenable.

## How it works

- One question is active each day (for example: *Sydney Swans top disposal getters in 2025*).
- The player must guess all 10 valid answers.
- Correct guesses reveal items on the board.
- Progress is saved in browser localStorage per date.

## Run locally

Because this is plain HTML/CSS/JS, you can open `index.html` directly in a browser, or serve it with a simple static server.

## Add a new daily question

Edit `script.js` and append a new date entry in `QUESTION_BANK`:

```js
"2026-03-01": {
  prompt: "Your question text",
  subtitle: "Optional help text",
  answers: ["Answer 1", "Answer 2", "..."]
}
```

The site automatically uses today’s date if present; otherwise it falls back to the latest configured date.
