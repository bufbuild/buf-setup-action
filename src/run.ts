// Copyright 2020-2021 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import cp from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as core from '@actions/core';
import * as io from '@actions/io';
import { getBuf } from './buf';
import { Error, isError } from './error';

export async function run(): Promise<void> {
    try {
        const result = await runSetup()
        if (result !== null && isError(result)) {
            core.setFailed(result.message);
        }
    } catch (error) {
        // In case we ever fail to catch an error
        // in the call chain, we catch the error
        // and mark the build as a failure. The
        // user is otherwise prone to false positives.
        if (isError(error)) {
            core.setFailed(error.message);
            return;
        }
        core.setFailed('Internal error');
    }
}

// runSetup runs the buf-setup action, and returns
// a non-empty error if it fails.
async function runSetup(): Promise<null|Error> {
    let version = core.getInput('version');
    if (version === '') {
        // If version is not provided, default to 'latest'.
        version = 'latest'
    }

    core.info(`Setting up buf version "${version}"`);
    const installDir = await getBuf(version);
    if (isError(installDir)) {
        return installDir
    }

    core.info('Adding buf binary to PATH');
    let binaryPath = '';
    if (os.platform() === 'win32') {
      core.addPath(installDir);
      binaryPath = await io.which('buf.exe', true);
    } else {
      core.addPath(path.join(installDir, 'bin'));
      binaryPath = await io.which('buf', true);
    }
    if (binaryPath === '') {
        return {
            message: 'buf was not found on PATH'
        };
    }

    core.info(`Successfully setup buf version ${version}`);
    core.info(cp.execSync(`${binaryPath} --version`).toString());

    return null;
}
