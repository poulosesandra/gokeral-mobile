import { Card, List, Button, Switch, Skeleton, Typography } from "antd";

const { Title, Paragraph } = Typography;

interface SecurityTabProps {
  loading: boolean;
}

export const SecurityTab = ({ loading }: SecurityTabProps) => {
  const securityItems = [
    {
      title: "Password",
      description: "Last changed 3 months ago",
      action: <Button type="primary">Change</Button>,
    },
    {
      title: "Two-Factor Authentication",
      description: "Extra security layer",
      action: <Switch defaultChecked />,
    },
  ];

  return (
    <Card className="shadow-lg">
      <Title level={4} className="!mb-2 text-xl sm:text-2xl">
        Security Settings
      </Title>
      <Paragraph className="text-gray-500 text-sm sm:text-base">
        Manage account security
      </Paragraph>

      <Skeleton loading={loading} active>
        <List
          itemLayout="horizontal"
          dataSource={securityItems}
          renderItem={(item) => (
            <List.Item
              actions={[item.action]}
              className="flex flex-col sm:flex-row items-start sm:items-center py-4"
            >
              <List.Item.Meta
                title={
                  <span className="text-base font-medium">{item.title}</span>
                }
                description={
                  <span className="text-sm">{item.description}</span>
                }
                className="mb-2 sm:mb-0"
              />
            </List.Item>
          )}
        />
      </Skeleton>
    </Card>
  );
};
