import { Card, List, Button, Skeleton, Typography } from "antd";

const { Title, Paragraph } = Typography;

interface DataTabProps {
  loading: boolean;
}

export const DataTab = ({ loading }: DataTabProps) => {
  const dataOptions = [
    {
      title: "Export Data",
      description: "Download your data",
      action: <Button>Download</Button>,
    },
    {
      title: "Delete Account",
      description: "Request deletion",
      action: <Button danger>Request</Button>,
    },
  ];

  return (
    <Card className="shadow-lg">
      <Title level={4} className="!mb-2 text-xl sm:text-2xl">
        Data Management
      </Title>
      <Paragraph className="text-gray-500 text-sm sm:text-base">
        Manage your personal data
      </Paragraph>

      <Skeleton loading={loading} active>
        <List
          itemLayout="horizontal"
          dataSource={dataOptions}
          renderItem={(item) => (
            <List.Item
              key={item.title}
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
