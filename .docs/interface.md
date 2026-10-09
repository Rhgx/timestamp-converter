# Interface

How each part of the converter behaves.

## Input

- While you type, the line under the input shows how the text will be read ("Reads as Friday, October 16, 2026 at 3:00 PM, your time"). It falls back to the local-time hint when the text can't be read yet.
- **Convert** or Enter parses the input. If it can't be read, an error appears below and the last good result stays in place.
- City, state, and country names load in the background just after the page opens. A conversion that fails before then says so, and a shared link naming a place converts once they arrive.
- The **Quick** buttons (`now`, `tomorrow`, `in 3 hours`) convert immediately.
- The **X** button clears the input, the results, and the link.
- A successful conversion saves the input in the address bar as `?q=`. Opening that link converts it again on load, so relative input like `tomorrow` resolves at the time the link is opened.

## Formats & examples

- A searchable guide with one section per kind of input. Search matches section titles, examples, and mistakes.
- Clicking an example converts it straight away and returns focus to the input for editing.
- Each section has a folded **Common mistakes** list showing unsupported input, the version that works, and why. Clicking the correction converts it. The list opens by itself when a search matches one of its entries.
- The dialog closes with Escape, the close button, or a click on the backdrop. A text selection dragged out of the search field does not close it.

## Calendar

- The calendar button opens a month view with draggable hour and minute wheels. It starts at the current result, or now.
- **Apply** converts the selection in local time. Closing the dialog any other way discards the draft.
- Changing the day keeps the selected time. **Now** resets to the current date and time.
- Months change with the arrow buttons or by swiping the grid. Swipes can interrupt a settling animation, and the heading blends between month names as you drag. Holding an arrow repeats it and speeds up.
- The wheels accept dragging, clicking a number, the arrow buttons, and the keyboard: arrow keys, Page Up/Down for steps of five, and Home/End.
- The calendar code is downloaded on first hover or focus of its button. If the download fails, the dialog says so and the rest of the page keeps working.

## Results

- One row per Discord format, plus the raw Unix timestamp. Each row previews what a reader with your language and timezone would see.
- **UTC previews** changes only the previews; the copied tags are the same.
- **Show codes** replaces each preview with the exact text that will be copied.
- The relative row counts live while the page is open.
- **Copy** confirms with a check mark and a screen reader announcement. If the clipboard is blocked, the row shows the text to copy by hand.

## Motion and accessibility

- Result values morph with [Torph](https://torph.lochie.me/). Entrances, dialogs, the calendar, and the mistakes disclosure use CSS transitions or Motion springs.
- Every animation is turned off when the system asks for reduced motion.
- Dialogs are native `<dialog>` elements, which provide focus containment, Escape to close, and focus return.
- Icon buttons have labels, conversions and copies are announced, and the time wheels are exposed as spin buttons.
