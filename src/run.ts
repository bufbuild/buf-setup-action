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

import * as child from 'child_process';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as io from '@actions/io';
import * as path from 'path';
import { getBuf } from './buf';
import { Error, isError } from './error';

// runnerTempEnvKey is the environment variable key
// used to access a temporary directory. Although
// undocumented in the Github Actions documentation,
// this can be found in the @actions/tools-cache module.
// https://github.com/actions/toolkit/blob/4bf916289e5e32bb7d1bd7f21842c3afeab3b25a/packages/tool-cache/src/tool-cache.ts#L701
const runnerTempEnvKey = 'RUNNER_TEMP'

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
    const version = core.getInput('version');
    if (version === '') {
        return {
            message: 'a version was not provided'
        };
    }

    core.info(`Setting up buf version "${version}"`);
    const installDir = await getBuf(version);
    if (isError(installDir)) {
        return installDir
    }

    core.info('Adding buf binary to PATH');
    core.addPath(path.join(installDir, 'bin'));
    const binaryPath = await io.which('buf', true);
    if (binaryPath === '') {
        return {
            message: 'buf was not found on PATH'
        };
    }

    core.info(`Successfully setup buf version ${version}`);
    core.info(child.execSync(`${binaryPath} --version`).toString());

    const bufToken = core.getInput('buf_token');
    if (bufToken !== '') {
        // If the BUF_TOKEN is set, add it to the runner's .netrc.
        const tempDir = process.env[runnerTempEnvKey] ?? '';
        if (tempDir === '') {
            return {
                message: `expected ${runnerTempEnvKey} to be defined`
            };
        }

        // TODO: For now, we hard-code the 'buf.build' remote. This will
        // need to be refactored once we support federation between other
        // BSR remotes.
        const netrcPath = path.join(tempDir, '.netrc');
        fs.writeFileSync(netrcPath, `machine buf.build\npassword ${bufToken}`, { flag: 'w' });
        process.env.NETRC = netrcPath;
    }
    return null;
}
