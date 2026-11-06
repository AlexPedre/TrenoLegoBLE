# TrenoLegoBLE

**A Bluetooth train controller for LEGO® Powered Up hubs, running directly in your web browser.**

TrenoLegoBLE is a lightweight, installable Progressive Web App (PWA) for controlling multiple LEGO Powered Up trains from a Windows PC or an Android phone/tablet. It communicates directly with the LEGO Powered Up Hub (88009) using Bluetooth Low Energy (BLE) and the LEGO Wireless Protocol 3.0. **No ESP32, external server, or dedicated native app is required to control the trains. Most importantly, no replacement or modification of the original LEGO hub firmware is required: unlike solutions based on Pybricks, TrenoLegoBLE communicates with hubs running their factory firmware.**

[Click here](https://alexpedre.github.io/TrenoLegoBLE/) to try it!

## 1. Main features

- Direct Bluetooth connection to multiple LEGO Powered Up 88009 hubs.
- Independent motor power control from **-100% to +100%** using continuous sliders.
- Configurable acceleration and deceleration ramp; individual **STOP** follows the ramp, while **STOP ALL** stops motors immediately.
- Independent configuration of ports **A** and **B**: **Motor**, **Lights**, or **None**.
- Individual motor direction reversal for each port.
- Two motors on one hub, controlled either independently or together with one slider.
- **Duo trains:** group two hubs under a single control, with support for up to four motors and independent direction reversal.
- Powered Up light on/off control with configurable brightness, including independent buttons for lights on ports A and B.
- Hub and remote-controller battery level and Bluetooth signal (RSSI) monitoring, plus expandable firmware/hardware information where supported.
- Rename the hub's Bluetooth advertising name and assign a separate display name to each train.
- Set a predefined LEGO hub LED color for each hub.
- Automatic reconnection when supported by the browser, with manual reconnection as a fallback.
- Drag-and-drop reordering of train cards; saved train configurations and order.
- Optional energy saving for inactive hubs and LEGO remote controllers. Hubs are switched off first; remote controllers are disconnected after a fixed 30-second delay to reduce unwanted direct hub/remote pairing.
- **LEGO Powered Up Remote Control 88010 support:** connect multiple remotes and assign configurable pairs of motors, including Duo trains; switch between motor pairs with the center button and identify the active pair by the remote LED color.
- Remote-control driving with configurable stepwise or press-and-hold continuous power changes; single STOP for the assigned motor/group and double-click STOP on either side for immediate STOP ALL.
- Per-motor **Torque Boost:** optional three-step startup boost with configurable maximum power and duration, compatible with ramps and Duo trains.
- Optional **haptic feedback** on supported devices, with vibration duration related to the acceleration/deceleration ramp.
- One-time low-battery warning below 20%, re-armed only after recovery to 30% or higher.
- Export and import the complete configuration as a JSON backup, including hubs, Duo trains, remotes, and preferences.
- Automatic Italian/English localization: Italian for Italian-language browsers, English otherwise.
- Installable PWA with offline application files and a responsive interface for desktop and mobile.

> **Safety:** Motor power is not a measured speed. Bluetooth communication, browser suspension, or device disconnection can prevent a stop command from reaching a train. Always supervise moving trains. **STOP ALL is a software command, not a guaranteed emergency-stop system.**

## 2. Hardware and software requirements

### Hardware

- One or more **LEGO Powered Up Hub 88009** devices (the two-port hubs used in LEGO City Powered Up trains).
- Compatible LEGO Powered Up motors and, optionally, Powered Up lights.
- Optionally, one or more **LEGO Powered Up Remote Control 88010** devices for physical train control.
- A Windows computer or Android device with working Bluetooth Low Energy hardware.

### Browser

Use a recent version of **Google Chrome** on Windows or Android, or **Microsoft Edge** on Windows. Web Bluetooth support varies across browsers and operating systems.

**iOS/iPadOS is not supported:** the browsers available for iPhone and iPad do not provide the Web Bluetooth support required by this project. TrenoLegoBLE displays a compatibility notice on those devices.

The app should be opened over **HTTPS** (e.g. GitHub Pages), or over `http://localhost` while developing. It may work as a local `file://` page on some Chrome configurations, but this is not guaranteed.

## 3. Chrome settings for automatic reconnection

The basic Bluetooth connection uses `navigator.bluetooth.requestDevice()` and does **not** require experimental Chrome settings on compatible platforms. The browser will show a device-selection dialog when pairing or reconnecting manually.

For **automatic reconnection of previously authorized hubs and remote controllers**, TrenoLegoBLE optionally uses `navigator.bluetooth.getDevices()`. During testing, the following Chrome flags were required:

1. Open `chrome://flags/#enable-experimental-web-platform-features`.
2. Set **Experimental Web Platform features** to **Enabled**, if this flag is available.
3. Open `chrome://flags/#enable-web-bluetooth-new-permissions-backend`.
4. Set **Web Bluetooth New Permissions Backend** to **Enabled**, if this flag is available.
5. Relaunch Chrome, then reconnect each hub and remote manually once to establish or refresh its authorization.

These are **experimental browser settings**, not permanent Chrome features: their names, availability, and behavior may change with browser updates. Enable them only if you understand the implications. If they are absent, automatic reconnection may still be available in your browser version, or you can continue using manual reconnection.

**Important limitation observed during testing:** even with `getDevices()` enabled, Chrome may fail to reconnect automatically if a hub is powered on *after* the page has tried to connect to it. It can report `NetworkError: Bluetooth Device is no longer in range` although the hub is advertising. Selecting the hub again using **Reconnect** (`requestDevice()`) typically restores connectivity. Repeated page refreshes do not necessarily resolve this issue.

The persistent Bluetooth permissions and saved device settings are separate: clearing browser data or using a different website origin may require hubs and remote controllers to be selected again.

## 4. Getting started

1. Turn on the LEGO Powered Up hub(s), and make sure they are not already connected to another controller or app.
2. Open the hosted TrenoLegoBLE page in a supported browser.
3. Go to **Settings** and select **Pair hub**.
4. Choose the hub in Chrome's Bluetooth dialog.
5. Give the train a display name and configure ports **A** and **B** as Motor, Lights, or None.
6. Set motor direction reversal, ramp, optional Torque Boost, lights brightness, and other preferences as needed.
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

## 6. LEGO remote controllers

TrenoLegoBLE supports one or more **LEGO Powered Up Remote Control 88010** devices directly over Web Bluetooth. Open the **Remotes** tab to pair, reconnect, and configure each remote. The BLE connection is maintained independently of the currently displayed page.

- Each remote can be assigned **multiple motor pairs**. The left and right button groups may control separate motors/ports or Duo trains.
- The **center button** cycles through the configured motor pairs; the remote status LED changes color to indicate the active pair.
- Choose between **stepwise** power adjustments (a configurable percentage per press) and **continuous** adjustments while holding the + or - button.
- A **single STOP** on either side stops its assigned motor or group using the configured ramp. **Double-click either STOP** to stop all connected trains immediately.
- Remote-controller battery, RSSI, and available firmware/hardware details are shown in the interface.
- A hub belonging to a Duo cannot be assigned individually to a remote; assign the Duo instead.
- Multiple remotes may be connected and configured independently. The practical BLE connection limit depends on the computer/phone and its Bluetooth adapter.

The remote is connected to the browser, not paired directly to the train hubs. Turn on the remote and use the **Remotes** tab to select it in Chrome when manual authorization is necessary.

## 7. Lights, hub LED, and hub information

- **Powered Up lights:** assign a port as Lights and configure its brightness under Settings. The **Lights ON/OFF** button appears in Controls. If both ports carry lights, separate **Lights A ON/OFF** and **Lights B ON/OFF** buttons are shown side by side.
- **Hub status LED:** choose one of the **predefined LEGO colors**, or leave LED control to the original LEGO behavior. The selection is saved and reapplied when the hub connects.
- **Bluetooth name:** the hub's BLE name can be read and changed independently of its display name in TrenoLegoBLE. This is useful when several hubs originally advertise the same name, such as `HUB NO.4`.
- **Telemetry:** battery (shown with a battery icon) and RSSI are displayed in Controls. Under Settings, expand **Hub information** beneath the hub name to view available firmware, hardware, radio firmware, protocol, and battery-type details.

Some telemetry values depend on the hub and firmware and may not always be available.

## 8. Ramps, Torque Boost, and haptic feedback

Each motor can optionally use **Torque Boost** to help a train start moving at low requested power. Rather than immediately applying full startup power, the boost increases the motor output in **three fixed steps**. The user can enable/disable the feature per motor and adjust the maximum boost power and total duration. Torque Boost is disabled by default, and the sequence is canceled if a STOP or a new power command is received. It works with individually controlled motors, Duo trains, and remote controls.

The optional **haptic feedback** setting consists of a single checkbox in Settings and is disabled by default. On supported Android devices, moving a motor slider or pressing STOP can trigger vibration. With a ramp, its duration tracks the estimated remaining ramp time (subject to an upper limit); without a ramp, a short fixed vibration is used. Vibration support depends on the browser and device and may not work on desktop computers.

## 9. Reconnection, saved settings, energy saving, and backups

Train names, port assignments, linked motors, Duo associations, remote-controller assignments, Torque Boost, haptic feedback, card order, and other preferences are saved in the browser's **localStorage**. They are associated with the website origin and browser profile and do not automatically transfer between domains or devices.

- **Reconnect** lets you select and reconnect an individual hub or remote controller from its respective page.
- **Reconnect all** helps you reconnect missing devices where supported. Chrome's Bluetooth dialog selects **one device at a time**; user interaction is required for each manual selection.
- With browser support and saved authorizations, previously paired hubs and remotes may reconnect automatically on startup.
- **Energy saving** is a global Settings option with a configurable inactivity timeout. When motors are stopped and the timeout expires, the app requests hub shutdown first and disconnects remote controllers **30 seconds later**. Activity during the waiting period cancels the pending remote disconnection. Browser background throttling, especially with a locked phone, can delay timers.
- **Low battery warning:** a popup is displayed when a hub or remote reports a battery level below **20%**. To avoid repeated alerts due to transient voltage drops under motor load, the warning is only re-armed after the reported charge reaches **30%** or more; the warning state is stored locally.
- **Configuration backup:** Settings provides **Export** and **Import** actions for a JSON file containing hub, Duo, remote, and general app preferences. Import validates the file and requires confirmation before replacing the current configuration. Bluetooth permissions are **not** part of the backup and may need to be granted again on another device or website origin.

To reorder trains in Controls, drag the card by its handle. The new order is saved automatically.

## 10. Installing the PWA

When hosted on HTTPS, TrenoLegoBLE can be installed as a Progressive Web App.

**Windows (Chrome/Edge):** open the app URL and use the browser's **Install app** command (or the installation icon, if shown).

**Android (Chrome):** open the app URL, open Chrome's menu, and choose **Install app** or **Add to Home screen**, depending on the browser version.

After installation, the app opens in its own window and its interface files can be available offline once cached by the Service Worker. **Bluetooth still requires compatible hardware, permissions, and proximity to the hubs.** Installing the PWA does not bypass Web Bluetooth limitations.

### Hosting on GitHub Pages

Place the PWA files in a GitHub repository and enable **Settings → Pages → Deploy from a branch** (`main`, `/ (root)`). GitHub Pages provides HTTPS hosting for static sites. Keep the manifest, Service Worker, CSS, JavaScript, and icons alongside `index.html`, using relative paths appropriate for the repository URL.

Typical files:

```text
index.html
style.css
app.js
manifest.webmanifest
sw.js
icons/
  icon-192.png
  icon-512.png
  icon-maskable-512.png
```

A GitHub Pages installation uses a different origin from any previous self-hosted deployment. Browser storage and Bluetooth permissions therefore need to be set up again on the new origin.

## 11. Limitations and future developments

- Web Bluetooth compatibility and permission persistence are browser-dependent.
- Automatic BLE rediscovery after a hub is powered on late is not always reliable; manual selection is the fallback.
- The number of simultaneous hub connections depends on the Bluetooth adapter, operating system, and radio environment.
- Motor sliders control **power**, not closed-loop speed.
- Support for LEGO Powered Up sensors, generic gamepads (such as the PS4 DualShock 4), and virtual Power Functions IR hubs is being explored; **these features are not included in the current release**.
- The infrared Power Functions system and third-party firmware emulation are not required for standard Powered Up train operation.
- The app controls hubs with their **original LEGO firmware**; installing Pybricks or flashing a custom firmware is **not required**.

## 12. Technical references

- [Official LEGO Wireless Protocol documentation](https://lego.github.io/lego-ble-wireless-protocol-docs/)
- [LEGO Wireless Protocol documentation repository](https://github.com/LEGO/lego-ble-wireless-protocol-docs)
- [Web Bluetooth API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [TrenoLEGO project](https://github.com/AlexPedre/TrenoLEGO)

## 13. Disclaimer

TrenoLegoBLE is an independent, unofficial project and is **not affiliated with or endorsed by the LEGO Group**. LEGO, Powered Up, and related marks belong to their respective owners. Product names are used only to identify compatibility.

Use the controller responsibly and never rely on a browser-based stop button as the sole means of preventing injury or damage.

## 14. License

TrenoLegoBLE is free and open-source software released under the **GNU General Public License v3.0 (GPL-3.0)**. You may use, modify, and redistribute it under the terms of this license. See the [LICENSE](LICENSE) file for the full license text.
