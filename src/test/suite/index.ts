import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'bdd',
        color: true,
        timeout: 10000, // 10 second timeout for tests
        reporter: 'spec', // Use spec reporter for detailed output
        slow: 1000 // Mark tests as slow if they take more than 1s
    });

    const testsRoot = path.resolve(__dirname, '.');

    try {
        // Find all test files
        const files = await glob('**/**.test.js', { cwd: testsRoot });

        // Add files to the test suite
        files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

        // Run the mocha test
        return new Promise<void>((resolve, reject) => {
            mocha.run(failures => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        });
    } catch (err) {
        console.error('Error loading test files:', err);
        throw err;
    }
}
