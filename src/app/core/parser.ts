import { yamlParse } from 'yaml-cfn';

export class TemplateParser {
  parse(template: string) {
    try {
      return yamlParse(template);
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
