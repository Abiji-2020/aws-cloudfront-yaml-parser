import * as query from './query';
import transformations from './transformations';
import resolveSubBindings from './resolveSubBindings';

export default (binding: any, template: any, object: any, context: any) => {
  const { finalBinding, contexts } = resolveSubBindings(
    template,
    object,
    binding,
    context,
  );

  let value;
  if (typeof finalBinding === 'string') {
    value = query.value(finalBinding, template, object, contexts[0]);
  } else if ('Path' in finalBinding) {
    value = query.value(finalBinding.Path, template, object, contexts[0]);
  } else {
    throw new Error(
      'Binding must be either a string or have a Path specification',
    );
  }

  const settingTransformations = finalBinding.Transformations || [];

  for (const transformation of settingTransformations) {
    if (!(transformation in transformations)) {
      throw new Error(`Invalid transformation '${transformation}'`);
    }

    value = (transformations as any)[transformation](value, context);
  }

  return value;
};
