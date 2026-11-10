<p align="center">
  <img src="assets/logo.svg" width="88" height="88" alt="Brisk logo" />
</p>

<h1 align="center">Brisk™</h1>

<p align="center">
  A lighter way to browse on Windows.<br />
  <a href="https://github.com/koharuame/brisk-browser/releases/latest"><b>Download for Windows 11</b></a>
  ·
  <a href="https://koharuame.github.io/brisk-browser/">Website</a>
  ·
  <a href="https://koharuame.github.io/brisk-browser/speed.html">Speed</a>
</p>

---

Brisk blocks ads before they load, puts the tabs you're not using to sleep, and keeps your history on your PC. It's built on Microsoft Edge WebView2, the web engine already inside Windows 11, so the installer is about 7 MB.

## What it does

- **Ads and trackers never load.** Every request is checked against EasyList, EasyPrivacy and uBlock Origin's filter lists. Known malware and phishing sites are stopped with a warning.
- **Tabs you're not using sleep.** Background tabs step down until they hold almost nothing, and come back where you left them. Tabs playing audio stay awake.
- **What you do stays on your PC.** No telemetry, no account, no sync, no background service. The password vault is encrypted with your master password.
- **Tabs your way.** Tear a tab off into its own window, drag it back, or group tabs.
- **Chrome extensions** from the Chrome Web Store.
- **Profiles and private tabs** to keep sign-ins apart.
- **Updates built in.** Brisk checks once a day; update from Settings → About.
- English and Thai interface, light and dark themes.

## Measured

On ten ad-heavy news sites, with Brisk's ad blocking on vs off:

| | Off | On | |
|---|---:|---:|---:|
| Median page load | 1,383 ms | 943 ms | **32% faster** |
| Processor time, all ten sites | 56.6 s | 45.4 s | **20% less** |
| Memory, all ten sites open | 2,225 MB | 1,992 MB | **10% less** |

Ten open tabs after ten idle minutes: **1,921 MB → 375 MB**. Method and full numbers are on the [speed page](https://koharuame.github.io/brisk-browser/speed.html). We haven't measured other browsers the same way yet, so we don't compare against them.

## Install

1. Download `Brisk_<version>_Setup.exe` from [Releases](https://github.com/koharuame/brisk-browser/releases/latest).
2. Run it. Setup checks your PC first, then installs Brisk for your account. No admin rights are needed.

The installer isn't code-signed yet, so Windows SmartScreen may warn you: choose **More info → Run anyway**.

**Requirements:** Windows 11 (64-bit) · Microsoft Edge WebView2 Runtime, installed for you if missing · 100 MB free disk space.

## About this repository

This repository is Brisk's public home: releases, the website (`docs/`) and the update feed that Brisk's built-in updater reads (`latest.json` on each release). Brisk's source code is not published.

---

<sub>© 2026 Koharuame. Brisk™ and the Brisk logo are trademarks of Koharuame. Microsoft, Windows, Edge and WebView2 are trademarks of the Microsoft group of companies. Chrome and Chrome Web Store are trademarks of Google LLC. Use of these names does not imply endorsement.</sub>
