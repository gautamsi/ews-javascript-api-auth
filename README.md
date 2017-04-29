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
> 1.2.0 adds support for NTLMv2. 
> 1.2.0 removes `httpntlm` package and usage `ntlm-client` due to lack of NTLMv2 support in `httpntlm`
> 
> as of version 1.1.0 you can pass `true` as third parameter to the constructer to bypass certificate errors, Note: To be used only for testing and debugging, not suitable for production environment. 
>
>This should only be needed for ntlm authentication, other scenarios should be fine with use of `process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";` in the calling library.


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

### 1.1.1 changes
* fixed header check to be case insensitive
* moved header helper method creation to util.js