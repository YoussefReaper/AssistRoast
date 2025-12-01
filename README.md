# Assist Roast Linter
This is a visual studio code extension to help fixes bad coding habits by roasting your code into shape, a self-aware linter that teaches cleaner, more expressive code through sarcasm, wit, and a touch of emotional damage (the motivational kind). It's like "write cleaner code or get flamed trying"

## Features
--Total roasts bar counter.
--35 Roast rules.
--Tip with every roast to actually code better.
--The most common issues are within the extension.
--Variety in rules (Performance, Safety, Syntax and etc.).
--3 Different Modes (gentle, annoying, savage).
## Example for every rule kind
Below are small taste-test examples of the kinds of roasts Assist Roast Linter will throw at you.  
Each rule also includes a practical tip so it’s not just emotional damage for nothing.
### Syntax

> **Example:**  
> Using `var`? Ah yes, coding like it’s 2005 again.  
> **Tip:** Use `let` or `const` before your descendants hunt you down.

Covers things like:
- `var` usage  
- `console.log` spam  
- `==` instead of `===`  
- `any` in TypeScript  
- Magic numbers  
- Empty `catch` blocks  
- Super long lines  
- Redundant boolean compares like `flag === true`

---

### Performance

> **Example:**  
> `fs.readFileSync` in a server? Bold move. Enjoy your single-threaded traffic jam.  
> **Tip:** Use async FS APIs (`fs.promises.*` or callbacks) to avoid blocking the event loop.

Covers things like:
- Synchronous `fs.*Sync` calls in hot paths  
- `JSON.parse` inside loops  
- `console.log` in tight loops  
- `setInterval` without clearing  
- Nested `setTimeout` chaos  
- Massive callbacks in `map` / `forEach` / `filter` / `reduce`

---

### Security

> **Example:**  
> Using `eval`? You really said “execute this string and we’ll see what happens”.  
> **Tip:** Avoid `eval`/`new Function`, use safer structured logic or mappings instead.

Covers things like:
- `eval`  
- `new Function(...)`  
- Direct `.innerHTML = ...`  
- `dangerouslySetInnerHTML` in React  
- Shell commands via `child_process.exec`  
- Weak hashes like `md5` / `sha1`  
- Storing `token` / `jwt` in `localStorage`

---

### Naming

> **Example:**  
> `'data' again? Revolutionary. No one’s ever thought of that.  
> **Tip:** Use names that explain the *intent*, like `userProfile`, `errorCount`, `orderTotal`.

Targets vague names like:
- `foo`, `bar`, `baz`, `data`, `info`, `obj`, `tmp`  
- `x`, `y`, `z`, `t`, `a`, `b`, `c` as “permanent” variable names  
- `res`, `str`, `num`, `test`, etc. with no context

---

### Async

> **Example:**  
> Floating promise detected. Just letting it vibe in the ether, huh?  
> **Tip:** Either `await` the promise, return it, or handle its errors explicitly.

Covers things like:
- Promise chains not awaited or returned  
- `async function` with zero `await` inside (async in vibes only)

---

### Structure

> **Example:**  
> This nesting is so deep you’ll need a rope and a map to get back out.  
> **Tip:** Use early returns, helper functions, or guard clauses to flatten control flow.

Covers:
- Deeply nested `if/for/while/switch/try` blocks  
- Functions with way too many parameters  
- Huge function-like blocks that should be split into smaller units

---

### Comments & Dead Code

> **Example:**  
> Commented-out code museum exhibit right here.  
> **Tip:** If it’s important, version control remembers it. If not, delete it.

Covers:
- Large blocks of commented-out code  
- `// debug` / `# debug` noise left behind in comments

---

### TODO / FIXME

> **Example:**  
> `// TODO:` Ah yes, another promise to future-you that will never be fulfilled.  
> **Tip:** Turn important TODOs into actual issues or tasks so they don’t rot in comments.

Catches:
- `TODO` and `FIXME` notes that you keep stacking up like emotional debt

---

### Python-specific

> **Example:**  
> `print()` everywhere? Production logs via vibes only.  
> **Tip:** Use Python’s `logging` module for real apps and keep stray prints out of main code paths.

Also includes:
- Lone `pass` blocks left as “I’ll do it later” placeholders

---

### Bypass / Ignoring Tools

> **Example:**  
> `// @ts-ignore` — you didn’t fix the error, you just blindfolded the compiler.  
> **Tip:** Use ignores *sparingly* and document why, or fix the underlying type issue.

Covers:
- `// @ts-ignore` abuse  
- `// eslint-disable` everywhere instead of fixing code or tuning config

---

### Docs / Public API

> **Example:**  
> Exported function with no docs? This public API is just raw-dogging the outside world.  
> **Tip:** Add a short JSDoc to explain what the function does and how to use it.

Catches exported functions with zero documentation, nudging you to add descriptions.