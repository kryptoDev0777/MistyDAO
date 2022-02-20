/**
 * Access `process.env` in an environment helper
 * Usage: `EnvHelper.env`
 * - Other static methods can be added as needed per
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static
 */
export class EnvHelper {
  /**
   * @returns `process.env`
   */
  static env = process.env;
  static whitespaceRegex = /\s+/;

  /**
   * Returns env contingent segment api key
   * @returns segment
   */
  static getSegmentKey() {
    return EnvHelper.env.REACT_APP_SEGMENT_API_KEY;
  }

  static getGeoapifyAPIKey() {
    var apiKey = EnvHelper.env.REACT_APP_GEOAPIFY_API_KEY;
    if (!apiKey) {
      console.warn("Missing REACT_APP_GEOAPIFY_API_KEY environment variable");
      return null;
    }

    return apiKey;
  }
}
