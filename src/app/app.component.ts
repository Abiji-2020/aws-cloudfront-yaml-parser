import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import parse from './utils/parse';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'cfnParser';
  value: any;

  cfnTemplate = `
AWSTemplateFormatVersion: "2010-09-09"
Description: Deploys an AWS Lambda function with API Gateway.

Resources:
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: LambdaExecutionRole
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: LambdaBasicExecution
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: "*"

  MyLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: MyLambdaFunction
      Runtime: python3.9
      Handler: index.lambda_handler
      Code:
        ZipFile: |
          def lambda_handler(event, context):
              return {
                  "statusCode": 200,
                  "body": "Hello from Lambda!"
              }
      Role: !GetAtt LambdaExecutionRole.Arn

  MyApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: MyApi
      Description: API Gateway for Lambda

  MyApiResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      ParentId: !GetAtt MyApiGateway.RootResourceId
      PathPart: "lambda"
      RestApiId: !Ref MyApiGateway

  MyApiMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      AuthorizationType: NONE
      HttpMethod: GET
      ResourceId: !Ref MyApiResource
      RestApiId: !Ref MyApiGateway
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub
          - arn:aws:apigateway:\${AWS::Region}:lambda:path/2015-03-31/functions/\${LambdaArn}/invocations
          - { LambdaArn: !GetAtt MyLambdaFunction.Arn }

  MyApiDeployment:
    Type: AWS::ApiGateway::Deployment
    Properties:
      RestApiId: !Ref MyApiGateway
      StageName: prod

  LambdaApiInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref MyLambdaFunction
      Principal: apigateway.amazonaws.com

Outputs:
  ApiUrl:
    Description: "Invoke the API Gateway URL"
    Value: !Sub "https://\${MyApiGateway}.execute-api.\${AWS::Region}.amazonaws.com/prod/lambda"
`;
  cfnTemplates = `
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  CloudFormation template with grouping constraints and resource names containing slashes.

Parameters:
  Environment:
    Type: String
    Default: dev

Mappings:
  EnvMapping:
    dev:
      GroupName: "Dev/Group"
    prod:
      GroupName: "Prod/Group"

Conditions:
  IsProd: !Equals [ !Ref Environment, prod ]

Resources:
  MyResourceGroup:
    Type: AWS::ResourceGroups::Group
    Properties:
      Name: !FindInMap [ EnvMapping, !Ref Environment, GroupName ]
      Description: "Resource group for the specified environment"
      ResourceQuery:
        Type: TAG_FILTERS_1_0
        Query: >
          {
            "ResourceTypeFilters": ["AWS::AllSupported"],
            "TagFilters": [
              {
                "Key": "Environment",
                "Values": ["\${Environment}"]
              }
            ]
          }

  MyLambdaFunction:
    Type: AWS::Lambda::Function
    Condition: IsProd
    Properties:
      FunctionName: "MyLambdaFunction"
      Runtime: nodejs14.x
      Handler: index.handler
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            return "Hello, world!";
          }

Outputs:
  GroupName:
    Description: "The name of the resource group"
    Value: !GetAtt MyResourceGroup.Name

  ApiUrl:
    Description: "The API URL for accessing resources"
    Value: !Sub "https://\${MyApiGateway}.execute-api.\${AWS::Region}.amazonaws.com/prod"`;

  constructor() {
    this.value = parse(this.cfnTemplate, 'SAM');
    console.log(this.value);
  }
}
