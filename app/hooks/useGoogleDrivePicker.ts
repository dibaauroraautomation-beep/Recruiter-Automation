"use client";

import { useCallback, useRef } from "react";

declare const gapi: {
  load: (
    api: string,
    params: {
      callback: () => void;
    }
  ) => void;
};

declare const google: {
  picker: {
    PickerBuilder: new () => PickerBuilderInstance;
    ViewId: {
      DOCS: number;
      DOCS_VIDEOS: number;
      DOCS_IMAGES: number;
      PDFS: string;
    };
  };
};

interface PickerBuilderInstance {
  addView(view: unknown): PickerBuilderInstance;
  setOAuthToken(token: string): PickerBuilderInstance;
  setDeveloperKey(key: string): PickerBuilderInstance;
  setAppId(appId: string): PickerBuilderInstance;
  setCallback(
    cb: (data: PickerCallbackData) => void
  ): PickerBuilderInstance;
  build(): {
    setVisible(visible: boolean): void;
  };
}

interface PickerDoc {
  id: string;
  name: string;
  mimeType: string;
}

interface PickerCallbackData {
  action: string;
  docs: PickerDoc[];
}

const API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "";

const APP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID ?? "";

let pickerApiLoaded = false;
let pickerLoadPromise: Promise<void> | null = null;

function loadPickerApi(): Promise<void> {
  if (pickerApiLoaded) {
    return Promise.resolve();
  }

  if (pickerLoadPromise) {
    return pickerLoadPromise;
  }

  pickerLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");

    script.src = API_KEY
      ? `https://apis.google.com/js/api.js?key=${API_KEY}`
      : "https://apis.google.com/js/api.js";

    script.onload = () => {
      gapi.load("picker", {
        callback: () => {
          pickerApiLoaded = true;
          resolve();
        },
      });
    };

    script.onerror = reject;

    document.body.appendChild(script);
  });

  return pickerLoadPromise;
}

interface UseGoogleDrivePickerOptions {
  onFilePicked: (file: File) => void;
}

export function useGoogleDrivePicker({
  onFilePicked,
}: UseGoogleDrivePickerOptions) {
  const tokenRef = useRef<string | null>(null);

  const pickFileFromDrive = useCallback(
    async (token: string) => {
      if (!API_KEY) {
        alert(
          "Google Drive picker requires an API key. Set NEXT_PUBLIC_GOOGLE_API_KEY in .env.local"
        );
        return;
      }

      if (!APP_ID) {
        alert(
          "Google Drive picker requires an App ID. Set NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID in .env.local"
        );
        return;
      }

      await loadPickerApi();

      const rawToken = token;

      const tokenFromPicker = await new Promise<string>((resolve) => {
        const picker = new google.picker.PickerBuilder()
          .addView(google.picker.ViewId.DOCS)
          .addView(google.picker.ViewId.PDFS)
          .setOAuthToken(rawToken)
          .setDeveloperKey(API_KEY)
          .setAppId(APP_ID)
          .setCallback(async (data: PickerCallbackData) => {
            if (data.action === "picked") {
              const doc = data.docs[0];

              if (!doc) {
                console.error("No document was selected.");
                resolve(rawToken);
                return;
              }

              try {
                let blob: Blob;

                /*
                 * Google Workspace document
                 *
                 * Google Docs cannot be downloaded directly using
                 * alt=media, so export it as PDF.
                 */
                if (
                  doc.mimeType ===
                  "application/vnd.google-apps.document"
                ) {
                  const resp = await fetch(
                    `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=application/pdf`,
                    {
                      headers: {
                        Authorization: `Bearer ${rawToken}`,
                      },
                    }
                  );

                  // IMPORTANT:
                  // Do not convert an error response into a Blob.
                  if (!resp.ok) {
                    const errorText = await resp.text();

                    throw new Error(
                      `Google Drive download failed (${resp.status}): ${errorText}`
                    );
                  }

                  blob = await resp.blob();
                } else {
                  /*
                   * Normal uploaded files such as PDF.
                   */
                  const resp = await fetch(
                    `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
                    {
                      headers: {
                        Authorization: `Bearer ${rawToken}`,
                      },
                    }
                  );

                  // IMPORTANT:
                  // Check the HTTP response before reading the body.
                  if (!resp.ok) {
                    const errorText = await resp.text();

                    throw new Error(
                      `Google Drive download failed (${resp.status}): ${errorText}`
                    );
                  }

                  blob = await resp.blob();
                }

                /*
                 * Make sure Google actually returned file data.
                 */
                if (blob.size === 0) {
                  throw new Error(
                    "Google Drive returned an empty file."
                  );
                }

                console.log("Google Drive file downloaded successfully:", {
                  id: doc.id,
                  name: doc.name,
                  mimeType: doc.mimeType,
                  size: blob.size,
                  sizeKB: (blob.size / 1024).toFixed(2),
                  type: blob.type,
                });

                /*
                 * Determine the correct file extension.
                 */
                let ext = "";

                if (doc.mimeType === "application/pdf") {
                  ext = ".pdf";
                } else if (
                  doc.mimeType ===
                  "application/vnd.google-apps.document"
                ) {
                  ext = ".pdf";
                } else {
                  ext = ".pdf";
                }

                const name = doc.name.endsWith(ext)
                  ? doc.name
                  : `${doc.name}${ext}`;

                /*
                 * Create the actual File object.
                 */
                const file = new File([blob], name, {
                  type: blob.type || "application/pdf",
                });

                /*
                 * Final validation before sending the file
                 * back to CareerAI.
                 */
                if (file.size === 0) {
                  throw new Error(
                    "The generated file is empty."
                  );
                }

                console.log(
                  "File ready for CareerAI:",
                  {
                    name: file.name,
                    size: file.size,
                    sizeKB: (file.size / 1024).toFixed(2),
                    type: file.type,
                  }
                );

                onFilePicked(file);
              } catch (err) {
                console.error(
                  "Drive download failed:",
                  err
                );

                const message =
                  err instanceof Error
                    ? err.message
                    : "Unknown Google Drive download error.";

                alert(
                  `Failed to download file from Google Drive.\n\n${message}`
                );
              }
            }

            resolve(rawToken);
          })
          .build();

        picker.setVisible(true);
      });

      return tokenFromPicker;
    },
    [onFilePicked]
  );

  const openDrivePicker = useCallback(async () => {
    const popup = window.open(
      "/api/drive/auth",
      "Google Drive",
      "width=500,height=700"
    );

    if (!popup) {
      alert(
        "Please allow popups for this site and try again."
      );
      return;
    }

    try {
      const token = await new Promise<string>(
        (resolve, reject) => {
          const handler = (event: MessageEvent) => {
            if (
              event.data?.type === "drive_token"
            ) {
              window.removeEventListener(
                "message",
                handler
              );

              resolve(event.data.token);
            }

            if (
              event.data?.type === "drive_error"
            ) {
              window.removeEventListener(
                "message",
                handler
              );

              reject(
                new Error(event.data.error)
              );
            }
          };

          window.addEventListener(
            "message",
            handler
          );

          setTimeout(() => {
            window.removeEventListener(
              "message",
              handler
            );

            reject(
              new Error("OAuth timed out")
            );
          }, 120000);
        }
      );

      tokenRef.current = token;

      await pickFileFromDrive(token);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message !== "OAuth timed out"
      ) {
        console.error(
          "Google Drive auth failed:",
          err
        );

        alert(
          "Google Drive authentication failed."
        );
      }
    }
  }, [pickFileFromDrive]);

  return {
    openDrivePicker,
  };
}