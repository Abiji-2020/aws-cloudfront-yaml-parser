import resolveBinding from './resolveBinding';
import cloneDeep from 'clone-deep';

export default (
  resourceDescription: any,
  settingName: any,
  settingSchema: any,
  template: any,
  object: any,
  context: any,
) => {
  try {
    return cloneDeep(resolveBinding(settingSchema, template, object, context));
  } catch (err: any) {
    err.message = `Invalid binding format for ${resourceDescription} setting ${settingName}: ${err.message}`;

    throw err;
  }
};
