# buf-setup-action

Install and setup [buf](https://github.com/bufbuild/buf) for use in other actions.

## Usage

Refer to the [action.yml](https://github.com/bufbuild/buf-setup-action/blob/main/action.yml)
to see all of the action parameters.

If `version` is unspecified, the default value is set to the latest `buf` version:

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: bufbuild/buf-setup-action@v0.6.0
  - run: buf --version
```

If you want to pin to a specific version, vou can explicitly set it like so:

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: bufbuild/buf-setup-action@v0.6.0
    with:
      version: '1.0.0-rc1'
  - run: buf --version
```

If you'd like to resolve the latest release from GitHub, you can specify `latest`,
but this is **not** recommended:

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: bufbuild/buf-setup-action@v0.6.0
    with:
      version: 'latest'
  - run: buf --version
```

Optionally, you can supply a `github_token` input so that any GitHub API
requests are authenticated, avoiding any potential rate limit issues when
running on GitHub hosted runners:

```yaml
steps:
  - uses: bufbuild/buf-setup-action@v0.6.0
    with:
      github_token: ${{ github.token }}
      version: 'latest'
```

The `buf-setup` action is commonly used by the other `buf` actions,
such as [buf-breaking][1], [buf-lint][2], and [buf-push][3].

  [1]: https://github.com/marketplace/actions/buf-breaking
  [2]: https://github.com/marketplace/actions/buf-lint
  [3]: https://github.com/marketplace/actions/buf-push

## Installing `protoc`

In most cases, you _don't_ need to install [`protoc`][4] for Buf's GitHub Actions, but
some `protoc` plugins are built-in to the compiler itself. If you need to execute any of
`protoc-gen-{cpp,csharp,java,js,objc,php,python,ruby,kotlin}`, then you'll need to install
`protoc` alongside `buf`. In these cases, `buf` actually executes `protoc` as a plugin,
but continues to use its own [internal compiler][5].

The `buf-setup-action` won't install `protoc` for you, but there are other options you can
use, such as [setup-protoc][6]. For clarity, you can configure it alongside `buf` like so:

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: bufbuild/buf-setup-action@v0.6.0
  - uses: arduino/setup-protoc@v1
```

  [4]: https://github.com/protocolbuffers/protobuf#protocol-compiler-installation
  [5]: https://docs.buf.build/build/internal-compiler
  [6]: https://github.com/marketplace/actions/setup-protoc
