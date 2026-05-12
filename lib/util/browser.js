import { spawn } from 'child_process';
import { pathToFileURL } from 'url';

/**
 * Open a file path in the OS default browser.
 * Returns a Promise that resolves on success, rejects on spawn error.
 */
export function openInBrowser(absPath) {
  return new Promise((resolve, reject) => {
    const url = pathToFileURL(absPath).href;
    let cmd, args;

    switch (process.platform) {
      case 'darwin':
        cmd = 'open'; args = [absPath]; break;
      case 'win32':
        cmd = 'cmd'; args = ['/c', 'start', '', absPath]; break;
      default:
        cmd = 'xdg-open'; args = [absPath]; break;
    }

    const child = spawn(cmd, args, { stdio: 'ignore' });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) {
        resolve(url);
      } else {
        reject(new Error(`${cmd} exited with code ${code}`));
      }
    });
  });
}
