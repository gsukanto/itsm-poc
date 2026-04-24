import React from 'react';
import { useEventsQuery } from '../../services/api';
import { ListItemDetail } from '../../components/GenericDetail';

export function EventDetail() {
  const { data, isFetching } = useEventsQuery({});
  return <ListItemDetail title="Event" items={data as any} loading={isFetching} backTo="/events" highlight={['severity', 'status']} />;
}
