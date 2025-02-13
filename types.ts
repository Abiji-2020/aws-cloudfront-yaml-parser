function classifyResource(resourceType: string): { category: string; nodeGroup: "standalone" | "grouped" } {
    const categoryMap: { [key: string]: string } = {
      "AWS::EC2": "Compute",
      "AWS::Lambda": "Compute",
      "AWS::ECS": "Compute",
      "AWS::EKS": "Compute",
      "AWS::S3": "Storage",
      "AWS::EBS": "Storage",
      "AWS::EFS": "Storage",
      "AWS::DynamoDB": "Database",
      "AWS::RDS": "Database",
      "AWS::Neptune": "Database",
      "AWS::IAM": "Security",
      "AWS::KMS": "Security",
      "AWS::SecretsManager": "Security",
      "AWS::VPC": "Networking",
      "AWS::Route53": "Networking",
      "AWS::CloudFormation": "Configuration",
      "AWS::CloudWatch": "Monitoring",
      "AWS::SNS": "Application Services",
      "AWS::SQS": "Application Services",
      "AWS::StepFunctions": "Application Services",
      "AWS::Glue": "Analytics",
      "AWS::Athena": "Analytics",
      "AWS::SageMaker": "Machine Learning",
      "AWS::AppSync": "Networking",
      "AWS::ApiGateway": "Networking",
      "AWS::CertificateManager": "Security",
      "AWS::Backup": "Security",
      "AWS::Shield": "Security",
      "AWS::WAF": "Security",
    };
  
    const groupedResources: Set<string> = new Set([
      "AWS::ECS::Cluster",
      "AWS::EKS::Cluster",
      "AWS::RDS::DBCluster",
      "AWS::Neptune::DBCluster",
      "AWS::AutoScaling::AutoScalingGroup",
      "AWS::VPC::VPC",
      "AWS::EC2::Subnet",
      "AWS::EC2::SecurityGroup",
    ]);
  
    const parts = resourceType.split("::");
    if (parts.length < 3) return { category: "Unknown", nodeGroup: "standalone" };
  
    const serviceKey = `${parts[0]}::${parts[1]}`;
    const nodeGroup = groupedResources.has(resourceType) ? "grouped" : "standalone";
  
    return {
      category: categoryMap[serviceKey] || "Other",
      nodeGroup,
    };
  }
  
  export { classifyResource };
  