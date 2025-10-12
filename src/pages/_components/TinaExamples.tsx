import { useMemo, useState, type FC } from 'react'
import hljs from 'highlight.js/lib/core'
import 'highlight.js/styles/atom-one-dark.min.css'

import javascript from 'highlight.js/lib/languages/javascript'
hljs.registerLanguage('javascript', javascript)

const parseSketch = (
  code: string
) => `const lib = document.createElement("script");
lib.src = "https://moloxe.github.io/tina/lib.js";
document.head.appendChild(lib);

${code}`

export type TinaExample = { route: string; sketch: string }

type Props = {
  examples: TinaExample[]
}

const TinaExamples: FC<Props> = ({ examples }) => {
  const [currentExample, setCurrentExample] = useState(
    Math.max(
      0,
      examples.findIndex(({ route }) => route === 'rm-periodic-surface')
    )
  )
  const example = examples[currentExample]
  const code = parseSketch(example.sketch)

  const sketch = useMemo(() => {
    return hljs.highlight(code, {
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
                    href={`/${example.route}`}
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

      <iframe src={`/${example.route}`} height="400" width="100%" />

      <h1>{example.route}</h1>

      <p>
        Copy and paste it in:{' '}
        <a
          href="https://editor.p5js.org/"
          target="_blank"
          className="text-primary"
        >
          editor.p5js.org
        </a>
      </p>

      <pre className="bg-[#282c34] relative">
        <button
          className="top-2 right-2 px-2 rounded absolute text-sm border"
          onClick={(ev) => {
            const button = ev.target as HTMLButtonElement
            button.innerText = 'Copied!'
            navigator.clipboard.writeText(code)
            setTimeout(() => {
              button.innerText = 'Copy'
            }, 2000)
          }}
        >
          Copy
        </button>
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
