import * as definitions from './definitions';
import validateResourceSelectField from '../utils/validateResourceSelectField';
import Parameter from './parameter';

export default function (this: any ,resourceId: any ) {
  const resource = this.resources[resourceId];
  const resourceType = resource.Type;
  const definition = definitions.SAM.ResourceTypes[resourceType];

  if (definition && definition.Settings) {
    let errors : any = [];
    Object.keys(definition.Settings).forEach((settingId) => {
      let value = resource.Settings[settingId];
      if (
        value !== undefined &&
        !(value instanceof Parameter) &&

        // Value is not a reference or attribute
        !(
          value && typeof value === 'object' && Object.keys(value).length === 1 &&
          ('Ref' in value || 'Fn::GetAtt' in value)
        ) &&

        'Choices' in definition.Settings[settingId]
      ) {
        let valid = validateResourceSelectField(value, definition.Settings[settingId]);
        if (!valid) {
          let err: any  = new Error(`Invalid setting in resource ${resource.Id}, value ${value} is an invalid choice for ${settingId}.`);
          err.settingId = settingId;
          errors.push(err);
        }
      }
    });
    if (errors.length > 0) {
      throw errors;
    }
  }
}
