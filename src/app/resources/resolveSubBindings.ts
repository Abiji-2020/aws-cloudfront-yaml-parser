import * as query from './query';
import transformations from './transformations';

export default (template: any, object: any, binding: any, context = {}) => {
  let finalBinding = binding;
  let contexts = [context];

  if (typeof finalBinding === 'string') {
    finalBinding = { Path: finalBinding };
  } else if (Array.isArray(binding.Path)) {
    const subBindings = binding.Path.slice(0, -1);
    finalBinding = {
      Path: binding.Path[binding.Path.length - 1],
      Transformations: binding.Transformations,
    };

    contexts = subBindingsResolver(template, object, subBindings, contexts);
  }

  return { finalBinding, contexts };
};

const subBindingsResolver = (
  template: any,
  object: any,
  subBindings: any,
  contexts: any,
) => {
  for (const subBinding of subBindings) {
    let path;
    if (typeof subBinding === 'string') {
      path = subBinding;
    } else if ('Path' in subBinding) {
      path = subBinding.Path;
    } else {
      throw new Error(
        'Invalid sub-binding format: must be either a string or have a Path specification',
      );
    }

    contexts = contexts.reduce((newContexts: any, context: any) => {
      const nodes = query.nodes(path, template, object, context);

      for (const node of nodes) {
        let key;
        if (subBinding.KeyTransformations) {
          key = node.path;
          for (const transformation of subBinding.KeyTransformations) {
            if (!(transformation in transformations)) {
              throw new Error(`Invalid key transformation '${transformation}'`);
            }

            key = (transformations as any)[transformation](key, context);
          }
        } else {
          key = node.path[node.path.length - 1];
        }
        let value = node.value;

        const bindingTransformations = subBinding.Transformations || [];

        for (const transformation of bindingTransformations) {
          if (!(transformation in transformations)) {
            throw new Error(`Invalid transformation '${transformation}'`);
          }

          value = (transformations as any)[transformation](value);
        }

        newContexts.push({
          ...context,
          key,
          value,
          keys: [...(context.keys || []), key],
          values: [...(context.values || []), value],
        });
      }

      return newContexts;
    }, []);
  }

  return contexts;
};
