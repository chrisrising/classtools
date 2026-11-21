# ClassTools

A free set of classroom maths tools for Windows, built for the interactive whiteboard. Everything
floats on top of whatever is already on screen — PowerPoint, a website, an exam paper — so you can
reach for a tool without closing what you are teaching from.

Written for FE maths: GCSE resit and Functional Skills groups, on a board where right-clicking is
awkward and every button needs to be big enough to hit with a finger.

## Download

Grab the latest `ClassTools-Windows-x.y.z.zip` from the
[Releases page](../../releases/latest).

**Before you extract it:** right-click the zip, choose Properties, and tick *Unblock*. Windows
marks anything downloaded from the internet, and without this it will question every file inside.

Then extract the folder and double-click **ClassTools**. There is no installer and nothing is
written to the registry. If you want it in the Start menu, run *Install to Start menu* inside the
`app` folder; *Remove ClassTools* undoes all of it.

## What's in it

| Tool | What it does |
| --- | --- |
| **Calculator** | Laid out like the Casio fx-83GT CW, so the keys are where learners expect them |
| **Document viewer** | Opens PDFs, PowerPoint and Word files; write over them with pen, highlighter, ruler, protractor and compass, rotate the page, then save your annotated copy back out in the same file type |
| **ShapeXplorer** | 2D and 3D shapes — nets, areas, volumes, cutting a shape into parts and moving them, regular polygons up to 50 sides |
| **Question sheets** | Generates fluency starters and problem-solving questions as printable sheets |
| **Objective ticker** | A lesson-objectives bar along the bottom of the board, ticked off as you go |
| **Timer** | Countdown for tasks, visible from the back of the room |
| **Screen pen** | Draw over anything on screen, not just inside ClassTools |
| **Dock** | The strip of buttons it all hangs off, which tucks out of the way when you don't need it |

## Repository layout

```
app/          the Electron application - all the HTML, JS and assets
launcher/     a small native Windows launcher (C) so the extracted folder shows one icon
packaging/    build script and the optional setup / removal scripts
```

## Building it yourself

You need [Node.js](https://nodejs.org), `mingw-w64` for the launcher, and `zip`:

```bash
sudo apt install mingw-w64 zip        # or the equivalent on your system
cd packaging
./build.sh
```

That fetches Electron 33.4.11, packs `app/` into `resources/app.asar`, compiles the launcher and
writes `dist/ClassTools-Windows-x.y.z.zip`.

To run the app directly while working on it:

```bash
npx electron app
```

## Free to use

ClassTools is free for any teacher to use with their classes.
