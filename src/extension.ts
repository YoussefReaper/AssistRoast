import * as vscode from "vscode";
type Mode = "gentle" | "annoying" | "savage";

const LANGUAGES = ["javascript", "typescript", "python"] as const;
function pick<T>(list: T[]) {
    return list[Math.floor(Math.random()*list.length)];
}
function getConfig() {
    const config = vscode.workspace.getConfiguration("assistRoast");
    return {
        enabled: config.get("enabled", true),
        debounceMs: config.get("debounceMs", 900),
        maxLineLength: config.get("maxLineLength", 120),
        mode: config.get<Mode>("mode", "annoying"),
        onSaveOnly: config.get("onSaveOnly", false),
        popupOnNew: config.get("popupOnNew", true),
        statsEnabled: config.get("statsEnabled", true),
    };
}
class RoastStatusBar implements vscode.Disposable {
    private item: vscode.StatusBarItem;
    constructor() {
        this.item = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.item.text ="0 total roasts";
        this.item.tooltip = "Assist Roast Linter";
        this.item.show();
    }
    update(count: number) {
        this.item.text = `${count} total roasts`;
    }
    setVisible(yes: boolean){
        if(yes) {
            this.item.show();
        }else {
            this.item.hide();
        }
    }
    dispose() {
        this.item.dispose();
    }
}
const maxLineLength = 120;
const syntaxRules: RoastRule[] = [
    {
        id: "console-log",
        languages: ["javascript", "typescript"],
        regex: /console\.(log|debug|info|warn|error)\s*\(/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Console logs left in, tidy up when you get a sec.",
                "A friendly reminder: logs love to linger.",
            ],
            annoying: [
                "Another console.log? running a logging startup? bro?",
                "Console.log enjoyer detected. Shipping vibes builds, I see.",
                "Debugging by print again? Bold strategy.",
            ],
            savage: [
                "Console.log is not a long-term debugging bro.",
                "Logs in 2025? Your debugger feel betrayed.",
            ],
        },
        tip: "Remove stray logs before committing, use a debugger or proper tracing.",
    },
    {
        id: "var-usage",
        languages: ["javascript", "typescript"],
        regex: /\bvar\b/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Prefer let/const over var for block scoping.",
                "Legacy 'var' spotted, consider modernizing.",
            ],
            annoying: [
                "Using 'var' in 2025? Archaeology speedrun",
                "Bold of you to time-travel back to ES3.",
            ],
            savage: [
                "'var'? This code belongs in a museum.",
                "You just summoned hoisting bugs from the shadow realm.",
            ],
        },
        tip: "Use 'let' for reassignable binding and 'const' for fixed ones.",
    },
    {
        id: "double-equals",
        languages: ["javascript", "typescript"],
        regex: /(^|[^=])==([^=]|$)/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Loose equality found, consider using ===.",
                "Careful: type coercion can bite.",
            ],
            annoying: [
                "'=='? So you like surprise bugs.",
                "Trusting coercion like it won't betray you...",
            ],
            savage: [
                "Loose equality, loose standards.",
                "== is just chaos with extra steps.",
            ],
        },
        tip: "Use strict equality (===) unless you intentionally want type coercion.",
    },
    {
        id: "any-type",
        languages: ["typescript"],
        regex: /\bany\b/g,
        severity: vscode.DiagnosticSeverity.Information,
        msgs: {
            gentle: [
                "'any' weakens type safety, consider a narrower type.",
                "Tiny nudge, avoid 'any' when possible.",
            ],
            annoying: [
                "'any'? Ah yes, the 'I give up' type.",
                "TypeScript called, it wants your types back.",
            ],
            savage: [
                "'any' is less a type and more a cry for help.",
                "You just turned off the type system with vibes.",
            ],
        },
        tip: "Prefer unknown, generics, or explicit interfaces instead of 'any'.",
    },
    {
        id: "long-line",
        languages: ["javascript", "typescript", "python"],
        regex: new RegExp(`^.{${maxLineLength},}$`, "m"),
        severity: vscode.DiagnosticSeverity.Information,
        msgs: {
            gentle: [
                "Long line detected, consider wrapping for readability.",
                "That line could use a breather.",
            ],
            annoying: [
                "Writing essays now?",
                "That line's longer than my attention span.",
            ],
            savage: [
                "This line needs chapters and a table of contents.",
                "IDE zoomed out and still couldn't see the end.",
            ],
        },
        tip: "Break expressions or extract variables to keep lines manageable.",
    },
    {
        id: "magic-number",
        languages: ["javascript", "typescript", "python"],
        regex: /\b\d{3,}\b/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Magic number spotted, consider a named constant.",
                "Big literal value here, a named constant could help.",
            ],
            annoying: [
                "Magic numbers again? This code reads like an escape room puzzle.",
                "Hope you remember what that number means a week from now.",
            ],
            savage: [
                "This number has more mystery than documentation.",
                "Future-you will open this and just stare at that number in silence.",
            ],
        },
        tip: "Use named constants or config values instead of hardcoded numbers.",
    },
    {
        id: "reduntant-boolean-compare",
        languages: ["javascript", "typescript"],
        regex: /\b([a-zA-Z_][a-zA-Z-0-9_]*)\s*===\s*(true|false)\b/g,
        severity: vscode.DiagnosticSeverity.Hint,
        msgs: {
            gentle: [
                "Redundant boolean compare, you can just use the variable direcly.",
                "This boolean comparison can be simplified.",
            ],
            annoying: [
                "Comparing to true/false like the variable isn't already boolean.",
                "Extra equality for emotional support?",
            ],
            savage: [
                "This boolean check took the scenic route.",
                "Writing more code than necessary for the same logic, huh?",
            ],
        },
        tip: "Use `if (flag)` or `if (!flag)` instead of `flag === true/false`.",
    },
    {
        id: "empty-catch",
        languages: ["javascript", "typescript"],
        regex: /catch\s*\(\s*[^)]*\)\s*{\s*}/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Empty catch block, consider handling or logging the error.",
                "Catching errors and doing nothing? Maybe add at least a log.",
            ],
            annoying: [
                "Empty catch: the 'ignore the problem and hope it goes away' pattern.",
                "Catching errors and doing nothing? Maybe add at least a log.",
            ],
            savage: [
                "This catch block hid the error so well, even you won't find it later.",
                "Silently swallowing exceptions? Bold choice.",
            ],
        },
        tip: "Log, rethrow, or handle the error, empty catch blocks hide real problems.",
    },
];
type RoastRule = {
  id: string;
  languages: string[];
  regex: RegExp;
  severity: vscode.DiagnosticSeverity;
  msgs: {
    gentle: string[];
    annoying: string[];
    savage: string[];
  };
  tip?: string;
  wholeLine?: boolean;
  placeHolderMatch?: boolean;
};
const vagueNames = /\b(?:var|let|const|def)?\s*(foo|bar|baz|data|info|obj|object|tmp|temp|thing|stuff|value|val|var\d*|item|items|res|result|str|num|test|t|x|y|z|a|b|c)\b/gi;
const namingRules: RoastRule[] = [
    {
        id: "non-expressive-name",
        languages: ["javascript", "typescript", "python"],
        regex: vagueNames,
        severity: vscode.DiagnosticSeverity.Warning,
        placeHolderMatch: true,
        msgs: {
            gentle: [
                "Vague name spotted, give '${match}' some identity.",
                "'${match}'? That name's hiding from responsibility.",
            ],
            annoying: [
                "'${match}'? Revolutionary. No one's ever thought of that.",
                "Went with '${match}' and called it a day, huh.",
                "Names are free. Spend a few more brain cycles.",
            ],
            savage: [
                "'${match}' is not a variable name, it's a mystery box.",
                "Every time someone writes '${match}', a maintainer loses patience.",
                "Future-you will see '${match}' and question every life decision.",
            ],
        },
        tip: "Use meaningful names that describe value or intent, e.g. userData, errorCount, configOptions.",
    },
]
const pythonRules: RoastRule[] = [
    {
        id: "print-spam",
        languages: ["python"],
        regex: /\bprint\s*\(/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Stray prints, tidy them up before committing.",
                "Consider using the logging module for real applications.",
            ],
            annoying: [
                "print-debugging artisan spotted.",
                "Diary mode enabled: printing your feelings again.",
            ],
            savage: [
                "Production logs via print? Chaos speedrun.",
                "Your debugger saw this and closed itself.",
            ],
        },
        tip: "Use Python's logging module with proper levels and handlers."
    },
    {
        id: "pass-empty",
        languages: ["python"],
        regex: /^\s*pass\s*$/gm,
        severity: vscode.DiagnosticSeverity.Information,
        msgs: {
            gentle: [
                "Empty block placeholder, remember to fill it later.",
                "'pass' is fine, just don't forget it exists.",
            ],
            annoying: [
                "pass. Just like your motivation right now.",
                "This block looked at work and said 'not today'.",
            ],
            savage: [
                "This code path is spiritually empty.",
                "Feature by manifestation: pass now, maybe logic later.",
            ],
        },
        tip: "Implement or remove these blocks to avoid forgotten logic.",
    },
];
const todoRules: RoastRule[] = [
    {
        id: "todo-fixme",
        languages: ["javascript", "typescript", "python"],
        regex: /\b(?:TODO|FIXME)\b.*$/gm,
        severity: vscode.DiagnosticSeverity.Information,
        msgs: {
            gentle: [
                "TODO/FIXME noted, remember to circle back to this.",
                "A little reminder to actually resolve this someday.",
            ],
            annoying: [
                "TODO spotted. Future-you just got assigned more work.",
                "FIXME? More like 'good luck, tomorrow self'.",
            ],
            savage: [
                "Ah yes, another TODO to the graveyard.",
                "You're writing a novel of promises to yourself in comments.",
            ],
        },
        tip: "Convert important TODO/FIXME into tracked issues or resolve them promptly.",
    }
];
const structureRules: RoastRule[] = [
    {
        id: "deep-nesting",
        languages: ["javascript", "typescript", "python"],
        regex: /^\s{12,}(if|for|while|switch|try)\b.*$/gm,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Deep nesting detected, consider refactoring.",
                "This block could be split up for clarity.",
            ],
            annoying: [
                "Nesting this deep? You building a matryoshka function?",
                "Code levels unlocked: inception mode.",
            ],
            savage: [
                "You'll need a rope and a map to navigate this nesting.",
                "This function has more layers than an onion and the same effect on your eyes.",
            ],
        },
        tip: "Use early return, helper functions, or guards to reduce nesting depth.",
    },
    {
        id: "long-parameter-list",
        languages: ["javascript", "typescript", "python"],
        regex: /(function\s+\w+\s*\([^)]*,[^)]*,[^)]*,[^)]*,[^)]*[^)]*\)|\w+\s*=\s*\([^)]*,[^)]*,[^)]*,[^)]*,[^)]*[^)]*\)\s*=>)/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Function with many parameters, consider grouping them.",
                "This paramter list is getting a bit crowded.",
            ],
            annoying: [
                "Parameter list longer than mos people's resumes.",
                "You know you can pass an object instead of 9 arguments, right?",
            ],
            savage: [
                "This function signature is basically a questionnaire.",
                "Too many params, this function is begging to be refactored.",
            ],
        },
        tip: "Group related parameters into objects or use options/config objects.",
    },
    {
        id: "long-function-like-block",
        languages: ["javascript", "typescript", "python"],
        regex: /{[^}]{800,}}/gs,
        severity: vscode.DiagnosticSeverity.Information,
        msgs: {
            gentle: [
                "Large block of code detected, consider splitting into helpers.",
                "Big functions can often be broken into smaller ones.",
            ],
            annoying: [
                "This function is starting to look like a mini-framework.",
                "That's not a function, that's an entire chapter.",
            ],
            savage: [
                "This block could have its own repo.",
                "You've written a whole saga inside one function.",
            ],
        },
        tip: "Extract smaller, focused functions to improve readability and reuse.",
    },
];
const commentRules: RoastRule[] = [
    {
        id: "comment-out-code",
        languages: ["javascript", "typescript"],
        regex: /^\s*\/\/\s*(if|for|while|function|\w+\s*=|\w+\()/gm,
        severity: vscode.DiagnosticSeverity.Hint,
        msgs: {
            gentle: [
                "Commented-out code hanging around, maybe clean it up.",
                "Old code commented out; consider removing if it's no longer needed.",
            ],
            annoying: [
                "Commented-out code museum exhibit right here.",
                "Keeping relics of past bugs in comments, I see.",
            ],
            savage: [
                "Commented-out code: the graveyard of forgotten features.",
                "If it's important, version control has your back. If not, delete it.",
            ],
        },
        tip: "Use version control history instead of leaving large blocks of commented-out code.",
    },
    {
        id: "debug-comment",
        languages: ["javascript", "typescript", "python"],
        regex: /\/\/\s*debug\b|#\s*debug\b/gi,
        severity: vscode.DiagnosticSeverity.Information,
        msgs: {
            gentle: [
                "Debug comment spotted, useful now, but don't forget it later.",
                "Little reminder: clean up debug comments at some points.",
            ],
            annoying: [
                "'debug' comments: the graffiti of codebases.",
                "Leaving yourself debug breadcrumbs again, huh?",
            ],
            savage: [
                "Your code has more debug graffiti than a test environment.",
                "If every line is 'debug', is *anything* production-ready?",
            ],
        },
        tip: "Remove or refine debug comments once the issue is resolved.",
    },
]
const bypassRules: RoastRule[] = [
    {
        id: "ts-ignore",
        languages: ["typescript"],
        regex: /\/\/\s*@ts-ignore\b.*$/gm,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "@ts-ignore is a temporary escape hatch.... right? RIGHT?",
                "Ignored a TypeScript error, just don't forget why.",
            ],
            annoying: [
                "@ts-ignore: when the compiler says no and you say 'SHHHHH'.",
                "Bro really said 'what if we just... didn't type-check this'.",
            ],
            savage: [
                "@ts-ignore is just 'I'll deal with this never' in code.",
                "You didn't fix the error, you just blindfolded the compiler.",
            ],
        },
        tip: "Use @ts-ignore sparingly and document why, better fix the underlying type issue.",
    },
    {
        id: "eslint-disable",
        languages: ["javascript", "typescript"],
        regex: /\/\/\s*eslint-disable(?:-next-line|(?:-[a-z-]+)*)?.*$/gm,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Disabling ESLint rule here, make sure you have a good reason.",
                "eslint-disable used, maybe fix the underlying issue later.",
            ],
            annoying: [
                "eslint-disable: the duct tape of code quality.",
                "Turned the cop off instead of obeying the speed limit, I see.",
            ],
            savage: [
                "You didn't refactor. You overpowered ESLint with pure stubbornness.",
                "If you disable enough rules, you've basically invented plain JS again.",
            ],
        },
        tip: "Only disable rules with a documented justification, prefer configuration or refactoring.",
    },
];
const asyncRules: RoastRule[] = [
    {
        id: "floating-promise",
        languages: ["javascript", "typescript"],
        regex: /^(?!\s*(return|await))\s*[a-zA-Z_$][\w$]*\([^)]*\)\.then\(/gm,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Promise chain not awaited or returned, make sure that's intentional.",
                "This .then() chain looks a bit... untethered.",
            ],
            annoying: [
                "Floating promise detected. Just letting it vibe in the ether?",
                "You fired off a promise and walked away. Bold"
            ],
            savage: [
                "This promise is out there running unsupervised.",
                "Floating async work: because who needs predictability.",
            ],
        },
        tip: "Either await the promise, return itm or handle errors explicity.",
    },
    {
        id: "async-without-await",
        languages: ["javascript", "typescript"],
        regex: /async\s+function\s+\w+\s*\([^)]*\)\s*{[^]*?}/g,
        severity: vscode.DiagnosticSeverity.Information,
        msgs: {
            gentle: [
                "async function without await, is it really async?",
                "No await inside this async function, double-check if it needs to be async.",
            ],
            annoying: [
                "async function with no await? Just flexing the keyword?",
                "You declared async but forgot to actually await anything.",
            ],
            savage: [
                "This async function is async in spirit only.",
                "You gave it async energy but no async responsibilities.",
            ],
        },
        tip: "Remove async if not needed, or add awaits where asynchronous work actually happens.",
    },
];
const docsRules: RoastRule[] = [
    {
        id: "missing-docs-exported-function",
        languages: ["javascript", "typescript"],
        regex: /^(?!\/\*\*)(?:.|n)*?\bexport\s+function\s+([a-zA-Z_$][\w$]*)\s*\(/gm,
        severity: vscode.DiagnosticSeverity.Hint,
        msgs: {
            gentle: [
                "Exported function with no docs, a tiny comment could help.",
                "Public API would appreciate a short description.",
            ],
            annoying: [
                "Exported function just raw-dogging the public API with no docs.",
                "Your exported functions are exhibitionists without any clothes on.",
            ],
            savage: [
                "This exported function is a mystery to the outside world.",
                "Public API without docs? Future users will hate you.",
            ],
        },
        tip: "Add JSDoc comments to exported functions to clarify their purpose and usage."
    },
];
const securityRules: RoastRule[] = [
    {
        id: "eval-usage",
        languages: ["javascript", "typescript"],
        regex: /\beval\s*\(/g,
        severity: vscode.DiagnosticSeverity.Error,
        msgs: {
            gentle: [
                "eval can be dangerous, consider alternatives.",
                "Using eval? Make sure the input is trusted.",
            ],
            annoying: [
                "eval? Bold move. also terrifying.",
                "You really said 'execute this string and we'll see what happens'.",
            ],
            savage: [
                "eval is basically remote code execution you gift-wrapped yourself.",
                "You just opened a portal to 'I hope no one can inject this'.",
            ],
        },
        tip: "Avoid eval, use safer alternatives like JSON.parse, function maps, or proper parsing.",
    },
    {
        id: "function-constructor",
        languages: ["javascript", "typescript"],
        regex: /\bnew\s+Function\s*\(/g,
        severity: vscode.DiagnosticSeverity.Error,
        msgs: {
            gentle: [
                "Function constructor acts like eval, be cautious.",
                "Using Function constructor? Ensure inputs are safe.",
            ],
            annoying: [
                "new Function? You really like living on the edge, huh?",
                "Function constructor: because eval wasn't scary enough.",
            ],
            savage: [
                "Function constructor is just eval in a tuxedo.",
                "You just invited chaos into your codebase with open arms.",
            ],
        },
        tip: "Avoid Function constructor, prefer safer alternatives for dynamic behavior."
    },
    {
        id: "innerHTML-assignment",
        languages: ["javascript", "typescript"],
        regex: /\.innerHTML\s*=\s*[^;]+/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "innerHTML assignment can lead to XSS, sanitize inputs.",
                "Setting innerHTML directly? Make sure the content is safe.",
            ],
            annoying: [
                "innerHTML assignment: opening the door to XSS attacks.",
                "You just handed over the keys to your DOM to anyone who cares to knock.",
            ],
            savage: [
                "XSS speedrun starter kit, right here.",
                "You just turned your webpage into a hacker's playground.",
            ],
        },
        tip: "Use textContent, DOM APIs, or properly sanitized/escaped HTML for user-provided content.",
    },
    {
        id: "dangerously-set-inner-html",
        languages: ["javascript", "typescript"],
        regex: /dangerouslySetInnerHTML\s*:/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "dangerouslySetInnerHTML used, ensure content is sanitized.",
                "Using dangerouslySetInnerHTML? Double-check the safety of the content.",
            ],
            annoying:[
                "dangerouslySetInnerHTML: because 'safe' is just too mainstream.",
                "You opted for 'dangerous' in your code. Exciting choice.",
            ],
            savage: [
                "If this string isn't sanitized, you've just invited XSS to the party.",
                "You just handed over the keys to your DOM to anyone who cares to knock.",
            ],
        },
        tip: "Avoid dangerouslySetInnerHTML when possible, prefer safer rendering methods or sanitize content."
    },
    {
        id: "child-process-exec",
        languages: ["javascript", "typescript"],
        regex: /\b(require\(['"]child_process['"]\)|import\s+.+\s+from\s+['"]child_process['"]).*|\b(exec|execSync|spawn|spawnSync)\s*\(/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Shell execution spotted, validate and sanitize all inputs.",
                "child_process APIs can be risky, ensure command safety.",
            ],
            annoying: [
                "Spawning shell commands? Make sure you're not inviting trouble.",
                "child_process execs: handle with care and sanitize inputs.",
            ],
            savage: [
                "Shelling out like this can turn into a security nightmare.",
                "You just opened a door for command injection attacks.",
            ],
        },
        tip: "Validate and sanitize all inputs used in shell commands, prefer safer alternatives when possible.",
    },
    {
        id: "weak-crypto-md5-sha1",
        languages: ["javascript", "typescript"],
        regex: /\bcrypto\.createHash\s*\(\s*['"](md5|sha1)['"]\s*\)/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
            "Weak hash algorithm detected (md5/sha1).",
            "These hashes are considered broken for security purposes.",
            ],
            annoying: [
            "md5/sha1 are about as secure as a wet paper lock.",
            "These hashes are here for nostalgia, not security.",
            ],
            savage: [
            "md5/sha1 are basically write-only hashing at this point.",
            "These hashes are museum pieces, not security tools.",
            ],
        },
        tip: "Use stronger algorithms like sha256/sha512/bcrypt/scrypt/argon2 depending on the use case.",
    },
    {
        id: "localstorage-token",
        languages: ["javascript", "typescript"],
        regex: /\blocalStorage\.setItem\s*\(\s*['"](token|auth|jwt|accessToken|refreshToken)['"]/gi,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Storing tokens in localStorage has XSS exposure risk.",
                "Consider more secure storage for auth tokens.",
            ],
            annoying: [
                "JWTs in localStorage, the classic 'hope there's never XSS' move.",
                "If an XSS hits, those tokens are free real estate.",
            ],
            savage: [
                "localStorage + tokens = 'please steal me' for any XSS.",
                "You've basically put the keys to the kingdom in the front window.",
            ],
        },
        tip: "Prefer httpOnly secure cookies or well-protected storage in environments with strong XSS defenses.",
    },
];
const performanceRules: RoastRule[] = [
    {
        id: "fs-sync-api",
        languages: ["javascript", "typescript"],
        regex: /\bfs\.(readFileSync|writeFileSynce|readdirSync|statSync|lstatSync|existsSync)\s*\(/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Synchronous fs call detected, fine in scripts, risky in servers.",
                "Blocking the event loop with fs sync APIs can hurt performance.",
            ],
            annoying: [
                "fs.*Sync in production? Enjoy your single-threaded traffic jam.",
                "Blocking I/O calls? Your server called, it wants its responsiveness back.",
            ],
            savage: [
                "You just turned your event loop into a parking lot.",
                "Synchronous fs calls in async code: because who needs scalability?",
            ],
        },
        tip: "Use asynchronous fs APIs with callbacks, promises, or async/await to keep the event loop responsive."
    },
    {
        id: "json-parse-in-loop",
        languages: ["javascript", "typescript"],
        regex: /^(?=.*JSON\.parse)(?=.*(for\s*\(|while\s*\())/gm,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "JSON.parse in a loop, consider parsing once outside.",
                "Repeated JSON.parse calls inside loops can add up.",
            ],
            annoying: [
                "Decoding JSON on every iteraction? CPU is sweating.",
                "JSON.parse in loops? Your CPU called, it wants a break.",
            ],
            savage: [
                "This loop is JSON-parsing its way to performance hell.",
                "You just turned your CPU into a JSON decoder factory.",
            ],
        },
        tip: "Parse once and reuse structured data, or batch operations when possible.",
    },
    {
        id: "console-inside-loop",
        languages: ["javascript", "typescript"],
        regex: /^(?=.*console\.(log|debug|info|warn|error))(?=.*(for\s*\(|while\s*\())/gm,
        severity: vscode.DiagnosticSeverity.Information,
        msgs: {
            gentle: [
                "Console logging inside loops can slow things down.",
                "Frequent logging in loops may impact performance.",
            ],
            annoying: [
                "Logging on every iteration? Your console is begging for mercy.",
                "Console spam in loops? Your performance just took a hit.",
            ],
            savage: [
                "Your console is drowning in a sea of logs, thanks to this loop.",
                "Console logging in loops: because who needs performance?",
            ],
        },
        tip: "Minimize console logging inside loops to improve performance and reduce noise."
    },
    {
        id: "set-interval-no-clear",
        languages: ["javascript", "typescript"],
        regex: /\bsetInterval\s*\(/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "setInterval used, make sure it's cleared when no longer needed.",
                "Uncleared intervals can cause memory leaks and unexpected behavior.",
            ],
            annoying: [
                "setInterval without clearInterval? Memory leak in progress.",
                "You just set up a timer bomb for your app's memory.",
            ],
            savage: [
                "This setInterval is a ticking time bomb for memory leaks.",
                "You just invited a memory leak to the party and forgot to feed it.",
            ],
        },
        tip: "Always clear intervals with clearInterval when they are no longer needed.",
    },
    {
        id: "nested-set-timeout",
        languages: ["javascript", "typescript"],
        regex: /setTimeout\s*\([^]*setTimeout\s*\(/g,
        severity: vscode.DiagnosticSeverity.Warning,
        msgs: {
            gentle: [
                "Nested setTimeout detected, can lead to timing issues.",
                "Consider flattening nested timeouts for clarity and reliability.",
            ],
            annoying: [
                "setTimeout nesting like this? Event loop spaghetti detected.",
                "Timer inception: setTimeout within setTimeout. Enjoy the chaos.",
            ],
            savage: [
                "You just created a timer labyrinth with nested setTimeouts.",
                "This nested setTimeout is a recipe for timing nightmares.",
            ],
        },
        tip: "Consider a single setTimeout with proper logic inside, or use async/await for better flow control.",
    },
    {
        id: "array-callback-heavy",
        languages: ["javascript", "typescript"],
        regex: /\.((map|forEach|filter|reduce))\s*\([^)]{80,}\)/g,
        severity: vscode.DiagnosticSeverity.Information,
        msgs: {
            gentle: [
                "Heavy callback in array method, ensure it's not in a super hot path.",
                "Consider optimizing or extracting complex callbacks for readability and performance.",
            ],
            annoying: [
                "That callback is doing a lot. Your array is working overtime.",
                "Array method with a novel-length callback? Your CPU is crying.",
            ],
            savage: [
                "This array callback is basically a mini-application.",
                "You just turned a simple array operation into a full-on saga.",
            ],
        },
        tip: "Extract heavy logic into named functions, cache repeated work, and avoid hot-path expensive operations.",
    },
];
class AssistRoastAnalyzer implements vscode.Disposable {
    private context: vscode.ExtensionContext;
    private collection: vscode.DiagnosticCollection;
    private timers = new Map<string, NodeJS.Timeout>();
    private ruleCounts = new Map<string, Map<string, number>>();
    private statusBar: RoastStatusBar;
    enabled = true;
    mode: Mode = "annoying";
    debounceMs = 900;
    onSaveOnly = false;
    popupOnNew = true;
    maxLineLength = 120;
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.collection = vscode.languages.createDiagnosticCollection("assist-roast-analyzer");
        this.statusBar = new RoastStatusBar();
        this.reloadConfig();
        context.subscriptions.push(this.collection, this.statusBar);
        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor((add) => {
            if (add?.document &&this.supported(add.document)){
                this.schedule(add.document);
            }
            })
        );
        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument((e)=> {
            if (e.document && this.supported(e.document)) {
                this.schedule(e.document);
            }
            })
        );
        context.subscriptions.push(
            vscode.workspace.onDidCloseTextDocument((doc) => {
            this.collection.delete(doc.uri);
            this.ruleCounts.delete(doc.uri.toString());
            const key = doc.uri.toString();
            const time = this.timers.get(key);
            if (time) {
                clearTimeout(time);
                this.timers.delete(key);
            }
            })
        );
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration("assistRoast")) {
                this.reloadConfig();
                this.analyzeActive(true);
            }
            })
        );
        }
        reloadConfig() {
        const config = getConfig();
        this.enabled = config.enabled;
        this.mode = config.mode;
        this.debounceMs = config.debounceMs;
        this.onSaveOnly = config.onSaveOnly;
        this.popupOnNew = config.popupOnNew;
        this.maxLineLength = config.maxLineLength;
        this.statusBar.setVisible(config.statsEnabled);
        }
        resetMode() {
        this.ruleCounts.clear();
        }
        analyzeActive(force=false) {
        const doc = vscode.window.activeTextEditor?.document;
        if(doc && this.supported(doc)) {
            if (force) {
            this.analyze(doc, true);
            }
            else {
            this.schedule(doc);
            }
        }
        }
        private supported(doc: vscode.TextDocument): boolean {
        return (
            this.enabled &&
            (LANGUAGES as readonly string[]).includes(doc.languageId)
        );
        }
        private schedule(doc: vscode.TextDocument) {
        if (this.onSaveOnly) {
            return;
        }
        const key = doc.uri.toString();
        const existing = this.timers.get(key);
        if (existing){
            clearTimeout(existing);
        }
        const timer = setTimeout(() => this.analyze(doc), this.debounceMs);
        this.timers.set(key, timer);
        }
        private analyze(doc: vscode.TextDocument, isSave: boolean = false) {
        if (!this.enabled) return;
        const rules = [
            ...syntaxRules,
            ...namingRules,
            ...pythonRules,
            ...todoRules,
            ...structureRules,
            ...commentRules,
            ...bypassRules,
            ...asyncRules,
            ...docsRules,
            ...securityRules,
            ...performanceRules,
        ];
        const {diagnostics, newIssues} = this.runRules(doc, rules, this.mode);
        this.collection.set(doc.uri, diagnostics);
        const count = diagnostics.length;
        this.statusBar.update(count);
        if(this.popupOnNew && newIssues > 0 && diagnostics.length > 0) {
            const sample = pick(diagnostics).message.split("\n")[0];
            vscode.window.showInformationMessage(sample);
        }
    }
    private runRules (
        document: vscode.TextDocument,
        rules: RoastRule[],
        baseMode: Mode
    ): {diagnostics: vscode.Diagnostic[]; newIssues: number} {
        const text = document.getText();
        const uriKey = document.uri.toString();
        if(!this.ruleCounts.has(uriKey)) this.ruleCounts.set(uriKey, new Map());
        const counts = this.ruleCounts.get(uriKey)!;
        const diags: vscode.Diagnostic[] = [];
        let newIssues =0;
        for (const rule of rules) {
            if(!rule.languages.includes(document.languageId)) continue;
            const pattern = new RegExp(rule.regex.source, rule.regex.flags);
            let match: RegExpExecArray | null;
            const prev=counts.get(rule.id)??0;
            let localHits=0;
            while((match=pattern.exec(text))) {
                localHits++;
                const start = document.positionAt(match.index);
                const endPos=rule.wholeLine
                    ?document.lineAt(start.line).range.end
                    :document.positionAt(match.index+match[0].length);
                const effectiveMode = modeWithRepetition(
                    baseMode,
                    prev+localHits -1
                );
                let template =
                    effectiveMode === "gentle"
                        ?pick(rule.msgs.gentle)
                        :effectiveMode==="savage"
                        ?pick(rule.msgs.savage)
                        :pick(rule.msgs.annoying);
                if(rule.placeHolderMatch){
                    template= template.replace("${match}", match[0]);
                }
                const message =rule.tip?`${template}\nTip: ${rule.tip}`:template;
                const diag=new vscode.Diagnostic(
                    rule.wholeLine
                        ?document.lineAt(start.line).range
                        :new vscode.Range(start, endPos),
                    message,
                    rule.severity
                );
                diag.source="AssistRoast";
                diag.code=rule.id;
                diags.push(diag);
            }
            if(localHits>0){
                counts.set(rule.id, prev+localHits);
                newIssues+=localHits;
            }
        }
        return {diagnostics: diags, newIssues};
    }
    dispose() {
        this.collection.dispose();
        this.statusBar.dispose();
        this.timers.forEach((timer) => clearTimeout(timer));
        this.timers.clear();
        this.ruleCounts.clear();
    }
}
function modeWithRepetition(mode: string, repeatCount: number): Mode{
    if (mode === "gentle") {
    if (repeatCount >= 5) return "annoying";
        return "gentle";
    }
    if (mode === "annoying") {
        if (repeatCount >= 5) return "savage";
        return "annoying";
    }
    return "savage";
}
let analyzer: AssistRoastAnalyzer | null=null;
export function activate(context: vscode.ExtensionContext) {
    console.log("Assist Roast Linter activated");
    analyzer = new AssistRoastAnalyzer(context);
    context.subscriptions.push(
        vscode.commands.registerCommand("assistRoast.toggleEnable", () => {
            if(!analyzer) return;
            analyzer.enabled =!analyzer.enabled;
            vscode.window.showInformationMessage(
                analyzer.enabled
                    ?"Assist Roast enabled"
                    :"Assist roast disabled"
            );
            analyzer.analyzeActive(true);
        }),
        vscode.commands.registerCommand("assistRoast.resetMode", () => {
            analyzer?.resetMode();
            vscode.window.showInformationMessage("Assist Roast mode reset");
        }),
        vscode.commands.registerCommand("assistRoast.runNow", () => {
            analyzer?.analyzeActive(true);
        })
    );
    analyzer.analyzeActive();
}
export function deactivate() {
    analyzer?.dispose();
    analyzer=null;
    console.log("Assist Roast Linter deactivated");
}