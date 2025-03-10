import * as query from './query';
import transformations from './transformations';

export const intrinsicFunctionType = (value: any) => {
  if (!value || typeof value !== 'object' || Object.keys(value).length !== 1) {
    return null;
  }
  const [key] = Object.keys(value);
  if (key === 'Ref' || key.startsWith('Fn::')) {
    return key;
  }
  return null;
};

export const injectContext = (template: any, context: any) => {
  if (typeof template === 'string') {
    return contextReplace(template, context);
  }
};

const NATIVE_VALUE_CONTEXT_RE = /^%\{([^}]+)\}$/;
const CONTEXT_RE = /%\{([^}]+)\}/g;

const contextReplace = (string: string, context: any) => {
  const nativeMatch = string.match(NATIVE_VALUE_CONTEXT_RE);
  if (nativeMatch) {
    return transform(nativeMatch[1], context);
  } else {
    return string.replace(CONTEXT_RE, (_, spec) => transform(spec, context));
  }
};

const transform = (spec: string, context: any) => {
  const contextTransformations = spec.split('|');
  const key = contextTransformations.shift() as string;

  let queryPath = '$';

  for (const part of key.split('.')) {
    if (part.includes(':')) {
      queryPath += `["${part}"]`;
    } else {
      queryPath += `.${part}`;
    }
  }
  let value = query.value(queryPath, context, undefined, {});
  for (const transformation of contextTransformations) {
    let [_, transformationName, args] = (transformation.match(
      /^([^(]+)(?:\((.*)\))?$/,
    ) || []) as [string, string, any];
    args = args ? args.split(',').map((arg: any) => arg.trim()) : [];

    value = transformations[transformationName as keyof typeof transformations](
      value,
      context,
      args,
    );
    return value;
  }
};

export const DEFAULT_PARAMETERS = {};
