import {createLoader} from '@mdx-js/node-loader'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import {remarkMdxFrontmatterRaw} from './remarkMdxFrontmatterRaw.ts'

export const {load} = createLoader({
	remarkPlugins: [
		remarkGfm,
		remarkFrontmatter,
		remarkMdxFrontmatterRaw,
	],
})
