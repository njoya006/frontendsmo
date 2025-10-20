If you are experiencing CDN failures loading the Daily embed library, you can host a local copy as a fallback.

1. Download the production build of the Daily iframe library (daily-iframe.min.js) from one of the official CDNs, for example:
   - https://unpkg.com/@daily-co/daily-js/dist/daily-iframe.min.js
   - https://cdn.jsdelivr.net/npm/@daily-co/daily-js/dist/daily-iframe.min.js

2. Create the directory `Frontend/assets/vendor/` and place the file there as `daily-iframe.min.js`.

3. Confirm that the file is served at `/assets/vendor/daily-iframe.min.js` when running your static server. If you're opening `index.html` directly from the filesystem, use a simple local server such as Python's http.server:

   ```powershell
   # From the Frontend folder
   python -m http.server 8000;
   # Then open http://localhost:8000/index.html
   ```

4. The live sessions loader (`live-sessions.js`) will attempt to load `/assets/vendor/daily-iframe.min.js` before falling back to public CDNs.

Note: Keep this copy updated if Daily releases breaking changes. The local copy is intended as a short-term fallback for network/CDN issues.