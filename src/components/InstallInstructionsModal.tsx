import React from 'react';

interface InstallInstructionsModalProps {
  onClose: () => void;
}

export default function InstallInstructionsModal({ onClose }: InstallInstructionsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold text-fg">How to Install the Extension</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-fg hover:text-fg hover:bg-muted transition-all duration-150 cursor-pointer"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6 text-sm text-fg">
          <p className="text-muted-fg">
            Follow these steps to load the Context Relay extension into Chrome:
          </p>

          <ol className="space-y-5">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <strong className="block mb-1 text-base">Extract the downloaded file</strong>
                <p className="text-muted-fg">Unzip <code className="bg-muted px-1.5 py-0.5 rounded text-xs">context-relay-extension.zip</code> to a folder on your computer.</p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <strong className="block mb-1 text-base">Open Extensions page</strong>
                <p className="text-muted-fg">In Chrome, go to <code className="bg-muted px-1.5 py-0.5 rounded text-xs select-all">chrome://extensions/</code> (copy and paste into your address bar).</p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <strong className="block mb-1 text-base">Enable Developer Mode</strong>
                <p className="text-muted-fg">Toggle the <strong>Developer mode</strong> switch in the top right corner.</p>
              </div>
            </li>

            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <strong className="block mb-1 text-base">Load the unpacked extension</strong>
                <p className="text-muted-fg">Click the <strong>Load unpacked</strong> button that appears and select the folder you extracted in Step 1.</p>
              </div>
            </li>
          </ol>

          <div className="bg-accent-light/30 border border-accent/20 rounded-xl p-4 mt-6">
            <h3 className="font-semibold text-accent mb-1 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
              You're all set!
            </h3>
            <p className="text-muted-fg text-xs">
              Don't forget to pin the extension in your browser toolbar for quick access to your Context Relay.
            </p>
          </div>
        </div>

        <div className="p-5 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-all duration-150 cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
