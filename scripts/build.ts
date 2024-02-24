import * as fs from 'node:fs'
import * as path from 'node:path'
import {mdxToMarkdown} from './mdxToMarkdown.ts'

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

			const baseName = itemNameDotSplited.join('.')
			fs.promises.writeFile(
				path.join(outPath, `${baseName}.md`),
				await mdxToMarkdown(
					await fs.promises.readFile(path.join(srcPath, item.name), {encoding: 'utf-8'}),
				),
			)
		})
	})
}

build('articles')
