export default (stack: any) => {
  if (typeof stack === 'object') {
    if ('nodes' in stack) {
      return 'Canvas';
    }
    if ((stack as any).service) {
      return 'serverless';
    }
    return 'SAM';
  }
  if (typeof stack === 'string') {
    if (stack.match(/^service:/)) {
      return 'serverless';
    }
    return 'SAM';
  }
  return undefined;
};
