import $ from 'dax-sh'
import * as fs from 'node:fs'
import * as path from 'node:path'

const newArticle = async () => {
	const line = (await $`npx zenn new:article`.lines()).pop()
	if (line === undefined) {
		return
	}
	// https://zenn.dev/zenn/articles/what-is-slug
	const slug = (/[a-z0-9-_]{12,50}(?=\.md)/.exec(line) ?? [])[0]
	if (slug === undefined) {
		return
	}
	fs.promises.copyFile(
		path.join('.', 'articles', `${slug}.md`),
		path.join('.', 'src', 'articles', `${slug}.mdx`),
	)
}

newArticle()
