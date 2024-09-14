import { useMemo, useState, type FC } from 'react'
import hljs from 'highlight.js/lib/core'
import 'highlight.js/styles/atom-one-dark.min.css'

import javascript from 'highlight.js/lib/languages/javascript'
hljs.registerLanguage('javascript', javascript)

export type TinaExample = { route: string; sketch: string }

type Props = {
  examples: TinaExample[]
}

const TinaExamples: FC<Props> = ({ examples }) => {
  const [currentExample, setCurrentExample] = useState(3)
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
        {examples.map((example, index) => {
          const isCurrent = index === currentExample
          return (
            <li key={example.route}>
              {isCurrent ? (
                <>
                  <a
                    href={`/tina/${example.route}`}
                    target="_blank"
                    className="underline text-primary"
                  >
                    {example.route}
                  </a>
                  {' — Click again to open in new tab'}
                </>
              ) : (
                <button
                  onClick={() => setCurrentExample(index)}
                  className="underline"
                >
                  {example.route}
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <iframe src={`/tina/${example.route}`} height="400" width="100%" />

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
