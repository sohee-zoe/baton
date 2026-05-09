import { spawn } from 'child_process';

/**
 * Open a file path in the OS default browser.
 * Returns a Promise that resolves on success, rejects on spawn error.
 */
export function openInBrowser(absPath) {
  return new Promise((resolve, reject) => {
    const url = `file://${absPath}`;
    let cmd, args;

    switch (process.platform) {
      case 'darwin':
        cmd = 'open'; args = [absPath]; break;
      case 'win32':
        cmd = 'cmd'; args = ['/c', 'start', '', absPath]; break;
      default:
        cmd = 'xdg-open'; args = [absPath]; break;
    }

    const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
    child.on('error', reject);
    child.on('spawn', () => { child.unref(); resolve(url); });
  });
}
