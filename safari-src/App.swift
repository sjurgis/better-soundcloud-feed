// Minimal container app for the Safari Web Extension. Safari only loads web
// extensions that ship inside a macOS app; this app just explains how to
// enable it and opens Safari's extension settings.
import Cocoa
import SafariServices

let extensionBundleIdentifier =
  (Bundle.main.object(forInfoDictionaryKey: "BSFExtensionBundleIdentifier") as? String)
  ?? "com.sjurgis.bettersoundcloudfeed.Extension"

final class AppDelegate: NSObject, NSApplicationDelegate {
  var window: NSWindow!

  func applicationDidFinishLaunching(_ notification: Notification) {
    window = NSWindow(
      contentRect: NSRect(x: 0, y: 0, width: 460, height: 190),
      styleMask: [.titled, .closable, .miniaturizable],
      backing: .buffered, defer: false)
    window.title = "Better SoundCloud Feed"

    let label = NSTextField(wrappingLabelWithString: """
      Better SoundCloud Feed is a Safari extension.

      This build is unsigned: enable Safari > Settings > Advanced > "Show features for web \
      developers", then Develop > Allow Unsigned Extensions. Then turn the extension on in \
      Safari > Settings > Extensions and allow it on soundcloud.com.
      """)
    label.frame = NSRect(x: 20, y: 64, width: 420, height: 112)

    let button = NSButton(
      title: "Open Safari Extensions Settings…", target: self, action: #selector(openSettings))
    button.bezelStyle = .rounded
    button.frame = NSRect(x: 16, y: 18, width: 280, height: 32)

    window.contentView?.addSubview(label)
    window.contentView?.addSubview(button)
    window.center()
    window.makeKeyAndOrderFront(nil)
    NSApp.activate(ignoringOtherApps: true)
  }

  @objc func openSettings() {
    SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) {
      error in
      if let error { NSLog("showPreferencesForExtension failed: \(error)") }
    }
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
