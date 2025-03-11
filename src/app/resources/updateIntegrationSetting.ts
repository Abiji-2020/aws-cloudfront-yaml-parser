import * as definitions from './definitions';
import dispatch, { UpdateIntegrationSettingAction } from './dispatch';

export default function updateIntegrationSetting(
  this: any,
  sourceResourceId: any,
  targetResourceId: any,
  settingName: any,
  value: any,
) {
  const source = this.resources[sourceResourceId];
  const target = this.resources[targetResourceId];

  const integration = this.integrations.find((integration: any) => {
    return (
      integration.Source.ResourceId === sourceResourceId &&
      integration.Target.ResourceId === targetResourceId
    );
  });

  if (!integration) {
    throw new Error(
      `Failed to update setting ${settingName} for integration from ${sourceResourceId} to ${targetResourceId}: Integration does not exist in state`,
    );
  }

  const currentValue = integration.Settings[settingName];

  const definition = definitions.SAM.IntegrationTypes.find(
    (definition: any) => {
      return (
        definition.SourceType === source.Type &&
        definition.TargetType === target.Type
      );
    },
  );

  const settingSchemas = definition.Settings;

  if (!(settingName in settingSchemas)) {
    throw new Error(
      `Failed to update setting ${settingName} for integration from ${sourceResourceId} to ${targetResourceId}: Setting does not exist in integration schema`,
    );
  }

  const context: any = {
    sourceId: sourceResourceId,
    targetId: targetResourceId,
  };

  for (const currentSettingName in integration.Settings) {
    if (currentSettingName === settingName) {
      context[`SETTING:${currentSettingName}`] = value;
    } else {
      context[`SETTING:${currentSettingName}`] =
        integration.Settings[currentSettingName];
    }
  }

  const action = new UpdateIntegrationSettingAction(
    this.format,
    source,
    target,
    integration,
    settingName,
    value,
    currentValue,
  );

  dispatch(action, this.template);

  integration.Settings[settingName] = value;
}
