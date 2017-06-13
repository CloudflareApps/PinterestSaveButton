(function () {
  'use strict'

  if (!window.addEventListener) return // Check for IE9+

  let options = INSTALL_OPTIONS
  const APP_ATTRIBUTE = 'data-cf-pin'
  const IS_PREVIEW = INSTALL_ID === 'preview'
  let observer

  let url
  if (IS_PREVIEW) {
    const {host, path, scheme} = INSTALL.proxy.originalURL.parsed

    url = `${scheme}://${host}${path}`
  } else {
    url = window.location
  }

  function revertImages () {
    const images = Array.prototype.slice.call(document.querySelectorAll(`[${APP_ATTRIBUTE}="parsed"`))

    images.forEach(image => {
      const originalParent = image.parentElement.parentElement

      originalParent.replaceChild(image, image.parentElement)
      image.removeAttribute(APP_ATTRIBUTE)
    })
  }

  function insertLink (image) {
    let wrapper = document.createElement('a')

    wrapper.href = 'https://www.pinterest.com/pin/create/button/'
    // wrapper.setAttribute('data-pin-do', 'buttonBookmark')
    wrapper.setAttribute('data-pin-do', 'buttonPin')
    wrapper.setAttribute('data-pin-url', url)

    if (options.appearOnHover) {
      wrapper.setAttribute('data-pin-hover', '')
    }

    switch (options.style) {
      case 'round':
        wrapper.setAttribute('data-pin-shape', 'round')
        break
      case 'tall':
        wrapper.setAttribute('data-pin-tall', 'true')
        break
    }

    if (options.countPosition !== 'none') {
      wrapper.setAttribute('data-pin-count', options.countPosition)
    }

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

    wrapper.setAttribute('data-pin-description', description)

    console.log(wrapper)
    // if (!wrapper.contains(image)) {
    image.parentElement.replaceChild(wrapper, image)
    wrapper.appendChild(image)
    // }

    image.setAttribute(APP_ATTRIBUTE, 'parsed')
  }

  function parseImages () {
    const container = document.querySelector(options.advanced.region)
    if (!container) return

    const images = Array.prototype.slice.call(container.querySelectorAll('img'))

    images
      .filter(image => {
        if (image.parentElement.tagName === 'A') return false
        if (image.getAttribute(APP_ATTRIBUTE) === 'parsed') return false
        if (image.getAttribute('role') === 'presentation') return false
        if (image.width <= options.advanced.minWidth) return false
        if (image.height <= options.advanced.minHeight) return false
        return true
      })
      .filter(insertLink)
  }

  function initalize () {
    // revertImages()

    if (observer) observer.disconnect()

    // Images loaded via HTML.
    parseImages()

    // Images laoded via JavaScript.
    observer = new window.MutationObserver(parseImages)
  }

  function bootstrap () {
    const pinterestVendorScript = document.createElement('script')
    pinterestVendorScript.src = 'https://assets.pinterest.com/js/pinit.js'
    pinterestVendorScript.addEventListener('load', initalize)
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

      initalize()
    }
  }
}())
