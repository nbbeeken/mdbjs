class BrowserURL extends URL {
  /**
   * Hacky way to get the host and port to be passed properly through the driver
   * @param urlString
   */
  constructor(urlString: string) {
      // //validate iLoveJS error
      if (urlString.startsWith('iLoveJS')) {
        const modifiedString = "http" + urlString.slice(7);
        super(modifiedString);
      } else {
        super(urlString);
      }
  }
}

export { BrowserURL as URL };