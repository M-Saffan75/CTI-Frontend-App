# Finish protocol for this React Native app (temporary file)

This file is temporary. Read it fully before starting work, follow it for every task in this project, and read it again whenever you start a new task or feel unsure. When I say "cleanup", delete this file and the checklist file (see section 8).

The goal: every task is finished 100 percent the first time. No stopping at 90 percent, no forgotten requirements, no second prompt from me to finish the rest.

Important facts about my setup:
- This is a large React Native app. I test on a physical phone, not an emulator.
- You cannot run the app on my phone. So your job is to make the code correct by careful checks and reading, and to give me a short device test list. I will test and report back.
- If a command needs my permission or fails to run, do not guess. Give me the exact command and I will run it.

## 1. Before you write any code

1. Read my whole message again, slowly.
2. Create a file called CHECKLIST.md in the project root. Write every requirement from my message as a numbered line with an empty checkbox. Be literal and detailed. If my message has 12 small things, the list has 12 lines. Never merge or summarize requirements.
3. Use the project map. If PROJECT_MAP.md exists in the project root, read it first to find the exact screen, section, component and API for this task. If it does not exist, create it once before doing anything else: scan the app and write, for every screen, its file path, its sections (each with the component or file that renders it), the API calls and state it uses, and the shared components it imports. Keep it short and factual. At the end of every task, update PROJECT_MAP.md if you added, moved or renamed anything.
4. Scope. Do not retest or rewrite the whole app. Work only on the screen and section the task is about. Use the project map plus a search to find every place that uses the files you change. If you change a shared component, hook, style, API function or type, find all the places that use it and check each one still works. Do not touch unrelated screens.
5. Read the existing code that the task touches (screens, components, navigation, API files, state, styles). Learn how this project already does things: folder structure, naming, navigation setup, state management, API calling style, error handling, styling approach, existing shared components. Reuse them. Do not invent a new pattern.
6. If the project has other requirement documents (a README, a brief, a design file, an API doc), read them and add any requirement that touches the same feature.
7. Show me the checklist in chat in short form, then start working. Do not wait for approval unless something is truly unclear.

## 2. While you work

- Work on one checklist item at a time and tick it in CHECKLIST.md only after the code for it exists and is correct.
- Do not skip small items: loading states, empty states, error messages, validation, disabled buttons, keyboard behavior, spacing, alignment, text overflow, permissions, back button behavior. These are exactly what usually gets forgotten.
- If two requirements conflict, tell me in one line and choose the safest option. Do not silently drop either one.
- Follow the existing code style, folder structure and naming of this project. Keep the code simple and readable. Do not add files, folders or packages that are not needed.
- Do not upgrade or remove packages, change native folders (android, ios), or change app config, unless the task needs it. If it does, say so first and give me the exact command to run.
- Flexbox only for layout. No CSS grid, no web only APIs.
- Handle Android and iOS differences when they matter (safe area, status bar, keyboard avoiding, shadows and elevation, permissions, back button).
- Never hardcode API keys, tokens or passwords. Use the project's env or config approach.

## 3. Checks you must run yourself before saying "done"

Run what the project supports. Fix everything, then run again until clean.

1. TypeScript check (for example npx tsc --noEmit) if the project uses TypeScript.
2. Lint (for example npm run lint). Fix every error and every warning in the files you touched.
3. Tests (for example npm test) if the project has tests. Add or update tests only if the project already has a testing habit.
4. A bundle or build check that proves the app compiles (for example npx expo export for Expo projects, or the project's Metro bundle or Gradle build command). If you cannot run it, say exactly why and give me the command.
5. Search the files you changed for: console.log, unused imports and variables, TODO, leftover test code, hardcoded secrets, hardcoded test data.

## 4. Code walk through (mandatory, this replaces running the app)

Since you cannot run the app on my phone, trace every flow in the code like a tester:

- Open CHECKLIST.md. For every line write where it lives (file and what was changed). If a line has no real place in the code, it is not done.
- Follow each user flow from the first tap to the final result. Check: navigation and route params (names, types, required values), state updates, props passed between components, API request and response shape, what happens when the request fails or is slow or returns empty data, null and undefined cases, double taps and repeated submits.
- Check effects and listeners: dependency arrays are correct, timers, subscriptions, sockets and keyboard or back handlers are cleaned up, async work does not set state after unmount.
- Check lists: stable keys, no heavy work inside render, no inline functions or objects that cause needless re renders in large lists.
- Check layout: works on small and large phones, long text does not overflow, bottom buttons are not hidden by the keyboard or the safe area, nothing depends on a fixed screen size.
- If the app has dark mode, multiple languages or multiple user roles, check each one.

## 5. Device test list (for me)

After the checks pass, write a short numbered test list for my physical phone. Each item: where to go, what to tap or type, and exactly what I should see. Include the edge cases that matter (wrong input, no internet, back button, app in background and return).

Mark the related checklist items as "needs device test" until I confirm. Never say a feature is tested on a device. Only I can confirm that.

## 6. How to report

When sections 3 and 4 are done, reply with:
- The checklist with every line marked done (or "needs device test"), and the file where each lives.
- The device test list.
- One line for anything you could not do and why (missing asset, missing package, a command that needs my permission).
- The exact command for me to run if you need one.

Never say "done" or "completed" while any line is unchecked. If something is blocked, say exactly what is blocked instead of claiming success.

## 7. When I report a problem or say "continue"

- If I paste an error or a screenshot: read the whole error, find the root cause, fix the cause (not just the symptom), then search the project for the same mistake in other places and fix those too. Then redo sections 3 and 4 for the files you changed.
- If I say "continue" or "finish": open CHECKLIST.md, find every unchecked or weak item, complete them all, and redo sections 3 and 4. Do not ask me what is left. You already know from the checklist.

## 8. Cleanup (only when I say "cleanup")

Delete these files and nothing else:
- finish-protocol.md
- CHECKLIST.md
- Keep PROJECT_MAP.md unless I tell you to delete it too.
- Any temporary screenshots or scripts you created outside the normal project files.

Then run the checks from section 3 one last time and confirm they still pass.