import { dirname } from 'path';
import cloneDeep from 'clone-deep';
import { intrinsicFunctionType, DEFAULT_PARAMETERS } from './manageCFResources';

const INVALID_TAG_CHARACTERS_RE = /[^\sa-zA-Z0-9+=._:/-]/g;
const WHITESPACE_RE = /\s+/g;
const LOG_GROUP_RE = /[^a-zA-Z0-9_-]/g;

const transformations = {
  Uppercase: (value: string) => value.toUpperCase(),
  Lowercase: (value: string) => value.toLowerCase(),
  UppercaseFirstLetter: (value: any) => value[0].toUpperCase() + value.slice(1),
  MaxLength: (value: any, length: any, args: any) => {
    const maxLength = Number(args[0]);
    return value.slice(0, maxLength);
  },
  LogicalId: (value: any) => value.replace(/[^A-Za-z0-9]/g, ''),
  LogicalIdFromReferecne: (ref: any) =>
    ref !== null && typeof ref === 'object' ? ref.Ref : ref,
  Boolean: (value: any) => {
    if (
      intrinsicFunctionType(value) === 'Ref' &&
      !(value.Ref in DEFAULT_PARAMETERS)
    ) {
      return value;
    }
    return !!value;
  },
  Not: (value: any) => !value,
  JSONParse: (value: any) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  JSONStringify: (value: any) => {
    if (
      intrinsicFunctionType(value) === 'Ref' &&
      !(value.Ref in DEFAULT_PARAMETERS)
    ) {
      return value;
    }
    return JSON.stringify(value);
  },
  NullToEmptyString: (value: any) => (value === null ? '' : value),
  NullToFalseString: (value: any) => (value === null ? 'false' : value),
  ToString: (value: any) => {
    if (intrinsicFunctionType(value) === 'Ref') {
      return value;
    }
    return value.toString();
  },
  ParseNumber: (value: any) => Number(value),
  TagEscape: (value: any) =>
    value.replace(INVALID_TAG_CHARACTERS_RE, '').replace(WHITESPACE_RE, ' '),
  LogGroupEscape: (value: any) => value.replace(LOG_GROUP_RE, '-'),
  ToNameValue: (map: any) =>
    map ? Object.keys(map).map((Name) => ({ Name, Value: map[Name] })) : [],
  FromNameValue: (array: any) =>
    array === null || array === undefined
      ? null
      : array.reduce((map: any, item: any) => {
          map[item.Name] = item.Value;
          return map;
        }, {}),
  FunctionRuntime: (resource: any) => {
    let runtime;
    let metadata;
    if ('Properties' in resource) {
      runtime = resource.Properties.Runtime;
      if ('Metadata' in resource) {
        metadata = resource.Metadata;
      }
    } else if ('runtime' in resource) {
      if ('tags' in resource) {
        metadata = resource.tags;
      }
    }
    let runtimeOption;
    if (metadata) {
      if ('RuntimeOption' in metadata) {
        runtimeOption = metadata.RuntimeOption;
      } else if ('runtimeOption' in metadata) {
        runtimeOption = metadata.runtimeOption;
      }
    }
    if (runtimeOption) {
      return `${runtime} (${runtimeOption})`;
    } else return runtime;
  },
  DatabasePort: (engine: any) => {
    switch (engine) {
      case 'mariadb':
      case 'mysql':
      case 'aurora':
      case 'aurora-mysql':
        return 3306;
      case 'aurora-postgresql':
      case 'postgres':
        return 5432;
      case 'sqlserver-ex':
      case 'sqlserver-web':
      case 'sqlserver-se':
      case 'sqlserver-ee':
        return 1433;
      default:
        throw new Error(
          `Failed to transform RDS engine to port: Unknown engine type '${engine}'`,
        );
    }
  },
};

export default transformations;
