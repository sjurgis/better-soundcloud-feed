import { useSignal } from "@preact/signals";
import { Modal, mountModal } from "./Modal";
import { settingsStore } from "../../shared/stores/settings-store";
import { DEFAULT_SETTINGS } from "../../shared/types";
import { pipSupported } from "../signals";

const SETTINGS_MODAL_ID = "scf-settings-modal";

function SettingsModalContent({ onClose }: { onClose: () => void }) {
  const settings = settingsStore.get();
  const seekEnabled = useSignal(settings.seekEnabled);
  const seekSeconds = useSignal(settings.seekSeconds);
  const pipAutoEnabled = useSignal(settings.pipAutoEnabled);
  const pipButtonEnabled = useSignal(settings.pipButtonEnabled);
  const isPipSupported = pipSupported.value;

  const onApply = () => {
    const seconds = seekSeconds.value > 0 ? seekSeconds.value : settingsStore.get("seekSeconds");
    settingsStore.update({
      seekEnabled: seekEnabled.value,
      seekSeconds: seconds,
      pipAutoEnabled: pipAutoEnabled.value,
      pipButtonEnabled: pipButtonEnabled.value,
    });
    onClose();
  };

  const onReset = () => {
    seekEnabled.value = DEFAULT_SETTINGS.seekEnabled;
    seekSeconds.value = DEFAULT_SETTINGS.seekSeconds;
    pipAutoEnabled.value = DEFAULT_SETTINGS.pipAutoEnabled;
    pipButtonEnabled.value = DEFAULT_SETTINGS.pipButtonEnabled;
  };

  return (
    <Modal title="Better SC Feed Playback Settings" onClose={onClose}>
      <section class="scf-modal-section">
        <h3>Seek Playback</h3>
        <label class="scf-toggle-row">
          <span>Enable Seek Buttons</span>
          <input
            type="checkbox"
            class="scf-toggle"
            id="scf-setting-seek-enabled"
            checked={seekEnabled.value}
            onChange={(e) => (seekEnabled.value = (e.target as HTMLInputElement).checked)}
          />
        </label>
        <label class="scf-toggle-row">
          <span>Seconds to seek</span>
          <input
            type="number"
            class="scf-input scf-input-small"
            id="scf-setting-seek-seconds"
            min={1}
            max={300}
            step={1}
            value={seekSeconds.value}
            onInput={(e) =>
              (seekSeconds.value = parseInt((e.target as HTMLInputElement).value, 10) || 0)
            }
          />
        </label>
      </section>
      <section class="scf-modal-section">
        <h3>Picture-in-Picture</h3>
        {!isPipSupported && (
          <p class="scf-help-text">
            Document Picture-in-Picture is not supported in this browser. Chrome 116+ and Edge 116+
            support it natively. Firefox 148+ requires enabling <code>dom.documentpip.enabled</code>{" "}
            in <code>about:config</code>. Safari does not support it yet, so PiP is unavailable
            there; filters and seek buttons work normally.
          </p>
        )}
        <label class={`scf-toggle-row${!isPipSupported ? " scf-toggle-row-disabled" : ""}`}>
          <span>Auto-open PiP on tab switch</span>
          <input
            type="checkbox"
            class="scf-toggle"
            id="scf-setting-pip-auto"
            checked={pipAutoEnabled.value}
            disabled={!isPipSupported}
            onChange={(e) => (pipAutoEnabled.value = (e.target as HTMLInputElement).checked)}
          />
        </label>
        <label class={`scf-toggle-row${!isPipSupported ? " scf-toggle-row-disabled" : ""}`}>
          <span>Show PiP button in player</span>
          <input
            type="checkbox"
            class="scf-toggle"
            id="scf-setting-pip-button"
            checked={pipButtonEnabled.value}
            disabled={!isPipSupported}
            onChange={(e) => (pipButtonEnabled.value = (e.target as HTMLInputElement).checked)}
          />
        </label>
      </section>
      <div class="scf-actions">
        <button
          type="button"
          class="scf-btn scf-btn-primary"
          id="scf-settings-apply"
          onClick={onApply}
        >
          Apply
        </button>
        <button
          type="button"
          class="scf-btn scf-btn-secondary"
          id="scf-settings-reset"
          onClick={onReset}
        >
          Reset
        </button>
        <button
          type="button"
          class="scf-btn scf-btn-secondary"
          id="scf-settings-cancel"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export function openSettingsModal(): void {
  mountModal(SETTINGS_MODAL_ID, (close) => <SettingsModalContent onClose={close} />);
}
