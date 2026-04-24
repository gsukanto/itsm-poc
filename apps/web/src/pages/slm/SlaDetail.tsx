import React from 'react';
import { useSlasQuery } from '../../services/api';
import { ListItemDetail } from '../../components/GenericDetail';

export function SlaDetail() {
  const { data, isFetching } = useSlasQuery();
  return <ListItemDetail title="SLA" items={data} loading={isFetching} backTo="/slm" highlight={['key', 'priority', 'type']} />;
}
