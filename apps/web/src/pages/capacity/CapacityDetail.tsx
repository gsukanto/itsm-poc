import React from 'react';
import { useCapacityPlansQuery } from '../../services/api';
import { ListItemDetail } from '../../components/GenericDetail';

export function CapacityDetail() {
  const { data, isFetching } = useCapacityPlansQuery();
  return <ListItemDetail title="Capacity Plan" items={data} loading={isFetching} backTo="/capacity" highlight={['serviceKey']} />;
}
