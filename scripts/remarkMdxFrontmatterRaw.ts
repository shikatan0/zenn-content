import {valueToEstree} from 'estree-util-value-to-estree'
import type {Root} from 'mdast'
import type {Plugin} from 'unified'

/**
 * YAML front matter を named export する remark プラグイン
 */
export const remarkMdxFrontmatterRaw: Plugin<[], Root> = () => {
	return (tree) => {
		if (tree.children[0]?.type !== 'yaml') {
			return
		}
		tree.children.unshift({
			type: 'mdxjsEsm',
			value: '',
			data: {
				estree: {
					type: 'Program',
					sourceType: 'module',
					body: [
						{
							type: 'ExportNamedDeclaration',
							specifiers: [],
							declaration: {
								type: 'VariableDeclaration',
								kind: 'const',
								declarations: [
									{
										type: 'VariableDeclarator',
										id: {type: 'Identifier', name: 'frontmatter'},
										init: valueToEstree(tree.children[0].value),
									},
								],
							},
						},
					],
				},
			},
		})
	}
}
