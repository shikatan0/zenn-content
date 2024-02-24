import 'tsx'
// https://mdxjs.com/packages/node-loader/#use
import {register} from 'node:module'
register('@mdx-js/node-loader', import.meta.url)
