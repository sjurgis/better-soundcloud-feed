// Native side of the Safari Web Extension. The extension does not use native
// messaging; this handler only exists because Safari requires a principal class.
import Foundation
import SafariServices

@objc(SafariWebExtensionHandler)
final class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
  func beginRequest(with context: NSExtensionContext) {
    let response = NSExtensionItem()
    response.userInfo = [SFExtensionMessageKey: ["ok": true]]
    context.completeRequest(returningItems: [response], completionHandler: nil)
  }
}
