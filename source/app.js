(function () {
  'use strict'

  if (!window.addEventListener) return // Check for IE9+

  const APP_ATTRIBUTE = 'data-cf-pin'
  const VENDOR_METHOD = 'cfPinBuild'
  const IS_PREVIEW = INSTALL_ID === 'preview'
  let options = INSTALL_OPTIONS
  let buttonContainer
  let observer
  let url

  if (IS_PREVIEW) {
    const {host, path, scheme} = INSTALL.proxy.originalURL.parsed

    url = `${scheme}://${host}${path}`
  } else {
    url = window.location
  }

  function insertButton () {
    buttonContainer = INSTALL.createElement(options.location, buttonContainer)
    buttonContainer.setAttribute('app', 'pinterest-save-button')

    if (!buttonContainer.parentElement) return

    const button = document.createElement('a')

    button.innerHTML = `
      <img src="https://assets.pinterest.com/images/pidgets/pinit_fg_en_rect_gray_20.png" />
    `

    button.href = 'https://www.pinterest.com/pin/create/button/'
    button.setAttribute('data-pin-do', 'buttonBookmark')
    button.setAttribute('data-pin-url', url)

    switch (options.shape) {
      case 'round':
        button.setAttribute('data-pin-shape', 'round')
        break
      case 'tall':
        button.setAttribute('data-pin-tall', 'true')
        break
    }

    if (options.shape !== 'round' && options.countPosition !== 'none') {
      button.setAttribute('data-pin-count', options.countPosition)
    }

    buttonContainer.appendChild(button)

    // The initial button insertion occurs before the vendor method is ready.
    if (window[VENDOR_METHOD]) {
      window[VENDOR_METHOD].call()
    }
  }

  function prepImage (image) {
    let description = document.title

    if (image.parentElement.nodeName === 'FIGURE') {
      const figcaption = image.parentElement.querySelector('figcaption')

      if (figcaption) description = figcaption.textContent
    } else if (image.alt) {
      description = image.alt
    } else {
      const meta = document.head.querySelector('meta[name="description"]') ||
        document.head.querySelector('meta[name="og:description"]')

      if (meta && meta.content) description = meta.content
    }

    image.setAttribute('data-pin-description', description)
    image.setAttribute(APP_ATTRIBUTE, 'parsed')
  }

  function parseImages () {
    const images = Array.prototype.slice.call(document.body.querySelectorAll('img'))

    images
      .filter(image => {
        if (image.getAttribute(APP_ATTRIBUTE) === 'parsed') return false
        if (image.getAttribute('role') === 'presentation') return false
        if (image.width <= 100) return false
        if (image.height <= 100) return false
        return true
      })
      .forEach(prepImage)
  }

  function updateElements () {
    if (buttonContainer && buttonContainer.parentElement) {
      buttonContainer.parentElement.removeChild(buttonContainer)
    }

    if (observer) {
      observer.disconnect()
    }

    if (options.type === 'once') {
      insertButton()
      return
    }

    // Images loaded via HTML.
    parseImages()

    // Images laoded via JavaScript.
    observer = new window.MutationObserver(parseImages)
  }

  function bootstrap () {
    const pinterestVendorScript = document.createElement('script')
    pinterestVendorScript.src = 'https://assets.pinterest.com/js/pinit.js'
    pinterestVendorScript.setAttribute('data-pin-build', VENDOR_METHOD)

    if (options.type === 'hover') {
      pinterestVendorScript.setAttribute('data-pin-hover', 'true')
    }

    pinterestVendorScript.addEventListener('load', updateElements)
    pinterestVendorScript.addEventListener('error', () => {
      console.warn('Could not load Pinterest vendor script')
    })

    document.head.appendChild(pinterestVendorScript)
  }

  // This code ensures that the app doesn't run before the page is loaded.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap)
  } else {
    bootstrap()
  }

  // INSTALL_SCOPE is an object that is used to handle option changes without refreshing the page.
  window.INSTALL_SCOPE = {
    setOptions (nextOptions) {
      options = nextOptions

      updateElements()
    }
  }
}())
