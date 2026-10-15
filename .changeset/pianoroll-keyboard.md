---
"solid-pianoroll": minor
---

The keys down the side are now solid-piano-keyboard. They look the same, and they now play with several fingers at once. `onNoteDown` gets a third argument, the velocity (0–1) from where the key was struck. A key held while the selected track changes is released on the track it was played for, instead of a note-off going to the new track. Key tooltips read "C3" rather than "C 3".
