class ProductGallery extends HTMLElement {
  constructor () {
    super()

    // Set active thumbnail when changing slide
    this.addEventListener('change', (event) => {
      this.setActiveThumbnail()
    })
    this.addEventListener('focusin', (event) => {
      console.log(event)
      this.setFocusedThumbnail()
    })
    this.addEventListener('focusout', (event) => {
      console.log(event)
      this.setFocusedThumbnail()
    })

    // Set initial active thumbnail
    this.setActiveThumbnail()
    this.setFocusedThumbnail()
  }

  // Toggle active and inactive thumbnail styling based on current slide
  setActiveThumbnail () {
    // Remove active styling from thumbnails
    this.querySelectorAll('label[for^="selected-media"]').forEach((el) => {
      el.parentElement.setAttribute('data-active', 'false')
    })

    // Apply active styling to selected thumbnail
    const checkedInput = this.querySelector('input[name="selected-media"]:checked')
    this.querySelector(`label[for="${checkedInput.id}"]`).parentElement.setAttribute('data-active', 'true')
  }

  // Toggle focused thumbnail styling based on current active element
  setFocusedThumbnail () {
    // Remove focus styling from thumbnails
    this.querySelectorAll('label[for^="selected-media"]').forEach((el) => {
      el.parentElement.setAttribute('data-focus', 'false')
    })

    if (document.activeElement.matches('input[name="selected-media"]')) {
      this.querySelector(`label[for="${document.activeElement.id}"]`).parentElement.setAttribute('data-focus', 'true')
    }
  }
}

customElements.define('product-gallery', ProductGallery)
