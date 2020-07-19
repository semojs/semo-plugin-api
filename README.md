# semo-plugin-api

A `Semo` plugin to provide ability to do restful api request, like `curl`, based on `axios`.

## Installation

```
npm i -g @semo/cli semo-plugin-api

semo api help
```

## Usage

Like `curl`, you can set request to a URL in any valid verb, case in insensitive.

```
semo api --method GET|POST|PUT|PATCH|OPTIONS|HEAD|DELETE URL
```

You can use socks proxy to send reqeust

```
semo api URL --socks-proxy=socks://127.0.0.1:1080
```

If your proxy is just same as socks://127.0.0.1:1080, then you can omit last part

```
semo api URL --socks-proxy
semo api URL --ss
```

Json response can be colorful and formated

```
semo api URL --color
```

All request data can be provided from json or js file, if config provided by js file, it support function or promise.



```js
// semo api URL --file api.js
module.export = async () => {
  return {
    url: '',
    method: 'get',
    headers: {}
  }
}

```

When request using `POST`, we need to send request boy, the style is

```
semo api -X=POST URL --data.foo=bar
semo api -X POST URL --data.foo bar
```

