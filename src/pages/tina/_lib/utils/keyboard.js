function keyboardListener(actions) {
  const codes = {}
  const keys = Object.keys(actions)
  window.addEventListener('keydown', (event) => {
    event.preventDefault()
    codes[event.code] = true
  })
  window.addEventListener('keyup', (event) => {
    event.preventDefault()
    codes[event.code] = false
  })
  setInterval(() => {
    keys.forEach((key) => {
      if (codes[key]) actions[key]()
    })
  }, 1000 / 60)
}
