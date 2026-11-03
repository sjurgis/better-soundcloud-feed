import { createLogger } from "../../shared/utils/logger";
import { buildPipDocument, type PipController } from "./ui";

const log = createLogger("pip");

let autoPipEnabled = false;
let controller: PipController | null = null;

async function openPipWindow(): Promise<void> {
  if (!("documentPictureInPicture" in window)) return;

  if (documentPictureInPicture.window) {
    documentPictureInPicture.window.focus();
    return;
  }

  const pipWindow = await documentPictureInPicture.requestWindow({
    width: 360,
    height: 480,
  });

  controller = buildPipDocument(pipWindow);
  controller.startPolling();

  pipWindow.addEventListener("pagehide", () => {
    controller?.stopPolling();
    controller = null;
  });

  log.debug("PiP window opened");
}

function closePipWindow(): void {
  controller?.stopPolling();
  controller = null;
  if ("documentPictureInPicture" in window) documentPictureInPicture.window?.close();
}

export function togglePip(): void {
  // Safari (and Firefox without the pref) have no Document PiP. The button is
  // hidden there, but guard anyway so a stray command can't throw.
  if (!("documentPictureInPicture" in window)) {
    log.info("Document Picture-in-Picture is not supported in this browser");
    return;
  }
  if (documentPictureInPicture.window) {
    closePipWindow();
  } else {
    openPipWindow();
  }
}

export function setupAutoPip(enabled: boolean): void {
  if (enabled === autoPipEnabled) return;
  autoPipEnabled = enabled;

  if (!("documentPictureInPicture" in window)) return;

  if (enabled) {
    try {
      navigator.mediaSession.setActionHandler("enterpictureinpicture", () => {
        openPipWindow();
      });
      log.debug("Auto PiP enabled");
    } catch {
      log.warn("Browser does not support enterpictureinpicture media session action");
    }
  } else {
    try {
      navigator.mediaSession.setActionHandler("enterpictureinpicture", null);
    } catch {
      // ignore — action may not be supported
    }
    log.debug("Auto PiP disabled");
  }
}
