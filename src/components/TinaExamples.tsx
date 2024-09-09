import { useEffect, useMemo, useState, type FC } from 'react'
import hljs from 'highlight.js/lib/core'
import 'highlight.js/styles/atom-one-dark.min.css'

import javascript from 'highlight.js/lib/languages/javascript'
hljs.registerLanguage('javascript', javascript)

export type TinaExample = { route: string; sketch: string }

type Props = {
  examples: TinaExample[]
}

const TinaExamples: FC<Props> = ({ examples }) => {
  const [currentExample, setCurrentExample] = useState(0)
  const example = examples[currentExample]

  const sketch = useMemo(() => {
    return hljs.highlight(example.sketch, {
      language: 'javascript',
    }).value
  }, [example])

  if (!example) return null

  return (
    <>
      <ul>
        {examples.map((example, index) => (
          <li key={example.route}>
            <button
              onClick={() => setCurrentExample(index)}
              className={`underline ${
                index === currentExample ? 'text-primary' : ''
              }`}
            >
              {example.route}
            </button>
          </li>
        ))}
      </ul>

      <iframe src={`/${example.route}`} height="400" width="100%" />

      <h1>{example.route}</h1>

      <pre className="bg-[#282c34]">
        <code
          className="hljs language-javascript"
          dangerouslySetInnerHTML={{
            __html: sketch,
          }}
        ></code>
      </pre>
    </>
  )
}

export default TinaExamples
