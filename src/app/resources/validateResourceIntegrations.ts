/* This used to validate that required integrations (e.g. CDN to ObjectStore)
 * existed, but we don't have required integrations anymore. It's still called
 * and can be extended to validate more template data, so it's left here as a
 * stub. */
export default function (resourceId: any ) {
    let errors: any  = [];
  
    if (errors.length > 0) {
      throw errors;
    }
  }
  