# `buf-setup-action`

This [Action] installs the [`buf`][buf-cli] CLI in your GitHub Actions pipelines so that it can be
used by other Buf Actions:

* [`buf-breaking-action`][buf-breaking]
* [`buf-lint-action`][buf-lint]
* [`buf-push-action`][buf-push]

After `buf-setup-action` is run, the `buf` command is available to other Actions in the pipeline's
`PATH`. You can also use the `buf` command directly inside of workflow steps.

## Usage

Here's an example usage of `buf-setup-action`:

```yaml
steps:
  # Run `git checkout`
  - uses: actions/checkout@v2
  # Install the `buf` CLI
  - uses: bufbuild/buf-setup-action@v1.13.0
  # Ensure that `buf` is installed
  - run: buf --version
```

## Configuration

### Input

You can configure `buf-setup-action` with these parameters:

| Parameter      | Description                                        | Default            |
|:---------------|:---------------------------------------------------|:-------------------|
| `version`      | The version of the [`buf` CLI][buf-cli] to install | [`v1.13.0`][version] |
| `github_token` | The GitHub token to use when making API requests   |                    |
| `buf_user`     | The username to use for logging into Buf Schema registry.                                               |                    |
| `buf_api_token` | The API token to use for logging into Buf Schema registry.                                                                                                            |                    |

> These parameters are derived from [`action.yml`](./action.yml). <br>
#### Version

If `version` is unspecified, the latest version of `buf` is installed:

```yaml
steps:
  - uses: actions/checkout@v2
  # Installs latest
  - uses: bufbuild/buf-setup-action@v1.13.0
  - run: buf --version
```

Use the `version` parameter to pin to a specific version:

```yaml
steps:
  - uses: actions/checkout@v2
  # Installs version 1.13.0
  - uses: bufbuild/buf-setup-action@v1.13.0
    with:
      version: 1.13.0
  # Should output 1.13.0
  - run: buf --version
```

To resolve the latest release from GitHub, you can specify `latest`, but this is **not**
recommended:

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: bufbuild/buf-setup-action@v1.13.0
    with:
      version: latest
  - run: buf --version
```

#### GitHub token

Optionally, you can supply a `github_token` input so that any GitHub API requests are authenticated.
This may prevent rate limit issues when running on GitHub hosted runners:

```yaml
steps:
  - uses: bufbuild/buf-setup-action@v1.13.0
    with:
      github_token: ${{ github.token }}
```

#### Buf username and Buf API token

If you are using Private [Remote Packages](https://docs.buf.build/bsr/remote-packages/overview) you may need to authenticate the entire system to successfully communicate with the [Buf Schema Registry][bsr]. To achieve this, supply both `buf_user` and `buf_api_token`. This will add your auth credentials to the `.netrc` and allow you to access the BSR from anything in your `PATH`. 

```yaml
steps:
  - uses: bufbuild/buf-setup-action@v1.13.0
    with:
      buf_user: ${{ secrets.buf_user }}
      buf_api_token: ${{ secrets.buf_api_token }}
```

### Other Configurations

#### Buf token

When calling the `buf` command directly from a workflow step, you may need to authenticate with the
BSR. You can authenticate by setting the [`BUF_TOKEN`][buf-token]
environment variable. If you have a GitHub secret called `BUF_TOKEN`, for example, you can set the
`BUF_TOKEN`  environment variable like this:

```yaml
env:
  BUF_TOKEN: ${{ secrets.BUF_TOKEN }}
```

Note that this only authenticate you with the `buf` cli. You cannot access your private remote 
packages in BSR. If you need to access your private remote packages, supply the username and Buf
API Token [as parameters](#buf-username-and-buf-api-token). 

#### Installing `protoc`

In most cases, you _don't_ need to install [`protoc`][protoc] for Buf's GitHub Actions, but some
`protoc` plugins are built into the compiler itself. If you need to execute one of these plugins,
you do need to install `protoc` alongside `buf`:

* `protoc-gen-cpp` (C++)
* `protoc-gen-csharp` (C#)
* `protoc-gen-java` (Java)
* `protoc-gen-js` (JavaScript)
* `protoc-gen-objc` (Objective-C)
* `protoc-gen-php` (PHP)
* `protoc-gen-python` (Python)
* `protoc-gen-ruby` (Ruby)
* `protoc-gen-kotlin` (Kotlin)

In these cases, `buf` executes `protoc` as a plugin but continues to use its own [internal
compiler][compiler].

The `buf-setup-action` doesn't install `protoc` for you, but there are other options you can
use, such as [`setup-protoc`][setup-protoc]. To configure it alongside `buf`:

```yaml
steps:
  # Run `git checkout`
  - uses: actions/checkout@v2
  # Install the `buf` CLI
  - uses: bufbuild/buf-setup-action@v1.13.0
  # Install `protoc`
  - uses: arduino/setup-protoc@v1
```

[action]: https://docs.github.com/actions
[breaking]: https://docs.buf.build/breaking
[bsr]: https://docs.buf.build/bsr
[buf-breaking]: https://github.com/marketplace/actions/buf-breaking
[buf-cli]: https://github.com/bufbuild/buf
[buf-lint]: https://github.com/marketplace/actions/buf-lint
[buf-push]: https://github.com/marketplace/actions/buf-push
[buf-token]: https://docs.buf.build/bsr/authentication#buf_token
[compiler]: https://docs.buf.build/build/internal-compiler
[protoc]: https://github.com/protocolbuffers/protobuf#protocol-compiler-installation
[setup-protoc]: https://github.com/marketplace/actions/setup-protoc
[version]: https://github.com/bufbuild/buf/releases/tag/v1.13.0
