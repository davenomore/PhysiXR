import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugin a TTS mappa automatikus kiszolgálására (helyes MIME típus, bitek)
// és a build mappába másolására
function ttsStaticPlugin() {
  return {
    name: 'tts-static-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/TTS/')) return next();
        const rawName = decodeURIComponent(req.url.slice('/TTS/'.length).split('?')[0]);
        const ttsDir = path.resolve(__dirname, 'TTS');
        let targetPath = path.join(ttsDir, rawName);

        if (!fs.existsSync(targetPath)) {
          if (rawName.endsWith('.mp3')) {
            const noExt = rawName.slice(0, -4);
            if (fs.existsSync(path.join(ttsDir, noExt))) {
              targetPath = path.join(ttsDir, noExt);
            } else if (fs.existsSync(path.join(ttsDir, `${rawName}.mp3`))) {
              targetPath = path.join(ttsDir, `${rawName}.mp3`);
            }
          } else if (fs.existsSync(path.join(ttsDir, `${rawName}.mp3`))) {
            targetPath = path.join(ttsDir, `${rawName}.mp3`);
          } else if (fs.existsSync(path.join(ttsDir, `${rawName}.mp3.mp3`))) {
            targetPath = path.join(ttsDir, `${rawName}.mp3.mp3`);
          }
        }

        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
          const stat = fs.statSync(targetPath);
          const fileSize = stat.size;
          const range = req.headers.range;

          if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;
            const stream = fs.createReadStream(targetPath, { start, end });

            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunkSize,
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'public, max-age=3600'
            });
            return stream.pipe(res);
          } else {
            res.writeHead(200, {
              'Content-Length': fileSize,
              'Content-Type': 'audio/mpeg',
              'Accept-Ranges': 'bytes',
              'Cache-Control': 'public, max-age=3600'
            });
            return fs.createReadStream(targetPath).pipe(res);
          }
        }
        next();
      });
    },
    closeBundle() {
      const srcDir = path.resolve(__dirname, 'TTS');
      const distDir = path.resolve(__dirname, 'dist', 'TTS');
      if (fs.existsSync(srcDir)) {
        fs.mkdirSync(path.dirname(distDir), { recursive: true });
        fs.cpSync(srcDir, distDir, { recursive: true });
      }
    }
  };
}

// A WebXR csak HTTPS (vagy localhost) alatt működik. A basic-ssl önaláírt
// tanúsítványt ad, így a Quest böngészője a gép LAN-os címén is eléri.
export default defineConfig({
  plugins: [basicSsl(), ttsStaticPlugin()],
  server: { host: true, port: 5173 },
  build: { target: 'es2022' }
});
