import * as fs from 'node:fs'
import {register} from 'node:module'
import * as path from 'node:path'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import {unified} from 'unified'

register('./buildLoader.ts', import.meta.url)

const build = (directoryName: string): void => {
	const srcPath = path.join('.', 'src', directoryName)
	const outPath = path.join('.', directoryName)

	fs.promises.readdir(srcPath, {withFileTypes: true}).then((items) => {
		items.forEach(async (item) => {
			// .mdx 以外は除外する
			if (item.isDirectory()) {
				return
			}
			const itemNameDotSplited = item.name.split('.')
			const extension = itemNameDotSplited.pop()
			if (extension !== 'mdx') {
				return
			}

			const {default: content, frontmatter} = await import(path.join(srcPath, item.name))
			const html = renderToStaticMarkup(createElement(content))

			const baseName = itemNameDotSplited.join('.')
			fs.promises.writeFile(
				path.join(outPath, `${baseName}.md`),
				`---\n${frontmatter}\n---\n\n${await htmlToMarkdown(html)}`,
			)
		})
	})
}

const htmlToMarkdown = async (html: string): Promise<string> => {
	const processor = unified()
		.use(rehypeParse)
		.use(rehypeRemark)
		.use(remarkGfm)
		.use(remarkStringify)
	return String(await processor.process(html))
}

build('articles')
