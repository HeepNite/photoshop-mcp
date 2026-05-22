import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Logger } from '../utils/logger.js';
import { ScriptExecutor } from './script-executor.js';

const execAsync = promisify(exec);

export class MacOSExecutor implements ScriptExecutor {
  private logger: Logger;
  private scriptQueue: Array<() => Promise<unknown>> = [];
  private isProcessing = false;
  private appName: string = 'Adobe Photoshop 2025';

  constructor() {
    this.logger = new Logger('MacOSExecutor');
  }

  setAppName(appName: string): void {
    this.appName = appName;
    this.logger.debug(`App name set to: ${appName}`);
  }

  async execute(script: string, timeout: number = 30000): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Script execution timeout'));
      }, timeout);

      this.scriptQueue.push(async () => {
        try {
          const result = await this.executeScript(script);
          clearTimeout(timeoutId);
          resolve(result);
          return result;
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
          throw error;
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.scriptQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.scriptQueue.length > 0) {
      const task = this.scriptQueue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          this.logger.error('Script execution failed:', error);
        }
      }
    }

    this.isProcessing = false;
  }

  private async executeScript(script: string): Promise<unknown> {
    // For macOS, we'll use AppleScript to execute JavaScript in Photoshop.
    // The script is written to a temp .jsx file and evaluated by Photoshop
    // through `$.evalFile`. The return value of `$.evalFile` becomes the
    // value of `do javascript`, which AppleScript prints to stdout for us.
    const tempScriptPath = join(tmpdir(), `photoshop-script-${Date.now()}.jsx`);
    const tempAppleScriptPath = join(tmpdir(), `photoshop-applescript-${Date.now()}.scpt`);

    try {
      await writeFile(tempScriptPath, script, 'utf8');

      // Create AppleScript that tells Photoshop to execute the JSX
      const appleScript = this.createAppleScriptWrapper(tempScriptPath);
      await writeFile(tempAppleScriptPath, appleScript, 'utf8');

      try {
        // Execute AppleScript via osascript. Try once, and if the result
        // is the stale-reference "No such element" error, wait briefly
        // and retry — this is a known issue right after operations that
        // change document state (open, place, close).
        let stdout = '';
        let stderr = '';
        for (let attempt = 0; attempt < 2; attempt++) {
          const result = await execAsync(`osascript "${tempAppleScriptPath}"`);
          stdout = result.stdout;
          stderr = result.stderr;

          if (stderr) {
            this.logger.warn('Script execution warning:', stderr);
          }

          const trimmed = stdout.trim();
          if (
            attempt === 0 &&
            trimmed.startsWith('ERROR:') &&
            trimmed.indexOf('No such element') !== -1
          ) {
            this.logger.debug('Stale activeDocument detected, retrying after 150ms');
            await new Promise((r) => setTimeout(r, 150));
            continue;
          }
          break;
        }

        // Parse result
        return this.parseResult(stdout);
      } catch (error) {
        this.logger.error('AppleScript execution failed:', error);
        throw error;
      } finally {
        // Cleanup AppleScript file
        await unlink(tempAppleScriptPath).catch(() => {});
      }
    } finally {
      // Cleanup JSX file
      await unlink(tempScriptPath).catch(() => {});
    }
  }

  private createAppleScriptWrapper(jsxPath: string): string {
    // Use POSIX file path for AppleScript
    const posixPath = jsxPath.replace(/\\/g, '/');

    // The value of the `tell` block is the value of its last statement, so
    // `set theResult to do javascript ...` followed by `return theResult`
    // guarantees osascript prints the script's return value to stdout.
    // Without the explicit `return`, some macOS / Photoshop combinations
    // print an empty string for non-trivial return values.
    return `tell application "${this.appName}"
\tactivate
\tdelay 0.05
\tset theResult to do javascript "$.evalFile(decodeURI('${encodeURI(posixPath)}'))"
\treturn theResult
end tell`;
  }

  private parseResult(output: string): unknown {
    const trimmed = output.trim();

    if (trimmed.startsWith('ERROR:')) {
      throw new Error(trimmed.substring(6).trim());
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  async isPhotoshopRunning(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('pgrep -f "Adobe Photoshop"');
      return stdout.trim().length > 0;
    } catch (error) {
      // pgrep returns non-zero exit code if no process found
      return false;
    }
  }

  async launchPhotoshop(photoshopPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.info(`Launching Photoshop: ${photoshopPath}`);

      // Use 'open' command on macOS to launch the app
      const child = spawn('open', ['-a', photoshopPath], {
        detached: true,
        stdio: 'ignore',
      });

      child.unref();

      // Wait a bit for Photoshop to start
      setTimeout(() => {
        resolve();
      }, 5000);

      child.on('error', (error) => {
        reject(new Error(`Failed to launch Photoshop: ${error.message}`));
      });
    });
  }

  /**
   * Alternative method using 'do shell script' via AppleScript
   * This can be more reliable for some versions
   */
  async executeViaDoShellScript(script: string): Promise<unknown> {
    const tempScriptPath = join(tmpdir(), `photoshop-script-${Date.now()}.jsx`);
    const tempAppleScriptPath = join(tmpdir(), `photoshop-applescript-alt-${Date.now()}.scpt`);

    try {
      await writeFile(tempScriptPath, script, 'utf8');

      const appleScript = `tell application "${this.appName}"
\tdo shell script "cat '${tempScriptPath}'"
end tell`;

      await writeFile(tempAppleScriptPath, appleScript, 'utf8');
      const { stdout } = await execAsync(`osascript "${tempAppleScriptPath}"`);
      
      await unlink(tempAppleScriptPath).catch(() => {});
      return this.parseResult(stdout);
    } finally {
      await unlink(tempScriptPath).catch(() => {});
    }
  }
}
