import React from 'react';
import { useAvailabilityPlansQuery } from '../../services/api';
import { ListItemDetail } from '../../components/GenericDetail';

export function AvailabilityDetail() {
  const { data, isFetching } = useAvailabilityPlansQuery();
  return <ListItemDetail title="Availability Plan" items={data} loading={isFetching} backTo="/availability" highlight={['serviceKey', 'targetPct']} />;
}
