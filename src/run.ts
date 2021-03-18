// Copyright 2020-2021 Buf Technologies, Inc.
//
// All rights reserved.

import cp from 'child_process';
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
    core.info(cp.execSync(`${binaryPath} --version`).toString());

    return null;
}
