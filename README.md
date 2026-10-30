# TrenoLegoBLE

**A Bluetooth train controller for LEGO® Powered Up hubs, running directly in your web browser.**

TrenoLegoBLE is a lightweight, installable Progressive Web App (PWA) for controlling multiple LEGO Powered Up trains from a Windows PC or an Android phone/tablet. It communicates directly with the LEGO Powered Up Hub (88009) using Bluetooth Low Energy (BLE) and the LEGO Wireless Protocol 3.0. **No ESP32, external server, or dedicated native app is required to control the trains.**

TrenoLegoBLE is a standalone project, independent of [TrenoLEGO](https://github.com/AlexPedre/TrenoLEGO).

## 1. Main features

- Direct Bluetooth connection to multiple LEGO Powered Up 88009 hubs.
- Independent motor power control from **-100% to +100%** using continuous sliders.
- Configurable acceleration and deceleration ramp; individual **STOP** follows the ramp, while **STOP ALL** stops motors immediately.
- Independent configuration of ports **A** and **B**: **Motor**, **Lights**, or **None**.
- Individual motor direction reversal for each port.
- Two motors on one hub, controlled either independently or together with one slider.
- **Duo trains:** group two hubs under a single control, with support for up to four motors and independent direction reversal.
- Powered Up light on/off control with configurable brightness.
- Hub battery level and Bluetooth signal (RSSI) monitoring, plus firmware/hardware information.
- Rename the hub's Bluetooth advertising name and assign a separate display name to each train.
- Set a predefined LEGO hub LED color for each hub.
- Automatic reconnection when supported by the browser, with manual reconnection as a fallback.
- Drag-and-drop reordering of train cards; saved train configurations and order.
- Optional global energy-saving setting to disconnect inactive hubs after a configurable delay.
- Automatic Italian/English localization: Italian for Italian-language browsers, English otherwise.
- Installable PWA with offline application files and a responsive interface for desktop and mobile.

> **Safety:** Motor power is not a measured speed. Bluetooth communication, browser suspension, or device disconnection can prevent a stop command from reaching a train. Always supervise moving trains. **STOP ALL is a software command, not a guaranteed emergency-stop system.**

## 2. Hardware and software requirements

### Hardware

- One or more **LEGO Powered Up Hub 88009** devices (the two-port hubs used in LEGO City Powered Up trains).
- Compatible LEGO Powered Up motors and, optionally, Powered Up lights.
- A Windows computer or Android device with working Bluetooth Low Energy hardware.

### Browser

Use a recent version of **Google Chrome** on Windows or Android, or **Microsoft Edge** on Windows. Web Bluetooth support varies across browsers and operating systems.

**iOS/iPadOS is not supported:** the browsers available for iPhone and iPad do not provide the Web Bluetooth support required by this project. TrenoLegoBLE displays a compatibility notice on those devices.

The app should be opened over **HTTPS** (e.g. GitHub Pages), or over `http://localhost` while developing. It may work as a local `file://` page on some Chrome configurations, but this is not guaranteed.

## 3. Chrome settings for automatic reconnection

The basic Bluetooth connection uses `navigator.bluetooth.requestDevice()` and does **not** require experimental Chrome settings on compatible platforms. The browser will show a device-selection dialog when pairing or reconnecting manually.

For **automatic reconnection of previously authorized hubs**, TrenoLegoBLE optionally uses `navigator.bluetooth.getDevices()`. During testing, the following Chrome flags were required:

1. Open `chrome://flags/#enable-experimental-web-platform-features`.
2. Set **Experimental Web Platform features** to **Enabled**, if this flag is available.
3. Open `chrome://flags/#enable-web-bluetooth-new-permissions-backend`.
4. Set **Web Bluetooth New Permissions Backend** to **Enabled**, if this flag is available.
5. Relaunch Chrome, then reconnect each hub manually once to establish or refresh its authorization.

These are **experimental browser settings**, not permanent Chrome features: their names, availability, and behavior may change with browser updates. Enable them only if you understand the implications. If they are absent, automatic reconnection may still be available in your browser version, or you can continue using manual reconnection.

**Important limitation observed during testing:** even with `getDevices()` enabled, Chrome may fail to reconnect automatically if a hub is powered on *after* the page has tried to connect to it. It can report `NetworkError: Bluetooth Device is no longer in range` although the hub is advertising. Selecting the hub again using **Reconnect** (`requestDevice()`) typically restores connectivity. Repeated page refreshes do not necessarily resolve this issue.

The persistent Bluetooth permissions and the train settings are separate: clearing browser data or using a different website origin may require the hubs to be selected again.

## 4. Getting started

1. Turn on the LEGO Powered Up hub(s), and make sure they are not already connected to another controller or app.
2. Open the hosted TrenoLegoBLE page in a supported browser.
3. Go to **Settings** and select **Pair hub**.
4. Choose the hub in Chrome's Bluetooth dialog.
5. Give the train a display name and configure ports **A** and **B** as Motor, Lights, or None.
6. Set motor direction reversal, ramp, lights brightness, and other preferences as needed.
7. Return to **Controls** and use the sliders to drive the trains.

The power sliders range from -100% (reverse) to +100% (forward), with 0% for stop. If a motor runs in the opposite direction, enable **Reverse direction** for that specific port.

For trains with **two motors on a single hub**, select Motor for both ports and choose whether to **link the motor controls**. If the motors are not linked, each gets an independent slider.

## 5. Duo trains

A **Duo** combines two previously configured hubs into one train card.

1. Pair and configure both hubs in **Settings**.
2. In the **Duo trains** section, select the two hubs and enter a Duo name.
3. Create the Duo. Its individual hub cards are replaced by a single Duo card in **Controls**; their settings remain accessible individually.

A Duo can control up to four motors (two per hub). Each motor keeps its own direction-reversal setting. The Duo moves only when **both hubs are connected**. If one disconnects, the application attempts to stop the other; this cannot guarantee a stop if Bluetooth communication is unavailable.

The Duo card shows battery and signal details for each hub. Its summary displays the **average battery percentage** and the **weaker (more negative) RSSI**. Missing values are shown as unavailable rather than estimated.

## 6. Lights, hub LED, and hub information

- **Powered Up lights:** assign a port as Lights and configure its brightness under Settings. The on/off button appears in Controls.
- **Hub status LED:** choose one of the **predefined LEGO colors**, or leave LED control to the original LEGO behavior. The selection is saved and reapplied when the hub connects.
- **Bluetooth name:** the hub's BLE name can be read and changed independently of its display name in TrenoLegoBLE. This is useful when several hubs originally advertise the same name, such as `HUB NO.4`.
- **Telemetry:** battery and RSSI are displayed in Controls; available hub firmware, hardware, radio firmware, protocol, and battery-type information is displayed in Settings.

Some telemetry values depend on the hub and firmware and may not always be available.

## 7. Reconnection, saved settings, and energy saving

Train names, port assignments, linked motors, Duo associations, card order, and other preferences are saved in the browser's **localStorage**. They are associated with the website origin and browser profile and do not automatically transfer between domains or devices.

- **Reconnect** lets you select and reconnect an individual hub.
- **Reconnect all** helps you reconnect missing hubs. Chrome's Bluetooth dialog selects **one hub at a time**; user interaction is required for each manual selection.
- With browser support and saved authorizations, previously paired hubs may reconnect automatically on startup.
- **Energy saving** is a global Settings option with a configurable inactivity timeout. It can disconnect idle hubs after their motors have stopped. A Duo is treated as one group. Browser background throttling, especially with a locked phone, can delay timers.

To reorder trains in Controls, drag the card by its handle. The new order is saved automatically.

## 8. Installing the PWA

When hosted on HTTPS, TrenoLegoBLE can be installed as a Progressive Web App.

**Windows (Chrome/Edge):** open the app URL and use the browser's **Install app** command (or the installation icon, if shown).

**Android (Chrome):** open the app URL, open Chrome's menu, and choose **Install app** or **Add to Home screen**, depending on the browser version.

After installation, the app opens in its own window and its interface files can be available offline once cached by the Service Worker. **Bluetooth still requires compatible hardware, permissions, and proximity to the hubs.** Installing the PWA does not bypass Web Bluetooth limitations.

### Hosting on GitHub Pages

Place the PWA files in a GitHub repository and enable **Settings → Pages → Deploy from a branch** (`main`, `/ (root)`). GitHub Pages provides HTTPS hosting for static sites. Keep the manifest, Service Worker, and icons alongside `index.html`, using relative paths appropriate for the repository URL.

Typical files:

```text
index.html
manifest.webmanifest
sw.js
icons/
  icon-192.png
  icon-512.png
  icon-maskable-512.png
```

A GitHub Pages installation uses a different origin from any previous self-hosted deployment. Browser storage and Bluetooth permissions therefore need to be set up again on the new origin.

## 9. Limitations and future developments

- Web Bluetooth compatibility and permission persistence are browser-dependent.
- Automatic BLE rediscovery after a hub is powered on late is not always reliable; manual selection is the fallback.
- The number of simultaneous hub connections depends on the Bluetooth adapter, operating system, and radio environment.
- Motor sliders control **power**, not closed-loop speed.
- LEGO Powered Up 88010 remote-control support and sensor integration are **under investigation / experimental** and are not claimed as integrated features of this release.

## 10. Technical references

- [Official LEGO Wireless Protocol documentation](https://lego.github.io/lego-ble-wireless-protocol-docs/)
- [LEGO Wireless Protocol documentation repository](https://github.com/LEGO/lego-ble-wireless-protocol-docs)
- [Web Bluetooth API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [TrenoLEGO project](https://github.com/AlexPedre/TrenoLEGO)

## 11. Disclaimer

TrenoLegoBLE is an independent, unofficial project and is **not affiliated with or endorsed by the LEGO Group**. LEGO, Powered Up, and related marks belong to their respective owners. Product names are used only to identify compatibility.

Use the controller responsibly and never rely on a browser-based stop button as the sole means of preventing injury or damage.

## 12. License

TrenoLegoBLE is free and open-source software released under the **GNU General Public License v3.0 (GPL-3.0)**. You may use, modify, and redistribute it under the terms of this license. See the LICENSE file for the full license text.
