# buf-setup-action

Install and setup [buf](https://github.com/bufbuild/buf) for use in other actions.

## Usage

Refer to the [action.yml](https://github.com/bufbuild/buf-setup-action/blob/master/action.yml)
to see all of the action parameters.

If `version` is unspecified, it will be defaulted to `latest`.

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: bufbuild/buf-setup-action@v0.3.1
  - run: buf --version
```

The `buf-setup` action is commonly used by the other `buf` actions,
such as [buf-breaking][1], [buf-lint][2], and [buf-push][3].

  [1]: https://github.com/marketplace/actions/buf-breaking
  [2]: https://github.com/marketplace/actions/buf-lint
  [3]: https://github.com/marketplace/actions/buf-push
