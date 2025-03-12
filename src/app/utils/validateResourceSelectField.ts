export default (value: any, setting: any) => {
  if (setting.ValueType === 'number' && value) {
    value = Number(value);
  }

  if (value === undefined) {
    return false;
  }

  if (!Array.isArray(setting.Choices)) {
    // TODO: Validate value when choices come from another setting
    return true;
  }

  return setting.Choices.some((choice: any) => {
    if (typeof choice === 'object') {
      return choice.Value === value;
    } else {
      return choice === value;
    }
  });
};
