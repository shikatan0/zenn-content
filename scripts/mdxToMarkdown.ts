import {compile, run} from '@mdx-js/mdx'
import type {Parent} from 'mdast'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import runtime from 'react/jsx-runtime'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import {unified} from 'unified'

export const mdxToMarkdown = async (mdx: string): Promise<string> => {
	// YAML front matter の内容を保持する
	let frontmatter = ''
	const remarkFrontmatterStore = () => {
		return (tree: Parent) => {
			if (tree.type === 'root' && tree.children[0]?.type === 'yaml') {
				frontmatter = tree.children[0].value
			}
		}
	}
	const code = String(
		await compile(mdx, {
			outputFormat: 'function-body',
			remarkPlugins: [remarkGfm, remarkFrontmatter, remarkFrontmatterStore],
		}),
	)
	const {default: content} = await run(code, {
		...runtime as {Fragment: symbol},
		baseUrl: import.meta.resolve('./src/'),
	})
	// https://mdxjs.com/packages/node-loader/#use
	const html = renderToStaticMarkup(createElement(content as any))
	return `---\n${frontmatter}\n---\n\n${await htmlToMarkdown(html)}`
}

const htmlToMarkdown = async (html: string): Promise<string> => {
	const processor = unified()
		.use(rehypeParse)
		.use(rehypeRemark)
		.use(remarkGfm)
		.use(remarkStringify)
	return String(await processor.process(html))
}
