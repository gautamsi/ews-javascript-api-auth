# ews-javascript-api-auth

A helper library to support NTLM and Cookies authentication with [ews-javascript-api](https://github.com/gautamsi/ews-javascript-api)

## Install

`npm install ews-javascript-api-auth --save`

# How to
## NTLM Authentication or Windows Integrated Authentication with Exchange Web Service

Typescript code:
```ts
import { ConfigurationApi } from "ews-javascript-api"; // add other imported objects based on your need
import { ntlmAuthXhrApi } from "ews-javascript-api-auth"
ConfigurationApi.ConfigureXHR(new ntlmAuthXhrApi(credentials.userName, credentials.password));
// ----------other code------------
```

JavaScript code:
```js
var ews = require("ews-javascript-api");
var ewsAuth = require("ews-javascript-api-auth");
ews.ConfigurationApi.ConfigureXHR(new ewsAuth.ntlmAuthXhrApi(credentials.userName, credentials.password));
// ------------rest of code----------------
```

## Cookies Auth using TMG/ISA

Typescript code:
```ts
import { ConfigurationApi } from "ews-javascript-api"; // add other imported objects based on your need
import { cookieAuthXhrApi } from "ews-javascript-api-auth"
ConfigurationApi.ConfigureXHR(new cookieAuthXhrApi(credentials.userName, credentials.password));
// ----------other code------------
```

JavaScript code:
```js
var ews = require("ews-javascript-api");
var ewsAuth = require("ews-javascript-api-auth");
ews.ConfigurationApi.ConfigureXHR(new ewsAuth.cookieAuthXhrApi(credentials.userName, credentials.password));
// ------------rest of code----------------
```

### requirememnts
require `ews-javascript-api` version `0.9`


## License
MIT

