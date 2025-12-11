import { Card, List, Switch, Skeleton, Typography } from "antd";

const { Title, Paragraph } = Typography;

interface PrivacyTabProps {
  loading: boolean;
}

export const PrivacyTab = ({ loading }: PrivacyTabProps) => {
  const privacySettings = [
    {
      title: "Email Notifications",
      description: "Booking updates",
      defaultChecked: true,
    },
    {
      title: "SMS Notifications",
      description: "Text alerts",
      defaultChecked: true,
    },
    {
      title: "Marketing",
      description: "Offers & newsletter",
      defaultChecked: false,
    },
  ];

  return (
    <Card className="shadow-lg">
      <Title level={4} className="!mb-2 text-xl sm:text-2xl">
        Privacy Preferences
      </Title>
      <Paragraph className="text-gray-500 text-sm sm:text-base">
        Control your privacy settings
      </Paragraph>

      <Skeleton loading={loading} active>
        <List
          itemLayout="horizontal"
          dataSource={privacySettings}
          renderItem={(item) => (
            <List.Item
              key={item.title}
              actions={[
                <Switch
                  key={item.title}
                  defaultChecked={item.defaultChecked}
                />,
              ]}
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
