# CipherApp

A static, browser-based workspace for experimenting with text ciphers, number
base conversions, and arithmetic across numeral systems. Open `index.html` in a
modern browser to get started; no build step or server is required.

## Workspaces

- `ciphertext.html` — encode and decode messages with classical ciphers and
  common text encodings. AES encryption uses the versioned
  `CipherApp-AES-GCM:v1:` format with a fresh random salt and IV; legacy
  ciphertexts using the original fixed salt remain decryptable.
- `numconv.html` — convert values between bases 2–36 and Base64 integer bytes,
  or use the separate Base64 Text tool for UTF-8 text.
- `numcalc.html` — evaluate expressions in one base and display the result in
  another.
- `hash-verify.html` — generate SHA-256, SHA-384, or SHA-512 hashes for text
  and files, verify an expected digest, or hash up to 100 text lines in a batch.

  Use the theme toggle on any page to switch between the default dark theme and
  the light theme. The preference is saved in browser storage.

  The Cipher Text and Number Converter workspaces support batch processing of up
to 100 non-empty lines per run. Each line is transformed independently, errors
are reported per line, and results can be copied or downloaded as JSON. Batch
data is kept in page memory and is not saved by CipherApp.

All tools run in the browser. Classical ciphers are intended for learning, not
for securing sensitive messages. AES passphrases are not stored; keep the full
versioned ciphertext together with the passphrase needed to decrypt it. This
learning tool is not a substitute for a reviewed secure messaging system.
